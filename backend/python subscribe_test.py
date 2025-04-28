import paho.mqtt.client as mqtt

def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code {reason_code}")
    client.subscribe("esp32/input")

def on_message(client, userdata, msg, properties=None):
    print(f"Received: {msg.payload.decode()} on topic {msg.topic}")

client = mqtt.Client(client_id="Test_Client", callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message
client.connect("broker.hivemq.com", 1883, 60)
client.loop_forever()