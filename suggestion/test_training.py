import torch
import pickle
import numpy as np
import pandas as pd
from training import RainClassifier  # or from models import RainClassifier

# 1) Load your saved artifacts
scaler = pickle.load(open('scaler.pkl','rb'))
model  = RainClassifier(in_dim=3)
model.load_state_dict(torch.load(
    'rain_classifier.pth',
    map_location='cpu',
    weights_only=True
))
model.eval()

# Load and preprocess CSV into long_df
df = pd.read_csv('monthly_data/preprocessed_weather.csv', parse_dates=['timestamp'])
df['date'] = df['timestamp'].dt.date

morning = df.rename(columns={
    '9am Temperature (°C)':      'air_temp_9am',
    '9am relative humidity (%)': 'rel_hum_9am',
    '9am MSL pressure (hPa)':    'press_9am'
})[['date','air_temp_9am','rel_hum_9am','press_9am','rain_next']]

afternoon = df.rename(columns={
    '3pm Temperature (°C)':      'air_temp_3pm',
    '3pm relative humidity (%)': 'rel_hum_3pm',
    '3pm MSL pressure (hPa)':    'press_3pm'
})[['date','air_temp_3pm','rel_hum_3pm','press_3pm']]

wide = pd.merge(morning, afternoon, on='date', how='inner')
wide['rain'] = wide['rain_next'].shift(1).fillna(0).astype(int)
wide.drop(columns='rain_next', inplace=True)

morning_long = wide[['date','air_temp_9am','rel_hum_9am','press_9am','rain']].copy()
morning_long['time'] = '9am'
morning_long.rename(columns={
    'air_temp_9am': 'air_temp',
    'rel_hum_9am':  'rel_hum',
    'press_9am':    'press'
}, inplace=True)

afternoon_long = wide[['date','air_temp_3pm','rel_hum_3pm','press_3pm','rain']].copy()
afternoon_long['time'] = '3pm'
afternoon_long.rename(columns={
    'air_temp_3pm': 'air_temp',
    'rel_hum_3pm':  'rel_hum',
    'press_3pm':    'press'
}, inplace=True)

long_df = pd.concat([morning_long, afternoon_long], ignore_index=True)
long_df = long_df.sort_values(['date','time'], key=lambda col: col.map({'9am':0,'3pm':1})).reset_index(drop=True)

# Filter for rainy rows
rainy_df = long_df[long_df['rain'] == 1]
for idx, row in rainy_df.iterrows():
    features = [row['air_temp'], row['rel_hum'], row['press']]
    X = scaler.transform([features])
    xb = torch.from_numpy(X).float()
    with torch.no_grad():
        logit = model(xb).item()
    prob = torch.sigmoid(torch.tensor(logit)).item()
    pred = int(prob > 0.5)
    print(f"{row['date']} {row['time']}: rain_prob={prob:.3f}, pred={pred}")