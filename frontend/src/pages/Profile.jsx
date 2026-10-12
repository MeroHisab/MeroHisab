import React, { useState, useEffect } from 'react';
import { User, Store, Phone, Mail, Globe, Mic, Bell, Shield, Camera, Check, Loader } from 'lucide-react';
import api, { errorMessage } from '../api';

const LANGUAGES = ['English', 'नेपाली (Nepali)'];
const VOICES = ['Default (Nepali)', 'Female — Priya', 'Male — Rohan'];

export default function Profile() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    shop_name: '',
    location: '',
    language: 'English',
    voice: 'Default (Nepali)',
    notifications: true,
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        const u = res.data;
        setForm({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          shop_name: u.shop_name || '',
          location: u.location || '',
          language: u.language || 'English',
          voice: u.voice || 'Default (Nepali)',
          notifications: u.notifications !== undefined ? u.notifications : true,
        });
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/auth/me', {
        name: form.name,
        phone: form.phone,
        shop_name: form.shop_name,
        location: form.location,
        language: form.language,
        voice: form.voice,
        notifications: form.notifications,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save profile', err);
      alert(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const initials = form.name
    ? form.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-sub">Manage your personal info, shop details and preferences.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} style={{ gap: 8 }} disabled={saving}>
          {saving ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <><Check size={15} /> Saved!</> : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>

        {/* ── Left: Avatar card */}
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #1C379B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 700, color: '#fff',
              margin: '0 auto', letterSpacing: '-1px'
            }}>
              {initials}
            </div>
            <button style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--accent)', border: '2px solid var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}>
              <Camera size={13} />
            </button>
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 4 }}>{form.name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{form.email}</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--accent-soft)', color: 'var(--accent)',
            fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, marginTop: 8
          }}>
            <Store size={12} /> {form.shop_name || 'My Shop'}
          </div>
          {form.location && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>📍 {form.location}</div>
          )}
        </div>

        {/* ── Right: Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Personal Info */}
          <div className="card">
            <div className="card-head">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
                <User size={16} style={{ color: 'var(--accent)' }} /> Personal Information
              </div>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <input className="form-control" type="text" value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email Address</label>
                <input className="form-control" type="email" value={form.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phone Number</label>
                <input className="form-control" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Shop Details */}
          <div className="card">
            <div className="card-head">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
                <Store size={16} style={{ color: 'var(--accent)' }} /> Shop Details
              </div>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Shop Name</label>
                <input className="form-control" type="text" value={form.shop_name} onChange={e => update('shop_name', e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Location / City</label>
                <input className="form-control" type="text" value={form.location} onChange={e => update('location', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card">
            <div className="card-head">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
                <Globe size={16} style={{ color: 'var(--accent)' }} /> App Preferences
              </div>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Interface Language</label>
                <select className="form-select" value={form.language} onChange={e => update('language', e.target.value)}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Voice Assistant Voice</label>
                <select className="form-select" value={form.voice} onChange={e => update('voice', e.target.value)}>
                  {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Push Notifications</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Receive alerts for credit due and low stock</div>
                </div>
                <button
                  type="button"
                  onClick={() => update('notifications', !form.notifications)}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: form.notifications ? 'var(--accent)' : 'var(--surface-3)',
                    border: 'none', cursor: 'pointer', position: 'relative',
                    transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 3, left: form.notifications ? 22 : 3,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                  }} />
                </button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="card">
            <div className="card-head">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
                <Shield size={16} style={{ color: 'var(--accent)' }} /> Security
              </div>
            </div>
            <div className="card-body">
              <button type="button" className="btn btn-secondary">Change Password</button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
