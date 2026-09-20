/* =========================================================
   store.js – the ONE place where data lives.
   Every page (Dashboard, Transactions, Sales, Expenses) reads
   and writes through this file, so they always agree.

   Data is saved in the browser (localStorage). Later, when you
   have a backend, only this file needs to change.

   A transaction looks like:
   {
     id, date: '2026-09-20T18:42',      // local date & time
     type: 'sale' | 'credit' | 'payment' | 'expense',
     desc, customer, amount, status: 'Completed' | 'Pending',
     category                            // only used for expenses
   }
   sale    = cash sale            credit  = sale on credit (udhar)
   payment = customer paid back   expense = money you spent
   ========================================================= */

const Store = (() => {
  const KEY = 'merohisab.v1.transactions';
  const CATEGORIES = ['Stock purchase', 'Utilities', 'Transport', 'Supplies', 'Salary', 'Rent', 'Other'];

  /* ---------- small date helpers ---------- */
  const pad = n => String(n).padStart(2, '0');
  const toLocal = d =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const daysAgo = (n, h = 12, m = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(h, m, 0, 0);
    return toLocal(d);
  };

  const isSale = t => t.type === 'sale' || t.type === 'credit';   // counts as sales revenue

  /* ---------- demo data (created the first time you open the app) ---------- */
  function seedData() {
    const list = [];
    let n = 1;
    const add = (date, type, desc, customer, amount, status = 'Completed', category = '') =>
      list.push({ id: 's' + n++, date, type, desc, customer, amount, status, category });

    // Today: sales 12,450 · expenses 4,250
    add(daysAgo(0, 18, 42), 'sale',    'Rice × 5',              'Walk-in', 2500);
    add(daysAgo(0, 17, 15), 'credit',  'Sugar × 3, Tea × 2',    'Ram',     1800, 'Pending');
    add(daysAgo(0, 16,  5), 'sale',    'Milk × 6, Bread × 4',   'Walk-in',  950);
    add(daysAgo(0, 14, 20), 'sale',    'Noodles × 2 cartons',   'Walk-in', 3100);
    add(daysAgo(0, 12, 10), 'sale',    'Cooking oil × 4',       'Walk-in', 2600);
    add(daysAgo(0, 10, 30), 'sale',    'Biscuits & snacks',     'Walk-in', 1500);
    add(daysAgo(0, 13,  5), 'payment', 'Payment received',      'Sita',    1000);
    add(daysAgo(0, 15, 30), 'expense', 'Shop electricity bill', '—', 1250, 'Completed', 'Utilities');
    add(daysAgo(0, 11,  0), 'expense', 'Vegetables from market','—', 2000, 'Completed', 'Stock purchase');
    add(daysAgo(0,  9, 15), 'expense', 'Delivery transport',    '—',  500, 'Completed', 'Transport');
    add(daysAgo(0,  8, 30), 'expense', 'Packaging bags',        '—',  500, 'Completed', 'Supplies');

    // Yesterday: sales 11,080 · expenses 6,830
    add(daysAgo(1, 19, 20), 'sale', 'Rice × 8',                 'Walk-in', 2900);
    add(daysAgo(1, 16, 45), 'sale', 'Flour (atta) × 5 sacks',   'Walk-in', 3100);
    add(daysAgo(1, 13, 10), 'sale', 'Soft drinks × 24',         'Walk-in', 2680);
    add(daysAgo(1, 10,  5), 'sale', 'Lentils & spices',         'Walk-in', 2400);
    add(daysAgo(1, 14,  0), 'expense', 'Wholesale restock',     '—', 4800, 'Completed', 'Stock purchase');
    add(daysAgo(1, 11, 30), 'expense', 'Helper wage',           '—', 1500, 'Completed', 'Salary');
    add(daysAgo(1,  9,  0), 'expense', 'Phone recharge',        '—',  530, 'Completed', 'Utilities');

    // Credit (udhar) and repayments – balances add up to NPR 18,500 across 8 customers
    add(daysAgo(5, 15,  0), 'credit',  'Monthly grocery',  'Ram',    3200, 'Pending');
    add(daysAgo(12, 14, 0), 'credit',  'Monthly grocery',  'Sita',   4500, 'Pending');
    add(daysAgo(6, 11, 30), 'payment', 'Payment received', 'Sita',   1000);
    add(daysAgo(4, 17,  0), 'credit',  'Rice & lentils',   'Hari',   1000, 'Pending');
    add(daysAgo(9, 16,  0), 'credit',  'Weekly grocery',   'Maya',   1500, 'Pending');
    add(daysAgo(3, 12,  0), 'payment', 'Payment received', 'Maya',    700);
    add(daysAgo(15, 13, 0), 'credit',  'Monthly grocery',  'Gita',   3200, 'Pending');
    add(daysAgo(20, 18, 0), 'credit',  'Monthly grocery',  'Bikash', 2700, 'Pending');
    add(daysAgo(18, 15, 0), 'credit',  'Monthly grocery',  'Anita',  3000, 'Pending');
    add(daysAgo(7, 10, 30), 'payment', 'Payment received', 'Anita',  1000);
    add(daysAgo(8, 17, 30), 'credit',  'Weekly grocery',   'Suresh', 1300, 'Pending');

    // Older days (2 … 90 days ago): random but repeatable
    let seed = 42;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const pick = arr => arr[Math.floor(rand() * arr.length)];
    const products = ['Rice', 'Sugar', 'Tea', 'Cooking oil', 'Noodles', 'Biscuits', 'Milk', 'Bread',
                      'Soap', 'Salt', 'Lentils', 'Flour', 'Eggs', 'Soft drinks'];
    const costs = [
      ['Vegetables from market', 'Stock purchase',  800, 2500],
      ['Wholesale restock',      'Stock purchase', 2000, 3500],
      ['Delivery transport',     'Transport',       300,  700],
      ['Packaging bags',         'Supplies',        300,  800],
      ['Shop electricity bill',  'Utilities',       900, 1600],
      ['Phone & internet',       'Utilities',       400,  900],
      ['Helper wage',            'Salary',         1000, 1800],
      ['Cleaning supplies',      'Supplies',        200,  500]
    ];

    for (let day = 2; day <= 90; day++) {
      const dow = new Date(Date.now() - day * 86400000).getDay();
      const weekend = (dow === 5 || dow === 6) ? 1.2 : 1;
      const target = Math.round(((7500 + rand() * 4500) * weekend) / 100) * 100;

      const parts = 3 + Math.floor(rand() * 3);                 // 3–5 sales a day
      const weights = Array.from({ length: parts }, () => 0.5 + rand());
      const wsum = weights.reduce((a, b) => a + b, 0);
      let left = target;
      weights.forEach((w, i) => {
        const amt = i === parts - 1 ? left : Math.round(((w / wsum) * target) / 10) * 10;
        left -= amt;
        const desc = `${pick(products)} × ${1 + Math.floor(rand() * 6)}`;
        add(daysAgo(day, 8 + Math.floor(rand() * 12), Math.floor(rand() * 60)), 'sale', desc, 'Walk-in', amt);
      });

      const spends = 2 + Math.floor(rand() * 2) + (rand() < 0.35 ? 1 : 0);   // 2–4 expenses a day
      for (let k = 0; k < spends; k++) {
        const [desc, cat, lo, hi] = pick(costs);
        const amt = Math.round((lo + rand() * (hi - lo)) / 50) * 50;
        add(daysAgo(day, 8 + Math.floor(rand() * 12), Math.floor(rand() * 60)), 'expense', desc, '—', amt, 'Completed', cat);
      }
    }
    return list;
  }

  /* ---------- load / save ---------- */
  let list = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) { /* storage blocked – fall through and use demo data in memory */ }
    const seeded = seedData();
    save(seeded);
    return seeded;
  }
  function save(data = list) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) { /* ignore */ }
  }

  /* ---------- CRUD ---------- */
  const all = () => list.slice();
  const get = id => list.find(t => t.id === id);

  function add(record) {
    const t = { ...record, id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
    list.push(t);
    save();
    return t;
  }
  function update(id, patch) {
    const i = list.findIndex(t => t.id === id);
    if (i === -1) return null;
    list[i] = { ...list[i], ...patch, id };
    save();
    return list[i];
  }
  function remove(id) {
    list = list.filter(t => t.id !== id);
    save();
  }
  function reset() {
    list = seedData();
    save();
  }

  /* ---------- calculations used by several pages ---------- */

  // Sales / expenses / profit for one day (offset 0 = today, 1 = yesterday …)
  function day(offset = 0) {
    const target = startOfDay();
    target.setDate(target.getDate() - offset);
    let sales = 0, expenses = 0;
    list.forEach(t => {
      if (+startOfDay(new Date(t.date)) !== +target) return;
      if (isSale(t)) sales += t.amount;
      else if (t.type === 'expense') expenses += t.amount;
    });
    return { sales, expenses, profit: sales - expenses };
  }

  // Average daily expenses over the 30 days before today
  function avgDailyExpenses() {
    const from = startOfDay(); from.setDate(from.getDate() - 30);
    const to = startOfDay();
    const total = list
      .filter(t => t.type === 'expense' && new Date(t.date) >= from && new Date(t.date) < to)
      .reduce((s, t) => s + t.amount, 0);
    return total / 30;
  }

  // Who owes how much: credit given minus payments received
  function creditBalances() {
    const map = new Map();
    list.forEach(t => {
      if (t.type !== 'credit' && t.type !== 'payment') return;
      const name = (t.customer || '').trim();
      if (!name || /^walk-?in$/i.test(name) || name === '—') return;
      const key = name.toLowerCase();
      const e = map.get(key) || { name, credit: 0, paid: 0 };
      if (t.type === 'credit') e.credit += t.amount; else e.paid += t.amount;
      map.set(key, e);
    });
    return [...map.values()]
      .map(e => ({ name: e.name, balance: e.credit - e.paid, status: e.paid > 0 ? 'Partial' : 'Outstanding' }))
      .filter(e => e.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }

  // Names of known customers (for the autocomplete in forms)
  function customers() {
    const set = new Set();
    list.forEach(t => {
      const n = (t.customer || '').trim();
      if (n && n !== '—' && !/^walk-?in$/i.test(n)) set.add(n);
    });
    return [...set].sort();
  }

  // Chart data: '7d' (daily), '30d' (daily), '3m' (13 weekly totals)
  function series(range) {
    const today = startOfDay();
    const shift = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };
    const short = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const buckets = [];

    if (range === '3m') {
      for (let i = 12; i >= 0; i--) {
        const start = shift(i * 7 + 6);
        const end = new Date(start); end.setDate(end.getDate() + 7);
        buckets.push({ start, end, label: short(start) });
      }
    } else {
      const count = range === '30d' ? 30 : 7;
      for (let i = count - 1; i >= 0; i--) {
        const start = shift(i);
        const end = new Date(start); end.setDate(end.getDate() + 1);
        buckets.push({
          start, end,
          label: range === '7d' ? start.toLocaleDateString('en-US', { weekday: 'short' }) : short(start)
        });
      }
    }

    const sales = buckets.map(() => 0);
    const expenses = buckets.map(() => 0);
    list.forEach(t => {
      const d = new Date(t.date);
      const i = buckets.findIndex(b => d >= b.start && d < b.end);
      if (i === -1) return;
      if (isSale(t)) sales[i] += t.amount;
      else if (t.type === 'expense') expenses[i] += t.amount;
    });
    // profit never drops below 0 on the chart so the line stays inside the graph
    const profit = sales.map((s, i) => Math.max(0, s - expenses[i]));
    return { labels: buckets.map(b => b.label), sales, expenses, profit };
  }

  return {
    CATEGORIES, all, get, add, update, remove, reset,
    isSale, startOfDay, toLocal,
    day, avgDailyExpenses, creditBalances, customers, series
  };
})();