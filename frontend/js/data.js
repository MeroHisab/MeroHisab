/* =========================================================
   Mock data – later you can replace this with real API calls
   (fetch('/api/...')) from your backend.
   ========================================================= */

const MH_DATA = {

  // Credit overview (customers who owe money)
  credit: [
    { name: 'Ram',  status: 'Outstanding', amount: 5000 },
    { name: 'Sita', status: 'Partial',     amount: 2500 },
    { name: 'Hari', status: 'Outstanding', amount: 1000 },
    { name: 'Maya', status: 'Partial',     amount: 800  }
  ],

  // Recent transactions
  // type: sale | expense | credit | payment
  transactions: [
    { date: 'Today, 6:42 PM',     desc: 'Rice × 5',              type: 'sale',    customer: 'Walk-in', amount: 2500, status: 'Completed' },
    { date: 'Today, 5:15 PM',     desc: 'Sugar × 3, Tea × 2',    type: 'credit',  customer: 'Ram',     amount: 1800, status: 'Pending'   },
    { date: 'Today, 3:30 PM',     desc: 'Shop electricity bill', type: 'expense', customer: '—',       amount: 1250, status: 'Completed' },
    { date: 'Today, 1:05 PM',     desc: 'Payment received',      type: 'payment', customer: 'Sita',    amount: 1000, status: 'Completed' },
    { date: 'Yesterday, 7:20 PM', desc: 'Cooking oil × 2',       type: 'sale',    customer: 'Walk-in', amount: 760,  status: 'Completed' }
  ],

  // Chart data. Each range has labels + 3 series.
  chart: {
    '7d': {
      labels:   ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      sales:    [7200, 9800, 8500, 11800, 10500, 14200, 12450],
      expenses: [3200, 4200, 2800, 3800, 4900, 4700, 4250],
      profit:   [4000, 5600, 5700, 8000, 5600, 9500, 8200]
    }
    // '30d' and '3m' are generated below
  }
};

/* ---------- helper: generate fake data for 30 days / 3 months ---------- */
(function buildExtraRanges() {
  // tiny seeded random so the chart looks the same on every reload
  let seed = 7;
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  function make(points, stepDays, salesBase) {
    const labels = [], sales = [], expenses = [], profit = [];
    const today = new Date();
    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i * stepDays);
      labels.push(fmt(d));

      const weekend = (d.getDay() === 5 || d.getDay() === 6) ? 1.25 : 1;
      const s = Math.round((salesBase * weekend * (0.8 + rand() * 0.5)) / 100) * 100;
      const e = Math.round((s * (0.28 + rand() * 0.14)) / 100) * 100;
      sales.push(s); expenses.push(e); profit.push(s - e);
    }
    return { labels, sales, expenses, profit };
  }

  MH_DATA.chart['30d'] = make(30, 1, 9500);
  MH_DATA.chart['3m']  = make(13, 7, 9500 * 7);   // 13 weekly totals
})();