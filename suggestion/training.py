import pandas as pd
import torch
from torch import nn, optim
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.preprocessing  import StandardScaler

# -------------------------------
# 1) PREPROCESSING
# -------------------------------
class RainClassifier(nn.Module):
    def __init__(self, in_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1)            # single logit
        )
    def forward(self, x):
        return self.net(x).squeeze(-1)  # (batch,)

if __name__ == '__main__':
    # 1) load & parse
    df = pd.read_csv('preprocessed_weather.csv', parse_dates=['timestamp'])

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

    # move rain_next into rain of the *next* day, fill first day with 0, cast to int
    wide['rain'] = wide['rain_next'].shift(1).fillna(0).astype(int)
    wide.drop(columns='rain_next', inplace=True)

    # 7) reshape to long format
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

    # 8) combine & sort so each date’s 9am then 3pm are consecutive
    long_df = pd.concat([morning_long, afternoon_long], ignore_index=True)
    time_order = {'9am': 0, '3pm': 1}
    long_df['time_order'] = long_df['time'].map(time_order)
    long_df = (
        long_df
        .sort_values(['date','time_order'])
        .drop(columns='time_order')
        .reset_index(drop=True)
    )

    print("Preprocessed rows:", len(long_df))
    print(long_df.head(6))

    # -------------------------------
    # 2) PREPARE TRAIN/VAL SPLIT
    # -------------------------------

    FEATURES = ['air_temp','rel_hum','press']
    X = long_df[FEATURES].values
    y = long_df['rain'].values

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    scaler = StandardScaler().fit(X_train)
    X_train = scaler.transform(X_train)
    X_val   = scaler.transform(X_val)

    # -------------------------------
    # 3) DATASET & DATALOADER
    # -------------------------------

    class RainDataset(Dataset):
        def __init__(self, X, y):
            self.X = torch.tensor(X, dtype=torch.float32)
            self.y = torch.tensor(y, dtype=torch.float32)
        def __len__(self):      return len(self.y)
        def __getitem__(self, i): return self.X[i], self.y[i]

    train_ds = RainDataset(X_train, y_train)
    val_ds   = RainDataset(X_val,   y_val)

    train_loader = DataLoader(train_ds, batch_size=64, shuffle=True)
    val_loader   = DataLoader(val_ds,   batch_size=64)

    # -------------------------------
    # 4) MODEL DEFINITION
    # -------------------------------


    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = RainClassifier(in_dim=len(FEATURES)).to(device)

    # -------------------------------
    # 5) LOSS, OPTIMIZER, METRIC
    # -------------------------------

    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-3)

    # -------------------------------
    # 6) TRAIN / VALIDATION LOOP
    # -------------------------------

    EPOCHS = 20
    for epoch in range(1, EPOCHS+1):
        # -- train --
        model.train()
        total_loss = 0.0
        for xb, yb in train_loader:
            xb, yb = xb.to(device), yb.to(device)
            logits = model(xb)
            loss   = criterion(logits, yb)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * xb.size(0)
        avg_train_loss = total_loss / len(train_ds)

        # -- validate --
        model.eval()
        total_val_loss = 0.0
        correct = 0
        with torch.no_grad():
            for xb, yb in val_loader:
                xb, yb = xb.to(device), yb.to(device)
                logits = model(xb)
                total_val_loss += criterion(logits, yb).item() * xb.size(0)
                preds = (torch.sigmoid(logits) > 0.5).float()
                correct += (preds == yb).sum().item()
        avg_val_loss = total_val_loss / len(val_ds)
        val_acc      = correct / len(val_ds)

        print(f"Epoch {epoch:02d} | "
              f"Train Loss: {avg_train_loss:.4f} | "
              f"Val Loss: {avg_val_loss:.4f} | "
              f"Val Acc: {val_acc:.3f}")

    # -------------------------------
    # 7) SAVE MODEL + SCALER
    # -------------------------------

    torch.save(model.state_dict(), 'rain_classifier.pth')
    import pickle
    with open('scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)

    print("Training complete. Model saved to rain_classifier.pth")
