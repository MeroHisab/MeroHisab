/* =========================================================
   MeroHisab – main.js
   Wires the page together: greeting, lists, chart, sidebar, voice.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  setGreeting();
  renderCredit();
  renderTransactions();
  initChart();
  initSidebar();
  initVoice();
});

const npr = n => 'NPR ' + n.toLocaleString('en-IN');

/* ---------- Greeting + date ---------- */
function setGreeting() {
  const now  = new Date();
  const hour = now.getHours();
  const text = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  document.getElementById('greetingText').textContent = text;
  document.getElementById('todayDate').textContent =
    now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/* ---------- Credit overview list ---------- */
function renderCredit() {
  const list = document.getElementById('creditList');
  list.innerHTML = MH_DATA.credit.map(c => `
    <li>
      <span class="avatar">${c.name[0]}</span>
      <div class="who">
        <strong>${c.name}</strong>
        <span>${c.status}</span>
      </div>
      <span class="amt">${npr(c.amount)}</span>
    </li>
  `).join('');
}

/* ---------- Recent transactions table ---------- */
function renderTransactions() {
  const body = document.getElementById('txBody');

  const typeLabel = { sale: 'Sale', expense: 'Expense', credit: 'Credit', payment: 'Payment' };

  body.innerHTML = MH_DATA.transactions.map(t => {
    // + for money in, − for money out, no sign for credit given
    let amount;
    if (t.type === 'sale' || t.type === 'payment') amount = `<span class="pos">+ ${npr(t.amount)}</span>`;
    else if (t.type === 'expense')                 amount = `<span class="neg">− ${npr(t.amount)}</span>`;
    else                                           amount = `<span class="neu">${npr(t.amount)}</span>`;

    return `
      <tr>
        <td class="muted">${t.date}</td>
        <td class="desc">${t.desc}</td>
        <td><span class="pill pill-${t.type}">${typeLabel[t.type]}</span></td>
        <td class="muted">${t.customer}</td>
        <td>${amount}</td>
        <td class="muted">${t.status}</td>
      </tr>`;
  }).join('');
}

/* ---------- Chart + range toggle ---------- */
let currentRange = '7d';

function initChart() {
  const chartEl = document.getElementById('chart');
  const toggle  = document.getElementById('rangeToggle');

  const draw = () => MHChart.render(chartEl, MH_DATA.chart[currentRange]);
  draw();

  toggle.addEventListener('click', e => {
    const btn = e.target.closest('button[data-range]');
    if (!btn) return;
    currentRange = btn.dataset.range;
    toggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
    draw();
  });

  // redraw when the window size changes (debounced)
  let timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(draw, 120);
  });
}

/* ---------- Mobile sidebar ---------- */
function initSidebar() {
  const open  = () => document.body.classList.add('sidebar-open');
  const close = () => document.body.classList.remove('sidebar-open');

  document.getElementById('menuToggle').addEventListener('click', open);
  document.getElementById('sidebarBackdrop').addEventListener('click', close);
  document.querySelectorAll('.nav-item').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ---------- Voice: "Ask MeroHisab" ----------
   Uses the browser's built-in Web Speech API (works best in Chrome/Edge).
   Later you can send the transcript to your backend / AI instead of the
   tiny answer() function below. */
function initVoice() {
  const btn   = document.getElementById('micBtn');
  const label = document.getElementById('voiceLabel');
  const hint  = document.getElementById('voiceHint');

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    btn.addEventListener('click', () => {
      label.textContent = 'Voice not supported';
      hint.textContent  = 'Please open this page in Chrome or Edge.';
    });
    return;
  }

  const rec = new SR();
  rec.lang = 'en-US';          // try 'ne-NP' for Nepali
  rec.interimResults = false;

  let listening = false;
  const setListening = on => {
    listening = on;
    btn.classList.toggle('listening', on);
    btn.setAttribute('aria-pressed', String(on));
    label.textContent = on ? 'Listening…' : 'Tap to speak';
  };

  btn.addEventListener('click', () => {
    if (listening) { rec.stop(); return; }
    try { rec.start(); setListening(true); } catch (_) { /* already started */ }
  });

  rec.onresult = e => {
    const said = e.results[0][0].transcript;
    hint.textContent = `“${said}” — ${answer(said)}`;
  };
  rec.onerror = e => {
    hint.textContent = e.error === 'not-allowed'
      ? 'Microphone access is blocked. Allow it in your browser settings.'
      : 'Could not hear that. Tap the mic and try again.';
  };
  rec.onend = () => setListening(false);
}

// Very small demo "brain" – replace with your real logic / API
function answer(text) {
  const q = text.toLowerCase();
  if (q.includes('sale'))    return 'Today’s sales are NPR 12,450.';
  if (q.includes('expense')) return 'Today’s expenses are NPR 4,250.';
  if (q.includes('profit'))  return 'Estimated profit today is NPR 8,200.';
  if (q.includes('credit') || q.includes('udhar') || q.includes('outstanding'))
    return 'Outstanding credit is NPR 18,500 across 8 customers.';
  return 'I can answer about sales, expenses, profit and credit for now.';
}