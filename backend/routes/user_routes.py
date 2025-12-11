# backend/routes/user_routes.py

from flask import Blueprint, request, jsonify, session
from models import db, User
from werkzeug.security import generate_password_hash, check_password_hash


from utils.emailer import send_email
from models import Preference, Tag, User


user_bp = Blueprint("users", __name__)


def user_to_dict(user: User):
    return {
        "userID": user.userID,
        "username": user.u_username,
        "email": user.u_email,
    }


@user_bp.get("/")
def list_users():
    """
    GET /api/users
    Simple list of all users (for dropdowns, etc.)
    """
    users = User.query.all()
    return jsonify([user_to_dict(u) for u in users])


@user_bp.post("/")
def create_user():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "username, email, password are required"}), 400

    hashed = generate_password_hash(password)

    user = User(u_username=username, u_email=email, u_password=hashed)
    db.session.add(user)
    db.session.commit()
    
    session["user_id"] = user.userID

    return jsonify(user_to_dict(user)), 201
