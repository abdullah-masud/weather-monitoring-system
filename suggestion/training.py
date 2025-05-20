import pandas as pd
import numpy as np
import torch
from torch import nn, optim
from torch.utils.data import Dataset, DataLoader
from torch.utils.tensorboard import SummaryWriter
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# 1. Load and augment dataset for multi-task
df = pd.read_csv('mock_training_data.csv', parse_dates=['timestamp'])
# Create 15-min ahead forecast labels
df['rain_level_future'] = df['rain_level'].shift(-1).fillna(method='ffill').astype(int)
df['rain_score_future'] = df['rain_score'].shift(-1).fillna(method='ffill')
# Drop last row (no true future label)
df = df.iloc[:-1]

# 2. Define feature and target columns
feature_cols = ['temperature','humidity','pressure','light','rain_status','rain_intensity_raw','rain_score']
X = df[feature_cols].values
y_level = df['rain_level'].values
y_score = df['rain_score'].values
y_level_fut = df['rain_level_future'].values

# 3. Train/test split
X_train, X_test, yl_train, yl_test, ys_train, ys_test, yf_train, yf_test = \
    train_test_split(X, y_level, y_score, y_level_fut,
                     test_size=0.2, stratify=y_level, random_state=42)

# 4. Scale features
scaler = StandardScaler().fit(X_train)
X_train = scaler.transform(X_train)
X_test  = scaler.transform(X_test)

# 5. PyTorch Dataset for multi-task
class MultiTaskDataset(Dataset):
    def __init__(self, X, y_level, y_score, y_future):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.yl = torch.tensor(y_level, dtype=torch.long)
        self.ys = torch.tensor(y_score, dtype=torch.float32)
        self.yf = torch.tensor(y_future, dtype=torch.long)
    def __len__(self):
        return len(self.yl)
    def __getitem__(self, idx):
        return self.X[idx], self.yl[idx], self.ys[idx], self.yf[idx]

train_ds = MultiTaskDataset(X_train, yl_train, ys_train, yf_train)
test_ds  = MultiTaskDataset(X_test,  yl_test,  ys_test,  yf_test)
train_loader = DataLoader(train_ds, batch_size=64, shuffle=True)
test_loader  = DataLoader(test_ds,  batch_size=64)

# 6. Multi-task model
class RainMultiTaskModel(nn.Module):
    def __init__(self, in_dim, n_classes):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(in_dim, 32), nn.ReLU(),
            nn.Linear(32, 16),   nn.ReLU()
        )
        self.cls_head = nn.Linear(16, n_classes)  # current rain level
        self.reg_head = nn.Linear(16, 1)          # current rain score
        self.fc_head  = nn.Linear(16, n_classes)  # future rain level

    def forward(self, x):
        h = self.shared(x)
        return self.cls_head(h), self.reg_head(h).squeeze(-1), self.fc_head(h)

# 7. Setup device and model (positional args)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = RainMultiTaskModel(X_train.shape[1], len(np.unique(y_level))).to(device)

# 8. Losses, optimizer, TensorBoard
criterion_cls = nn.CrossEntropyLoss()
criterion_reg = nn.MSELoss()
optimizer = optim.Adam(model.parameters(), lr=1e-3)
writer = SummaryWriter(log_dir='runs/multitask_weather')

# 9. Training loop
epochs = 30
for epoch in range(1, epochs+1):
    model.train()
    total_loss = 0.0
    for xb, yl_b, ys_b, yf_b in train_loader:
        xb, yl_b, ys_b, yf_b = xb.to(device), yl_b.to(device), ys_b.to(device), yf_b.to(device)
        optimizer.zero_grad()
        out_cls, out_reg, out_fut = model(xb)
        loss_cls = criterion_cls(out_cls, yl_b)
        loss_reg = criterion_reg(out_reg, ys_b)
        loss_fut = criterion_cls(out_fut, yf_b)
        loss = loss_cls + 0.5 * loss_reg + loss_fut
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * xb.size(0)
    avg_loss = total_loss / len(train_ds)

    # Validation metrics
    model.eval()
    with torch.no_grad():
        correct_cls = correct_fut = 0
        total = len(test_ds)
        for xb, yl_b, ys_b, yf_b in test_loader:
            xb, yl_b, yf_b = xb.to(device), yl_b.to(device), yf_b.to(device)
            out_cls, _, out_fut = model(xb)
            correct_cls += (out_cls.argmax(1) == yl_b).sum().item()
            correct_fut += (out_fut.argmax(1) == yf_b).sum().item()
        acc_cls = correct_cls / total
        acc_fut = correct_fut / total

    writer.add_scalar('Loss/train',     avg_loss, epoch)
    writer.add_scalar('Accuracy/current', acc_cls,  epoch)
    writer.add_scalar('Accuracy/future',  acc_fut,  epoch)
    print(f"Epoch {epoch:02d} | Loss: {avg_loss:.4f} | Acc_curr: {acc_cls:.3f} | Acc_fut: {acc_fut:.3f}")

writer.close()

# 10. Save model and scaler
torch.save(model.state_dict(), 'multitask_weather_model.pth')
import pickle
with open('scaler_multitask.pkl','wb') as f:
    pickle.dump(scaler, f)
print("✅ Model and scaler saved.")
