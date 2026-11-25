import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Users, ArrowRight, Loader } from 'lucide-react';
import api, { errorMessage } from '../api';
import { TRANSACTION_TYPES as T, TYPE_META } from '../lib/constants';

const fmt = (n) => `NPR ${Number(n || 0).toLocaleString('en-IN')}`;
const COLORS = ['var(--accent)', '#12935F', '#E8960C', '#7442D8', '#94A3B8', '#D93A3A'];
const isIncome = (t) => t.type === T.SALE || t.type === T.CREDIT_SALE;
const isOutgo = (t) => t.type === T.EXPENSE || t.type === T.PURCHASE;
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
};

function Donut({ data }) {
  if (!data.length) return <div className="empty">No sales in the last 30 days.</div>;
  const R = 40, C = 2 * Math.PI * R;
  const offsets = data.map((_, i) => data.slice(0, i).reduce((a, d) => a + (d.pct / 100) * C, 0));
  return (
    <div className="donut">
      <svg viewBox="0 0 100 100" width="180" height="180" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="14" />
        {data.map((d, i) => {
          const len = (d.pct / 100) * C;
          return (
            <circle key={d.name} cx="50" cy="50" r={R} fill="none" stroke={COLORS[i % COLORS.length]}
              strokeWidth="14" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offsets[i]} />
          );
        })}
      </svg>
      <ul className="legend">
        {data.slice(0, 6).map((d, i) => (
          <li key={d.name}><i style={{ background: COLORS[i % COLORS.length] }} />{d.name}<b>{d.pct}%</b></li>
        ))}
      </ul>
    </div>
  );
}

function Bars({ data }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.outgo]), 1);
  return (
    <div className="bars">
      {data.map((d) => (
        <div key={d.key} className="bars-col" title={`${d.label}: sales ${fmt(d.income)}, expenses ${fmt(d.outgo)}`}>
          <div className="bars-pair">
            <span style={{ height: `${(d.income / max) * 100}%`, background: 'var(--accent)' }} />
            <span style={{ height: `${(d.outgo / max) * 100}%`, background: '#E8960C' }} />
          </div>
          <label>{d.label}</label>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ refreshKey }) {
  const [txs, setTxs] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/transactions/'), api.get('/customers/')])
      .then(([t, c]) => { setTxs(t.data); setCustomers(c.data); })
      .catch((e) => setError(errorMessage(e)));
  }, [refreshKey]);

  const stats = useMemo(() => {
    if (!txs) return null;
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 29); cutoff.setHours(0, 0, 0, 0);
    const month = txs.filter((t) => new Date(t.date) >= cutoff);
    const sales = month.filter(isIncome).reduce((s, t) => s + t.amount, 0);
    const expenses = month.filter(isOutgo).reduce((s, t) => s + t.amount, 0);

    const cat = {};
    month.filter(isIncome).forEach((t) => { const k = t.category || 'Others'; cat[k] = (cat[k] || 0) + t.amount; });
    const categories = Object.entries(cat)
      .map(([name, amount]) => ({ name, amount, pct: sales ? Math.round((amount / sales) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push({ key: dayKey(d), label: d.toLocaleDateString('en-US', { weekday: 'short' }), income: 0, outgo: 0 });
    }
    txs.forEach((t) => {
      const slot = days.find((d) => d.key === dayKey(t.date));
      if (!slot) return;
      if (isIncome(t)) slot.income += t.amount;
      else if (isOutgo(t)) slot.outgo += t.amount;
    });
    return { sales, expenses, profit: sales - expenses, categories, days };
  }, [txs]);

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!stats) return <div className="page"><div className="empty"><Loader className="spin" /></div></div>;

  const outstanding = customers.reduce((s, c) => s + (c.outstanding || 0), 0);
  const debtors = [...customers].filter((c) => c.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding).slice(0, 5);
  const recent = txs.slice(0, 6);

  const cards = [
    { label: 'Sales (30 days)', value: fmt(stats.sales), Icon: TrendingUp, tone: 'green' },
    { label: 'Expenses (30 days)', value: fmt(stats.expenses), Icon: TrendingDown, tone: 'amber' },
    { label: 'Net profit', value: fmt(stats.profit), Icon: Wallet, tone: stats.profit >= 0 ? 'blue' : 'red' },
    { label: 'Outstanding credit', value: fmt(outstanding), Icon: Users, tone: 'purple' },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Your business at a glance</p>
        </div>
      </div>

      <div className="grid-4 mb-24">
        {cards.map(({ label, value, Icon, tone }) => (
          <div key={label} className="card stat-card kpi">
            <div className={`kpi-icon ${tone}`}><Icon size={18} /></div>
            <div>
              <div className="stat-label" style={{ margin: 0 }}>{label}</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Last 7 days</div>
            <div className="text-xs text-muted"><i className="dot" style={{ background: 'var(--accent)' }} /> Sales <i className="dot" style={{ background: '#E8960C', marginLeft: 10 }} /> Expenses</div>
          </div>
          <div className="card-body"><Bars data={stats.days} /></div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Sales by category</div></div>
          <div className="card-body"><Donut data={stats.categories} /></div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Recent transactions</div>
            <Link to="/transactions" className="link">View all <ArrowRight size={13} /></Link>
          </div>
          <div className="card-body">
            {recent.length === 0 ? <div className="empty">No transactions yet. <Link to="/record" className="link">Record your first</Link></div> :
              recent.map((t) => (
                <div key={t.id} className="tx-row">
                  <div className={`tx-icon ${TYPE_META[t.type].color}`}>{isIncome(t) || t.type === T.REPAYMENT ? '+' : '−'}</div>
                  <div className="tx-info">
                    <div className="tx-desc">{t.description || TYPE_META[t.type].label}</div>
                    <div className="tx-meta">{TYPE_META[t.type].label}{t.customer ? ` · ${t.customer.name}` : ''} · {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <div className={`tx-amount ${isOutgo(t) ? 'neg' : 'pos'}`}>{isOutgo(t) ? '−' : '+'}{fmt(t.amount)}</div>
                </div>
              ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Customers who owe you</div>
            <Link to="/customers" className="link">All customers <ArrowRight size={13} /></Link>
          </div>
          <div className="card-body">
            {debtors.length === 0 ? <div className="empty">No outstanding credit 🎉</div> :
              debtors.map((c) => (
                <Link key={c.id} to={`/customers/${c.id}`} className="tx-row">
                  <div className="avatar">{c.name.slice(0, 2)}</div>
                  <div className="tx-info"><div className="tx-desc">{c.name}</div><div className="tx-meta">{c.phone || 'No phone'}</div></div>
                  <div className="tx-amount warn">{fmt(c.outstanding)}</div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
