/* =========================================================
   layout.js – shared by EVERY page.
   1. Draws the sidebar + top bar (so you edit the menu in ONE place)
   2. UI helpers: money format, safe text, dates, toast messages

   Each page just needs:
     <body data-page="sales">
     <div id="sidebarMount"></div>
     ... <div id="topbarMount"></div>
   ========================================================= */

/* ---------- UI helpers ---------- */
const UI = {
  npr: n => 'NPR ' + Number(n).toLocaleString('en-IN'),

  // Always escape text typed by the user before putting it in HTML
  esc: s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),

  // "Today, 6:42 PM" / "Yesterday, 7:20 PM" / "Sep 14, 2:10 PM"
  fmtDate(str) {
    const d = new Date(str);
    const now = new Date();
    const today = Store.startOfDay(now);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const dayStart = +Store.startOfDay(d);
    if (dayStart === +today) return 'Today, ' + time;
    if (dayStart === +yesterday) return 'Yesterday, ' + time;
    const opts = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString('en-US', opts) + ', ' + time;
  },

  // Small message at the bottom-right: UI.toast('Saved')
  toast(message, kind = 'success') {
    let stack = document.getElementById('toastStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'toastStack';
      stack.className = 'toast-stack';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    const icon = kind === 'error' ? 'bi-exclamation-circle' : kind === 'info' ? 'bi-info-circle' : 'bi-check-circle';
    const el = document.createElement('div');
    el.className = `mh-toast ${kind}`;
    el.innerHTML = `<i class="bi ${icon}"></i><span>${UI.esc(message)}</span>`;
    stack.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 250); }, 2800);
  }
};

/* ---------- Sidebar + top bar ---------- */
const Layout = (() => {
  // soon: true  → page not built yet (shows a "coming soon" message)
  const NAV = [
    { key: 'dashboard',    label: 'Dashboard',    icon: 'bi-grid',             href: 'index.html' },
    { key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right', href: 'transactions.html' },
    { key: 'sales',        label: 'Sales',        icon: 'bi-graph-up-arrow',   href: 'sales.html' },
    { key: 'expenses',     label: 'Expenses',     icon: 'bi-receipt',          href: 'expenses.html' },
    { key: 'customers',    label: 'Customers',    icon: 'bi-people',           soon: true },
    { key: 'credit',       label: 'Credit',       icon: 'bi-cash-coin',        soon: true },
    { key: 'products',     label: 'Products',     icon: 'bi-box-seam',         soon: true },
    { key: 'reports',      label: 'Reports',      icon: 'bi-bar-chart-line',   soon: true },
    { key: 'ai',           label: 'AI Assistant', icon: 'bi-robot',            soon: true },
    { key: 'settings',     label: 'Settings',     icon: 'bi-gear',             soon: true }
  ];

  function mount() {
    const page = document.body.dataset.page;

    const links = NAV.map(n => {
      const active = n.key === page;
      return `<a href="${n.href || '#'}" class="nav-item${active ? ' active' : ''}"
                 ${active ? 'aria-current="page"' : ''} ${n.soon ? `data-soon="${n.label}"` : ''}>
                <i class="bi ${n.icon}"></i>${n.label}
              </a>`;
    }).join('');

    document.getElementById('sidebarMount').outerHTML = `
      <aside class="sidebar" id="sidebar" aria-label="Main navigation">
        <a href="index.html" class="brand">
          <span class="brand-logo"><i class="bi bi-shop"></i></span>
          <span>
            <span class="brand-name">MeroHisab</span>
            <span class="brand-tag">Smart business assistant</span>
          </span>
        </a>
        <nav class="nav-list">${links}</nav>
        <div class="sidebar-user">
          <span class="avatar avatar-lg">SS</span>
          <div class="sidebar-user-info">
            <strong>Smriti Shrestha</strong>
            <span>Smriti Kirana Store</span>
          </div>
          <button class="icon-btn" type="button" id="logoutBtn" aria-label="Log out"><i class="bi bi-box-arrow-right"></i></button>
        </div>
      </aside>`;

    document.getElementById('topbarMount').outerHTML = `
      <header class="topbar">
        <div class="d-flex align-items-center gap-3">
          <button class="icon-btn d-lg-none" id="menuToggle" type="button" aria-label="Open menu">
            <i class="bi bi-list fs-4"></i>
          </button>
          <div class="crumbs">
            <span>Smriti Kirana Store</span>
            <span class="crumb-sep">/</span>
            <span class="crumb-current">Kathmandu</span>
          </div>
        </div>
        <div class="d-flex align-items-center gap-3">
          <button class="icon-btn bell" type="button" id="bellBtn" aria-label="Notifications">
            <i class="bi bi-bell"></i><span class="bell-dot"></span>
          </button>
          <span class="avatar">SS</span>
        </div>
      </header>`;

    document.body.insertAdjacentHTML('beforeend', '<div class="sidebar-backdrop" id="sidebarBackdrop"></div>');

    /* ----- behaviour ----- */
    const open  = () => document.body.classList.add('sidebar-open');
    const close = () => document.body.classList.remove('sidebar-open');

    document.getElementById('menuToggle').addEventListener('click', open);
    document.getElementById('sidebarBackdrop').addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    document.querySelectorAll('.nav-item').forEach(a => a.addEventListener('click', close));

    // Any link with data-soon="Name" shows a "coming soon" message instead of navigating
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-soon]');
      if (!a) return;
      e.preventDefault();
      UI.toast(`${a.dataset.soon} is coming soon`, 'info');
    });

    document.getElementById('logoutBtn').addEventListener('click', () =>
      UI.toast('Log out will work once the backend is connected', 'info'));
    document.getElementById('bellBtn').addEventListener('click', () =>
      UI.toast('No new notifications', 'info'));
  }

  return { mount };
})();

document.addEventListener('DOMContentLoaded', Layout.mount);