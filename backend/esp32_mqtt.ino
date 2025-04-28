#include <WiFi.h>
#include <PubSubClient.h>

// WiFi
const char* ssid = "WiFi";  
const char* password = "WiFi";  

// MQTT Broker configuration
const char* mqtt_server = "broker.hivemq.com"; //  Public Broker
const int mqtt_port = 1883;
const char* mqtt_client_id = "ESP32_Client";
const char* mqtt_topic_sub = "esp32/input";
const char* mqtt_topic_pub = "esp32/output";

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;

void setup_wifi() {
  delay(10);
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  // If a message is received, publish a response message
  if (message == "ON") {
    client.publish(mqtt_topic_pub, "ESP32: Received ON");
  } else if (message == "OFF") {
    client.publish(mqtt_topic_pub, "ESP32: Received OFF");
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect(mqtt_client_id)) {
      Serial.println("connected");
      client.subscribe(mqtt_topic_sub);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Messages are posted every 10 seconds
  unsigned long now = millis();
  if (now - lastMsg > 10000) {
    lastMsg = now;
    String msg = "ESP32: Alive at " + String(now);
    client.publish(mqtt_topic_pub, msg.c_str());
    Serial.println("Published: " + msg);
  }
}