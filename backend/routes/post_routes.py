# backend/routes/post_routes.py

from flask import Blueprint, request, jsonify, g
from models import db, Post, Event
from routes.auth_routes import login_required  # ⬅️ import this

post_bp = Blueprint("posts", __name__)


def post_to_dict(post: Post):
    return {
        "postID": post.postID,
        "title": post.postTitle,
        "content": post.postContent,
        "eventID": post.p_eventID,
    }


@post_bp.get("/event/<int:event_id>")
def list_posts_for_event(event_id):
    """
    GET /api/posts/event/<event_id>
    Public: anyone can view posts for an event.
    """
    event = Event.query.get_or_404(event_id)
    posts = event.posts
    return jsonify([post_to_dict(p) for p in posts])


@post_bp.get("/<int:post_id>")
def get_post(post_id):
    """
    GET /api/posts/<post_id>
    """
    post = Post.query.get_or_404(post_id)
    return jsonify(post_to_dict(post))


@post_bp.post("/")
@login_required
def create_post():
    """
    POST /api/posts
    Only the event's creator can create posts.

    Body JSON:
    {
      "title": "...",
      "content": "...",
      "eventID": 4
    }
    """
    data = request.get_json() or {}
    title = data.get("title")
    content = data.get("content")
    event_id = data.get("eventID")

    if not title or not content or not event_id:
        return jsonify({"error": "title, content, and eventID are required"}), 400

    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Invalid eventID"}), 404

    #  Only the creator of the event can post
    if event.e_userID != g.current_user.userID:
        return jsonify({"error": "Only the creator of this event can create posts"}), 403

    post = Post(
        postTitle=title,
        postContent=content,
        p_eventID=event_id,
    )
    db.session.add(post)
    db.session.commit()

    return jsonify(post_to_dict(post)), 201


@post_bp.patch("/<int:post_id>")
@login_required
def update_post(post_id):
    """
    PATCH /api/posts/<post_id>
    Only the event creator can edit posts for that event.
    Body JSON: any subset of {title, content}
    """
    post = Post.query.get_or_404(post_id)
    event = Event.query.get(post.p_eventID)

    if not event:
        return jsonify({"error": "Parent event not found"}), 404

    # Only event creator can edit
    if event.e_userID != g.current_user.userID:
        return jsonify({"error": "Only the creator of this event can edit posts"}), 403

    data = request.get_json() or {}

    if "title" in data:
        post.postTitle = data["title"]
    if "content" in data:
        post.postContent = data["content"]

    db.session.commit()
    return jsonify(post_to_dict(post))


@post_bp.delete("/<int:post_id>")
@login_required
def delete_post(post_id):
    """
    DELETE /api/posts/<post_id>
    Only the event creator can delete posts.
    """
    post = Post.query.get_or_404(post_id)
    event = Event.query.get(post.p_eventID)

    if not event:
        return jsonify({"error": "Parent event not found"}), 404

    # Only event creator can delete
    if event.e_userID != g.current_user.userID:
        return jsonify({"error": "Only the creator of this event can delete posts"}), 403

    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": f"Post {post_id} deleted"})
