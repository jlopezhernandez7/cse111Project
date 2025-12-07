# backend/routes/preference_routes.py

from flask import Blueprint, request, jsonify, g
from models import db, Preference, User, Tag
from routes.auth_routes import login_required  # adjust import path

preference_bp = Blueprint("preferences", __name__)


def tag_to_dict(tag: Tag):
    return {
        "tagsID": tag.tagsID,
        "type": tag.t_type,
        "date": tag.t_date,
        "startTime": tag.t_startTime,
        "duration": tag.t_duration,
        "capacity": tag.t_capacity,
    }


def pref_to_dict(pref: Preference):
    return {
        "userID": pref.p_userID,
        "tagsID": pref.p_tagsID,
        "notification": pref.notification,
    }


# get all tags + notification status

@preference_bp.get("/me")
@login_required
def get_my_preferences():
    """
    GET /api/preferences/me

    Returns all tags plus whether the CURRENT user has notifications on
    for each tag.
    """
    user = g.current_user
    all_tags = Tag.query.all()

    pref_by_tag_id = {p.p_tagsID: p for p in user.preferences}

    result = []
    for tag in all_tags:
        pref = pref_by_tag_id.get(tag.tagsID)
        result.append(
            {
                "tag": tag_to_dict(tag),
                "notification": bool(pref.notification) if pref else False,
            }
        )

    return jsonify(
        {
            "userID": user.userID,
            "username": user.u_username,
            "preferences": result,
        }
    )


# set notifcation preference tags for user

@preference_bp.post("/")
@login_required
def set_preference():
    """
    POST /api/preferences

    Body JSON:
    {
      "tagsID": 3,
      "notification": true   // or false
    }

    Applies to CURRENT user only.
    """
    data = request.get_json() or {}
    tag_id = data.get("tagsID")
    notification = data.get("notification")

    if tag_id is None or notification is None:
        return jsonify({"error": "tagsID and notification are required"}), 400

    user = g.current_user
    tag = Tag.query.get(tag_id)

    if not tag:
        return jsonify({"error": "Invalid tagsID"}), 404

    pref = Preference.query.get((user.userID, tag_id))
    if pref is None:
        pref = Preference(
            p_userID=user.userID,
            p_tagsID=tag_id,
            notification=bool(notification),
        )
        db.session.add(pref)
    else:
        pref.notification = bool(notification)

    db.session.commit()
    return jsonify(pref_to_dict(pref)), 201


# toggle on /off notification 

@preference_bp.post("/toggle")
@login_required
def toggle_preference():
    """
    POST /api/preferences/toggle

    Body JSON:
    {
      "tagsID": 3
    }

    For CURRENT user:
    - If no row -> create with notification=True
    - If exists and True -> set False
    - If exists and False -> set True
    """
    data = request.get_json() or {}
    tag_id = data.get("tagsID")

    if tag_id is None:
        return jsonify({"error": "tagsID is required"}), 400

    user = g.current_user
    tag = Tag.query.get(tag_id)

    if not tag:
        return jsonify({"error": "Invalid tagsID"}), 404

    pref = Preference.query.get((user.userID, tag_id))
    if pref is None:
        pref = Preference(
            p_userID=user.userID,
            p_tagsID=tag_id,
            notification=True,
        )
        db.session.add(pref)
    else:
        pref.notification = not bool(pref.notification)

    db.session.commit()
    return jsonify(pref_to_dict(pref)), 201


# delete preference 
@preference_bp.delete("/<int:tag_id>")
@login_required
def delete_my_preference(tag_id):
    """
    DELETE /api/preferences/<tag_id>
    Deletes CURRENT user's preference for this tag.
    """
    user = g.current_user
    pref = Preference.query.get((user.userID, tag_id))
    if pref is None:
        return jsonify({"error": "Preference not found"}), 404

    db.session.delete(pref)
    db.session.commit()
    return jsonify({"message": "Preference removed"})
