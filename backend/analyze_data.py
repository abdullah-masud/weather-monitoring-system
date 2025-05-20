import datetime
import pandas as pd
from models import SensorData, db
from sqlalchemy import func


def parse_ts(ts_str):
    try:
        # Python ≥3.7
        return datetime.datetime.fromisoformat(ts_str)
    except ValueError:
        # fallback for very old Python or other formats:
        return datetime.datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S.%f")

def analyze_date_range_db(start: str, end: str):
    start_dt = parse_ts(start)
    end_dt   = parse_ts(end)
    if end_dt < start_dt:
        raise ValueError("End must be after start")
    if end_dt - start_dt > datetime.timedelta(days=3):
        raise ValueError("Range cannot exceed 3 days")

    # 1) Pull all readings for our five topics
    topics = ['esp32/temperature',
              'esp32/humidity',
              'esp32/pressure',
              'esp32/rain_score',
              'esp32/light']

    rows = (
        SensorData.query
        .filter(SensorData.timestamp >= start_dt,
                SensorData.timestamp <= end_dt,
                SensorData.topic.in_(topics))
        .all()
    )
    if not rows:
        raise ValueError("No data in the given range")

    # 2) Build DataFrame and pivot so each column is a topic
    data = [{'timestamp': r.timestamp, 'topic': r.topic, 'value': r.value}
            for r in rows]
    df = pd.DataFrame(data)
    df = df.pivot(index='timestamp', columns='topic', values='value')
    # If some timestamps are missing a topic, you can forward-fill or drop:
    df = df.sort_index().ffill()

    # 3) Summary stats
    summary = df.describe().T

    # 4) Trend slopes
    trends = {}
    x = (df.index - df.index[0]).total_seconds().values.reshape(-1,1)
    for col in df.columns:
        y = df[col].values
        cov = ((x.flatten()-x.mean()) * (y-y.mean())).sum()
        var = ((x.flatten()-x.mean())**2).sum()
        trends[col] = cov/var

    return summary, trends


def get_latest_features():
    # Pull the very last timestamp across all topics
    last_ts = db.session.query(func.max(SensorData.timestamp)).scalar()
    # Query each feature at that timestamp:
    recs = SensorData.query.filter(SensorData.timestamp == last_ts).all()
    feat_map = {r.topic.split('/',1)[-1]: r.value for r in recs}
    return feat_map, last_ts

