import React, { useEffect, useState, useMemo } from 'react';
import { TRANSACTION_TYPES } from '../lib/constants';
import api from '../api';
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard,
  Calendar
} from 'lucide-react';

const fmt = (n) => `NPR ${Number(n).toLocaleString('en-IN')}`;
const fmtShort = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

// ── Period helpers ─────────────────────────────────────────
function getPeriodRange(period, customFrom, customTo) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'today') {
    return { from: today, to: now };
  }
  if (period === 'week') {
    const from = new Date(today); from.setDate(today.getDate() - 6);
    return { from, to: now };
  }
  if (period === 'month') {
    const from = new Date(today); from.setDate(today.getDate() - 29);
    return { from, to: now };
  }
  if (period === 'quarter') {
    const from = new Date(today); from.setDate(today.getDate() - 89);
    return { from, to: now };
  }
  if (period === 'custom' && customFrom && customTo) {
    return { from: new Date(customFrom), to: new Date(customTo + 'T23:59:59') };
  }
  const from = new Date(today); from.setDate(today.getDate() - 29);
  return { from, to: now };
}

function filterByRange(txs, from, to) {
  return txs.filter(t => {
    const d = new Date(t.date);
    return d >= from && d <= to;
  });
}

// ── Mini Line Chart ────────────────────────────────────────
function LineChart({ data, color = '#12935F', height = 80 }) {
  if (!data || data.length < 2) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>No data</div>;

  const max = Math.max(...data.map(d => d.value), 1);
  const w = 480;
  const h = height;
  const pad = 8;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((d.value / max) * (h - pad * 2));
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M ${points[0]} L ${points.join(' L ')} L ${points[points.length - 1].split(',')[0]},${h - pad} L ${points[0].split(',')[0]},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`lg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#lg-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - ((d.value / max) * (h - pad * 2));
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color} stroke="var(--bg)" strokeWidth="2" />;
      })}
    </svg>
  );
}

// ── Bar Chart ──────────────────────────────────────────────
function BarChart({ data, colors = {} }) {
  if (!data || data.length === 0) return <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{fmtShort(d.value)}</div>
          <div style={{
            width: '100%',
            height: `${(d.value / max) * 80}px`,
            minHeight: d.value > 0 ? 4 : 0,
            background: colors[d.label] || 'var(--accent)',
            borderRadius: '3px 3px 0 0',
            transition: 'height 0.4s ease',
          }} />
          <div style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon, trend }) {
  const isUp = trend > 0;
  return (
    <div className="card stat-card" style={{ padding: '20px 24px', borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `color-mix(in srgb, ${color} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 6 }}>{value}</div>
      {trend !== undefined && (
        <div style={{ fontSize: 12, color: isUp ? '#12935F' : '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}% vs previous period
        </div>
      )}
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</div>}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────
const PERIODS = [
  { key: 'today',   label: 'Today' },
  { key: 'week',    label: '7 Days' },
  { key: 'month',   label: '30 Days' },
  { key: 'quarter', label: '3 Months' },
  { key: 'custom',  label: 'Custom' },
];

const CAT_COLORS = {
  'Groceries': '#12935F',
  'Snacks':    '#E8960C',
  'Dairy':     'var(--accent)',
  'Drinks':    '#7442D8',
  'Others':    '#94A3B8',
};

export default function Reports({ refreshKey }) {
  const [period, setPeriod] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [txRes, cRes] = await Promise.all([
          api.get('/transactions/'),
          api.get('/customers/')
        ]);
        setTransactions(txRes.data);
        setCustomers(cRes.data);
      } catch (err) {
        console.error("Failed to fetch reports data", err);
      }
    };
    load();
  }, [refreshKey]);

  const { from, to } = useMemo(() => getPeriodRange(period, customFrom, customTo), [period, customFrom, customTo]);
  const inRange = useMemo(() => filterByRange(transactions, from, to), [transactions, from, to]);

  // ── Core metrics ──────────────────────────────────────────
  const metrics = useMemo(() => {
    const sales    = inRange.filter(t => t.type === TRANSACTION_TYPES.SALE || t.type === TRANSACTION_TYPES.CREDIT_SALE);
    const expenses = inRange.filter(t => t.type === TRANSACTION_TYPES.EXPENSE || t.type === TRANSACTION_TYPES.PURCHASE);
    const credits  = inRange.filter(t => t.type === TRANSACTION_TYPES.CREDIT_SALE);
    const payments = inRange.filter(t => t.type === TRANSACTION_TYPES.REPAYMENT);

    const totalSales    = sales.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const totalCredit   = credits.reduce((s, t) => s + t.amount, 0);
    const totalRepaid   = payments.reduce((s, t) => s + t.amount, 0);
    const netProfit     = totalSales - totalExpenses;

    return { totalSales, totalExpenses, totalCredit, totalRepaid, netProfit, txCount: inRange.length };
  }, [inRange]);

  // ── Category breakdown ────────────────────────────────────
  const categoryData = useMemo(() => {
    const map = {};
    inRange
      .filter(t => t.type === TRANSACTION_TYPES.SALE || t.type === TRANSACTION_TYPES.CREDIT_SALE)
      .forEach(t => {
        const cat = t.category || 'Others';
        map[cat] = (map[cat] || 0) + t.amount;
      });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.keys(map)
      .map(k => ({ label: k, value: map[k], pct: total > 0 ? Math.round((map[k] / total) * 100) : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [inRange]);

  // ── Daily revenue trend ────────────────────────────────────
  const trendData = useMemo(() => {
    // Group sales by day
    const map = {};
    inRange
      .filter(t => t.type === TRANSACTION_TYPES.SALE || t.type === TRANSACTION_TYPES.CREDIT_SALE)
      .forEach(t => {
        const d = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        map[d] = (map[d] || 0) + t.amount;
      });
    // Create a sorted array over the range days
    const result = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const key = cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      result.push({ label: key, value: map[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    // If too many points (e.g. 90), sample every Nth
    if (result.length > 30) {
      const step = Math.ceil(result.length / 20);
      return result.filter((_, i) => i % step === 0 || i === result.length - 1);
    }
    return result;
  }, [inRange, from, to]);

  // ── Expense breakdown ─────────────────────────────────────
  const expenseData = useMemo(() => {
    const map = {};
    inRange
      .filter(t => t.type === TRANSACTION_TYPES.EXPENSE || t.type === TRANSACTION_TYPES.PURCHASE)
      .forEach(t => {
        const label = t.description || 'Other';
        map[label] = (map[label] || 0) + t.amount;
      });
    return Object.keys(map)
      .map(k => ({ label: k, value: map[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [inRange]);

  // ── Top customers by credit ───────────────────────────────
  const topCustomers = useMemo(() => {
    const map = {};
    inRange
      .filter(t => t.type === TRANSACTION_TYPES.CREDIT_SALE && t.customer_id)
      .forEach(t => { map[t.customer_id] = (map[t.customer_id] || 0) + t.amount; });
    return Object.keys(map)
      .map(id => {
        const c = customers.find(c => c.id === parseInt(id));
        return { name: c?.name || id, value: map[id], outstanding: c?.outstanding || 0 };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [inRange, customers]);

  const profitPositive = metrics.netProfit >= 0;

  return (
    <div className="page">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="page-head" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">Detailed financial analysis for your business</p>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${period === p.key ? 'var(--accent)' : 'var(--border)'}`,
                background: period === p.key ? 'var(--accent-soft)' : 'var(--surface)',
                color: period === p.key ? 'var(--accent)' : 'var(--text-2)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="card" style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Calendar size={16} color="var(--accent)" />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 160 }}>
              <label className="form-label">From</label>
              <input type="date" className="form-control" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 160 }}>
              <label className="form-label">To</label>
              <input type="date" className="form-control" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Period label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
          {from.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — {to.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>({metrics.txCount} transactions)</span>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div className="grid-4 mb-32">
        <StatCard label="Total Revenue" value={fmt(metrics.totalSales)} color="#12935F" icon={DollarSign} />
        <StatCard label="Net Profit" value={fmt(metrics.netProfit)} color={profitPositive ? 'var(--accent)' : '#EF4444'} icon={profitPositive ? TrendingUp : TrendingDown} />
        <StatCard label="Total Expenses" value={fmt(metrics.totalExpenses)} color="#E8960C" icon={TrendingDown} />
        <StatCard label="Credit Given" value={fmt(metrics.totalCredit)} color="#7442D8" icon={CreditCard} sub={`${fmt(metrics.totalRepaid)} repaid`} />
      </div>

      {/* ── Revenue Trend Chart ───────────────────────────── */}
      <div className="card mb-32">
        <div className="card-head" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="card-title">Revenue Trend</div>
            <div className="card-sub" style={{ marginTop: 4 }}>Daily sales over the selected period</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{fmt(metrics.totalSales)}</div>
        </div>
        <div className="card-body" style={{ padding: '20px 24px' }}>
          <LineChart data={trendData} color="#12935F" height={120} />
          {/* X-axis labels */}
          {trendData.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{trendData[0]?.label}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{trendData[Math.floor(trendData.length / 2)]?.label}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{trendData[trendData.length - 1]?.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Middle Row: Category + Expenses ──────────────── */}
      <div className="grid-2 mb-32">

        {/* Category Sales */}
        <div className="card">
          <div className="card-head" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="card-title">Sales by Category</div>
          </div>
          <div className="card-body">
            {categoryData.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>No sales in this period</p>
            ) : categoryData.map((cat) => (
              <div key={cat.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cat.label}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{cat.pct}%</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{fmt(cat.value)}</span>
                  </div>
                </div>
                <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${cat.pct}%`,
                    background: CAT_COLORS[cat.label] || 'var(--accent)',
                    borderRadius: 4,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="card">
          <div className="card-head" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="card-title">Expense Breakdown</div>
          </div>
          <div className="card-body">
            {expenseData.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>No expenses in this period</p>
            ) : (
              <BarChart
                data={expenseData}
                colors={expenseData.reduce((acc, d, i) => {
                  acc[d.label] = ['#E8960C', '#EF4444', '#7442D8', 'var(--accent)', '#12935F', '#94A3B8'][i % 6];
                  return acc;
                }, {})}
              />
            )}
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Total Expenses</span>
                <span style={{ fontWeight: 800, color: '#EF4444' }}>{fmt(metrics.totalExpenses)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profit / Loss Summary ─────────────────────────── */}
      <div className="card mb-32" style={{ borderLeft: `4px solid ${profitPositive ? '#12935F' : '#EF4444'}` }}>
        <div className="card-body" style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: profitPositive ? 'var(--green)' : '#EF4444', marginBottom: 6 }}>
                {profitPositive ? '📈 Profit Summary' : '📉 Loss Summary'}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: profitPositive ? 'var(--green)' : '#EF4444', letterSpacing: '-1px' }}>
                {profitPositive ? '+' : ''}{fmt(metrics.netProfit)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Net {profitPositive ? 'profit' : 'loss'} for the selected period</div>
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Revenue</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>{fmt(metrics.totalSales)}</div>
              </div>
              <div style={{ fontSize: 22, color: 'var(--border)', alignSelf: 'center' }}>−</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Expenses</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#EF4444' }}>{fmt(metrics.totalExpenses)}</div>
              </div>
              <div style={{ fontSize: 22, color: 'var(--border)', alignSelf: 'center' }}>=</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Net Profit</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: profitPositive ? 'var(--green)' : '#EF4444' }}>{fmt(metrics.netProfit)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Credit Customers ──────────────────────────── */}
      <div className="card">
        <div className="card-head" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="card-title">Top Credit Customers</div>
            <div className="card-sub" style={{ marginTop: 4 }}>Customers with highest credit in this period</div>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {topCustomers.length === 0 ? (
            <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0' }}>No credit sales in this period</p>
          ) : topCustomers.map((c, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '32px 1fr auto auto',
              gap: 16, alignItems: 'center',
              padding: '14px 24px',
              borderBottom: i < topCustomers.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: i === 0 ? 'linear-gradient(135deg, #E8960C, #D97706)' : 'var(--surface-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
                color: i === 0 ? '#fff' : 'var(--text-2)',
              }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Outstanding: {fmt(c.outstanding)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>Credit taken</div>
                <div style={{ fontWeight: 700, color: '#7442D8' }}>{fmt(c.value)}</div>
              </div>
            </div>
          ))}
          {topCustomers.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              No credit sales in this period
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
