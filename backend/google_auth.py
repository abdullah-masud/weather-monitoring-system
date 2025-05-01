import os
from authlib.integrations.flask_client import OAuth

oauth = OAuth()

def register_oauth(app):
    oauth.init_app(app)

    google = oauth.register(
        name="google",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        access_token_url='https://oauth2.googleapis.com/token',
        authorize_url='https://accounts.google.com/o/oauth2/auth',
        api_base_url='https://www.googleapis.com/oauth2/v1/',
        client_kwargs={
            "scope": "email profile"
        },
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    )

    return oauth