import { Navigate } from "react-router-dom";
import AuthScreen from "../components/AuthScreen.jsx";
import useAuth from "../auth/useAuth.js";

export default function LoginPage() {
  const { user, loading } = useAuth();
  if (loading) return <div className="boot-screen"><span className="brand-mark">TL</span><p>Connecting to ThreatLens...</p></div>;
  return user ? <Navigate to="/" replace /> : <AuthScreen />;
}
