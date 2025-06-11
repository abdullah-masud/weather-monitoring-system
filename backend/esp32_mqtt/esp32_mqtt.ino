#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <SparkFun_VEML6030_Ambient_Light_Sensor.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "Waveshare_LCD1602_RGB.h"  

// define esp32 I2C pins (default SDA: GPIO 21, SCL: GPIO 22)
#define SDA_PIN 21
#define SCL_PIN 22

// create BME280 sensor instance
Adafruit_BME280 bme;
// create VEML6030 light sensor instance
SparkFun_Ambient_Light veml6030(0x10);  // VEML6030 I2C address is 0x10

// create LCD instance
Waveshare_LCD1602_RGB lcd(16, 2);

// define BME280 I2C address
#define I2C_ADDRESS 0x77  // If it doesn't work, try 0x76

// rain sensor pins
#define RAIN_SENSOR_DIGITAL_PIN 15  
#define RAIN_SENSOR_ANALOG_PIN 36   

// wifi credentials
const char* ssid = "huawei mate50";
const char* password = "88888889";

// MQTT Broker settings
const char* mqtt_broker = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_client_id = "ESP32_Weather_Client";
const char* mqtt_topic = "esp32/output";

// initialize wifi and mqtt client
WiFiClient espClient;
PubSubClient client(espClient);

// lcd rainbow backlight variables
int r, g, b, t = 0;

// page switching control
int currentPage = 0;
unsigned long lastPageChange = 0;
const int PAGE_INTERVAL = 2000; // switch  every 2 seconds

// sensor reading variables
float temperature, humidity, pressure, lightLevel, rainScore;
int rain_level;

// Function to connect to wifi
void setup_wifi() {
  delay(10);
  Serial.println("Connecting to WiFi...");
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// function to reconnect to mqtt broker
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect(mqtt_client_id)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

// Function to update LCD display
void updateDisplay() {
    lcd.clear(); // clear screen
    
    switch (currentPage) {
        case 0: // Temperature and humidity
            lcd.setCursor(0, 0);
            lcd.send_string("Temp: ");
            char tempStr[8];
            dtostrf(temperature, 4, 1, tempStr);
            lcd.send_string(tempStr);
            lcd.send_string(" C");
            
            lcd.setCursor(0, 1);
            lcd.send_string("Humidity: ");
            char humStr[8];
            dtostrf(humidity, 2, 0, humStr);
            lcd.send_string(humStr);
            lcd.send_string("%");
            break;
            
        case 1: // pressure
            lcd.setCursor(0, 0);
            lcd.send_string("Pressure:");
            lcd.setCursor(0, 1);
            char pressStr[10];
            dtostrf(pressure, 6, 1, pressStr);
            lcd.send_string(pressStr);
            lcd.send_string(" hPa");
            break;
            
        case 2: // light level
            lcd.setCursor(0, 0);
            lcd.send_string("Light Level:");
            lcd.setCursor(0, 1);
            char lightStr[10];
            dtostrf(lightLevel, 6, 0, lightStr);
            lcd.send_string(lightStr);
            lcd.send_string(" lux");
            break;
            
        case 3: // rain level
            lcd.setCursor(0, 0);
            lcd.send_string("Rain Level:");
            lcd.setCursor(0, 1);
            switch(rain_level) {
                case 0:
                    lcd.send_string("No Rain");
                    break;
                case 1:
                    lcd.send_string("Light");
                    break;
                case 2:
                    lcd.send_string("Moderate");
                    break;
                case 3:
                    lcd.send_string("Heavy");
                    break;
            }
            break;
            
        case 4: // Rain score
            lcd.setCursor(0, 0);
            lcd.send_string("Rain Score:");
            lcd.setCursor(0, 1);
            char rainStr[8];
            dtostrf(rainScore, 4, 2, rainStr);  // Format as float with 2 decimal places
            lcd.send_string(rainStr);
            break;
    }
}

void setup() {
  // start serial communication
  Serial.begin(115200);
  
  // initialize I2C with specified SDA and SCL pins
  Wire.begin(SDA_PIN, SCL_PIN);
  
  // initialize LCD
  lcd.init();
  lcd.setRGB(255, 255, 255); // set white backlight
  lcd.setCursor(0, 0);
  lcd.send_string("Weather Station");
  lcd.setCursor(0, 1);
  lcd.send_string("Initializing...");
  delay(2000);

  // initialize BME280 sensor
  if (!bme.begin(I2C_ADDRESS)) {
    Serial.println("⚠️  Could not find a valid BME280 sensor, check wiring!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.send_string("BME280 Error");
    while (1);
  }

  // initialize rain sensor
  pinMode(RAIN_SENSOR_DIGITAL_PIN, INPUT);  // Set as input
  
  // initialize VEML6030 light sensor
  if (!veml6030.begin()) {
    Serial.println("⚠️  VEML6030 sensor not found");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.send_string("VEML6030 Error");
  } else {
    Serial.println("✅ VEML6030 sensor found");
  }

  Serial.println("✅ BME280, Rain Sensor, and VEML6030 Light Sensor Found!");
  
  // connect to wifi
  setup_wifi();
  
  // Set mqtt server
  client.setServer(mqtt_broker, mqtt_port);
  
  Serial.println("Setup complete");
  Serial.println("-------------------------");
}

void loop() {
  // check mqtt connection
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // collect sensor data
  temperature = bme.readTemperature();
  humidity = bme.readHumidity();
  pressure = bme.readPressure() / 100.0F;
  int rainIntensity = analogRead(RAIN_SENSOR_ANALOG_PIN);
  rainScore = (2541.0 - rainIntensity) / 2541.0;  // normalized to 0-1
  lightLevel = veml6030.readLight();
  
  // ensure rainscore stays within 0-1 range
  if (rainScore < 0) rainScore = 0;
  if (rainScore > 1) rainScore = 1;
  
  // calculate rain level based on rain intensity
  if (rainIntensity > 2500)       rain_level = 0;  // No rain
  else if (rainIntensity > 1500)  rain_level = 1;  // Light
  else if (rainIntensity > 1000)  rain_level = 2;  // Moderate
  else                           rain_level = 3;  // Heavy
  
  // ensure rain_level is never negative
  if (rain_level < 0) rain_level = 0;
  
  // === display data on serial monitor ===
  Serial.println("------ WEATHER MONITORING ------");
  Serial.print("🌡️  Temperature: "); Serial.print(temperature); Serial.println(" °C");
  Serial.print("💧 Humidity: "); Serial.print(humidity); Serial.println(" %");
  Serial.print("📈 Pressure: "); Serial.print(pressure); Serial.println(" hPa");
  Serial.print("🌧️ Rain Level: ");
  switch(rain_level) {
    case 0: Serial.println("No Rain"); break;
    case 1: Serial.println("Light"); break;
    case 2: Serial.println("Moderate"); break;
    case 3: Serial.println("Heavy"); break;
  }
  Serial.print("💧 Rain Score: "); Serial.println(rainScore);
  Serial.print("☀️ Light: "); Serial.print(lightLevel); Serial.println(" lux");

  // rainbow backlight effect
  r = (abs(sin(3.14 * t / 180))) * 255;
  g = (abs(sin(3.14 * (t + 60) / 180))) * 255;
  b = (abs(sin(3.14 * (t + 120) / 180))) * 255;
  t = (t + 3) % 360; // prevent t from growing too large
  lcd.setRGB(r, g, b);
  
  // page switching logic - using millis() to avoid blocking
  unsigned long currentTime = millis();
  if (currentTime - lastPageChange >= PAGE_INTERVAL) {
      lastPageChange = currentTime;
      currentPage = (currentPage + 1) % 5; // cycle through 5 display pages
      updateDisplay();
  }

  // create and send mqtt message
  StaticJsonDocument<256> doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["pressure"] = pressure;
  doc["rain_level"] = rain_level;
  doc["rain_score"] = rainScore;
  doc["light"] = lightLevel;
  
  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);
  
  if (client.publish(mqtt_topic, jsonBuffer)) {
    Serial.println("MQTT message sent successfully");
  } else {
    Serial.println("Failed to send MQTT message");
  }

  Serial.println("-------------------------");
  delay(1000);  // 10s refresh
}