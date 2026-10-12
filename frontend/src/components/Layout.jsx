import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Mic, Users, Menu, X, Store, Box, LineChart,
  User, LogOut, ShoppingCart, ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeMenu from './ThemeMenu';

const NAV_ITEMS = [
  { to: '/',             label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/record',       label: 'Quick Record', Icon: Mic, highlight: true },
  { to: '/transactions', label: 'Transactions', Icon: ShoppingCart },
  { to: '/customers',    label: 'Customers',    Icon: Users },
  { to: '/products',     label: 'Products',     Icon: Box },
  { to: '/reports',      label: 'Reports',      Icon: LineChart },
];

const MOBILE_NAV = [
  { to: '/', label: 'Home', Icon: LayoutDashboard },
  { to: '/transactions', label: 'Activity', Icon: ShoppingCart },
  { to: '/record', label: 'Record', Icon: Mic, highlight: true },
  { to: '/customers', label: 'Customers', Icon: Users },
  { to: '/reports', label: 'Reports', Icon: LineChart },
];

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const current = NAV_ITEMS.find((n) => (n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)));
  const title = current?.label || (location.pathname.startsWith('/profile') ? 'My Profile' : '');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <div className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-logo"><Store size={20} /></div>
          <div>
            <div className="brand-name">MeroHisab</div>
            <div className="brand-sub">Smart business assistant</div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', marginTop: 16 }}>
          <ul className="nav-list">
            {NAV_ITEMS.map(({ to, label, Icon, highlight }) => (
              <li key={to}>
                <NavLink to={to} end={to === '/'} className={({ isActive }) => `nav-item ${highlight ? 'nav-highlight' : ''} ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon"><Icon size={18} strokeWidth={2} /></span>
                  {label}
                  {highlight && <span className="nav-live">NEW</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div ref={profileRef} className="profile-wrap">
          {profileOpen && (
            <div className="profile-menu">
              <div className="profile-menu-head">
                <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
                <div className="text-muted text-xs" style={{ marginTop: 2 }}>{user?.email}</div>
              </div>
              <div style={{ padding: 4 }}>
                <button className="menu-item" onClick={() => navigate('/profile')}><User size={15} /> My profile</button>
                <button className="menu-item danger" onClick={handleLogout}><LogOut size={15} /> Log out</button>
              </div>
            </div>
          )}
          <button className={`profile-trigger ${profileOpen ? 'open' : ''}`} onClick={() => setProfileOpen((o) => !o)}>
            <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>{initials(user?.name)}</div>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div className="ellipsis" style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
              <div className="ellipsis text-muted" style={{ fontSize: 11 }}>{user?.shop_name}</div>
            </div>
            <ChevronUp size={14} style={{ transform: profileOpen ? 'none' : 'rotate(180deg)', transition: 'transform .2s' }} />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn icon-btn" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle menu">
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="crumbs">
              <span>{user?.shop_name || 'My Shop'}</span>
              {title && <><span style={{ opacity: 0.4 }}>/</span><strong>{title}</strong></>}
            </div>
          </div>
          <div className="topbar-right">
            <ThemeMenu />
            <NavLink to="/record" className="btn btn-primary btn-sm topbar-cta"><Mic size={14} /> <span>New entry</span></NavLink>
          </div>
        </header>

        <main>{children}</main>
      </div>

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {MOBILE_NAV.map(({ to, label, Icon, highlight }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `mobile-nav-item ${highlight ? 'fab' : ''} ${isActive ? 'active' : ''}`}>
              <span className="mn-icon"><Icon size={highlight ? 24 : 20} /></span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
