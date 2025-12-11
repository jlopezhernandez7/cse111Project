# backend/routes/media_routes.py

from flask import Blueprint, request, jsonify, g
from models import db, Media, Event
from routes.auth_routes import login_required  # ⬅️ import this

media_bp = Blueprint("media", __name__)


def media_to_dict(media: Media):
    return {
        "mediaID": media.mediaID,
        "mediaType": media.m_mediaType,
        "eventID": media.m_eventID,
        "url": media.m_mediaURL,
    }


@media_bp.get("/event/<int:event_id>")
def list_media_for_event(event_id):
    """
    GET /api/media/event/<event_id>
    Public: anyone can view media for an event.
    """
    event = Event.query.get_or_404(event_id)
    items = event.media_items
    return jsonify([media_to_dict(m) for m in items])


@media_bp.get("/<int:media_id>")
def get_media(media_id):
    """
    GET /api/media/<media_id>
    """
    media = Media.query.get_or_404(media_id)
    return jsonify(media_to_dict(media))


@media_bp.post("/")
@login_required
def create_media():
    """
    POST /api/media
    Only the event's creator can attach media.

    Body JSON:
    {
      "eventID": 4,
      "url": "https://example.com/image.png",
      "mediaType": 0   // 0=image,1=video, etc.
    }
    """
    data = request.get_json() or {}
    event_id = data.get("eventID")
    url = data.get("url")
    media_type = data.get("mediaType", 0)

    if not event_id or not url:
        return jsonify({"error": "eventID and url are required"}), 400

    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Invalid eventID"}), 404

    # Only creator can add media
    if event.e_userID != g.current_user.userID:
        return jsonify({"error": "Only the creator of this event can add media"}), 403

    media = Media(
        m_eventID=event_id,
        m_mediaURL=url,
        m_mediaType=media_type,
    )
    db.session.add(media)
    db.session.commit()

    return jsonify(media_to_dict(media)), 201


@media_bp.delete("/<int:media_id>")
@login_required
def delete_media(media_id):
    """
    DELETE /api/media/<media_id>
    Only the event creator can delete media for that event.
    """
    media = Media.query.get_or_404(media_id)
    event = Event.query.get(media.m_eventID)

    if not event:
        return jsonify({"error": "Parent event not found"}), 404

    #  Only creator can delete media
    if event.e_userID != g.current_user.userID:
        return jsonify({"error": "Only the creator of this event can delete media"}), 403

    db.session.delete(media)
    db.session.commit()
    return jsonify({"message": f"Media {media_id} deleted"})
