from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sensors.db'  
db = SQLAlchemy(app)

# Database model 
class SensorData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(100))
    value = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<SensorData {self.topic}: {self.value} @ {self.timestamp}>"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    password = db.Column(db.String(100))

    def __repr__(self):
        return f"<User {self.name} ({self.email})>"

# Add root route
@app.route('/')
def index():
    return "Weather Monitoring API. Access /latest for the latest sensor data."

# expose latest data to frontend
@app.route('/latest')
def latest_data():
    latest = SensorData.query.order_by(SensorData.timestamp.desc()).all()
    # group by timestamp 
    latest_data = {}
    for reading in latest:
        if reading.timestamp not in latest_data:
            latest_data[reading.timestamp] = {}
        latest_data[reading.timestamp][reading.topic.split('/')[-1]] = reading.value
    return jsonify(latest_data)  

def on_message(client, userdata, msg):
    data = json.loads(msg.payload.decode())
    timestamp = datetime.now()
    with app.app_context():
        for key, value in data.items():
            if isinstance(value, (int, float)):
                sensor = SensorData(topic=f"esp32/{key}", value=float(value), timestamp=timestamp)
                db.session.add(sensor)
        db.session.commit()
        print(f"Stored sensor data: {data}")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables
    app.run(debug=True)  # Enable debug mode to view error details