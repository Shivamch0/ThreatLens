import { useState } from "react";

const emptyForm = { type: "login_failure", username: "", sourceIp: "", message: "" };

export default function EventForm({ onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  async function submit(event) {
    event.preventDefault();
    const saved = await onSubmit({ ...form, timestamp: new Date().toISOString() });
    if (saved) setForm(emptyForm);
  }
  return <form className="event-form" onSubmit={submit}><h3>Record a security event</h3><div className="form-row">
    <select aria-label="Event type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="login_failure">Login failure</option><option value="login_success">Login success</option><option value="access_denied">Access denied</option><option value="other">Other</option></select>
    <input placeholder="Account (optional)" maxLength="120" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
    <input placeholder="Source IP (optional)" maxLength="64" value={form.sourceIp} onChange={(event) => setForm({ ...form, sourceIp: event.target.value })} />
    <button className="primary-btn">Add event</button>
  </div><input className="message-input" placeholder="Event note (optional)" maxLength="1000" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></form>;
}
