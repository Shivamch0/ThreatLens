import { useEffect, useState } from "react";
import api, { setAccessToken } from "../services/api.js";
import AuthContext from "./authContext.js";
let restoreSessionRequest;

function restoreSession() {
  restoreSessionRequest ||= api.post("/auth/refresh").finally(() => {
    restoreSessionRequest = null;
  });
  return restoreSessionRequest;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    restoreSession()
      .then(({ data }) => {
        if (!active) return;
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    const expire = () => { setAccessToken(null); setUser(null); };
    window.addEventListener("threatlens:session-expired", expire);
    return () => {
      active = false;
      window.removeEventListener("threatlens:session-expired", expire);
    };
  }, []);

  async function authenticate(mode, credentials) {
    const { data } = await api.post(`/auth/${mode}`, credentials);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
  }

  async function signOut() {
    try { await api.post("/auth/logout"); } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  return <AuthContext.Provider value={{ user, loading, authenticate, signOut }}>{children}</AuthContext.Provider>;
}
