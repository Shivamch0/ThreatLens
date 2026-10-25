import { useState } from 'react';
import { toast } from 'react-toastify';
import api, { setAccessToken } from '../services/api.js';

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      setAccessToken(data.data.accessToken); onAuthenticated(data.data.user);
      toast.success(mode === 'login' ? 'Welcome back' : 'Account created');
    } catch (error) { toast.error(error.response?.data?.message || 'Could not connect to ThreatLens API'); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell"><section className="auth-card"><div className="brand-mark">TL</div><p className="eyebrow">DEFENSIVE SECURITY MONITORING</p><h1>{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h1><p className="muted">Sign in to review events and investigate alerts.</p>
    <form onSubmit={submit} className="auth-form">
      {mode === 'register' && <label>Full name<input autoComplete="name" required minLength="2" maxLength="80" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
      <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="10" maxLength="128" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><small>Use at least 10 characters.</small></label>
      <button className="primary-btn full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <p className="switch-auth">{mode === 'login' ? 'New to ThreatLens?' : 'Already have an account?'} <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></p>
  </section></main>;
}
