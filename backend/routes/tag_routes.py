# backend/routes/tag_routes.py

from flask import Blueprint, request, jsonify
from models import db, Tag

tag_bp = Blueprint("tags", __name__)


def tag_to_dict(tag: Tag):
    return {
        "tagsID": tag.tagsID,
        "type": tag.t_type,
        "date": tag.t_date,
        "startTime": tag.t_startTime,
        "duration": tag.t_duration,
        "capacity": tag.t_capacity,
    }


@tag_bp.get("/types")
def list_tag_types():
    """
    GET /api/tags/types

    Returns unique tag types (strings), e.g.:
    ["Math Study Group", "Reading Club", "Gaming", ...]
    """
    types = (
        db.session.query(Tag.t_type)
        .distinct()
        .order_by(Tag.t_type)
        .all()
    )
    # 'types' is a list of tuples like [("Gaming",), ("Math",)...]
    type_list = [t[0] for t in types if t[0] is not None]
    return jsonify(type_list)


@tag_bp.post("/")
def create_tag():
    """
    POST /api/tags
    Body JSON example:
    {
      "type": "gaming",
      "date": "2025-11-30",
      "startTime": "18:00",
      "duration": 180,
      "capacity": 60
    }
    """
    data = request.get_json() or {}

    tag = Tag(
        t_type=data.get("type"),
        t_date=data.get("date"),
        t_startTime=data.get("startTime"),
        t_duration=data.get("duration"),
        t_capacity=data.get("capacity"),
    )

    db.session.add(tag)
    db.session.commit()
    return jsonify(tag_to_dict(tag)), 201
