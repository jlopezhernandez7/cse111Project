# backend/routes/post_routes.py

from flask import Blueprint, request, jsonify
from models import db, Post, Event

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
def create_post():
    """
    POST /api/posts
    Body JSON:
    {
      "title": "Smash Tournament Announcements",
      "content": "Bracket starts at 7PM...",
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

    post = Post(
        postTitle=title,
        postContent=content,
        p_eventID=event_id,
    )
    db.session.add(post)
    db.session.commit()

    return jsonify(post_to_dict(post)), 201


@post_bp.patch("/<int:post_id>")
def update_post(post_id):
    """
    PATCH /api/posts/<post_id>
    Body JSON: any subset of {title, content}
    """
    post = Post.query.get_or_404(post_id)
    data = request.get_json() or {}

    if "title" in data:
        post.postTitle = data["title"]
    if "content" in data:
        post.postContent = data["content"]

    db.session.commit()
    return jsonify(post_to_dict(post))


@post_bp.delete("/<int:post_id>")
def delete_post(post_id):
    """
    DELETE /api/posts/<post_id>
    """
    post = Post.query.get_or_404(post_id)
    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": f"Post {post_id} deleted"})
