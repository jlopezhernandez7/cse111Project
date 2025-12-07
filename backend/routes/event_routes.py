# backend/routes/event_routes.py

from flask import Blueprint, request, jsonify, g
from models import db, Event, User, Tag, Preference, Attendance
from routes.auth_routes import login_required 

event_bp = Blueprint("events", __name__)

#helpers
def event_to_dict(event: Event):
    """Serialize an Event to a JSON-friendly dict."""
    return {
        "eventID": event.eventID,
        "name": event.e_name,
        "date": event.e_eventDate,
        "startTime": event.e_startTime,
        "location": event.e_location,
        "type": event.e_type,
        "duration": event.e_duration,
        "capacity": event.e_capacity,
        "creator": {
            "userID": event.creator.userID,
            "username": event.creator.u_username,
        } if event.creator else None,
        "tags": [
            {
                "tagsID": t.tagsID,
                "type": t.t_type,
                "date": t.t_date,
                "startTime": t.t_startTime,
            }
            for t in event.tags
        ],
    }


# create event

@event_bp.post("/")
@login_required
def create_event():
    data = request.get_json() or {}

    name = data.get("name")
    date = data.get("date")
    start_time = data.get("startTime")

    if not name or not date or not start_time:
        return jsonify({"error": "name, date, and startTime are required"}), 400

    creator = g.current_user  # ignore creatorID from body

    event = Event(
        e_name=name,
        e_eventDate=date,
        e_startTime=start_time,
        e_location=data.get("location"),
        e_type=data.get("type"),
        e_duration=data.get("duration"),
        e_capacity=data.get("capacity"),
        creator=creator,
    )
    
    db.session.add(event)
    db.session.flush()  # assign event.eventID without committing yet

    tag_ids = data.get("tagIDs", [])
    if tag_ids:
        tags = Tag.query.filter(Tag.tagsID.in_(tag_ids)).all()
        event.tags = tags
        
    #  Auto-mark creator as going to this event
    attendance = Attendance(
        a_userID=creator.userID,
        a_eventID=event.eventID,
        a_going=True,
    )
        
        
        

    db.session.add(attendance)
    db.session.commit()

    return jsonify(event_to_dict(event)), 201

@event_bp.get("/")
def list_events():
    """
    GET /api/events
    Return all events (for homepage list on frontend).
    """
    events = Event.query.all()
    return jsonify([event_to_dict(e) for e in events])


@event_bp.get("/<int:event_id>")
def get_event(event_id):
    """
    GET /api/events/<event_id>
    Get detail for one event (for event detail page).
    """
    event = Event.query.get_or_404(event_id)
    return jsonify(event_to_dict(event))





@event_bp.patch("/<int:event_id>")
@login_required
def update_event(event_id):
    event = Event.query.get_or_404(event_id)

    if event.e_userID != g.current_user.userID:
        return jsonify({"error": "You can only edit your own events"}), 403

    data = request.get_json() or {}

  
    if "name" in data:
        event.e_name = data["name"]
    # etc.

    db.session.commit()
    return jsonify(event_to_dict(event))


@event_bp.delete("/<int:event_id>")
@login_required
def delete_event(event_id):
    event = Event.query.get_or_404(event_id)

    if event.e_userID != g.current_user.userID:
        return jsonify({"error": "You can only delete your own events"}), 403

    db.session.delete(event)
    db.session.commit()
    return jsonify({"message": f"Event {event_id} deleted"})





@event_bp.get("/feed")
def user_feed():
    """
    GET /api/events/feed?userID=<id>&tagIDs=1,2,3

    Priority of filters:
    1. If tagIDs query param is provided -> use those tags.
    2. Else if userID is provided -> use user's preferences (notification=True).
    3. Else -> return all events.

    "home feed" endpoint.
    """
    user_id = request.args.get("userID", type=int)
    tag_ids_param = request.args.get("tagIDs", type=str)

    tag_ids = None

    # Case 1: explicit tagIDs in query (e.g. custom filter UI)
    if tag_ids_param:
        try:
            tag_ids = [int(tid) for tid in tag_ids_param.split(",") if tid.strip()]
        except ValueError:
            return jsonify({"error": "tagIDs must be a comma-separated list of integers"}), 400

    # Case 2: derive from user's preferences (saved filters)
    if tag_ids is None and user_id is not None:
        prefs = Preference.query.filter_by(p_userID=user_id, notification=True).all()
        tag_ids = [p.p_tagsID for p in prefs]

    # Base query
    query = Event.query

    # If we have tag filters, join via canconnect (Event.tags)
    if tag_ids:
        query = (
            query.join(Event.tags)
                 .filter(Tag.tagsID.in_(tag_ids))
                 .distinct()
        )

    events = query.all()
    return jsonify([event_to_dict(e) for e in events])