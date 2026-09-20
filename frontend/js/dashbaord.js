/* =========================================================
   dashboard.js – Dashboard page only.
   All numbers come from Store, so when you add a sale or expense
   on the other pages, the dashboard updates too.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  setGreeting();
  renderStats();
  renderCredit();
  renderRecent();
  initChart();
  initVoice();
});

// If the browser restores this page from cache (Back button), reload fresh numbers
window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

const { npr, esc, fmtDate } = UI;
const $ = id => document.getElementById(id);

/* ---------- Greeting + date ---------- */
function setGreeting() {
  const now = new Date();
  const hour = now.getHours();
  $('greetingText').textContent = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  $('todayDate').textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/* ---------- 4 stat cards ---------- */
function setMeta(id, icon, text, tone = '') {
  const el = $(id);
  el.className = 'stat-meta' + (tone ? ' ' + tone : '');
  el.innerHTML = `<i class="bi ${icon}"></i>${text}`;
}

function renderStats() {
  const today = Store.day(0);
  const yest  = Store.day(1);

  // Sales
  $('statSales').textContent = npr(today.sales);
  if (yest.sales > 0) {
    const pct = ((today.sales - yest.sales) / yest.sales) * 100;
    setMeta('statSalesMeta', pct >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right',
      `${pct >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(1)}% from yesterday`, pct >= 0 ? 'up' : 'down');
  } else {
    setMeta('statSalesMeta', 'bi-clock', 'No sales yesterday');
  }

  // Expenses
  $('statExpenses').textContent = npr(today.expenses);
  const avg = Store.avgDailyExpenses();
  if (avg > 0 && today.expenses > avg * 1.3) setMeta('statExpensesMeta', 'bi-exclamation-circle', 'Above the daily average', 'warn');
  else setMeta('statExpensesMeta', 'bi-clock', 'Within today’s average');

  // Credit
  const balances = Store.creditBalances();
  const totalCredit = balances.reduce((s, c) => s + c.balance, 0);
  $('statCredit').textContent = npr(totalCredit);
  setMeta('statCreditMeta', 'bi-clock', `Across ${balances.length} customer${balances.length === 1 ? '' : 's'}`);

  // Profit
  $('statProfit').textContent = npr(today.profit);
  const diff = today.profit - yest.profit;
  if (diff === 0) setMeta('statProfitMeta', 'bi-dash', 'Same as yesterday');
  else setMeta('statProfitMeta', diff > 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right',
    `${diff > 0 ? '+' : '−'} ${npr(Math.abs(diff))} vs yesterday`, diff > 0 ? 'up' : 'down');
}

/* ---------- Credit overview ---------- */
function renderCredit() {
  const balances = Store.creditBalances();
  const total = balances.reduce((s, c) => s + c.balance, 0);

  $('creditTotal').textContent = npr(total);
  $('creditSub').textContent = balances.length
    ? `${balances.length} customer${balances.length === 1 ? ' has' : 's have'} outstanding balances`
    : 'No one owes you anything right now';

  $('creditList').innerHTML = balances.slice(0, 4).map(c => `
    <li>
      <span class="avatar">${esc(c.name[0].toUpperCase())}</span>
      <div class="who"><strong>${esc(c.name)}</strong><span>${c.status}</span></div>
      <span class="amt">${npr(c.balance)}</span>
    </li>`).join('');
}

/* ---------- Recent transactions (latest 5) ---------- */
function renderRecent() {
  const label = { sale: 'Sale', expense: 'Expense', credit: 'Credit', payment: 'Payment' };
  const latest = Store.all().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  $('txBody').innerHTML = latest.map(t => {
    let amount;
    if (t.type === 'sale' || t.type === 'payment') amount = `<span class="pos">+ ${npr(t.amount)}</span>`;
    else if (t.type === 'expense')                 amount = `<span class="neg">− ${npr(t.amount)}</span>`;
    else                                           amount = `<span class="neu">${npr(t.amount)}</span>`;
    return `
      <tr>
        <td class="muted">${fmtDate(t.date)}</td>
        <td class="desc">${esc(t.desc)}</td>
        <td><span class="pill pill-${t.type}">${label[t.type]}</span></td>
        <td class="muted">${esc(t.customer || '—')}</td>
        <td>${amount}</td>
        <td class="muted">${t.status}</td>
      </tr>`;
  }).join('');
}

/* ---------- Chart + range toggle ---------- */
let currentRange = '7d';

function initChart() {
  const chartEl = $('chart');
  const toggle = $('rangeToggle');

  const draw = () => {
    MHChart.render(chartEl, Store.series(currentRange));
    $('chartSub').textContent = currentRange === '3m' ? 'Weekly business performance' : 'Daily business performance';
  };
  draw();

  toggle.addEventListener('click', e => {
    const btn = e.target.closest('button[data-range]');
    if (!btn) return;
    currentRange = btn.dataset.range;
    toggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
    draw();
  });

  let timer;
  window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(draw, 120); });
}

/* ---------- Voice: "Ask MeroHisab" ----------
   Uses the browser's built-in Web Speech API (best in Chrome / Edge). */
function initVoice() {
  const btn = $('micBtn');
  const label = $('voiceLabel');
  const hint = $('voiceHint');

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    btn.addEventListener('click', () => {
      label.textContent = 'Voice not supported';
      hint.textContent = 'Please open this page in Chrome or Edge.';
    });
    return;
  }

  const rec = new SR();
  rec.lang = 'en-US';            // try 'ne-NP' for Nepali
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

// Small demo "brain" using live numbers – replace with your own logic / AI later
function answer(text) {
  const q = text.toLowerCase();
  const today = Store.day(0);
  const balances = Store.creditBalances();
  const owed = balances.reduce((s, c) => s + c.balance, 0);

  if (q.includes('sale'))    return `Today’s sales are ${npr(today.sales)}.`;
  if (q.includes('expense')) return `Today’s expenses are ${npr(today.expenses)}.`;
  if (q.includes('profit'))  return `Estimated profit today is ${npr(today.profit)}.`;
  if (q.includes('credit') || q.includes('udhar') || q.includes('outstanding'))
    return `Outstanding credit is ${npr(owed)} across ${balances.length} customers.`;
  return 'I can answer about sales, expenses, profit and credit for now.';
}