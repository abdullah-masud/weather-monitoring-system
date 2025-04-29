import paho.mqtt.client as mqtt
import time
import json
import random

# MQTT Broker configuration
broker = "broker.hivemq.com"
port = 1883
client_id = "Simulated_ESP32"
topic_pub = "esp32/output"

# Simulate sensor data
def get_sensor_data():
    return {
        "temperature": random.uniform(20.0, 35.0),
        "humidity": random.uniform(30.0, 90.0),
        "air_quality": random.randint(0, 500),
        "rainfall": random.randint(0, 100),
        "uv_intensity": random.randint(0, 11)
    }

# Create MQTT client
client = mqtt.Client(client_id=client_id, 
callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
client.connect(broker, port, 60)
client.loop_start()

try:
    while True:
        # Simulate reading and publishing data
        data = get_sensor_data()
        message = json.dumps(data)
        client.publish(topic_pub, message)
        print(f"Published: {message}")
        time.sleep(10)  # Messages are posted every 10 seconds
except KeyboardInterrupt:
    print("Exiting...")

client.loop_stop()
client.disconnect()
