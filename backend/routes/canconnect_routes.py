# backend/routes/canconnect_routes.py

from flask import Blueprint, request, jsonify
from models import db, Event, Tag

canconnect_bp = Blueprint("canconnect", __name__)


def tag_light_dict(tag: Tag):
    return {
        "tagsID": tag.tagsID,
        "type": tag.t_type,
        "date": tag.t_date,
        "startTime": tag.t_startTime,
        "duration": tag.t_duration,
        "capacity": tag.t_capacity,
    }


def event_light_dict(event: Event):
    return {
        "eventID": event.eventID,
        "name": event.e_name,
        "date": event.e_eventDate,
        "startTime": event.e_startTime,
        "location": event.e_location,
        "type": event.e_type,
    }


# ---------- CREATE / ADD CONNECTION ----------

@canconnect_bp.post("/")
def add_connection():
    """
    POST /api/canconnect
    Body JSON:
    {
      "eventID": 4,
      "tagsID": 2
    }

    Adds a link Event <-> Tag (if not already present).
    """
    data = request.get_json() or {}
    event_id = data.get("eventID")
    tag_id = data.get("tagsID")

    if event_id is None or tag_id is None:
        return jsonify({"error": "eventID and tagsID are required"}), 400

    event = Event.query.get(event_id)
    tag = Tag.query.get(tag_id)

    if not event or not tag:
        return jsonify({"error": "Invalid eventID or tagsID"}), 404

    # Avoid duplicates
    if tag not in event.tags:
        event.tags.append(tag)
        db.session.commit()

    return jsonify(
        {
            "event": event_light_dict(event),
            "tag": tag_light_dict(tag),
            "message": "Connection created (or already existed)",
        }
    ), 201


# ---------- DELETE / REMOVE CONNECTION ----------

@canconnect_bp.delete("/<int:event_id>/<int:tag_id>")
def remove_connection(event_id, tag_id):
    """
    DELETE /api/canconnect/<event_id>/<tag_id>
    Removes the link Event <-> Tag if it exists.
    """
    event = Event.query.get(event_id)
    tag = Tag.query.get(tag_id)

    if not event or not tag:
        return jsonify({"error": "Invalid eventID or tagsID"}), 404

    if tag in event.tags:
        event.tags.remove(tag)
        db.session.commit()
        return jsonify({"message": "Connection removed"})

    return jsonify({"error": "Connection did not exist"}), 404


# list tags for an event

@canconnect_bp.get("/event/<int:event_id>")
def list_tags_for_event(event_id):
    """
    GET /api/canconnect/event/<event_id>
    Returns all tags linked to this event.
    """
    event = Event.query.get_or_404(event_id)
    tags = event.tags  # uses the many-to-many relationship

    return jsonify(
        {
            "event": event_light_dict(event),
            "tags": [tag_light_dict(t) for t in tags],
        }
    )


# list events for a tag

@canconnect_bp.get("/tag/<int:tag_id>")
def list_events_for_tag(tag_id):
    """
    GET /api/canconnect/tag/<tag_id>
    Returns all events linked to this tag.
    """
    tag = Tag.query.get_or_404(tag_id)
    events = tag.events  # uses the many-to-many relationship

    return jsonify(
        {
            "tag": tag_light_dict(tag),
            "events": [event_light_dict(e) for e in events],
        }
    )
