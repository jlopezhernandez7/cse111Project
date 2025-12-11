import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  // ---------- auth state ----------
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showLogin, setShowLogin] = useState(false);

  // ---------- signup state ----------
  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [signupError, setSignupError] = useState("");

  // ---------- events state ----------
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    startTime: "",
    location: "",
    type: "",
  });

  // ---------- search & filter ----------
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredEvents = events
    .filter((ev) =>
      ev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.location &&
        ev.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.type && ev.type.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(
      (ev) =>
        filter === "all" ||
        (ev.type && ev.type.toLowerCase() === filter.toLowerCase())
    );

  // ---------- attendance ----------
  const [joinedEventIds, setJoinedEventIds] = useState([]);

  // ---------- event details (sidebar) ----------
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailPosts, setDetailPosts] = useState([]);
  const [detailMedia, setDetailMedia] = useState([]);
  const [detailAttendees, setDetailAttendees] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [newEventTagLabel, setNewEventTagLabel] = useState("");
  const [creatingEventTag, setCreatingEventTag] = useState(false);
  const [eventTagError, setEventTagError] = useState("");


  // ---------- tags for events ----------
  const [allTags, setAllTags] = useState([]);              // all Tag rows
  const [selectedEventTagIds, setSelectedEventTagIds] = useState([]); // tags used for the event form

  // ---------- tag preferences ----------
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState([]);
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefError, setPrefError] = useState("");
  const [selectedPrefTags, setSelectedPrefTags] = useState([]);

  // ---------- create-tag form ----------
  const [newTagField, setNewTagField] = useState("type");
  const [newTagLabel, setNewTagLabel] = useState("");
  const [tagCreateError, setTagCreateError] = useState("");

  // =========================
  // Helpers: formatting
  // =========================
  function formatTimeWithAmPm(value) {
    if (!value) return value;
    const [hStr, m] = value.split(":");
    let h = parseInt(hStr, 10);
    if (Number.isNaN(h)) return value;

    const suffix = h >= 12 ? "pm" : "am";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;

    return `${h}:${m} ${suffix}`;
  }

  function formatTagLabel(tag) {
    if (tag.type) return tag.type;
    if (tag.date) return `Date: ${tag.date}`;
    if (tag.startTime) return `Time: ${formatTimeWithAmPm(tag.startTime)}`;
    if (tag.duration != null) return `Duration: ${tag.duration} min`;
    if (tag.capacity != null) return `Capacity: ${tag.capacity}`;
    return `Tag #${tag.tagsID}`;
  }

  // =========================
  // API calls
  // =========================
  async function fetchCurrentUser() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: "include",
      });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }

  async function fetchEvents() {
    try {
      setEventsLoading(true);
      setEventsError("");
      const res = await fetch(`${API_BASE_URL}/api/events/`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch events: ${res.status}`);
      }
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
      setEventsError(err.message || "Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  }

  async function fetchMyAttendance() {
    if (!user) {
      setJoinedEventIds([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/me`, {
        credentials: "include",
      });
      if (!res.ok) return;

      const data = await res.json();
      const ids = (data.events || [])
        .filter((r) => r.going)
        .map((r) => r.event.eventID);
      setJoinedEventIds(ids);
    } catch (err) {
      console.error("Failed to load attendance", err);
    }
  }

  async function fetchEventDetails(eventId) {
    try {
      setDetailLoading(true);
      setDetailError("");

      const [eventRes, postsRes, mediaRes, attendanceRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/events/${eventId}`, {
          credentials: "include",
        }),
        fetch(`${API_BASE_URL}/api/posts/event/${eventId}`, {
          credentials: "include",
        }),
        fetch(`${API_BASE_URL}/api/media/event/${eventId}`, {
          credentials: "include",
        }),
        fetch(`${API_BASE_URL}/api/attendance/event/${eventId}`, {
          credentials: "include",
        }),
      ]);

      if (!eventRes.ok) throw new Error("Failed to load event details");

      const eventData = await eventRes.json();
      const postsData = postsRes.ok ? await postsRes.json() : [];
      const mediaData = mediaRes.ok ? await mediaRes.json() : [];
      const attendanceData = attendanceRes.ok
        ? await attendanceRes.json()
        : { attendees: [], goingCount: 0 };

      setSelectedEvent(eventData);
      setDetailPosts(postsData);
      setDetailMedia(mediaData);
      setDetailAttendees(attendanceData.attendees || []);
    } catch (err) {
      console.error(err);
      setDetailError(err.message || "Failed to load event details");
    } finally {
      setDetailLoading(false);
    }
  }
  async function handleCreateTagFromEvent(e) {
  e.preventDefault();
  const value = newEventTagLabel.trim();
  if (!value) return;

  setEventTagError("");
  setCreatingEventTag(true);

  try {
    // For now we’ll only create "type" tags from here
    const res = await fetch(`${API_BASE_URL}/api/tags/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: value }),
    });

    const tag = await res.json();
    if (!res.ok) {
      throw new Error(tag?.error || `Failed to create tag (${res.status})`);
    }

    // 1) add to the global list so it appears in the checkboxes
    setAllTags((prev) => [...prev, tag]);

    // 2) auto-select this tag for the current event
    setSelectedEventTagIds((prev) => [...prev, tag.tagsID]);

    // 3) clear the input
    setNewEventTagLabel("");
  } catch (err) {
    console.error(err);
    setEventTagError(err.message || "Failed to create tag");
  } finally {
    setCreatingEventTag(false);
  }
}


  async function fetchPreferences() {
    if (!user) return;
    try {
      setPrefLoading(true);
      setPrefError("");

      const res = await fetch(`${API_BASE_URL}/api/preferences/me`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to load preferences (${res.status})`);
      }

      const data = await res.json();
      setPreferences(data.preferences || []);
      setSelectedPrefTags([]);
    } catch (err) {
      console.error(err);
      setPrefError(err.message || "Failed to load preferences");
    } finally {
      setPrefLoading(false);
    }
  }

  async function fetchAllTags() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tags/`, {
        credentials: "include",
      });
      if (!res.ok) {
        // This is where your 405 is coming from – backend must support GET /api/tags/
        throw new Error(`Failed to fetch tags: ${res.status}`);
      }
      const data = await res.json();
      setAllTags(data);
    } catch (err) {
      console.error("Failed to load tags", err);
    }
  }

  // =========================
  // Effects
  // =========================
  useEffect(() => {
    (async () => {
      await fetchCurrentUser();
      await fetchEvents();
      await fetchAllTags();
    })();
  }, []);

  useEffect(() => {
    if (user) fetchMyAttendance();
    else setJoinedEventIds([]);
  }, [user]);

  // =========================
  // Handlers: auth
  // =========================
  function handleLoginFormChange(e) {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Login failed (${res.status})`);
      }

      await fetchCurrentUser();
      setShowLogin(false);
      setLoginForm({ email: "", password: "" });
    } catch (err) {
      console.error(err);
      setAuthError(err.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      setEditingId(null);
    }
  }

  function handleSignupChange(e) {
    const { name, value } = e.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSignup(e) {
    e.preventDefault();
    setSignupError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(signupForm),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create account");
      }

      const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
        setSignupForm({ username: "", email: "", password: "" });
        setShowSignup(false);
      } else {
        throw new Error(
          "Signup succeeded, but login session was not created. Your browser may be blocking cookies."
        );
      }
    } catch (err) {
      console.error(err);
      setSignupError(err.message || "Signup failed");
    }
  }

  // =========================
  // Handlers: event form
  // =========================
  function handleEventFormChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function resetEventForm() {
    setFormData({
      name: "",
      date: "",
      startTime: "",
      location: "",
      type: "",
    });
    setEditingId(null);
    setSelectedEventTagIds([]);
  }

  async function handleEventSubmit(e) {
    e.preventDefault();
    setEventsError("");

    if (!user) {
      setEventsError("You must be logged in to create or edit events.");
      return;
    }
    if (!formData.name || !formData.date || !formData.startTime) {
      setEventsError("Name, date and start time are required.");
      return;
    }

    const payload = {
      name: formData.name,
      date: formData.date,
      startTime: formData.startTime,
      location: formData.location || null,
      type: formData.type || null,
      tagIDs: selectedEventTagIds,
    };

    try {
      let res;
      if (editingId == null) {
        res = await fetch(`${API_BASE_URL}/api/events/`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/events/${editingId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `Request failed (${res.status})`);
      }

      await fetchEvents();
      await fetchMyAttendance();
      resetEventForm();
      setShowCreateEvent(false);
    } catch (err) {
      console.error(err);
      setEventsError(err.message || "Failed to save event");
    }
  }

  function handleEditClick(ev) {
    if (!user || !ev.creator || ev.creator.userID !== user.userID) {
      alert("You can only edit events you created.");
      return;
    }
    setEditingId(ev.eventID);
    setFormData({
      name: ev.name || "",
      date: ev.date || "",
      startTime: ev.startTime || "",
      location: ev.location || "",
      type: ev.type || "",
    });
    setSelectedEventTagIds((ev.tags || []).map((t) => t.tagsID) || []);
    setShowCreateEvent(true);
  }

  function handleCancelEdit() {
    resetEventForm();
    setShowCreateEvent(false);
  }

  async function handleDelete(id, ev) {
    if (!user || !ev.creator || ev.creator.userID !== user.userID) {
      alert("You can only delete events you created.");
      return;
    }
    if (!window.confirm("Delete this event?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `Failed to delete event (${res.status})`);
      }
      await fetchEvents();
    } catch (err) {
      console.error(err);
      setEventsError(err.message || "Failed to delete event");
    }
  }

  // =========================
  // Handlers: attendance
  // =========================
  async function handleJoin(eventId) {
    if (!user) {
      setEventsError("You must be logged in to join events.");
      return;
    }
    setEventsError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventID: eventId, going: true }),
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `Failed to join event (${res.status})`);
      }
      await fetchMyAttendance();
    } catch (err) {
      console.error(err);
      setEventsError(err.message || "Failed to join event");
    }
  }

  async function handleLeave(eventId) {
    if (!user) return;
    setEventsError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `Failed to leave event (${res.status})`);
      }
      await fetchMyAttendance();
    } catch (err) {
      console.error(err);
      setEventsError(err.message || "Failed to leave event");
    }
  }

  // =========================
  // Handlers: event details (sidebar)
  // =========================
  function handleViewDetails(ev) {
    fetchEventDetails(ev.eventID);
  }

  function handlePostChange(e) {
    const { name, value } = e.target;
    setNewPost((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!user || !selectedEvent) return;
    setDetailError("");

    if (!newPost.title || !newPost.content) {
      setDetailError("Post title and content are required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          eventID: selectedEvent.eventID,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `Failed to create post (${res.status})`);
      }

      await fetchEventDetails(selectedEvent.eventID);
      setNewPost({ title: "", content: "" });
    } catch (err) {
      console.error(err);
      setDetailError(err.message || "Failed to create post");
    }
  }

  function handleMediaFileChange(e) {
    const file = e.target.files[0];
    setMediaFile(file || null);
  }

  async function handleMediaUpload(e) {
    e.preventDefault();
    if (!user || !selectedEvent || !mediaFile) return;
    setDetailError("");
    setMediaUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", mediaFile);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_PRESET);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD}/image/upload`,
        { method: "POST", body: formData }
      );
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        console.error(uploadData);
        throw new Error("Failed to upload image");
      }

      const imageUrl = uploadData.secure_url;

      const res = await fetch(`${API_BASE_URL}/api/media/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventID: selectedEvent.eventID,
          url: imageUrl,
          mediaType: 0,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `Failed to attach media (${res.status})`);
      }

      setMediaFile(null);
      if (e.target && typeof e.target.reset === "function") {
        e.target.reset();
      }

      await fetchEventDetails(selectedEvent.eventID);
    } catch (err) {
      console.error(err);
      setDetailError(err.message || "Failed to upload media");
    } finally {
      setMediaUploading(false);
    }
  }

  async function handleCreateTagFromEvent() {
  const value = newEventTagLabel.trim();
  if (!value) return;

  setEventTagError("");
  setCreatingEventTag(true);

  try {
    const res = await fetch(`${API_BASE_URL}/api/tags/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: value }),   // create a "type" tag
    });

    const tag = await res.json();
    if (!res.ok) {
      throw new Error(tag?.error || `Failed to create tag (${res.status})`);
    }

    // add new tag to list and auto-select it
    setAllTags((prev) => [...prev, tag]);
    setSelectedEventTagIds((prev) => [...prev, tag.tagsID]);
    setNewEventTagLabel("");
  } catch (err) {
    console.error(err);
    setEventTagError(err.message || "Failed to create tag");
  } finally {
    setCreatingEventTag(false);
  }
}


  // =========================
  // Handlers: tag preferences & tags
  // =========================
  function handleOpenPreferences() {
    if (!user) {
      setPrefError("You must be logged in to edit preferences.");
      return;
    }
    setShowPreferences(true);
    fetchPreferences();
  }

  function handleTogglePrefSelection(tagId) {
    setSelectedPrefTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }

  async function bulkSetNotificationForSelected(on) {
    if (!user || selectedPrefTags.length === 0) return;

    try {
      setPrefLoading(true);
      setPrefError("");

      await Promise.all(
        selectedPrefTags.map((tagId) =>
          fetch(`${API_BASE_URL}/api/preferences/`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tagsID: tagId, notification: on }),
          })
        )
      );

      await fetchPreferences();
    } catch (err) {
      console.error(err);
      setPrefError(err.message || "Failed to update preferences");
    } finally {
      setPrefLoading(false);
    }
  }

  async function toggleTagPreference(tagId) {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/preferences/toggle`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagsID: tagId }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `Failed to update preference (${res.status})`);
      }

      await fetchPreferences();
    } catch (err) {
      console.error(err);
      setPrefError(err.message || "Failed to update preference");
    }
  }

  function toggleEventTag(tagID) {
    setSelectedEventTagIds((prev) =>
      prev.includes(tagID) ? prev.filter((id) => id !== tagID) : [...prev, tagID]
    );
  }

  async function handleCreateSingleFieldTag(e) {
    e.preventDefault();
    setTagCreateError("");

    if (!newTagLabel) {
      setTagCreateError("Value is required.");
      return;
    }

    const payload = {};
    if (newTagField === "type") payload.type = newTagLabel;
    else if (newTagField === "date") payload.date = newTagLabel;
    else if (newTagField === "startTime") payload.startTime = newTagLabel;
    else if (newTagField === "duration")
      payload.duration = Number(newTagLabel);
    else if (newTagField === "capacity")
      payload.capacity = Number(newTagLabel);

    try {
      const res = await fetch(`${API_BASE_URL}/api/tags/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const tag = await res.json();
      if (!res.ok) {
        throw new Error(tag?.error || `Failed to create tag (${res.status})`);
      }

      // update both lists
      await fetchPreferences();
      await fetchAllTags();
      setNewTagLabel("");
    } catch (err) {
      console.error(err);
      setTagCreateError(err.message || "Failed to create tag");
    }
  }
  // ---------- UI ----------

  return (
  <div className="app">
    {/* ---------- Header ---------- */}
    <header className="app-header">
      <h1>Campus Events - University Event Finder</h1>
      <div className="auth-controls">
        {user ? (
          <>
            <span>Welcome, {user.username}</span>
             <button onClick={handleOpenPreferences}>Tag Preferences</button>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => setShowLogin(true)}>Login</button>
            <button onClick={() => setShowSignup(true)}>Sign Up</button>
          </>
        )}
      </div>

          {/* ---------- Preferences Modal ---------- */}

{showPreferences && (
  <div className="modal-overlay">
    <div className="modal-content preferences-modal">
      <h2 className="tag-title">Tag Preferences</h2>

      <p className="pref-descri" style={{ fontSize: "0.9rem" }}>
        Select one or more tags, then turn notifications ON or OFF for the group.
      </p>

      {/*  All scrollable content goes inside this container */}
      <div className="pref-scroll-container">
        {prefLoading && <p>Loading tags...</p>}
        {prefError && <p className="error">{prefError}</p>}

        {!prefLoading && (
          <>
            {/* bulk ON/OFF buttons */}
            <div className="preferences-actions">
              <button
                type="button"
                onClick={() => bulkSetNotificationForSelected(true)}
                disabled={selectedPrefTags.length === 0 || prefLoading}
              >
                Turn ON for selected
              </button>
              <button
                type="button"
                onClick={() => bulkSetNotificationForSelected(false)}
                disabled={selectedPrefTags.length === 0 || prefLoading}
              >
                Turn OFF for selected
              </button>
            </div>

            {/* tag list */}
            <div className="preferences-list">
              {preferences.length === 0 && <p>No tags defined yet.</p>}

              {preferences.map((item) => (
                <label
                  key={item.tag.tagsID}
                  className="preference-item"
                >
                  <div className="pref-left">
                    <input
                      type="checkbox"
                      checked={selectedPrefTags.includes(item.tag.tagsID)}
                      onChange={() => handleTogglePrefSelection(item.tag.tagsID)}
                    />
                    <span className="pref-label">
                      #{item.tag.tagsID} – {formatTagLabel(item.tag)}
                    </span>
                  </div>

                  <span
                    className={
                      item.notification ? "pref-status on" : "pref-status off"
                    }
                  >
                    {item.notification ? "ON" : "OFF"}
                  </span>
                </label>
              ))}
            </div>

            {/* create-tag section */}
            <div className="create-tag-section">
              <h3 className="create-tag-title">Create a new tag</h3>

              <form
                onSubmit={handleCreateSingleFieldTag}
                className="create-tag-form"
              >
                <div className="form-row">
                  <label className="form-label">
                    Category
                    <select
                      className="form-select"
                      value={newTagField}
                      onChange={(e) => setNewTagField(e.target.value)}
                    >
                      <option value="type">type</option>
                      <option value="date">Date</option>
                      <option value="startTime">Start time</option>
                      <option value="duration">Duration</option>
                      <option value="capacity">Capacity</option>
                    </select>
                  </label>
                </div>

                <div className="form-row">
                  <label className="form-label">
                    Value
                    <input
                      className="form-input"
                      type={
                        newTagField === "date"
                          ? "date"
                          : newTagField === "startTime"
                          ? "time"
                          : newTagField === "duration" ||
                            newTagField === "capacity"
                          ? "number"
                          : "text"
                      }
                      min={
                        newTagField === "duration" ||
                        newTagField === "capacity"
                          ? 0
                          : undefined
                      }
                      step={
                        newTagField === "duration" ||
                        newTagField === "capacity"
                          ? 1
                          : undefined
                      }
                      value={newTagLabel}
                      onChange={(e) => setNewTagLabel(e.target.value)}
                      placeholder={
                        newTagField === "type"
                          ? "e.g. anime, study, music"
                          : newTagField === "date"
                          ? "Choose a date"
                          : newTagField === "startTime"
                          ? "Choose a time"
                          : newTagField === "duration"
                          ? "e.g. 90"
                          : "e.g. 50"
                      }
                      required
                    />
                  </label>
                </div>

                <div className="create-tag-actions">
                  <button type="submit" className="primary-btn">
                    Create tag
                  </button>
                  {tagCreateError && (
                    <p className="error">{tagCreateError}</p>
                  )}
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      <button type="button" onClick={() => setShowPreferences(false)}>
        Close
      </button>
    </div>
  </div>
)}



    </header>


    {/* ---------- Search + Filters ---------- */}
    <section className="filters">
      <input
        type="text"
        placeholder="Search by title, description, or location..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="filter-buttons">
        {["all", "study", "sports", "social", "volunteer", "other"].map((cat) => (
          <button
            key={cat}
            className={filter === cat ? "active" : ""}
            onClick={() => setFilter(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <select>
        <option>All Events</option>
      </select>
    </section>

    {/* ---------- Create Event Button ---------- */}
    {user && (
      <button
        onClick={() => setShowCreateEvent(true)}
        className="create-event-btn"
      >
        + Create Event
      </button>
    )}

    {/* ---------- Create Event Modal ---------- */}
    {showCreateEvent && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Create Event</h2>
          <form onSubmit={handleEventSubmit}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleEventFormChange}
              placeholder="Event name"
              required
            />
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleEventFormChange}
              required
            />
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleEventFormChange}
              required
            />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleEventFormChange}
              placeholder="Location"
            />
            {/* Tag  */}
            {/* Tags section: create + select */}
<div className="event-tag-section">
  <h4>Tags</h4>

  {/* Quick create a new "type" tag from here */}
  <div className="event-tag-create-form" style={{ marginBottom: "0.75rem" }}>
    <input
      type="text"
      placeholder="New tag (e.g. band practice)"
      value={newEventTagLabel}
      onChange={(e) => setNewEventTagLabel(e.target.value)}
    />
    <button
      type="button"                 // 👈 IMPORTANT: not a submit button
      onClick={handleCreateTagFromEvent}
      disabled={creatingEventTag}
    >
      {creatingEventTag ? "Adding..." : "Add tag"}
    </button>
  </div>
  {eventTagError && <p className="error">{eventTagError}</p>}

  {/* List of existing tags (scrollable) */}
  {allTags.length === 0 ? (
    <p style={{ fontSize: "0.85rem" }}>No tags defined yet.</p>
  ) : (
    <div className="event-tag-list">
      {allTags.map((tag) => (
        <label key={tag.tagsID} className="event-tag-item">
          <input
            type="checkbox"
            checked={selectedEventTagIds.includes(tag.tagsID)}
            onChange={() => toggleEventTag(tag.tagsID)}
          />
          <span>
            #{tag.tagsID} – {formatTagLabel(tag)}
          </span>
        </label>
      ))}
    </div>
  )}
</div>




            <div className="modal-actions">
              <button type="submit">Save Event</button>
              <button type="button" onClick={() => setShowCreateEvent(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )}


    {/* ---------- Events List ---------- */}
    <main className="events-list">
      {eventsLoading && <p>Loading events...</p>}
      {eventsError && <p className="error">{eventsError}</p>}
      {filteredEvents.map((ev) => (
        <div className="event-card" key={ev.eventID}>
          <h3>{ev.name}</h3>
          <p className="event-category">{ev.type}</p>
          <p>{ev.description}</p>
          <p>
            <strong>Date:</strong> {ev.date} <br />
            <strong>Time:</strong> {ev.startTime} <br />
            <strong>Location:</strong> {ev.location}
          </p>
          <p>
            <strong>Attendance:</strong>{" "}
            {ev.attendees?.length || 0} / {ev.maxAttendees || "∞"}
          </p>
          <p><em>Created by {ev.creator?.username}</em></p>

          {joinedEventIds.includes(ev.eventID) ? (
            <button onClick={() => handleLeave(ev.eventID)}>Leave Event</button>
          ) : (
            <button onClick={() => handleJoin(ev.eventID)}>Join Event</button>
          )}

          {/*---------- View Details Button ---------- */}
              <button onClick={() => handleViewDetails(ev)}>More Details</button>

          {user?.userID === ev.creator?.userID && (
            <>
              <button onClick={() => handleEditClick(ev)}>Edit</button>
              <button onClick={() => handleDelete(ev.eventID, ev)}>Delete</button>
            </>
          )}
        </div>
      ))}
    </main>
                {/* ---------- Event More Details Panel ---------- */}
    {selectedEvent && (
      <section className="event-detail">
        <h2>Event Details</h2>

        {detailLoading && <p>Loading details...</p>}
        {detailError && <p className="error">{detailError}</p>}

        {!detailLoading && (
          <>
            <div className="event-detail-header">
              <h3>{selectedEvent.name}</h3>
              <div className="event-detail-header">
  <h3></h3>
  <p className="event-category">{selectedEvent.type}</p>
  <p>
    <strong>Date:</strong> {selectedEvent.date} <br />
    <strong>Time:</strong> {selectedEvent.startTime} <br />
    <strong>Location:</strong> {selectedEvent.location}
  </p>
  <p>
    <em>Created by {selectedEvent.creator?.username}</em>
  </p>
</div>

              {/* show tags for this event */}
              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div className="event-tags">
                  <h4>Tags</h4>
                  <ul className="event-tags-list">
                    {selectedEvent.tags.map((tag) => (
                      <li key={tag.tagsID} className="event-tag-chip">
                        {formatTagLabel(tag)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p>
                <strong>Date:</strong> {selectedEvent.date} <br />
                <strong>Time:</strong> {selectedEvent.startTime} <br />
                <strong>Location:</strong> {selectedEvent.location}
              </p>
              <p>
                <em>Created by {selectedEvent.creator?.username}</em>
              </p>
            </div>
            <div className="event-attendees">


  <h4>Attendees</h4>
  {detailAttendees.length === 0 ? (
    <p>No one has joined yet.</p>
  ) : (
    <ul>
      {detailAttendees.map((a) => (
        <li key={a.user.userID}>
          {a.user.username} {a.going ? "(going)" : "(not going)"}
        </li>
      ))}
    </ul>
  )}
</div>


            {/* ---- Media Gallery ---- */}
            <div className="event-media">
              <h4>Media</h4>
              {detailMedia.length === 0 && <p>No media yet.</p>}
              <div className="media-grid">
                {detailMedia.map((m) => (
                  <div key={m.mediaID} className="media-item">
                    {m.mediaType === 0 ? (
                      <img src={m.url} alt="Event media" />
                    ) : (
                      <a href={m.url} target="_blank" rel="noreferrer">
                        View media
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Creator-only media upload */}
              {user && user.userID === selectedEvent.creator?.userID && (
                <form className="media-upload-form" onSubmit={handleMediaUpload}>
                  <h5>Add Image (creator only)</h5>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMediaFileChange}
                  />
                  <button type="submit" disabled={mediaUploading || !mediaFile}>
                    {mediaUploading ? "Uploading..." : "Upload Image"}
                  </button>
                </form>
              )}
            </div>

            {/* ---- Posts ---- */}
            <div className="event-posts">
              <h4>Posts / Announcements</h4>
              {detailPosts.length === 0 && <p>No posts yet.</p>}
              <ul>
                {detailPosts.map((p) => (
                  <li key={p.postID}>
                    <strong>{p.title}</strong>
                    <p>{p.content}</p>
                  </li>
                ))}
              </ul>

              {/* Creator-only post form */}
              {user && user.userID === selectedEvent.creator?.userID && (
                <form className="post-form" onSubmit={handleCreatePost}>
                  <h5>Add Post (creator only)</h5>
                  <input
                    type="text"
                    name="title"
                    value={newPost.title}
                    onChange={handlePostChange}
                    placeholder="Post title"
                  />
                  <textarea
                    name="content"
                    value={newPost.content}
                    onChange={handlePostChange}
                    placeholder="Post content"
                  />
                  <button type="submit">Publish Post</button>
                </form>
              )}
            </div>
          </>
        )}
      </section>
    )}



    {/* ---------- Login Modal ---------- */}
    {showLogin && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Login</h2>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              name="email"
              value={loginForm.email}
              onChange={handleLoginFormChange}
              placeholder="Email"
            />

            <input
              type="password"
              name="password"
              value={loginForm.password}
              onChange={handleLoginFormChange}
              placeholder="Password"
            />

            <button type="submit" disabled={authLoading}>Login</button>
            {authError && <p className="error">{authError}</p>}

            <button type="button" onClick={() => setShowLogin(false)}>
              Cancel
            </button>
          </form>
        </div>
      </div>
    )}


    {/* ---------- Signup Modal ---------- */}
    {showSignup && (
      <div className="signup-modal">
        <form onSubmit={handleSignup}>
          <input
            type="text"
            name="username"
            value={signupForm.username}
            onChange={handleSignupChange}
            placeholder="Username"
          />
          <input
            type="email"
            name="email"
            value={signupForm.email}
            onChange={handleSignupChange}
            placeholder="Email"
          />
          <input
            type="password"
            name="password"
            value={signupForm.password}
            onChange={handleSignupChange}
            placeholder="Password"
          />
          <button type="submit">Sign Up</button>
          {signupError && <p className="error">{signupError}</p>}

          <button type="button" onClick={() => setShowSignup(false)}>
            Cancel
          </button>
        </form>
      </div>
    )}
  </div>
);
}

export default App;
