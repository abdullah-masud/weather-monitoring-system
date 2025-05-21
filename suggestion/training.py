import torch
from torch import nn

# Multi-task model definition only – no training on import
class RainMultiTaskModel(nn.Module):
    def __init__(self, in_dim, n_classes):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(in_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU()
        )
        # reg_head remains a Linear
        self.reg_head = nn.Linear(16, 1)
        # activation as a separate attribute
        self.reg_act  = nn.Sigmoid()

        self.cls_head = nn.Linear(16, n_classes)
        self.fut_head = nn.Linear(16, n_classes)

    def forward(self, x):
        h = self.shared(x)
        return (
            self.cls_head(h),
            self.reg_act(self.reg_head(h)).squeeze(-1),  # apply sigmoid here
            self.fut_head(h)
        )

# If you want to retrain from here, guard under main:
if __name__ == '__main__':
    from torch.utils.data import Dataset, DataLoader
    import pandas as pd
    import numpy as np
    import pickle
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    import torch.optim as optim
    from torch.utils.tensorboard import SummaryWriter

    # --- Training code (only executes when run directly) ---
    df = pd.read_csv('mock_training_data.csv', parse_dates=['timestamp'])
    df['rain_level_future'] = df['rain_level'].shift(-1).ffill().astype(int)
    df['rain_score_future'] = df['rain_score'].shift(-1).ffill()
    df = df.iloc[:-1]

    feature_cols = ['temperature', 'humidity', 'pressure', 'light', 'rain_status', 'rain_score']
    X = df[feature_cols].values
    y_curr = df['rain_level'].values
    y_score = df['rain_score'].values
    y_fut = df['rain_level_future'].values

    X_train, X_test, yc_train, yc_test, ys_train, ys_test, yf_train, yf_test = \
        train_test_split(X, y_curr, y_score, y_fut, test_size=0.2, stratify=y_curr, random_state=42)

    scaler = StandardScaler().fit(X_train)
    X_train = scaler.transform(X_train)
    X_test  = scaler.transform(X_test)

    class MultiTaskDataset(Dataset):
        def __init__(self, X, y_c, y_s, y_f):
            self.X = torch.tensor(X, dtype=torch.float32)
            self.yc = torch.tensor(y_c, dtype=torch.long)
            self.ys = torch.tensor(y_s, dtype=torch.float32)
            self.yf = torch.tensor(y_f, dtype=torch.long)
        def __len__(self): return len(self.yc)
        def __getitem__(self, i): return self.X[i], self.yc[i], self.ys[i], self.yf[i]

    train_ds = MultiTaskDataset(X_train, yc_train, ys_train, yf_train)
    test_ds  = MultiTaskDataset(X_test,  yc_test,  ys_test,  yf_test)

    train_loader = DataLoader(train_ds, batch_size=64, shuffle=True)
    test_loader  = DataLoader(test_ds,  batch_size=64)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = RainMultiTaskModel(in_dim=X_train.shape[1], n_classes=len(np.unique(y_curr))).to(device)

    criterion_cls = nn.CrossEntropyLoss()
    criterion_reg = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    writer = SummaryWriter(log_dir='runs/multitask')

    epochs = 30
    for epoch in range(1, epochs+1):
        model.train()
        total_loss = 0
        for xb, yc, ys, yf in train_loader:
            xb, yc, ys, yf = xb.to(device), yc.to(device), ys.to(device), yf.to(device)
            optimizer.zero_grad()
            out_c, out_s, out_f = model(xb)
            loss = criterion_cls(out_c, yc) + 0.5*criterion_reg(out_s, ys) + criterion_cls(out_f, yf)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()*xb.size(0)
        avg = total_loss/len(train_ds)
        print(f"Epoch {epoch} | Loss: {avg:.4f}")

    print("Saving model & scaler...")
    torch.save(model.state_dict(), '../backend/multitask_weather_model.pth')
    with open('../backend/scaler_multitask.pkl', 'wb') as f: pickle.dump(scaler, f)
    print("Done.")
