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
    <div className="App">
      {/* Header / Auth section */}
      <header>
        <div>
          <h1>Event Feed (Test)</h1>
          <p style={{ fontSize: 14, color: "#666", marginTop: 0 }}>
            Uses Flask backend with session-based login and creator-only
            editing.
          </p>
        </div>

        <div
          style={{
            minWidth: 260,
            border: "1px solid #000a42ff",
            borderRadius: 8,
            padding: 12,
          }}
        >
          {user ? (
            <>
              <div style={{ marginBottom: 8 }}>
                <strong>Logged in as</strong>
                <div>{user.username}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{user.email}</div>
              </div>
              <button onClick={handleLogout} disabled={authLoading}>
                Logout
              </button>
            </>
          ) : (
            <>
              <h3 style={{ marginTop: 0 }}></h3>
              {authError && (
                <div
                  style={{
                    backgroundColor: "#ffe5e5",
                    color: "#b00020",
                    padding: "4px 8px",
                    borderRadius: 4,
                    marginBottom: 8,
                    fontSize: 13,
                  }}
                >
                  {authError}
                </div>
              )}
              
              <form
                onSubmit={handleLogin}
                style={{ display: "grid", gap: 8, fontSize: 14 }}
              >
                      

                <label style={{display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center" 
                }}>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={loginForm.email}
                    onChange={handleLoginFormChange}
                    placeholder="you@example.com"
                    style={{
                      border: "1px solid #000000ff",   
                      borderRadius: "6px",           
                      padding: "8px",           
                      backgroundColor: "#f9f9f9",    
                      color: "#333",                 
                    }}/>
                </label>
                <label style={{display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center" 
                }}>
                  Password
                  <input 
                    type="password"
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginFormChange}
                    placeholder="••••••••"
                    style={{
                      border: "1px solid #000000ff",   
                      borderRadius: "6px",           
                      padding: "8px",           
                      backgroundColor: "#f9f9f9",    
                      color: "#333",                 
                    }}/>
                </label>
                <button type="submit" disabled={authLoading}
                style={{ backgroundColor: "darkblue", color: "white" }}
                >
                  {authLoading ? "Logging in..." : "Login"}
                </button>
                <p>or</p>
                <button
                        type="button"
                        onClick={() => setShowSignup(true)}
                        style={{
                          marginTop: "8px",
                          width: "100%",
                          background: "#222",
                          color: "white",
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #444",
                                }}
                              >
                                Create Account
                      </button>
              </form>
              <p style={{ fontSize: 11, color: "#888", marginTop: 8 }}>
                (Use a test user you created via the backend / API.)
              </p>

              
            </>
          )}
        </div>

        {showSignup && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        width: "350px",
        background: "#111",
        padding: "20px",
        borderRadius: "10px",
        border: "1px solid #444",
      }}
    >
      <h3 style={{ marginTop: 0, color:"white" }}>Create Account</h3>

      {signupError && (
        <div
          style={{
            backgroundColor: "#ffdddd",
            color: "#b00020",
            padding: "6px",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        >
          {signupError}
        </div>
      )}

      <form
        onSubmit={handleSignup}
        style={{ display: "grid", gap: "10px" }}
      >
        <label
          style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          textIndent: "40px"
        }}>
          <span style={{ color: "white" }}>Username</span>
          <input
            type="text"
            name="username"
            value={signupForm.username}
            onChange={handleSignupChange}
            placeholder="CoolUser123"
            required
            style={{
              border: "2px solid #000000ff",   
              borderRadius: "6px",           
              padding: "8px",           
              backgroundColor: "#f9f9f9",    
              color: "#333",                 
              }}
            />
        </label>

        <label
          style={{
          display: "flex",
          alignItems: "center",
          gap: 45,
          textIndent: "40px"
        }}>
          <span style={{ color: "white" }}>Email</span>
          <input
            type="email"
            name="email"
            value={signupForm.email}
            onChange={handleSignupChange}
            placeholder="you@example.com"
            required
            style={{
              border: "2px solid #000000ff",   
              borderRadius: "6px",           
              padding: "8px",           
              backgroundColor: "#f9f9f9",    
              color: "#333",                 
              }}
            />
        </label>

        <label
          style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          textIndent: "40px"
        }}>
          <span style={{ color: "white" }}>Password</span>
          <input
            type="password"
            name="password"
            value={signupForm.password}
            onChange={handleSignupChange}
            placeholder="StrongPassword"
            required
            style={{
              border: "2px solid #000000ff",   
              borderRadius: "6px",           
              padding: "8px",           
              backgroundColor: "#f9f9f9",    
              color: "#333",                 
            }}
          />
        </label>

        <button type="submit" style={{ marginTop: "10px", backgroundColor: "darkblue", color: "white" }}
        >
          Create Account
        </button>

        <button
          type="button"
          onClick={() => setShowSignup(false)}
          style={{
            marginTop: "8px",
            background: "#ffffffff",
            padding: "8px",
            borderRadius: "6px",
          }}
        >
          Cancel
        </button>
      </form>
    </div>
  </div>
)}

      </header>

      {/* Error / status for events */}
      {eventsError && (
        <div
          style={{
            backgroundColor: "#ffe5e5",
            color: "#b00020",
            padding: "8px 12px",
            borderRadius: 4,
          }}
        >
          {eventsError}
        </div>
      )}

      {/* Create / update form (only if logged in) */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {editingId === null ? "Create Event" : `Edit Event #${editingId}`}
        </h2>

        {!user && (
          <p style={{ fontSize: 14, color: "#666" }}>
            You must be logged in to create or edit events.
          </p>
        )}

        <form
          onSubmit={handleEventSubmit}
          style={{ display: "grid", gap: 8, maxWidth: 500 }}
        >
          <label
          style={{
          display: "flex",
          alignItems: "center",
          gap: 123,
          textIndent: "140px"
          }}>
            Name*
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleEventFormChange}
              placeholder="Smash Tournament"
              disabled={!user}
              style={{
              border: "1px solid #000000ff",   
              borderRadius: "6px",           
              padding: "8px",           
              backgroundColor: "#f9f9f9",    
              color: "#333",                 
              }}
            />
          </label>

          <label
          style={{
          display: "flex",
          alignItems: "center",
          gap: 19,
          textIndent: "140px"
          }}>
            Date* (YYYY-MM-DD)
            <input
              type="text"
              name="date"
              value={formData.date}
              onChange={handleEventFormChange}
              placeholder="2025-11-30"
              disabled={!user}
              style={{
              border: "1px solid #000000ff",   
              borderRadius: "6px",           
              padding: "8px",           
              backgroundColor: "#f9f9f9",    
              color: "#333",                 
              }}
            />
          </label>

          <label
          style={{
          display: "flex",
          alignItems: "center",
          gap: 25,
          textIndent: "140px"
          }}>
            Start Time* (HH:MM)
            <input
              type="text"
              name="startTime"
              value={formData.startTime}
              onChange={handleEventFormChange}
              placeholder="18:00"
              disabled={!user}
              style={{
              border: "1px solid #000000ff",   
              borderRadius: "6px",           
              padding: "8px",           
              backgroundColor: "#f9f9f9",    
              color: "#333",                 
              }}
            />
          </label>

          <label
          style={{
          display: "flex",
          alignItems: "center",
          gap: 112,
          textIndent: "140px"
          }}>
            Location
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleEventFormChange}
              placeholder="COB2 170"
              disabled={!user}
              style={{
              border: "1px solid #000000ff",   
              borderRadius: "6px",           
              padding: "8px",           
              backgroundColor: "#f9f9f9",    
              color: "#333",                 
              }}
            />
          </label>

          <label
          style={{
          display: "flex",
          alignItems: "center",
          gap: 139,
          textIndent: "140px"
          }}>
            Type
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleEventFormChange}
              placeholder="gaming / study group / ..."
              disabled={!user}
              style={{
              border: "1px solid #000000ff",   
              borderRadius: "6px",           
              padding: "8px",           
              backgroundColor: "#f9f9f9",    
              color: "#333",                 
              }}
            />
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit" disabled={!user}>
              {editingId === null ? "Create" : "Save changes"}
            </button>
            {editingId !== null && (
              <button type="button" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Event list (feed) */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0 }}>Events</h2>         
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "8px 10px",
                border: "1px solid #000000ff",
                borderRadius: "6px",
                flex: 1 
              }}
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: "6px", borderRadius: "4px" }}
            >
              <option value="all">All Types</option>
              <option value="anime">anime</option>
              <option value="study group">study group</option>
              <option value="gaming">gaming</option>
              <option value="movies">movies</option>
            </select>
          <button onClick={fetchEvents} disabled={eventsLoading}>
            {eventsLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {eventsLoading && events.length === 0 && <p>Loading events...</p>}

        {!eventsLoading && events.length === 0 && (
          <p style={{ marginTop: 12 }}>No events yet. Add one above!</p>
        )}

        <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>

          {filteredEvents.map((ev) => {
            const isCreator =
              user && ev.creator && ev.creator.userID === user.userID;

              
            const isJoined = joinedEventIds.includes(ev.eventID);
            

              

            return (
              <li
                key={ev.eventID}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {ev.name}{" "}
                    <span style={{ fontSize: 12, color: "#666" }}>
                      (#{ev.eventID})
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: "#444" }}>
                    {ev.date} at {ev.startTime}
                  </div>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    {ev.location || "No location"} · {ev.type || "No type"}
                  </div>
                  {ev.creator && (
                    <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                      Created by {ev.creator.username} (user #{ev.creator.userID}
                      )
                    </div>
                  )}
                </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* Join / Leave only for non-creators */}
                    {user && !isCreator && (
                      <button
                        type="button"
                        onClick={() =>
                          isJoined ? handleLeave(ev.eventID) : handleJoin(ev.eventID)
                        }
                      >
                        {isJoined ? "Leave" : "Join"}
                      </button>
                    )}

                    {/* Creator label */}
                    {isCreator && (
                      <span style={{ fontSize: 12, color: "#aaa" }}>
                        JOINED
                      </span>
                    )}

                    {/* Single Edit/Delete block for creator */}
                    {isCreator && (
                      <>
                        <button type="button" onClick={() => handleEditClick(ev)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ev.eventID, ev)}
                          style={{ backgroundColor: "#ffe5e5", borderColor: "#ffaaaa" }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>

              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export default App;

