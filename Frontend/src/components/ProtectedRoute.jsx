import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../auth/useAuth.js";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="boot-screen"><span className="brand-mark">TL</span><p>Connecting to ThreatLens...</p></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
