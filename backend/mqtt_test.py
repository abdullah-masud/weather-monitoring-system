import paho.mqtt.client as mqtt
import time

# MQTT Broker configuration
broker = "broker.hivemq.com"
port = 1883
client_id = "Python_Client"
topic_sub = "esp32/output"
topic_pub = "esp32/input"

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe(topic_sub)

def on_message(client, userdata, msg):
    print(f"Received: {msg.payload.decode()} on topic {msg.topic}")

client = mqtt.Client(client_id=client_id)
client.on_connect = on_connect
client.on_message = on_message

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
