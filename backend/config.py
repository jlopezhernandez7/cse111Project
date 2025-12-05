# backend/config.py

import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from models import db  # `db = SQLAlchemy()`

# Load environment variables from .env
load_dotenv()


def create_app():
    app = Flask(__name__)
    
    # Load env 
    DATABASE_URL = os.getenv("DATABASE_URL")
    SECRET_KEY = os.getenv("SECRET_KEY")
    FRONTEND_URL = os.getenv("FRONTEND_URL")

    # Flask config
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = SECRET_KEY

    # Init extensions
    db.init_app(app)
    CORS(app, origins=[FRONTEND_URL], supports_credentials=True)

    # Register blueprints here (apids )
    # from routes.event_routes import event_bp
    # app.register_blueprint(event_bp, url_prefix="/api/events")
    @app.get("/")
    def index():
        return {"message": "Backend running. Try /api/health"}

    # Simple health check route
    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    with app.app_context():
        # If you were creating tables with SQLAlchemy:
        # db.create_all()
        # But you already have an existing SQLite from CSE111, so leave this empty.
        pass

    return app
