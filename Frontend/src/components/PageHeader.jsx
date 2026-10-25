export default function PageHeader({ title, description, onRefresh }) {
  return <div className="page-heading"><div><p className="eyebrow">SECURITY OPERATIONS CENTER</p><h1>{title}</h1><p className="muted">{description}</p></div>{onRefresh && <button className="secondary-btn" onClick={onRefresh}>↻ Refresh</button>}</div>;
}
