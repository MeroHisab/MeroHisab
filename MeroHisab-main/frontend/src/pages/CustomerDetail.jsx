import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic } from 'lucide-react';
import { TRANSACTION_TYPES, TYPE_META } from '../lib/constants';
import api from '../api';

function fmt(n) { return `NPR ${Number(n).toLocaleString('en-NP')}`; }

function txAmountDisplay(tx) {
  if (tx.type === TRANSACTION_TYPES.REPAYMENT) {
    return <span className="pos">-{fmt(tx.amount)}</span>;
  }
  return <span className="warn">+{fmt(tx.amount)}</span>;
}

function formatDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-NP', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CustomerDetail({ refreshKey }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [txList, setTxList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, txRes] = await Promise.all([
          api.get(`/customers/${id}`),
          api.get(`/customers/${id}/transactions`)
        ]);
        setCustomer(cRes.data);
        setTxList(txRes.data);
      } catch (err) {
        console.error(err);
        navigate('/customers');
      }
    };
    fetchData();
  }, [id, navigate, refreshKey]);

  if (!customer) return null;

  return (
    <div className="page">
      {/* Back */}
      <div style={{ marginBottom: 20 }}>
        <Link to="/customers" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} /> ग्राहकहरू
        </Link>
      </div>

      {/* Customer header */}
      <div className="card mb-24" style={{ padding: '28px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div className="avatar" style={{ width: 64, height: 64, fontSize: 22, flexShrink: 0 }}>
            {customer.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{customer.name}</h1>
            <p className="text-muted" style={{ fontSize: 14 }}>{customer.phone}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>लिन बाँकी</div>
            <div style={{
              fontSize: 32, fontWeight: 700, letterSpacing: '-.02em',
              color: customer.outstanding > 0 ? 'var(--amber)' : 'var(--accent)',
            }}>
              {fmt(customer.outstanding)}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="card mb-24">
        <div className="card-head">
          <div>
            <div className="card-title">लेनदेन इतिहास</div>
            <div className="card-sub">Transaction history with {customer.name}</div>
          </div>
        </div>
        <div className="card-body">
          {txList.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-icon">📋</div>
              <div className="empty-title">No transactions yet</div>
              <div className="empty-desc">Record a transaction with {customer.name} to see it here.</div>
            </div>
          ) : (
            txList.map((tx) => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{tx.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`tag tag-${TYPE_META[tx.type]?.color}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                      {TYPE_META[tx.type]?.labelNp}
                    </span>
                    <span className="text-muted" style={{ fontSize: 13 }}>{formatDate(tx.date)}</span>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 17, fontVariantNumeric: 'tabular-nums' }}>
                  {txAmountDisplay(tx)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Record CTA */}
      <Link to="/record" className="btn btn-accent btn-lg w-full" style={{ justifyContent: 'center', borderRadius: 14 }}>
        <Mic size={18} /> हिसाब रेकर्ड गर्नुहोस्
      </Link>
    </div>
  );
}
