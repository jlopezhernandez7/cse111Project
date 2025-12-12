import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function EventDetails() {
  const { eventID } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${API_BASE_URL}/api/events/${eventID}`);
      const data = await res.json();
      setEvent(data);
    }
    load();
  }, [eventID]);

  if (!event) return <p>Loading...</p>;

  return (
    <div className="event-details-page">
      <Link to="/">← Back to Events</Link>

      <h1>{event.name}</h1>
      <p><strong>Category:</strong> {event.type}</p>
      <p><strong>Description:</strong> {event.description}</p>
      <p><strong>Date:</strong> {event.date}</p>
      <p><strong>Time:</strong> {event.startTime}</p>
      <p><strong>Location:</strong> {event.location}</p>
      <p><strong>Created by:</strong> {event.creator?.username}</p>
    </div>
  );
}