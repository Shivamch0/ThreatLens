import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAuth from "../auth/useAuth.js";

const links = [
  { to: "/", label: "Overview", icon: "◈", end: true },
  { to: "/events", label: "Security events", icon: "▤" },
  { to: "/alerts", label: "Alerts & incidents", icon: "◉" },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const current = links.find((link) => link.to === location.pathname)?.label || "Overview";

  async function handleSignOut() {
    try { await signOut(); } catch { toast.error("Could not reach the API; signed out locally"); }
    navigate("/login", { replace: true });
    toast.info("You have signed out");
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">TL</span><span>ThreatLens<small>SECURITY OPERATIONS</small></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}><span>{link.icon}</span>{link.label}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="status-dot" /> API connected</div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="crumb">ThreatLens <span>/</span> {current}</div><div className="user-menu"><span className="avatar">{user?.name?.slice(0, 1).toUpperCase()}</span><span>{user?.name}</span><button onClick={handleSignOut}>Sign out</button></div></header>
      <Outlet />
    </main>
  </div>;
}
