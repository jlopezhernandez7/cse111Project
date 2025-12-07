from flask import Blueprint, request, jsonify, session, g
from werkzeug.security import check_password_hash
from functools import wraps
from models import db, User

auth_bp = Blueprint("auth", __name__)


def user_to_dict(user: User):
    return {
        "userID": user.userID,
        "username": user.u_username,
        "email": user.u_email,
    }


@auth_bp.post("/login")
def login():
    """
    POST /api/auth/login
    { "email": "...", "password": "..." }
    """
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(u_email=email).first()
    if not user or not check_password_hash(user.u_password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    # Store user id in session
    session["user_id"] = user.userID

    return jsonify({"message": "logged in", "user": user_to_dict(user)})


@auth_bp.post("/logout")
def logout():
    """
    POST /api/auth/logout
    """
    session.pop("user_id", None)
    return jsonify({"message": "logged out"})


# Helper to get current user
def get_current_user():
    uid = session.get("user_id")
    if not uid:
        return None
    return User.query.get(uid)



def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        uid = session.get("user_id")
        if not uid:
            return jsonify({"error": "Authentication required"}), 401
        user = User.query.get(uid)
        if not user:
            session.pop("user_id", None)
            return jsonify({"error": "Authentication required"}), 401
        g.current_user = user
        return f(*args, **kwargs)
    return wrapper


@auth_bp.get("/me")
def me():
    """
    GET /api/auth/me
    Returns the current logged-in user based on the session cookie.
    """
    from .auth_routes import get_current_user  
    user = get_current_user()
    if not user:
        return jsonify({"user": None}), 401
    return jsonify({"user": user_to_dict(user)})
