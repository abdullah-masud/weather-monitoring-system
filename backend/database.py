from models import User, db, SensorData


def get_user_by_id(user_id):
    return User.query.get(user_id)

def get_user_by_email(email):
    return User.query.filter_by(email=email).first()

def get_user_by_name(name):
    return User.query.filter_by(name=name).first()

def check_user_credentials(email, password):
    user = get_user_by_email(email)
    return user if user and user.password == password else None

def create_user(name, email, password):
    user = User(name=name, email=email, password=password)
    db.session.add(user)
    db.session.commit()
    return user

def create_sensor_data(topic, value):
    data = SensorData(topic=topic, value=value)
    db.session.add(data)
    db.session.commit()
    return data

def get_latest_sensor_data():
    return SensorData.query.order_by(SensorData.timestamp.desc()).first()

def get_sensor_data_by_topic(topic):
    return SensorData.query.filter_by(topic=topic).order_by(SensorData.timestamp.desc()).all()

def get_sensor_data_between(start_time, end_time):
    return SensorData.query.filter(SensorData.timestamp.between(start_time, end_time)).all()


def delete_user_by_id(user_id):
    user = User.query.get(user_id)
    if user:
        db.session.delete(user)
        db.session.commit()
        return True
    return False

def delete_sensor_data_by_id(data_id):
    data = SensorData.query.get(data_id)
    if data:
        db.session.delete(data)
        db.session.commit()
        return True
    return False

def delete_all_users():
    db.session.query(User).delete()
    db.session.commit()

def delete_all_sensor_data():
    db.session.query(SensorData).delete()
    db.session.commit()

