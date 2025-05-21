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

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY')
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

# Database setup
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'sensors.db')
CORS(app, supports_credentials=True)
jwt = JWTManager(app)
db.init_app(app)

# OAuth registration
oauth = register_oauth(app)
google = oauth.google

# --- Load pretrained multi-task model & scaler once at startup ---
device = torch.device('cpu')
model = RainMultiTaskModel(in_dim=6, n_classes=4).to(device)
model.load_state_dict(
    torch.load('multitask_weather_model.pth', map_location=device, weights_only=True)
)
model.eval()
# load StandardScaler
with open('scaler_multitask.pkl','rb') as f:
    scaler = pickle.load(f)

# Shell context for flask shell
@app.shell_context_processor
def make_shell_context():
    return {
        "db": db,
        "User": User,
        "SensorData": SensorData,
        # user & sensor data helpers
        "get_user_by_id": get_user_by_id,
        "get_user_by_email": get_user_by_email,
        "check_user_credentials": check_user_credentials,
        "create_user": create_user,
        "create_sensor_data": create_sensor_data,
        "get_latest_sensor_data": get_latest_sensor_data,
        "get_sensor_data_by_topic": get_sensor_data_by_topic,
    }

# Basic health check
@app.route("/")
def home():
    return jsonify({"message": "Flask running with Google OAuth"})

# Google OAuth login
@app.route("/api/auth/google")
def google_login():
    redirect_uri = url_for("google_callback", _external=True)
    return google.authorize_redirect(redirect_uri)

# Google OAuth callback
@app.route("/api/auth/google/callback")
def google_callback():
    token = google.authorize_access_token()
    user_info = google.get("userinfo").json()
    jwt_token = create_access_token(identity=user_info["email"])
    redirect_url = (
        f"http://localhost:5173/dashboard?token={jwt_token}&email={user_info['email']}"
    )
    return redirect(redirect_url)

# Public data endpoint
@app.route("/api/data", methods=["GET"])
def get_data():
    # placeholder static data
    return jsonify({
        "temperature": "24°C",
        "humidity": "60%",
        "airQuality": "Good (45 AQI)",
        "rainfall": "5 mm",
        "uvIntensity": "Moderate (4)"
    })

# JWT‑protected profile
@app.route("/api/profile")
@jwt_required()
def protected():
    user_email = get_jwt_identity()
    return jsonify({"message": f"Welcome, {user_email}!"})

# Local login
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    registered_users = {
        "test@example.com": {"password": "123456", "name": "Test User"}
    }
    user = registered_users.get(email)
    if not user or user["password"] != password:
        return jsonify({"message": "Invalid email or password"}), 401
    access_token = create_access_token(identity=email)
    return jsonify({"token": access_token, "user": {"email": email, "name": user["name"]}})

# Analysis endpoint using DB + model inference
@app.route("/api/analyze", methods=["GET"])
def analyze():
    start = request.args.get("start", type=str)
    end   = request.args.get("end",   type=str)
    if not start or not end:
        return jsonify({"msg": "start & end required"}), 400

    summary, trends = analyze_date_range_db(start, end)

    # strip any prefixes:
    clean_summary = {
        topic.split("/",1)[-1]: stats
        for topic, stats in summary.to_dict(orient="index").items()
    }
    clean_trends = {
        topic.split("/",1)[-1]: slope
        for topic, slope in trends.items()
    }

    return jsonify({
        "summary": clean_summary,
        "trends":  clean_trends
    })


@app.route("/api/predict", methods=["GET"])
def predict():
    # default prediction window: last 24 hours
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)

    # we’ll aggregate that 24h slice
    pred_summary, pred_trends = analyze_date_range_db(
        day_ago.isoformat(), now.isoformat()
    )

    # build model features from these aggregates:
    means  = {k.split("/",1)[-1]: v["mean"]
              for k,v in pred_summary.to_dict("index").items()}
    slopes = {k.split("/",1)[-1]: s
              for k,s in pred_trends.items()}

    X_raw = [
        means["temperature"],
        means["humidity"],
        means["pressure"],
        means["light"],
        means["rain_score"],     # average rain score
        slopes["rain_score"]     # rain_score trend
    ]
    X = scaler.transform([X_raw])

    with torch.no_grad():
        out_cls, out_reg, _ = model(torch.tensor(X, dtype=torch.float32))
    rain_level = int(out_cls.argmax(dim=1))
    rain_score = float(out_reg.clamp(0.0, 1.0))

    return jsonify({
        "window_start": day_ago.isoformat(),
        "window_end":   now.isoformat(),
        "rain_level":   rain_level,
        "rain_score":   rain_score
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print('database created')
    app.run(debug=True)
