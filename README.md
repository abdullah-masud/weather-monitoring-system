# Smart Weather Monitoring System

This project collects environmental data (temperature, humidity, pressure, rain status/intensity, and light level) using an ESP32 microcontroller with I²C sensors, publishes readings via MQTT, stores data in a Flask/SQLite backend, and presents a React dashboard with user authentication (Google OAuth + email/password) and AI-driven analysis via trained model using previous data and BOM weather reports.

---

## Architecture Overview

```
[ESP32 + I²C Sensors]  
     │ (Wi‑Fi + MQTT)  
[MQTT Broker]  
     │ (subscribe)   
[Flask Backend + SQLite]  
     │ (REST + JWT)  
[React Frontend (Dashboard)]
```

## Hardware Components

* **ESP32 Dev Board** (FireBeetle 2 ESP32-E)
* **PiicoDev BME280** (Temperature, Humidity, Pressure)
* **PiicoDev VEML6030** (Ambient Light)
* **I²C 16×2 LCD with backpack**
* **Breadboard**, **jumper wires**, **USB-C data cable**

### 1. ESP32 Firmware (`backend/esp32_mqtt/esp32_mqtt.ino`)

The ESP32 firmware handles sensor data collection and MQTT communication.

#### Features

* **Multi-sensor support**: BME280 (temperature, humidity, pressure), VEML6030 (light), rain sensor (analog/digital)
* **LCD display**: 16×2 RGB LCD with rotating pages showing different sensor readings
* **Rainbow backlight**: Dynamic RGB color cycling for visual appeal
* **MQTT publishing**: Sends JSON-formatted sensor data to `esp32/output` topic
* **Wi-Fi connectivity**: Automatic connection and reconnection handling
* **Real-time monitoring**: 1-second refresh rate with non-blocking display updates

#### Configuration

// Wi-Fi credentials
const char* ssid = "ssid";
const char* password = "password";

// MQTT Broker settings
const char* mqtt_broker = "broker.hivemq.com";  
const char* mqtt_topic = "esp32/output";


#### Required Libraries

Install via Arduino IDE Library Manager:
* `Adafruit BME280 Library`
* `SparkFun VEML6030 Arduino Library`
* `PubSubClient` (for MQTT)
* `ArduinoJson`
* Custom `Waveshare_LCD1602_RGB` library

## Wiring

1. **Power & Ground** on breadboard rails to ESP32 `3V3` and `GND` pins.
2. **I²C bus**: connect `SDA` → ESP32 GPIO21, `SCL` → GPIO22.
3. Plug BME280, VEML6030, and LCD backpack onto the same I²C rails.
   

## Software Setup

### 1. Backend (Flask)

#### Requirements

```bash
cd backend/
pip install -r requirements.txt
# requirements.txt should include:
# Flask, flask-cors, flask_sqlalchemy, paho-mqtt, authlib, flask-jwt-extended, openai
```

#### Environment Variables (`backend/.env`)

```ini
FLASK_SECRET_KEY=your-flask-secret
JWT_SECRET_KEY=your-jwt-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OPENAI_API_KEY=...
```

#### Database Models (`models.py`)

* `User(id, name, email, password_hash)`
* `SensorData(id, topic, value, timestamp)`

#### Utility Functions (`database.py`)

* CRUD for users & sensor data (`create_user`, `get_user_by_email`, `delete_sensor_data_by_id`, etc.)

#### MQTT Subscriber (`mqtt_test.py`)
### 2. MQTT Testing Tool (`backend/mqtt_test.py`)

A Python script for testing MQTT communication and database storage. By using the `paho-mqtt` Python client library for MQTT protocol implementation.

#### Features

* **MQTT subscriber**: Listens to `esp32/output` topic for sensor data using paho-mqtt client
* **Database integration**: Automatically stores received sensor readings to SQLite database
* **Interactive control**: Send commands (`ON`/`OFF`) to ESP32 via `esp32/input` topic
* **Data verification**: Query and display recent sensor data from database
* **Real-time monitoring**: Continuous listening with proper error handling and automatic reconnection

#### Usage

bash
cd backend/
python mqtt_test.py


The script will:
1. Connect to the MQTT broker using paho-mqtt client
2. Subscribe to sensor data from ESP32
3. Store received data in SQLite database
4. Allow interactive command sending
5. Display recent database entries on exit



#### Flask App (`app.py`)

* Register OAuth (`Authlib`) for Google login
* JWT auth
* Routes:

  * `POST /api/signup`, `POST /api/login`4
  * `GET /api/data` (latest sensor values)
  * `POST /api/prediction` ( AI prediction for raining)

### 2. Frontend (React)

#### Setup

```bash
cd frontend
npm install
npm run dev
```

#### Login Flow

* **Email/password** login: submits to `/api/login`, stores `jwt` + `name` in `localStorage`.
* **Google OAuth**: redirects to `/api/auth/google`, callback stores token and redirects to `/dashboard`.

#### Dashboard (`Dashboard.jsx`)

* Reads `jwt` + `name` from `localStorage`
* Fetches `/api/data` to display sensor readings in cards
* Button to **Analyze with ChatGPT** calls `/api/analyze`
* **Logout** button clears storage and redirects

## Rain Prediction (Under `/suggestion`)

We also provide a simple machine-learning pipeline to predict whether it will rain in the next observation period (e.g. the next half-day). This runs entirely in Python and integrates with our Flask backend.

### 1. Data Preprocessing

All BOM monthly CSVs (`IDCJDW6111.YYYYMM.csv`) live in `monthly_data/`. To merge and clean them:

```bash
# Install dependencies
pip install pandas scikit-learn

# Run the prep script
python suggestion/preprocess_BOM_weather.py
```



## Running the System

1. **Start MQTT broker** python mqtt_test.py
2. **Run Flask**: `python app.py or flask run`
3. **Run React**: `npm start` in `frontend/`
4. **Upload firmware** to ESP32: Arduino IDE or PlatformIO
5. **View** dashboard at `http://localhost:5173`

## License

This project is MIT licensed.

---
