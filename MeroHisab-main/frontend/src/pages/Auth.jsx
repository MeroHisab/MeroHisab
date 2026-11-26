import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Store, Mic, BarChart3, Users, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api';

const FEATURES = [
  { Icon: Mic, text: 'Record sales & expenses by voice or text' },
  { Icon: Users, text: 'Track customer credit (udharo) and repayments' },
  { Icon: BarChart3, text: 'Profit, expense and trend reports in one place' },
];

export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', shop_name: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/'} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isRegister) {
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          shop_name: form.shop_name.trim() || 'My Shop',
          phone: form.phone.trim() || null,
        });
      } else {
        await login(form.email.trim(), form.password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="brand" style={{ border: 0, padding: 0 }}>
          <div className="brand-logo"><Store size={20} /></div>
          <div className="brand-name" style={{ color: '#fff' }}>MeroHisab</div>
        </div>
        <h1>Run your shop's books without the paperwork.</h1>
        <p>Simple bookkeeping for small businesses — sales, expenses, credit and reports.</p>
        <ul>
          {FEATURES.map(({ Icon, text }) => (
            <li key={text}><span><Icon size={16} /></span>{text}</li>
          ))}
        </ul>
      </div>

      <div className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>
            {isRegister ? 'Start tracking your business in minutes.' : 'Sign in to continue to MeroHisab.'}
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Your name</label>
                <input className="form-control" required value={form.name} onChange={set('name')} placeholder="Sarala Shrestha" />
              </div>
              <div className="form-group">
                <label className="form-label">Shop name</label>
                <input className="form-control" value={form.shop_name} onChange={set('shop_name')} placeholder="Sarala Dairy" />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@shop.com" />
          </div>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input className="form-control" value={form.phone} onChange={set('phone')} placeholder="98XXXXXXXX" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control" type="password" required minLength={6}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={form.password} onChange={set('password')} placeholder="At least 6 characters"
            />
          </div>

          <button className="btn btn-primary btn-lg btn-full" disabled={busy}>
            {busy && <Loader size={16} className="spin" />}
            {isRegister ? 'Create account' : 'Sign in'}
          </button>

          <p className="auth-switch">
            {isRegister ? <>Already have an account? <Link to="/login">Sign in</Link></> : <>New to MeroHisab? <Link to="/register">Create an account</Link></>}
          </p>
        </form>
      </div>
    </div>
  );
}
