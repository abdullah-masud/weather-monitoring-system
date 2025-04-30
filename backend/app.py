import os

from flask import Flask, jsonify, url_for, redirect
from flask_cors import CORS
from models import db
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity


from google_auth import register_oauth

load_dotenv()  # Load env variables


app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY')
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'sensors.db')

CORS(app, supports_credentials=True)
jwt = JWTManager(app)

db.init_app(app)

# Register OAuth
oauth = register_oauth(app)
google = oauth.google

@app.route("/")
def home():
    return jsonify({"message": "Flask running with Google OAuth"})

@app.route("/api/auth/google")
def google_login():
    redirect_uri = url_for("google_callback", _external=True)
    print("🪪 Redirect URI:", redirect_uri)  # ← Add this line
    return google.authorize_redirect(redirect_uri)

@app.route("/api/data", methods=["GET"])
def get_data():
    sensor_data = {
        "temperature": "24°C",
        "humidity": "60%",
        "airQuality": "Good (45 AQI)",
        "rainfall": "5 mm",
        "uvIntensity": "Moderate (4)"
    }
    return jsonify(sensor_data)

@app.route("/api/auth/google/callback")
def google_callback():
    token = google.authorize_access_token()
    user_info = google.get("userinfo").json()

    # Issue your JWT token
    jwt_token = create_access_token(identity=user_info["email"])

    # Redirect back to React dashboard with token as a URL parameter
    redirect_url = f"http://localhost:5173/dashboard?token={jwt_token}&email={user_info['email']}"
    # print(jwt_token)
    # print(user_info["email"])
    return redirect(redirect_url)

@app.route("/api/profile")
@jwt_required()
def protected():
    user_email = get_jwt_identity()
    return jsonify({"message": f"Welcome, {user_email}!"})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # creates the DB and tables
        print('database created')

    app.run(debug=True)
