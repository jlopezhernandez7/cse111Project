# backend/routes/attendance_routes.py

from flask import Blueprint, request, jsonify, g
from models import db, Attendance, Event, User
from routes.auth_routes import login_required  # 

attendance_bp = Blueprint("attendance", __name__)


def attendance_to_dict(record: Attendance):
    return {
        "userID": record.a_userID,
        "eventID": record.a_eventID,
        "going": record.a_going,
    }


def event_light_dict(event: Event):
    return {
        "eventID": event.eventID,
        "name": event.e_name,
        "date": event.e_eventDate,
        "startTime": event.e_startTime,
        "location": event.e_location,
    }


def user_light_dict(user: User):
    return {
        "userID": user.userID,
        "username": user.u_username,
        "email": user.u_email,
    }


# create or update attendance record for current user
@attendance_bp.post("/")
@login_required
def create_or_update_attendance():
    """
    POST /api/attendance

    Body JSON:
    {
      "eventID": 4,
      "going": true
    }

    userID is taken from the logged-in user (g.current_user),
    so the frontend cannot spoof attending as another user.
    """
    data = request.get_json() or {}
    event_id = data.get("eventID")
    going = data.get("going")

    if event_id is None or going is None:
        return jsonify({"error": "eventID and going are required"}), 400

    current_user = g.current_user

    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Invalid eventID"}), 404

    record = Attendance.query.get((current_user.userID, event_id))
    if record is None:
        record = Attendance(
            a_userID=current_user.userID,
            a_eventID=event_id,
            a_going=bool(going),
        )
        db.session.add(record)
    else:
        record.a_going = bool(going)

    db.session.commit()
    return jsonify(attendance_to_dict(record)), 201


# delte attendance record for current user

@attendance_bp.delete("/<int:event_id>")
@login_required
def delete_my_attendance(event_id):
    """
    DELETE /api/attendance/<event_id>
    Removes the logged-in user's attendance record.
    """
    current_user = g.current_user
    record = Attendance.query.get((current_user.userID, event_id))
    if record is None:
        return jsonify({"error": "Attendance record not found"}), 404

    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "Attendance removed"})


# list attendees for a given event

@attendance_bp.get("/event/<int:event_id>")
def list_attendees_for_event(event_id):
    """
    GET /api/attendance/event/<event_id>
    Returns all users with an attendance record for this event.
    You can add @login_required here if you want only signed-in users to see.
    """
    event = Event.query.get_or_404(event_id)
    records = event.attendances

    attendees = []
    going_count = 0

    for r in records:
        if r.user:
            attendees.append(
                {
                    **attendance_to_dict(r),
                    "user": user_light_dict(r.user),
                }
            )
        if r.a_going:
            going_count += 1

    return jsonify(
        {
            "event": event_light_dict(event),
            "totalRecords": len(records),
            "goingCount": going_count,
            "attendees": attendees,
        }
    )


# list events for current user

@attendance_bp.get("/me")
@login_required
def list_events_for_current_user():
    """
    GET /api/attendance/me
    Returns all events the logged-in user has an attendance record for.
    """
    user = g.current_user
    records = user.attendances

    events = []
    for r in records:
        if r.event:
            events.append(
                {
                    **attendance_to_dict(r),
                    "event": event_light_dict(r.event),
                }
            )

    return jsonify(
        {
            "user": user_light_dict(user),
            "events": events,
        }
    )
