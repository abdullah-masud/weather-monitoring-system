import pandas as pd

# 1) load & parse
df = pd.read_csv('monthly_data/preprocessed_weather.csv', parse_dates=['timestamp'])

# 2) extract date only
df['date'] = df['timestamp'].dt.date

# 3) copy full DataFrame for morning vs afternoon
morning   = df.copy()
afternoon = df.copy()

# 4) rename the actual 9 AM and 3 PM columns
morning.rename(columns={
    '9am Temperature (°C)':      'air_temp_9am',
    '9am relative humidity (%)': 'rel_hum_9am',
    '9am MSL pressure (hPa)':    'press_9am'
}, inplace=True)

afternoon.rename(columns={
    '3pm Temperature (°C)':      'air_temp_3pm',
    '3pm relative humidity (%)': 'rel_hum_3pm',
    '3pm MSL pressure (hPa)':    'press_3pm'
}, inplace=True)

# 5) pick the cols we need
morning_cols   = ['date','air_temp_9am','rel_hum_9am','press_9am','rain_next']
afternoon_cols = ['date','air_temp_3pm','rel_hum_3pm','press_3pm']

morning   = morning[morning_cols]
afternoon = afternoon[afternoon_cols]

# 6) merge on date
wide = pd.merge(morning, afternoon, on='date', how='inner')

# move rain_next into rain of the *next* day
wide['rain'] = wide['rain_next'].shift(1).fillna(0).astype(int)
wide.drop(columns='rain_next', inplace=True)

# 7) sanity-check
print(wide.head())
print(wide.shape)

# 8) reshape to long format
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

# 9) combine
long_df = pd.concat([morning_long, afternoon_long], ignore_index=True)

# <<< unchanged sorting block
time_order = {'9am': 0, '3pm': 1}
long_df['time_order'] = long_df['time'].map(time_order)
long_df = ( long_df
            .sort_values(['date','time_order'])
            .drop(columns='time_order')
            .reset_index(drop=True) )

# 10) final check
print(long_df.head(10))
print(long_df)
