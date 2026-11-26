import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Store, Mic, BarChart3, Users, Loader, Mail, Lock, User, Phone,
  Eye, EyeOff, AlertCircle, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api';

const FEATURES = [
  { Icon: Mic, text: 'Record sales & expenses by voice or text' },
  { Icon: Users, text: 'Track customer credit (udharo) and repayments' },
  { Icon: BarChart3, text: 'Profit, expense and trend reports in one place' },
];

/* ───────────────────────── Styles (kept in this file) ───────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');

.mh-shell {
  --mh-navy: #0a1f55;
  --mh-blue: #1d4ed8;
  --mh-blue-light: #2f6bf0;
  --mh-sky: #8dbcff;
  --mh-bg: #f1f5fd;
  --mh-line: #dbe4f5;
  --mh-text: #0f1b33;
  --mh-muted: #5b6a87;
  --mh-danger: #b42318;
  --mh-danger-bg: #fdeceb;

  --mh-display: 'Bricolage Grotesque', 'DM Sans', system-ui, sans-serif;
  --mh-body: 'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;

  /* One screen, no page scroll */
  height: 100vh;
  height: 100dvh;
  overflow: hidden;

  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  font-family: var(--mh-body);
  color: var(--mh-text);
  background: var(--mh-bg);
}
.mh-shell *, .mh-shell *::before, .mh-shell *::after { box-sizing: border-box; }

/* ---------- Left: brand side ---------- */
.mh-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 56px;
  color: #e8efff;
  overflow: hidden;
  background:
    radial-gradient(520px 520px at 100% 0%, rgba(141,188,255,.28), transparent 65%),
    radial-gradient(420px 420px at 0% 100%, rgba(47,107,240,.45), transparent 65%),
    linear-gradient(160deg, #1b46c4, var(--mh-navy));
}
.mh-brand { display: flex; align-items: center; gap: 12px; }
.mh-brand-logo {
  display: grid; place-items: center;
  width: 40px; height: 40px; border-radius: 12px;
  background: #fff; color: var(--mh-blue);
}
.mh-brand-name {
  font-family: var(--mh-display);
  font-weight: 800; font-size: 22px; letter-spacing: -.01em; color: #fff;
}

.mh-hero-body { max-width: 480px; }
.mh-hero h1 {
  margin: 0 0 14px;
  font-family: var(--mh-display);
  font-weight: 800;
  font-size: clamp(1.9rem, 3.2vw, 2.8rem);
  line-height: 1.08;
  letter-spacing: -.025em;
  color: #fff;
  text-wrap: balance;
}
.mh-lead { margin: 0 0 26px; font-size: 1rem; line-height: 1.6; color: rgba(232,239,255,.8); max-width: 44ch; }

.mh-features { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.mh-features li { display: flex; align-items: center; gap: 12px; font-size: .95rem; color: rgba(232,239,255,.95); }
.mh-feature-icon {
  flex: none; display: grid; place-items: center;
  width: 32px; height: 32px; border-radius: 10px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.2);
  color: var(--mh-sky);
}
.mh-foot { font-size: .85rem; color: rgba(232,239,255,.55); }

/* ---------- Right: form side ---------- */
.mh-panel {
  display: grid; place-items: center;
  padding: 24px;
  overflow-y: auto;            /* safety net only for very short screens */
  background: var(--mh-bg);
}
.mh-card {
  width: 100%; max-width: 440px;
  padding: 30px 30px 24px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid var(--mh-line);
  box-shadow: 0 20px 44px -28px rgba(29,78,216,.35);
  display: grid; gap: 14px;
}
.mh-card-head h2 {
  margin: 0 0 4px;
  font-family: var(--mh-display); font-weight: 800;
  font-size: 1.65rem; letter-spacing: -.02em;
}
.mh-card-head p { margin: 0; color: var(--mh-muted); font-size: .94rem; }

.mh-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.mh-field { display: grid; gap: 5px; min-width: 0; }
.mh-label { font-size: .82rem; font-weight: 600; color: #26365a; }
.mh-input-wrap { position: relative; display: block; }
.mh-input-icon {
  position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
  color: #8794b3; pointer-events: none; transition: color .15s;
}
.mh-input {
  width: 100%; height: 44px; padding: 0 12px 0 40px;
  font: inherit; font-size: .94rem; color: var(--mh-text);
  background: #f7f9fe;
  border: 1.5px solid var(--mh-line);
  border-radius: 11px; outline: none;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.mh-input::placeholder { color: #9aa6c2; }
.mh-input:hover { border-color: #c2d0ec; }
.mh-input:focus {
  background: #fff; border-color: var(--mh-blue);
  box-shadow: 0 0 0 4px rgba(29,78,216,.15);
}
.mh-input-wrap:focus-within .mh-input-icon { color: var(--mh-blue); }
.mh-input-pw { padding-right: 44px; }

.mh-eye {
  position: absolute; right: 5px; top: 50%; transform: translateY(-50%);
  display: grid; place-items: center; width: 34px; height: 34px;
  border: 0; border-radius: 9px; background: transparent;
  color: #7a88a8; cursor: pointer;
}
.mh-eye:hover { background: #edf2fc; color: var(--mh-text); }
.mh-eye:focus-visible { outline: 2px solid var(--mh-blue); outline-offset: 1px; }

.mh-alert {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 13px; border-radius: 11px;
  background: var(--mh-danger-bg); color: var(--mh-danger);
  border: 1px solid #f6c9c5; font-size: .88rem; line-height: 1.4;
}
.mh-alert svg { flex: none; margin-top: 2px; }

.mh-submit {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  height: 48px; margin-top: 2px; border: 0; border-radius: 12px;
  font: inherit; font-weight: 600; font-size: .98rem;
  color: #fff; cursor: pointer;
  background: linear-gradient(180deg, var(--mh-blue-light), var(--mh-blue));
  box-shadow: 0 10px 20px -10px rgba(29,78,216,.75), inset 0 1px 0 rgba(255,255,255,.25);
  transition: transform .12s, filter .15s;
}
.mh-submit svg { transition: transform .15s; }
.mh-submit:hover:not(:disabled) { filter: brightness(1.08); }
.mh-submit:hover:not(:disabled) svg:last-child { transform: translateX(3px); }
.mh-submit:active:not(:disabled) { transform: translateY(1px); }
.mh-submit:focus-visible { outline: 3px solid var(--mh-sky); outline-offset: 2px; }
.mh-submit:disabled { opacity: .7; cursor: not-allowed; }

.mh-switch { margin: 2px 0 0; text-align: center; font-size: .9rem; color: var(--mh-muted); }
.mh-switch a { color: var(--mh-blue); font-weight: 600; text-decoration: none; border-bottom: 2px solid var(--mh-sky); }
.mh-switch a:hover { color: var(--mh-navy); }

.mh-spin { animation: mh-spin .8s linear infinite; }
@keyframes mh-spin { to { transform: rotate(360deg); } }

/* ---------- Responsive ---------- */
@media (max-width: 900px) {
  .mh-shell { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  /* hero becomes a slim brand bar so the form fits on one screen */
  .mh-hero { padding: 14px 20px; flex-direction: row; align-items: center; }
  .mh-hero-body, .mh-foot { display: none; }
  .mh-brand-logo { width: 34px; height: 34px; border-radius: 10px; }
  .mh-brand-name { font-size: 19px; }
  .mh-panel { padding: 16px; align-items: start; }
  .mh-card { padding: 22px 18px 18px; gap: 12px; }
}
@media (max-width: 480px) {
  .mh-grid-2 { grid-template-columns: 1fr; gap: 12px; }
}
@media (max-height: 720px) {
  .mh-card { gap: 11px; padding-top: 22px; padding-bottom: 18px; }
  .mh-input { height: 40px; }
  .mh-submit { height: 44px; }
  .mh-card-head h2 { font-size: 1.45rem; }
}
@media (prefers-reduced-motion: reduce) {
  .mh-spin { animation-duration: 1.6s; }
  .mh-submit, .mh-submit svg { transition: none; }
}
`;

// Defined outside Auth so inputs don't lose focus on every keystroke
function Field({ label, icon: Icon, children }) {
  return (
    <label className="mh-field">
      <span className="mh-label">{label}</span>
      <span className="mh-input-wrap">
        <Icon size={17} className="mh-input-icon" />
        {children}
      </span>
    </label>
  );
}

export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', shop_name: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

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
    <div className="mh-shell">
      <style>{CSS}</style>

      {/* Left: brand */}
      <aside className="mh-hero">
        <div className="mh-brand">
          <span className="mh-brand-logo"><Store size={20} /></span>
          <span className="mh-brand-name">MeroHisab</span>
        </div>

        <div className="mh-hero-body">
          <h1>Run your shop’s books without the paperwork.</h1>
          <p className="mh-lead">
            Simple bookkeeping for small businesses — sales, expenses, credit and reports.
          </p>
          <ul className="mh-features">
            {FEATURES.map(({ Icon, text }) => (
              <li key={text}>
                <span className="mh-feature-icon"><Icon size={16} /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="mh-foot">© MeroHisab</div>
      </aside>

      {/* Right: form */}
      <main className="mh-panel">
        <form className="mh-card" onSubmit={submit}>
          <header className="mh-card-head">
            <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
            <p>
              {isRegister
                ? 'Start tracking your business in minutes.'
                : 'Sign in to continue to MeroHisab.'}
            </p>
          </header>

          {error && (
            <div className="mh-alert" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {isRegister && (
            <div className="mh-grid-2">
              <Field label="Your name" icon={User}>
                <input
                  className="mh-input" required value={form.name}
                  onChange={set('name')} placeholder="Sarala Shrestha" autoComplete="name"
                />
              </Field>
              <Field label="Shop name" icon={Store}>
                <input
                  className="mh-input" value={form.shop_name}
                  onChange={set('shop_name')} placeholder="Sarala Dairy"
                />
              </Field>
            </div>
          )}

          {isRegister ? (
            <div className="mh-grid-2">
              <Field label="Email" icon={Mail}>
                <input
                  className="mh-input" type="email" required autoComplete="email"
                  value={form.email} onChange={set('email')} placeholder="you@shop.com"
                />
              </Field>
              <Field label="Phone (optional)" icon={Phone}>
                <input
                  className="mh-input" inputMode="tel" value={form.phone}
                  onChange={set('phone')} placeholder="98XXXXXXXX" autoComplete="tel"
                />
              </Field>
            </div>
          ) : (
            <Field label="Email" icon={Mail}>
              <input
                className="mh-input" type="email" required autoComplete="email"
                value={form.email} onChange={set('email')} placeholder="you@shop.com"
              />
            </Field>
          )}

          <Field label="Password" icon={Lock}>
            <input
              className="mh-input mh-input-pw"
              type={showPw ? 'text' : 'password'}
              required minLength={6}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={form.password} onChange={set('password')}
              placeholder="At least 6 characters"
            />
            <button
              type="button" className="mh-eye"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </Field>

          <button className="mh-submit" disabled={busy}>
            {busy ? <Loader size={17} className="mh-spin" /> : null}
            <span>{isRegister ? 'Create account' : 'Sign in'}</span>
            {!busy && <ArrowRight size={17} />}
          </button>

          <p className="mh-switch">
            {isRegister ? (
              <>Already have an account? <Link to="/login">Sign in</Link></>
            ) : (
              <>New to MeroHisab? <Link to="/register">Create an account</Link></>
            )}
          </p>
        </form>
      </main>
    </div>
  );
}