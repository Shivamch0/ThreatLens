export default function MetricCard({ label, value, note, tone = "blue", icon = "◈" }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><i className={tone}>{icon}</i></div><strong>{value ?? "—"}</strong><small>{note}</small></article>;
}
