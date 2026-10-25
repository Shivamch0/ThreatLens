const dateLabel = (date) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));

export default function AlertList({ alerts = [], onStatus, compact = false }) {
  if (!alerts.length) return <div className="empty-state"><span>✓</span><strong>No alerts to review</strong><p>Detected findings will appear here as events arrive.</p></div>;
  return <div className="alert-list">{alerts.slice(0, compact ? 4 : undefined).map((alert) => <article className="alert-row" key={alert._id}>
    <div className={`severity-bar ${alert.severity?.toLowerCase()}`} /><div className="alert-copy"><div className="alert-title-line"><strong>{alert.title}</strong><span className={`severity-pill ${alert.severity?.toLowerCase()}`}>{alert.severity}</span></div><p>{alert.explanation}</p><small>{dateLabel(alert.lastSeen || alert.createdAt)} · {alert.count || 0} related events · {alert.sourceIp || "IP unavailable"}</small></div>
    {onStatus && <div className="alert-actions">{alert.status !== "Resolved" && <button onClick={() => onStatus(alert, "Resolved")}>Resolve</button>}{alert.status !== "False positive" && <button onClick={() => onStatus(alert, "False positive")}>False positive</button>}<span className="status-label">{alert.status}</span></div>}
  </article>)}</div>;
}
