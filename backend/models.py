from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class SensorData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(100))
    value = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
