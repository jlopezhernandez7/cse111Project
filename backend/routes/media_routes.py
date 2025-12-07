# backend/routes/media_routes.py

from flask import Blueprint, request, jsonify
from models import db, Media, Event

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
def create_media():
    """
    POST /api/media
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

    media = Media(
        m_eventID=event_id,
        m_mediaURL=url,
        m_mediaType=media_type,
    )
    db.session.add(media)
    db.session.commit()

    return jsonify(media_to_dict(media)), 201


@media_bp.delete("/<int:media_id>")
def delete_media(media_id):
    """
    DELETE /api/media/<media_id>
    """
    media = Media.query.get_or_404(media_id)
    db.session.delete(media)
    db.session.commit()
    return jsonify({"message": f"Media {media_id} deleted"})
