import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, Mic, Users, Plus, Edit2, Trash2, X } from 'lucide-react';
import api, { errorMessage } from '../api';

const fmt = (n) => `NPR ${Number(n).toLocaleString('en-NP')}`;

export default function Customers({ refreshKey }) {
  const [query, setQuery] = useState('');
  const [list, setList]   = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [stats, setStats] = useState({ totalOutstanding: 0 });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '' });

  const loadData = async () => {
    try {
      const res = await api.get('/customers/');
      setAllCustomers(res.data);
      const totalOut = res.data.reduce((sum, c) => sum + (c.outstanding || 0), 0);
      setStats({ totalOutstanding: totalOut });
    } catch (err) {
      console.error("Failed to load customers", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    setList(q ? allCustomers.filter((c) => c.name.toLowerCase().includes(q)) : [...allCustomers]);
  }, [query, allCustomers]);

  const withBalance = allCustomers.filter((c) => c.outstanding > 0).length;

  const openAddModal = () => {
    setEditingId(null);
    setForm({ name: '', phone: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (e, c) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(c.id);
    setForm({ name: c.name, phone: c.phone || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await api.delete(`/customers/${id}`);
        loadData();
      } catch (err) {
        console.error("Failed to delete customer", err);
      alert(errorMessage(err));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/customers/${editingId}`, { name: form.name, phone: form.phone });
      } else {
        await api.post('/customers/', { name: form.name, phone: form.phone });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to save customer", err);
      alert(errorMessage(err));
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-head" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-sub">ग्राहक र उधारो व्यवस्थापन</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/record" className="btn btn-secondary">
            <Mic size={14} /> Record Tx
          </Link>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> New Customer
          </button>
        </div>
      </div>

      {/* Outstanding banner */}
      <div className="grid-2 mb-20">
        <div className="card stat-card" style={{ borderLeft: '3px solid var(--amber)' }}>
          <div className="stat-label">
            <span>Total Outstanding (कुल लिन बाँकी)</span>
            <div className="stat-icon-wrap" style={{ background: 'var(--amber-soft)' }}>
              <Users size={14} color="var(--amber)" />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{fmt(stats.totalOutstanding)}</div>
          <div className="stat-hint">Total unpaid credit from all customers</div>
        </div>
        <div className="card stat-card" style={{ borderLeft: '3px solid var(--blue)' }}>
          <div className="stat-label">
            <span>Customers with Balance</span>
            <div className="stat-icon-wrap" style={{ background: 'var(--blue-soft)' }}>
              <Users size={14} color="var(--blue)" />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{withBalance}</div>
          <div className="stat-hint">Out of {allCustomers.length} total customers</div>
        </div>
      </div>

      {/* Customer list */}
      <div className="card">
        {/* Search */}
        <div className="search-bar">
          <div className="search-wrap">
            <span className="search-icon"><Search size={14} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search customers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table head */}
        <div className="table-head" style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          padding: '10px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Customer</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', minWidth: 120, textAlign: 'right' }}>Outstanding</span>
          <span style={{ width: 60 }} />
        </div>

        {/* Rows */}
        {list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No customers found</div>
            <div className="empty-desc">Try a different search term or add a new customer.</div>
          </div>
        ) : (
          list.map((c) => (
            <Link key={c.id} to={`/customers/${c.id}`} className="customer-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '16px 20px', alignItems: 'center', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div className="avatar avatar-md">{c.name.slice(0,2).toUpperCase()}</div>
                <div className="customer-info">
                  <div className="customer-name" style={{ fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                  <div className="customer-sub" style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                    {c.phone || 'No phone'}
                  </div>
                </div>
              </div>
              <div className="customer-balance" style={{ textAlign: 'right' }}>
                <div className={`balance-amt ${c.outstanding === 0 ? 'zero' : ''}`} style={{ fontWeight: 700, fontSize: 15, color: c.outstanding > 0 ? 'var(--amber)' : 'var(--muted)' }}>
                  {fmt(c.outstanding)}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 8, paddingLeft: 24 }} onClick={e => e.preventDefault()}>
                <button className="icon-btn" onClick={(e) => openEditModal(e, c)} title="Edit">
                  <Edit2 size={15} />
                </button>
                <button className="icon-btn" style={{ color: 'var(--red)' }} onClick={(e) => handleDelete(e, c.id)} title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(17,26,46,0.45)', backdropFilter: 'blur(4px)',
          display: 'grid', placeItems: 'center', padding: 20
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <div className="card-head">
              <div className="card-title" style={{ fontSize: 18 }}>{editingId ? 'Edit Customer' : 'Add Customer'}</div>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            
            <form className="card-body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name / नाम</label>
                <input type="text" className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Ram Prasad" />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="e.g. 9841000000" />
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
