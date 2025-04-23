import os

from flask import Flask, jsonify
from flask_cors import CORS
from models import db

app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'sensors.db')
CORS(app)

db.init_app(app)

@app.route('/')
def hello():
    return jsonify({'message': 'Hello from Flask!'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # creates the DB and tables
        print('database created')

    app.run(debug=True)
