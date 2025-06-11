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

## Wiring

1. **Power & Ground** on breadboard rails to ESP32 `3V3` and `GND` pins.
2. **I²C bus**: connect `SDA` → ESP32 GPIO21, `SCL` → GPIO22.
3. Plug BME280, VEML6030, and LCD backpack onto the same I²C rails.

## Software Setup

### 1. Backend (Flask)

#### Requirements

```bash
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

#### MQTT Subscriber (`mqtt_handler.py`)

* Uses `paho-mqtt` to subscribe to topics like `weather/temperature` and store readings.

#### Flask App (`app.py`)

* Register OAuth (`Authlib`) for Google login
* JWT auth for `/api/profile`, `/api/advice`
* Routes:

  * `POST /api/signup`, `POST /api/login`
  * `GET /api/data` (latest sensor values)
  * `POST /api/analyze` (optional AI analysis)

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

1. **Start MQTT broker** (e.g., Mosquitto)
2. **Run Flask**: `python app.py or flask run`
3. **Run React**: `npm start` in `frontend/`
4. **Upload firmware** to ESP32: Arduino IDE or PlatformIO
5. **View** dashboard at `http://localhost:5173`

## License

This project is MIT licensed.

---
