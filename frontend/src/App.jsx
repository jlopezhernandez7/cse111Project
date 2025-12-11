import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  // ---------- auth state ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [showLogin, setShowLogin] = useState(false);

     
  // ---------- events state ----------
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    startTime: "",
    location: "",
    type: "",
  });

  const [showCreateEvent, setShowCreateEvent] = useState(false);


  // ---------- Search and filter state ----------
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const filteredEvents = events
    .filter(ev =>
      ev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.location && ev.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.type && ev.type.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(ev => filter === "all" || (ev.type && ev.type.toLowerCase() === filter.toLowerCase()));



  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    password: "", 
  });
  const [signupError, setSignupError] = useState("");

  const [joinedEventIds, setJoinedEventIds] = useState([]); // eventIDs I’m going to



  // ---------- helpers: API calls ----------

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
        credentials: "include", // not required but fine
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

  useEffect(() => {
    // on mount: check session + load events
    (async () => {
      await fetchCurrentUser();
      await fetchEvents();
    })();
  }, []);

  useEffect(() => {
  if (user) {
    fetchMyAttendance();
  } else {
    setJoinedEventIds([]);
  }
}, [user]);

  // ---------- auth handlers ----------

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
      body: JSON.stringify({
        email: loginForm.email,
        password: loginForm.password,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || `Login failed (${res.status})`);
    }

    // 🔑 Only trust the session cookie
    await fetchCurrentUser();   // this reads /api/auth/me and sets user if cookie works
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

  // ---------- event form handlers ----------

  function handleEventFormChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      // creator is taken from session (backend ignores creatorID)
    };

    try {
      let res;
      if (editingId === null) {
        // CREATE
        res = await fetch(`${API_BASE_URL}/api/events/`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // UPDATE
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
        await fetchMyAttendance();  // refresh joinedEventIds so new event shows as joined for creator 
        resetEventForm();
    } catch (err) {
      console.error(err);
      setEventsError(err.message || "Failed to save event");
    }
  }
  function handleSignupChange(e) {
  const { name, value } = e.target;
  setSignupForm((prev) => ({ ...prev, [name]: value }));
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
  }

  function handleCancelEdit() {
    resetEventForm();
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
async function handleSignup(e) {
  e.preventDefault();
  setSignupError("");

  try {
    // 1) Create user account
    const res = await fetch(`${API_BASE_URL}/api/users/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // allow backend to set session cookie
      body: JSON.stringify({
        username: signupForm.username,
        email: signupForm.email,
        password: signupForm.password,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || "Failed to create account");
    }

    // 2) Now verify that the backend actually logged us in
    const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });

    if (meRes.ok) {
      // Session cookie worked! We are logged in.
      const meData = await meRes.json();
      setUser(meData.user);

      // Clear signup modal
      setSignupForm({ username: "", email: "", password: "" });
      setShowSignup(false);
    } else {
      // Cookie blocked → user NOT logged in
      throw new Error(
        "Signup succeeded, but login session was not created. Your browser may be blocking cookies."
      );
    }
  } catch (err) {
    console.error(err);
    setSignupError(err.message || "Signup failed");
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
        if (!res.ok) return; // silently ignore for now

        const data = await res.json();
        // data.events is from attendance_routes; we only care about going==true
        const ids = (data.events || [])
          .filter((r) => r.going)
          .map((r) => r.event.eventID);

        setJoinedEventIds(ids);
      } catch (err) {
        console.error("Failed to load attendance", err);
      }
    }


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
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => setShowLogin(true)}>Login</button>
            <button onClick={() => setShowSignup(true)}>Sign Up</button>
          </>
        )}
      </div>
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
            <select
              name="type"
              value={formData.type}
              onChange={handleEventFormChange}
            >
              <option value="">Select category</option>
              <option value="study">Study</option>
              <option value="sports">Sports</option>
              <option value="social">Social</option>
              <option value="volunteer">Volunteer</option>
              <option value="other">Other</option>
            </select>

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

          {user?.userID === ev.creator?.userID && (
            <>
              <button onClick={() => handleEditClick(ev)}>Edit</button>
              <button onClick={() => handleDelete(ev.eventID, ev)}>Delete</button>
            </>
          )}
        </div>
      ))}
    </main>


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

