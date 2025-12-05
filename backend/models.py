# models.py

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# ---------- Association table: Event <-> Tag (no extra data) ----------

canconnect = db.Table(
    "canconnect",
    db.Column(
        "c_eventID",
        db.Integer,
        db.ForeignKey("event.eventID", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "c_tagsID",
        db.Integer,
        db.ForeignKey("tags.tagsID", ondelete="CASCADE"),
        primary_key=True,
    ),
)


# ======================= CORE TABLES =======================

class User(db.Model):
    __tablename__ = "users"

    userID = db.Column(db.Integer, primary_key=True)
    u_username = db.Column(db.String(50), unique=True, nullable=False)
    u_email = db.Column(db.String(100), unique=True, nullable=False)
    u_password = db.Column(db.String(255), nullable=False)

    # One user -> many events they created
    events_created = db.relationship(
        "Event",
        back_populates="creator",
        cascade="all, delete-orphan",
    )

    # One user -> many attendance records
    attendances = db.relationship(
        "Attendance",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # One user -> many tag preferences
    preferences = db.relationship(
        "Preference",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<User {self.userID} {self.u_username!r}>"


class Event(db.Model):
    __tablename__ = "event"

    eventID = db.Column(db.Integer, primary_key=True)
    e_eventDate = db.Column(db.String, nullable=False)   # DATE in SQLite
    e_startTime = db.Column(db.String, nullable=False)   # TEXT in SQLite
    e_location = db.Column(db.String(150))
    e_userID = db.Column(
        db.Integer,
        db.ForeignKey("users.userID", ondelete="SET NULL"),
        nullable=True,
    )
    e_type = db.Column(db.String(50))
    e_name = db.Column(db.String(100), nullable=False)
    e_duration = db.Column(db.Integer)
    e_capacity = db.Column(db.Integer)

    # Many events -> one creator (User)
    creator = db.relationship(
        "User",
        back_populates="events_created",
    )

    # One event -> many posts
    posts = db.relationship(
        "Post",
        back_populates="event",
        cascade="all, delete-orphan",
    )

    # One event -> many media items
    media_items = db.relationship(
        "Media",
        back_populates="event",
        cascade="all, delete-orphan",
    )

    # One event -> many attendance records (User <-> Event via Attendance)
    attendances = db.relationship(
        "Attendance",
        back_populates="event",
        cascade="all, delete-orphan",
    )

    # Many-to-many: events <-> tags via canconnect
    tags = db.relationship(
        "Tag",
        secondary=canconnect,
        back_populates="events",
    )

    def __repr__(self):
        return f"<Event {self.eventID} {self.e_name!r}>"


# ======================= ASSOCIATION OBJECTS =======================

class Attendance(db.Model):
    """
    Association model for many-to-many:
    User <-> Event, with extra attribute a_going (boolean).
    """
    __tablename__ = "attendance"

    a_userID = db.Column(
        db.Integer,
        db.ForeignKey("users.userID", ondelete="CASCADE"),
        primary_key=True,
    )
    a_eventID = db.Column(
        db.Integer,
        db.ForeignKey("event.eventID", ondelete="CASCADE"),
        primary_key=True,
    )
    a_going = db.Column(db.Boolean, nullable=False)

    # Navigation attributes:
    user = db.relationship("User", back_populates="attendances")
    event = db.relationship("Event", back_populates="attendances")

    def __repr__(self):
        return f"<Attendance user={self.a_userID} event={self.a_eventID} going={self.a_going}>"


class Preference(db.Model):
    """
    Association model for many-to-many:
    User <-> Tag, with extra attribute notification (boolean).
    """
    __tablename__ = "preferences"

    p_userID = db.Column(
        db.Integer,
        db.ForeignKey("users.userID", ondelete="CASCADE"),
        primary_key=True,
    )
    p_tagsID = db.Column(
        db.Integer,
        db.ForeignKey("tags.tagsID", ondelete="CASCADE"),
        primary_key=True,
    )
    notification = db.Column(db.Boolean, nullable=False, default=False)

    user = db.relationship("User", back_populates="preferences")
    tag = db.relationship("Tag", back_populates="preferences")

    def __repr__(self):
        return f"<Preference user={self.p_userID} tag={self.p_tagsID} notif={self.notification}>"


# ======================= OTHER TABLES =======================

class Post(db.Model):
    __tablename__ = "posts"

    postID = db.Column(db.Integer, primary_key=True)
    postTitle = db.Column(db.String(200), nullable=False)
    p_eventID = db.Column(
        db.Integer,
        db.ForeignKey("event.eventID", ondelete="CASCADE"),
    )
    postContent = db.Column(db.Text, nullable=False)

    event = db.relationship("Event", back_populates="posts")

    def __repr__(self):
        return f"<Post {self.postID} {self.postTitle!r}>"


class Media(db.Model):
    __tablename__ = "media"

    mediaID = db.Column(db.Integer, primary_key=True)
    m_mediaType = db.Column(db.Integer)  # 0=image,1=video, etc. up to you
    m_eventID = db.Column(
        db.Integer,
        db.ForeignKey("event.eventID", ondelete="CASCADE"),
    )
    m_mediaURL = db.Column(db.String(255), nullable=False)

    event = db.relationship("Event", back_populates="media_items")

    def __repr__(self):
        return f"<Media {self.mediaID} url={self.m_mediaURL!r}>"


class Tag(db.Model):
    __tablename__ = "tags"

    tagsID = db.Column(db.Integer, primary_key=True)
    t_startTime = db.Column(db.String)   # TEXT
    t_type = db.Column(db.String(50))
    t_date = db.Column(db.String(50))
    t_duration = db.Column(db.Integer)
    t_capacity = db.Column(db.Integer)

    # Many-to-many: Tag <-> Event (via canconnect)
    events = db.relationship(
        "Event",
        secondary=canconnect,
        back_populates="tags",
    )

    # One tag -> many preferences (User <-> Tag association)
    preferences = db.relationship(
        "Preference",
        back_populates="tag",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Tag {self.tagsID} type={self.t_type!r}>"
