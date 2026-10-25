import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import AuthScreen from './components/AuthScreen.jsx';
import api, { setAccessToken } from './services/api.js';

const navItems = [['overview', 'Overview'], ['events', 'Security events'], ['alerts', 'Alerts & incidents']];
const eventLabel = (type) => ({ login_success: 'Login success', login_failure: 'Login failure', access_denied: 'Access denied', other: 'Other' }[type] || type);
const dateLabel = (date) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [page, setPage] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState('');
  const [eventForm, setEventForm] = useState({ type: 'login_failure', username: '', sourceIp: '', message: '' });
  const refreshPageRef = useRef(() => {});

  const loadDashboard = useCallback(async () => {
    const { data } = await api.get('/dashboard'); setDashboard(data.data);
  }, []);
  const loadEvents = useCallback(async () => {
    const { data } = await api.get('/events', { params: { search: search || undefined } }); setEvents(data.data.events);
  }, [search]);
  const loadAlerts = useCallback(async () => {
    const { data } = await api.get('/alerts'); setAlerts(data.data);
  }, []);
  const refreshPage = useCallback(async () => {
    try { await Promise.all([loadDashboard(), loadEvents(), loadAlerts()]); }
    catch (error) { toast.error(error.response?.data?.message || 'Unable to load security data'); }
  }, [loadAlerts, loadDashboard, loadEvents]);
  useEffect(() => { refreshPageRef.current = refreshPage; }, [refreshPage]);

  useEffect(() => {
    let active = true;
    api.post('/auth/refresh').then(async ({ data }) => { if (active) { setAccessToken(data.data.accessToken); setUser(data.data.user); await refreshPageRef.current(); } }).catch(() => {}).finally(() => { if (active) setBooting(false); });
    const expire = () => { setUser(null); setAccessToken(null); };
    window.addEventListener('threatlens:session-expired', expire);
    return () => { active = false; window.removeEventListener('threatlens:session-expired', expire); };
  }, []);
  function handleAuthenticated(account) { setUser(account); refreshPage(); }

  async function signOut() {
    try { await api.post('/auth/logout'); } catch { /* Clear the local session even if the API is unavailable. */ }
    setAccessToken(null); setUser(null); toast.info('You have signed out');
  }
  async function submitEvent(event) {
    event.preventDefault();
    try {
      await api.post('/events', { ...eventForm, timestamp: new Date().toISOString() });
      setEventForm({ type: 'login_failure', username: '', sourceIp: '', message: '' }); toast.success('Security event recorded'); await refreshPage();
    } catch (error) { toast.error(error.response?.data?.message || 'Could not record event'); }
  }
  async function changeStatus(alert, status) {
    try { await api.patch(`/alerts/${alert._id}/status`, { status }); toast.success(`Alert marked ${status.toLowerCase()}`); await refreshPage(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not update alert'); }
  }

  if (booting) return <div className="boot-screen"><span className="brand-mark">TL</span><p>Connecting to ThreatLens…</p></div>;
  if (!user) return <AuthScreen onAuthenticated={handleAuthenticated} />;

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">TL</span><span>ThreatLens<small>SECURITY OPERATIONS</small></span></div><div className="workspace-label">WORKSPACE</div><nav>{navItems.map(([key, label], index) => <button key={key} className={`nav-item ${page === key ? 'active' : ''}`} onClick={() => setPage(key)}><span>{['◈', '▤', '◉'][index]}</span>{label}{key === 'alerts' && dashboard?.openAlerts > 0 && <b>{dashboard.openAlerts}</b>}</button>)}</nav><div className="sidebar-bottom"><div className="status-dot" /> API connected</div></aside>
    <main className="main-area"><header className="topbar"><div className="crumb">ThreatLens <span>/</span> {navItems.find(([key]) => key === page)?.[1]}</div><div className="user-menu"><span className="avatar">{user.name?.slice(0, 1).toUpperCase()}</span><span>{user.name}</span><button onClick={signOut}>Sign out</button></div></header>
      <div className="page-content"><div className="page-heading"><div><p className="eyebrow">SECURITY OPERATIONS CENTER</p><h1>{page === 'overview' ? 'Security overview' : page === 'events' ? 'Security events' : 'Alerts & incidents'}</h1><p className="muted">{page === 'overview' ? 'Monitor authentication activity and investigate suspicious patterns.' : 'Review activity from your monitored environment.'}</p></div><button className="secondary-btn" onClick={refreshPage}>↻ Refresh</button></div>
        {page === 'overview' && <>
          <section className="metrics-grid">{[['Events ingested', dashboard?.totalEvents ?? '—', 'Across your workspace', 'blue'], ['Failed logins', dashboard?.failedLogins ?? '—', 'Authentication failures', 'amber'], ['Open alerts', dashboard?.openAlerts ?? '—', 'Require analyst review', 'violet'], ['High priority', dashboard?.highAlerts ?? '—', 'Open high or critical', 'red']].map(([label, value, note, color]) => <article className="metric-card" key={label}><div className="metric-top"><span>{label}</span><i className={color}>{['◈', '⌁', '◉', '△'][['Events ingested', 'Failed logins', 'Open alerts', 'High priority'].indexOf(label)]}</i></div><strong>{value}</strong><small>{note}</small></article>)}</section>
          <section className="content-grid"><article className="panel"><div className="panel-heading"><div><h2>Recent security events</h2><p>Latest activity captured by your workspace</p></div><button className="text-btn" onClick={() => setPage('events')}>View all →</button></div><EventTable events={dashboard?.recentEvents || []} /></article><article className="panel"><div className="panel-heading"><div><h2>Recent alerts</h2><p>Rule based detection findings</p></div><button className="text-btn" onClick={() => setPage('alerts')}>View all →</button></div><AlertList alerts={dashboard?.recentAlerts || []} onStatus={changeStatus} compact /></article></section>
          <div className="notice"><span>ⓘ</span><p><strong>Detection heuristic</strong> Repeated login failures are grouped per account and source IP when five or more occur within five minutes. This is an investigation signal, not proof of malicious activity.</p></div>
        </>}
        {page === 'events' && <section className="panel"><div className="panel-heading"><div><h2>Event activity</h2><p>Search by account name or source IP</p></div><input className="search-input" placeholder="Search events…" value={search} onChange={(e) => setSearch(e.target.value)} /></div><EventTable events={events} /><form className="event-form" onSubmit={submitEvent}><h3>Record a security event</h3><div className="form-row"><select value={eventForm.type} onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}><option value="login_failure">Login failure</option><option value="login_success">Login success</option><option value="access_denied">Access denied</option><option value="other">Other</option></select><input placeholder="Account (optional)" maxLength="120" value={eventForm.username} onChange={(e) => setEventForm({ ...eventForm, username: e.target.value })} /><input placeholder="Source IP (optional)" maxLength="64" value={eventForm.sourceIp} onChange={(e) => setEventForm({ ...eventForm, sourceIp: e.target.value })} /><button className="primary-btn">Add event</button></div><input className="message-input" placeholder="Event note (optional)" maxLength="1000" value={eventForm.message} onChange={(e) => setEventForm({ ...eventForm, message: e.target.value })} /></form></section>}
        {page === 'alerts' && <section className="panel"><div className="panel-heading"><div><h2>Detection alerts</h2><p>Explainable rule triggered findings for analyst review</p></div></div><AlertList alerts={alerts} onStatus={changeStatus} /></section>}
      </div>
    </main>
  </div>;
}

function EventTable({ events }) {
  if (!events.length) return <div className="empty-state"><span>◌</span><strong>No events yet</strong><p>Add an event to start monitoring your workspace.</p></div>;
  return <div className="table-wrap"><table><thead><tr><th>EVENT</th><th>ACCOUNT</th><th>SOURCE IP</th><th>TIME</th><th>SOURCE</th></tr></thead><tbody>{events.map((event) => <tr key={event._id}><td><span className={`event-marker ${event.type}`}></span>{eventLabel(event.type)}</td><td>{event.username || '—'}</td><td className="mono">{event.sourceIp || '—'}</td><td>{dateLabel(event.timestamp)}</td><td>{event.source || 'Manual'}</td></tr>)}</tbody></table></div>;
}

function AlertList({ alerts, onStatus, compact = false }) {
  if (!alerts.length) return <div className="empty-state"><span>✓</span><strong>No alerts to review</strong><p>Detected findings will appear here as events arrive.</p></div>;
  return <div className="alert-list">{alerts.slice(0, compact ? 4 : undefined).map((alert) => <article className="alert-row" key={alert._id}><div className={`severity-bar ${alert.severity?.toLowerCase()}`} /><div className="alert-copy"><div className="alert-title-line"><strong>{alert.title}</strong><span className={`severity-pill ${alert.severity?.toLowerCase()}`}>{alert.severity}</span></div><p>{alert.explanation}</p><small>{dateLabel(alert.lastSeen || alert.createdAt)} · {alert.count || 0} related events · {alert.sourceIp || 'IP unavailable'}</small></div><div className="alert-actions">{alert.status !== 'Resolved' && <button onClick={() => onStatus(alert, 'Resolved')}>Resolve</button>}{alert.status !== 'False positive' && <button onClick={() => onStatus(alert, 'False positive')}>False positive</button>}<span className="status-label">{alert.status}</span></div></article>)}</div>;
}
