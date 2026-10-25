const labels = { login_success: "Login success", login_failure: "Login failure", access_denied: "Access denied", other: "Other" };
const dateLabel = (date) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));

export default function EventTable({ events = [] }) {
  if (!events.length) return <div className="empty-state"><span>◌</span><strong>No events yet</strong><p>Add an event to start monitoring your workspace.</p></div>;
  return <div className="table-wrap"><table><thead><tr><th>EVENT</th><th>ACCOUNT</th><th>SOURCE IP</th><th>TIME</th><th>SOURCE</th></tr></thead><tbody>{events.map((event) => <tr key={event._id}><td><span className={`event-marker ${event.type}`} />{labels[event.type] || event.type}</td><td>{event.username || "—"}</td><td className="mono">{event.sourceIp || "—"}</td><td>{dateLabel(event.timestamp)}</td><td>{event.source || "Manual"}</td></tr>)}</tbody></table></div>;
}
