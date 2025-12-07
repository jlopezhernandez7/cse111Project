# backend/config.py

import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from models import db  # `db = SQLAlchemy()`

#/routes
from routes.event_routes import event_bp
from routes.user_routes import user_bp
from routes.tag_routes import tag_bp

from routes.attendance_routes import attendance_bp
from routes.preference_routes import preference_bp
from routes.post_routes import post_bp
from routes.media_routes import media_bp 

from routes.canconnect_routes import canconnect_bp
from routes.auth_routes import auth_bp

# Load environment variables from .env
load_dotenv()


def create_app():
    app = Flask(__name__)
    
    # Load env 
    DATABASE_URL = os.getenv("DATABASE_URL")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")

    FRONTEND_URL = os.getenv("FRONTEND_URL")

    # Flask config
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = SECRET_KEY
    
    
    
        # IMPORTANT: cookie settings for cross-site (Vercel ↔ Render)
    if os.getenv("FLASK_ENV") == "production":
        app.config["SESSION_COOKIE_SAMESITE"] = "None"
        app.config["SESSION_COOKIE_SECURE"] = True
    else:
        # local dev: easier to keep default
        app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
        app.config["SESSION_COOKIE_SECURE"] = False

    # Init extensions
    db.init_app(app)
    CORS(app, origins=[FRONTEND_URL], supports_credentials=True)

    # Register blueprints here (apids )
    # from routes.event_routes import event_bp
    # app.register_blueprint(event_bp, url_prefix="/api/events")
    #from routes folder 
    app.register_blueprint(event_bp, url_prefix="/api/events")
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(tag_bp, url_prefix="/api/tags")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(preference_bp, url_prefix="/api/preferences")
    app.register_blueprint(post_bp, url_prefix="/api/posts")
    app.register_blueprint(media_bp, url_prefix="/api/media")
    app.register_blueprint(canconnect_bp, url_prefix="/api/canconnect")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")




    @app.get("/")  #http://127.0.0.1:5000/
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
