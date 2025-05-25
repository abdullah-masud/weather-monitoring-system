import os
import pickle
from datetime import datetime, timedelta
import torch
from flask import Flask, jsonify, url_for, redirect, request
from flask_cors import CORS
from analyze_data import analyze_date_range_db, get_latest_features
from database import *
from models import db, SensorData, User
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from google_auth import register_oauth
from suggestion.training import RainMultiTaskModel  # only the model class, no training logic
import paho.mqtt.client as mqtt
import json
import pandas as pd
import numpy as np

load_dotenv()
app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY')
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")


basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'sensors.db')

# update CORS configuration 
CORS(app, 
     resources={r"/api/*": {
         "origins": ["http://localhost:5173"],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"]
     }},
     supports_credentials=True)
jwt = JWTManager(app)
db.init_app(app)

oauth = register_oauth(app)
google = oauth.google


# mqtt configuration
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_TOPIC = "esp32/output"

mqtt_client = mqtt.Client()
mqtt_client.on_connect = lambda client, userdata, flags, rc: client.subscribe(MQTT_TOPIC)
mqtt_client.on_message = lambda client, userdata, msg: on_message(client, userdata, msg)

# --- Load pretrained multi-task model & scaler once at startup ---
device = torch.device('cpu')
model = RainMultiTaskModel(in_dim=6, n_classes=4).to(device)
model.load_state_dict(
    torch.load('multitask_weather_model.pth', map_location=device, weights_only=True))
model.eval()
# load StandardScaler
with open('scaler_multitask.pkl','rb') as f:
    scaler = pickle.load(f)

def on_message(client, userdata, msg):
    data = json.loads(msg.payload.decode())
    timestamp = datetime.now()
    with app.app_context():
        for key, value in data.items():
            
            # ensure value is numeric type
            if isinstance(value, (int, float)):
                sensor = SensorData(topic=f"esp32/{key}", value=float(value), timestamp=timestamp)
                db.session.add(sensor)
        db.session.commit()
        print(f"Stored sensor data: {data}")

@app.shell_context_processor
def make_shell_context():
    return {
        "db": db,
        "User": User,
        "SensorData": SensorData,
        "get_user_by_id": get_user_by_id,
        "get_user_by_email": get_user_by_email,
        "check_user_credentials": check_user_credentials,
        "create_user": create_user,
        "create_sensor_data": create_sensor_data,
        "get_latest_sensor_data": get_latest_sensor_data,
        "get_sensor_data_by_topic": get_sensor_data_by_topic,
    }

@app.route("/")
def home():
    return jsonify({"message": "Flask running with Google OAuth"})

@app.route("/api/auth/google")
def google_login():
    redirect_uri = url_for("google_callback", _external=True)
    print("🪪 Redirect URI:", redirect_uri)
    return google.authorize_redirect(redirect_uri)

@app.route("/api/data", methods=["GET"])
def get_data():
    try:
        # get new value
        latest_temperature = SensorData.query.filter(SensorData.topic == "esp32/temperature").order_by(SensorData.timestamp.desc()).first()
        latest_humidity = SensorData.query.filter(SensorData.topic == "esp32/humidity").order_by(SensorData.timestamp.desc()).first()
        latest_pressure = SensorData.query.filter(SensorData.topic == "esp32/pressure").order_by(SensorData.timestamp.desc()).first()
        latest_rain_level = SensorData.query.filter(SensorData.topic == "esp32/rain_level").order_by(SensorData.timestamp.desc()).first()
        latest_rain_score = SensorData.query.filter(SensorData.topic == "esp32/rain_score").order_by(SensorData.timestamp.desc()).first()
        latest_light = SensorData.query.filter(SensorData.topic == "esp32/light").order_by(SensorData.timestamp.desc()).first()
        
        # Formatted data
        sensor_data = {
            "temperature": f"{latest_temperature.value:.1f}°C" if latest_temperature else "24°C",
            "humidity": f"{latest_humidity.value:.0f}%" if latest_humidity else "60%",
            "pressure": f"{latest_pressure.value:.1f} hPa" if latest_pressure else "1013 hPa",
            "rainLevel": "No Rain" if not latest_rain_level or latest_rain_level.value == 0 else 
                     "Light Rain" if latest_rain_level.value == 1 else 
                     "Moderate Rain" if latest_rain_level.value == 2 else 
                     "Heavy Rain",
            "rainScore": f"{latest_rain_score.value:.0f}" if latest_rain_score else "0",
            "light": f"{latest_light.value:.1f} lux" if latest_light else "500 lux"
        }
        
        return jsonify(sensor_data)
    except Exception as e:
        print(f"Error fetching sensor data: {str(e)}")
        fallback_data = {
            "temperature": "24°C",
            "humidity": "60%",
            "pressure": "1013 hPa",
            "rainLevel": "No Rain",
            "rainScore": "0",
            "light": "500 lux"
        }
        return jsonify(fallback_data)

@app.route("/api/auth/google/callback")
def google_callback():
    token = google.authorize_access_token()
    user_info = google.get("userinfo").json()
    jwt_token = create_access_token(identity=user_info["email"])
    redirect_url = f"http://localhost:5173/dashboard?token={jwt_token}&email={user_info['email']}"
    return redirect(redirect_url)

@app.route("/api/profile")
@jwt_required()
def protected():
    user_email = get_jwt_identity()
    return jsonify({"message": f"Welcome, {user_email}!"})

@app.route("/api/login", methods=["POST"])
def login():
    print("--------- LOGIN REQUEST RECEIVED ---------")
    print(f"Request headers: {dict(request.headers)}")
    print(f"Request data: {request.data}")
    
    try:
        data = request.get_json()
        print(f"Parsed JSON data: {data}")
        
        email = data.get("email")
        password = data.get("password")
        print(f"Login attempt - Email: {email}, Password: {password}")
        
        registered_users = {"test@example.com": {"password": "123456", "name": "Test User"}}
        print(f"Available users: {registered_users}")
        
        user = registered_users.get(email)
        print(f"Found user: {user}")
        
        if not user or user["password"] != password:
            print("Login failed: Invalid credentials")
            return jsonify({"message": "Invalid email or password"}), 401
        
        print("Login successful, generating token...")
        access_token = create_access_token(identity=email)
        response = jsonify({"token": access_token, "user": {"email": email, "name": user["name"]}})
        print(f"Sending response: {response.data}")
        return response
    except Exception as e:
        print(f"Error during login: {str(e)}")
        return jsonify({"message": f"Login error: {str(e)}"}), 500

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    
    # check if email is already registered
    existing_user = get_user_by_email(email)
    if existing_user:
        return jsonify({"message": "Email already registered"}), 400
    
    # create new user
    user = create_user(name, email, password)
    
    # generate jwt token
    access_token = create_access_token(identity=email)
    
    return jsonify({
        "message": "User registered successfully", 
        "token": access_token,
        "user": {"email": email, "name": name}
    }), 201

@app.route("/api/historical-data", methods=["GET"])
def get_historical_data():
    try:
        # get data in the last hour
        one_hour_ago = datetime.now() - timedelta(hours=1)
        
        # query data for each sensor type
        temperature_data = SensorData.query.filter(
            SensorData.topic == "esp32/temperature",
            SensorData.timestamp >= one_hour_ago
        ).order_by(SensorData.timestamp.asc()).all()
        
        humidity_data = SensorData.query.filter(
            SensorData.topic == "esp32/humidity",
            SensorData.timestamp >= one_hour_ago
        ).order_by(SensorData.timestamp.asc()).all()
        
        pressure_data = SensorData.query.filter(
            SensorData.topic == "esp32/pressure", 
            SensorData.timestamp >= one_hour_ago
        ).order_by(SensorData.timestamp.asc()).all()
        
        rain_level_data = SensorData.query.filter(
            SensorData.topic == "esp32/rain_level",
            SensorData.timestamp >= one_hour_ago
        ).order_by(SensorData.timestamp.asc()).all()
        
        rain_score_data = SensorData.query.filter(
            SensorData.topic == "esp32/rain_score",
            SensorData.timestamp >= one_hour_ago
        ).order_by(SensorData.timestamp.asc()).all()
        
        light_data = SensorData.query.filter(
            SensorData.topic == "esp32/light",
            SensorData.timestamp >= one_hour_ago
        ).order_by(SensorData.timestamp.asc()).all()
        
        # deduplicate function
        def deduplicate_by_minute(data_list):
            minute_map = {}
            for data in data_list:
                minute_key = data.timestamp.strftime("%H:%M")
                minute_map[minute_key] = data
            
            unique_list = list(minute_map.values())
            unique_list.sort(key=lambda x: x.timestamp)
            return unique_list
        
        # deduplicate each data set
        temperature_data = deduplicate_by_minute(temperature_data)
        humidity_data = deduplicate_by_minute(humidity_data)
        pressure_data = deduplicate_by_minute(pressure_data)
        rain_level_data = deduplicate_by_minute(rain_level_data)
        rain_score_data = deduplicate_by_minute(rain_score_data)
        light_data = deduplicate_by_minute(light_data)
        
        # Formatting frontend data
        result = {
            "temperature": [{"time": data.timestamp.strftime("%H:%M:%S"), "value": data.value} for data in temperature_data],
            "humidity": [{"time": data.timestamp.strftime("%H:%M:%S"), "value": data.value} for data in humidity_data],
            "pressure": [{"time": data.timestamp.strftime("%H:%M:%S"), "value": data.value} for data in pressure_data],
            "rainLevel": [{"time": data.timestamp.strftime("%H:%M:%S"), "value": data.value} for data in rain_level_data],
            "rainScore": [{"time": data.timestamp.strftime("%H:%M:%S"), "value": data.value} for data in rain_score_data],
            "light": [{"time": data.timestamp.strftime("%H:%M:%S"), "value": data.value} for data in light_data]
        }
        
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching historical data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/analyze", methods=["GET"])
def analyze():
    start = request.args.get("start", type=str)
    end = request.args.get("end", type=str)
    
    if not start or not end:
        return jsonify({"msg": "start & end required"}), 400
    
    try:    
        summary, trends = analyze_date_range_db(start, end)
        
        # strip any prefixes:
        clean_summary = {
            topic.split("/", 1)[-1]: stats
            for topic, stats in summary.to_dict(orient="index").items()
        }
        
        clean_trends = {
            topic.split("/", 1)[-1]: slope
            for topic, slope in trends.items()
        }
        
        return jsonify({
            "summary": clean_summary,
            "trends": clean_trends
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Error analyzing data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/predict", methods=["GET"])
def predict():
    try:
        # default prediction window: last 24 hours
        now = datetime.utcnow()
        day_ago = now - timedelta(days=1)
        
        # we'll aggregate that 24h slice
        summary, trends = analyze_date_range_db(
            day_ago.isoformat(), now.isoformat()
        )
        
        # build model features from these aggregates:
        means = {k.split("/", 1)[-1]: v["mean"]
                for k, v in summary.to_dict("index").items()}
        slopes = {k.split("/", 1)[-1]: s
                for k, s in trends.items()}
                
        # Handle case where data might be missing
        default_features = {
            "temperature": 22.0,
            "humidity": 50.0,
            "pressure": 1013.0,
            "light": 500.0,
            "rain_score": 0.0
        }
        
        # Use defaults for missing values
        for key in default_features:
            if key not in means:
                means[key] = default_features[key]
            if key not in slopes:
                slopes[key] = 0.0
        
        X_raw = [
            means["temperature"],
            means["humidity"],
            means["pressure"],
            means["light"],
            means["rain_score"],  # average rain score
            slopes["rain_score"]  # rain_score trend
        ]
        
        X = scaler.transform([X_raw])
        
        with torch.no_grad():
            out_cls, out_reg, _ = model(torch.tensor(X, dtype=torch.float32))
            
        rain_level = int(out_cls.argmax(dim=1))
        rain_score = float(out_reg.squeeze().clamp(0.0, 1.0))
        
        # Clean summaries for output
        clean_summary = {
            topic.split("/", 1)[-1]: stats
            for topic, stats in summary.to_dict(orient="index").items()
        }
        
        clean_trends = {
            topic.split("/", 1)[-1]: slope
            for topic, slope in trends.items()
        }
        
        # Return result in timestamp format
        return jsonify({
            "prediction": {
                "timestamp": (now + timedelta(days=1)).isoformat(),  # predict for tomorrow
                "rain_level": rain_level,
                "rain_score": rain_score
            },
            "summary": clean_summary,
            "trends": clean_trends
        })
    except Exception as e:
        print(f"Error generating prediction: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print('database created')
    # start mqtt client 
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    mqtt_client.loop_start()  
    app.run(debug=True, host='0.0.0.0', port=5001)