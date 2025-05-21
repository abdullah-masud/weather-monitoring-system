import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Parameters
num_days = 30
freq_minutes = 15
start_time = datetime(2025, 1, 1, 0, 0, 0)
periods = int((24 * 60 / freq_minutes) * num_days)  # e.g. 96*30 = 2880 rows

# 1) Timestamps
timestamps = [start_time + timedelta(minutes=freq_minutes * i) for i in range(periods)]

# 2) Temperature: 15–30 °C daily sinusoid + noise
temps = 22.5 + 7.5 * np.sin(
    [(ts.hour + ts.minute/60)/24 * 2*np.pi for ts in timestamps]
) + np.random.normal(0, 0.5, periods)

# 3) Humidity: 40–80 % inverse temp pattern + noise
humid = 60 - 20 * np.sin(
    [(ts.hour + ts.minute/60)/24 * 2*np.pi for ts in timestamps]
) + np.random.normal(0, 3, periods)
humid = np.clip(humid, 20, 100)

# 4) Pressure: ~1010 hPa + small noise
pressure = 1010 + np.random.normal(0, 1, periods)

# 5) Light: 0 at night, peaking ~10000 lux at noon + noise
light = []
for ts in timestamps:
    if 6 <= ts.hour < 18:
        # map 6:00→0 up to 12:00→π/2, down to 18:00→π
        theta = (ts.hour - 6 + ts.minute/60)/12 * np.pi
        light.append(10000 * np.sin(theta) + np.random.normal(0, 200))
    else:
        light.append(0 + np.random.normal(0, 50))
light = np.clip(light, 0, None)

# 6) Rain status: 10% chance
rain_status = np.random.binomial(1, 0.1, periods)

# 7) Rain levels: 0 if no rain, else 1/2/3 lightly weighted
rain_level = [
    0 if rs == 0 else np.random.choice([1,2,3], p=[0.5,0.3,0.2])
    for rs in rain_status
]

# 8) Rain score: [0,0.2) if no rain else [0.2,1.0)
rain_score = [
    np.random.uniform(0, 0.2) if rl==0 else np.random.uniform(0.2,1.0)
    for rl in rain_level
]

# 9) Assemble & save
df = pd.DataFrame({
    'timestamp': timestamps,
    'temperature': temps,
    'humidity': humid,
    'pressure': pressure,
    'light': light,
    'rain_status': rain_status,
    'rain_level': rain_level,
    'rain_score': rain_score
})
df.to_csv('mock_training_data.csv', index=False)
print("Generated mock_training_data.csv with", len(df), "rows.")