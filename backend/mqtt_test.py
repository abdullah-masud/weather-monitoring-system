import paho.mqtt.client as mqtt
import json
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# database address
DATABASE_URI = 'sqlite:////Users/qinding/weather-monitoring-system/backend/sensors.db'
Base = declarative_base()

# define sensordata model
class SensorData(Base):
    __tablename__ = 'sensor_data'
    id = Column(Integer, primary_key=True)
    topic = Column(String(100))
    value = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

# initialize database
engine = create_engine(DATABASE_URI, echo=False)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

# mqtt config
broker = "broker.hivemq.com"
port = 1883
client_id = "Python_Client"
topic_sub = "esp32/output"
topic_pub = "esp32/input"

# MQTT callback function
def on_connect(client, userdata, flags, rc, properties=None):
    print(f"Connected with result code {rc}")
    client.subscribe(topic_sub)

def on_message(client, userdata, msg):
    try:
        # parse json payload
        data = json.loads(msg.payload.decode())
        if isinstance(data, dict):
            session = Session()
            try:
                for sensor_type, value in data.items():
                    if isinstance(value, (int, float)):
                        new_data = SensorData(
                            topic=f"esp32/{sensor_type}",
                            value=value,
                            timestamp=datetime.utcnow()
                        )
                        session.add(new_data)
                session.commit()
                print(f"Stored sensor data: {data}")
            except Exception as e:
                session.rollback()
                print(f"Error storing data: {e}")
            finally:
                session.close()
        else:
            print(f"Received non-dict message: {msg.payload.decode()}")
    except json.JSONDecodeError:
        print(f"Received non-JSON message: {msg.payload.decode()}")

# create mqtt client
client = mqtt.Client(client_id=client_id, callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message

# connect to broker
print("Connecting to broker...")
client.connect(broker, port, 60)
client.loop_start()

try:
    while True:
        message = input("Enter message (ON/OFF) or 'q' to quit: ")
        if message.lower() == 'q':
            break
        if message in ["ON", "OFF"]:
            client.publish(topic_pub, message)
            print(f"Published: {message} to {topic_pub}")
        else:
            print("Invalid message. Use ON or OFF.")
except KeyboardInterrupt:
    print("Exiting...")

client.loop_stop()
client.disconnect()

# connect database
engine = create_engine('sqlite:////Users/qinding/weather-monitoring-system/backend/sensors.db')
Session = sessionmaker(bind=engine)
session = Session()

# query recent data
recent_data = session.query(SensorData).order_by(SensorData.timestamp.desc()).limit(5).all()


for data in recent_data:
    print(f"Topic: {data.topic}, Value: {data.value}, Time: {data.timestamp}")

session.close()