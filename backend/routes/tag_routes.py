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
    ["Gaming", "Math Study Group", "Reading Club", ...]
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
    {
      "type": "anime",
      "date": "2025-11-20",
      "startTime": "13:30",
      "duration": 180,
      "capacity": 60
    }
    Only the fields you send will be filled; others remain NULL.
    If a tag with exactly the same fields already exists, re-use it.
    """
    data = request.get_json() or {}

    type_ = data.get("type")
    date = data.get("date")
    start = data.get("startTime")
    duration = data.get("duration")
    capacity = data.get("capacity")

    # 1) check if this exact combination already exists
    existing = Tag.query.filter_by(
        t_type=type_,
        t_date=date,
        t_startTime=start,
        t_duration=duration,
        t_capacity=capacity,
    ).first()

    if existing:
        return jsonify(tag_to_dict(existing)), 200

    # 2) otherwise create a new tag
    tag = Tag(
        t_type=type_,
        t_date=date,
        t_startTime=start,
        t_duration=duration,
        t_capacity=capacity,
    )

    db.session.add(tag)
    db.session.commit()
    return jsonify(tag_to_dict(tag)), 201


@tag_bp.get("/")
def list_tags():
    tags = Tag.query.all()
    return jsonify([
        {
            "tagsID": t.tagsID,
            "type": t.t_type,
            "date": t.t_date,
            "startTime": t.t_startTime,
            "duration": t.t_duration,
            "capacity": t.t_capacity,
        }
        for t in tags
    ])
