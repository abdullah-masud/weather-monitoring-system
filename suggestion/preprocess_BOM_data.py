import os
import glob
import pandas as pd

# 1. Gather all monthly files
data_dir = r'.\monthly_data'
pattern = os.path.join(data_dir, 'IDCJDW6111.*.csv')
files = sorted(glob.glob(pattern))

dfs = []
for f in files:
    # 2. Read, skipping the 8 metadata rows so the header is correct
    tmp = pd.read_csv(
        f,
        sep=',',
        skiprows=8,
        encoding='latin-1',
        low_memory=False
    )
    # 3. Drop the first unnamed column if present
    if tmp.columns[0].startswith('Unnamed'):
        tmp = tmp.iloc[:, 1:]
    dfs.append(tmp)

# 4. Concatenate into one frame
df = pd.concat(dfs, ignore_index=True)
print(f"Combined DataFrame: {df.shape[0]} rows, {df.shape[1]} cols")

# 5. Parse the Date column into a datetime
df['timestamp'] = pd.to_datetime(df['Date'], format='%Y-%m-%d', errors='coerce')

# 6. Sort by time
df = df.sort_values('timestamp').reset_index(drop=True)

# 7. Cast numeric columns
num_cols = [
    'Minimum temperature (°C)',
    'Maximum temperature (°C)',
    'Rainfall (mm)',
    'Evaporation (mm)',
    'Sunshine (hours)',
    'Wind gust speed (km/h)',
    'Wind speed 9am (km/h)',
    'Wind speed 3pm (km/h)',
    'Humidity 9am (%)',
    'Humidity 3pm (%)',
    'Pressure 9am (hPa)',
    'Pressure 3pm (hPa)',
]
for c in num_cols:
    if c in df.columns:
        df[c] = pd.to_numeric(df[c], errors='coerce')

# 8. Define target: did it rain *next* day? (you can adjust shift window)
if 'Rainfall (mm)' in df.columns:
    df['rain_next'] = (df['Rainfall (mm)'].shift(-1).fillna(0) > 0).astype(int)

# 9. Drop rows with missing in any feature or target
features = [c for c in num_cols if c in df.columns]
if 'rain_next' in df.columns:
    features += ['rain_next']
df_clean = df.dropna(subset=features).reset_index(drop=True)

# 10. One-hot encode the two wind-direction columns
for col in ['Wind direction 9am', 'Wind direction 3pm']:
    if col in df_clean.columns:
        df_clean = pd.get_dummies(
            df_clean,
            columns=[col],
            prefix=col.replace(' ', '_'),
            dummy_na=True
        )

# 11. Save
output = os.path.join(data_dir, 'preprocessed_weather.csv')
df_clean.to_csv(output, index=False)
print(f"Saved preprocessed data to {output}")
