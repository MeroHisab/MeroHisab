import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api, { errorMessage } from '../api';

// Keep the metadata for rendering, but don't import mock functions
import { TRANSACTION_TYPES, TYPE_META, PAYMENT_STATUS } from '../lib/constants';

const fmt = (n) => `NPR ${Number(n).toLocaleString('en-IN')}`;

export default function Transactions({ refreshKey }) {
  const [filter, setFilter] = useState('ALL');
  const [txs, setTxs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    type: TRANSACTION_TYPES.SALE,
    amount: '',
    description: '',
    category: '',
    customer: '',
    status: PAYMENT_STATUS.PAID,
  });

  const loadData = async () => {
    try {
      const [txRes, catRes, custRes] = await Promise.all([
        api.get('/transactions/'),
        api.get('/categories/'),
        api.get('/customers/')
      ]);
      setTxs(txRes.data);
      setCategories(catRes.data.map(c => c.name));
      setCustomers(custRes.data);
    } catch (err) {
      console.error("Failed to load data", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const filtered = txs.filter((t) => {
    if (filter === 'ALL') return true;
    if (filter === 'SALES') return t.type === TRANSACTION_TYPES.SALE || t.type === TRANSACTION_TYPES.CREDIT_SALE;
    if (filter === 'EXPENSES') return t.type === TRANSACTION_TYPES.EXPENSE || t.type === TRANSACTION_TYPES.PURCHASE;
    if (filter === 'CREDIT') return t.type === TRANSACTION_TYPES.CREDIT_SALE || t.type === TRANSACTION_TYPES.REPAYMENT;
    return true;
  });

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      type: TRANSACTION_TYPES.SALE,
      amount: '',
      description: '',
      category: '',
      customer: '',
      status: PAYMENT_STATUS.PAID,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tx) => {
    setEditingId(tx.id);
    setForm({
      type: tx.type,
      amount: String(tx.amount),
      description: tx.description || '',
      category: tx.category || '',
      customer: tx.customer_id || '',
      status: tx.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await api.delete(`/transactions/${id}`);
        loadData();
      } catch (err) {
        console.error("Error deleting transaction", err);
      alert(errorMessage(err));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      type: form.type,
      amount: parseFloat(form.amount) || 0,
      description: form.description,
      category: form.category || 'Others',
      customer_id: form.customer ? parseInt(form.customer) : null,
      status: form.status,
    };

    try {
      if (editingId) {
        await api.patch(`/transactions/${editingId}`, payload);
      } else {
        await api.post('/transactions/', payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Error saving transaction", err);
      alert(errorMessage(err));
    }
  };

  return (
    <div className="page">
      <div className="page-head" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-sub">View, filter, and manage your sales, expenses, and credit.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> New Transaction
        </button>
      </div>

      <div className="card">
        <div className="card-head" style={{ paddingBottom: 0, borderBottom: 0 }}>
          <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', width: '100%' }}>
            {['ALL', 'SALES', 'EXPENSES', 'CREDIT'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  padding: '12px 0',
                  background: 'none', border: 'none',
                  fontSize: 14, fontWeight: filter === tab ? 600 : 500,
                  color: filter === tab ? 'var(--accent)' : 'var(--muted)',
                  borderBottom: `2px solid ${filter === tab ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer',
                  marginBottom: '-1px'
                }}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body">
          {filtered.length === 0 ? (
            <p className="text-muted" style={{ padding: '20px 0', textAlign: 'center' }}>No transactions found for this filter.</p>
          ) : (
            filtered.map((t) => (
              <div key={t.id} className="tx-row" style={{ paddingRight: 16 }}>
                <div className={`tx-icon ${TYPE_META[t.type]?.color}`}>
                  {t.type.includes('SALE') ? '🛍️' : t.type === 'EXPENSE' ? '📉' : t.type === 'PURCHASE' ? '📦' : '💳'}
                </div>
                <div className="tx-info">
                  <div className="tx-desc">{t.description}</div>
                  <div className="tx-meta">
                    {TYPE_META[t.type]?.labelNp} · {new Date(t.date).toLocaleDateString()}
                    {t.category && t.category !== 'Others' && ` · ${t.category}`}
                  </div>
                </div>
                <div className={`tx-amount ${(t.type === TRANSACTION_TYPES.SALE || t.type === TRANSACTION_TYPES.REPAYMENT) ? 'pos' : (t.type === TRANSACTION_TYPES.CREDIT_SALE ? 'warn' : 'neg')}`} style={{ marginRight: 24 }}>
                  {t.type === TRANSACTION_TYPES.SALE || t.type === TRANSACTION_TYPES.REPAYMENT ? '+' : '-'} {fmt(t.amount)}
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="icon-btn" onClick={() => openEditModal(t)} title="Edit">
                    <Edit2 size={15} />
                  </button>
                  <button className="icon-btn" style={{ color: 'var(--red)' }} onClick={() => handleDelete(t.id)} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(17,26,46,0.45)', backdropFilter: 'blur(4px)',
          display: 'grid', placeItems: 'center', padding: 20
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-head">
              <div className="card-title" style={{ fontSize: 18 }}>{editingId ? 'Edit Transaction' : 'Add Transaction'}</div>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            
            <form className="card-body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})} required>
                  {Object.values(TRANSACTION_TYPES).map(t => (
                    <option key={t} value={t}>{TYPE_META[t].label} — {TYPE_META[t].labelNp}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount (NPR)</label>
                <input type="number" className="form-control" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              </div>

              <div className="form-group">
                <label className="form-label">Category (Type or Select)</label>
                <input type="text" className="form-control" list="cat-list" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Groceries" />
                <datalist id="cat-list">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label">Customer (Optional)</label>
                <select className="form-select" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})}>
                  <option value="">-- None --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value={PAYMENT_STATUS.PAID}>Paid</option>
                  <option value={PAYMENT_STATUS.UNPAID}>Unpaid</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
