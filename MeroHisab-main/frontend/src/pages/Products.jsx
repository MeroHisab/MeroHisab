import React, { useState, useEffect } from 'react';
import { Search, Box, Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import api, { errorMessage } from '../api';

const fmt = (n) => `NPR ${Number(n).toLocaleString('en-NP')}`;

export default function Products({ refreshKey }) {
  const [query, setQuery] = useState('');
  const [list, setList]   = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', price: '', stock: '' });

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products/'),
        api.get('/categories/')
      ]);
      setAllProducts(prodRes.data);
      setCategories(catRes.data.map(c => c.name));
    } catch (err) {
      console.error("Failed to load products", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    setList(q ? allProducts.filter((p) => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q))) : [...allProducts]);
  }, [query, allProducts]);

  const totalProducts = allProducts.length;
  const lowStockCount = allProducts.filter((p) => p.stock < 20).length;

  const openAddModal = () => {
    setEditingId(null);
    setForm({ name: '', category: '', price: '', stock: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingId(p.id);
    setForm({ name: p.name, category: p.category || '', price: String(p.price), stock: String(p.stock) });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/products/${id}`);
        loadData();
      } catch (err) {
        console.error("Failed to delete product", err);
      alert(errorMessage(err));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      category: form.category || 'Others',
      price: parseFloat(form.price) || 0,
      stock: parseInt(form.stock) || 0
    };

    try {
      if (editingId) {
        await api.patch(`/products/${editingId}`, payload);
      } else {
        await api.post('/products/', payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to save product", err);
      alert(errorMessage(err));
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-head" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">सामान र स्टक व्यवस्थापन</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> New Product
        </button>
      </div>

      {/* Stats banner */}
      <div className="grid-2 mb-20">
        <div className="card stat-card" style={{ borderLeft: '3px solid var(--green)' }}>
          <div className="stat-label">
            <span>Total Products (कुल सामान)</span>
            <div className="stat-icon-wrap" style={{ background: 'var(--green-soft)' }}>
              <Box size={14} color="var(--green)" />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{totalProducts}</div>
          <div className="stat-hint">Unique items in your inventory</div>
        </div>
        <div className="card stat-card" style={{ borderLeft: '3px solid var(--red)' }}>
          <div className="stat-label">
            <span>Low Stock Alerts</span>
            <div className="stat-icon-wrap" style={{ background: 'var(--red-soft)' }}>
              <AlertTriangle size={14} color="var(--red)" />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{lowStockCount}</div>
          <div className="stat-hint">Items with less than 20 in stock</div>
        </div>
      </div>

      {/* Product list */}
      <div className="card">
        {/* Search */}
        <div className="search-bar">
          <div className="search-wrap">
            <span className="search-icon"><Search size={14} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search products or categories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table head */}
        <div className="table-head" style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
          padding: '10px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
          gap: 16
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Product</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Category</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'right' }}>Price</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'right' }}>Stock</span>
          <span style={{ width: 60 }} />
        </div>

        {/* Rows */}
        {list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">No products found</div>
            <div className="empty-desc">Try a different search term or add a new product.</div>
          </div>
        ) : (
          list.map((p) => (
            <div key={p.id} className="products-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', padding: '16px 20px', alignItems: 'center', borderBottom: '1px solid var(--border)', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="avatar" style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}><Box size={18} /></div>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {p.category}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>
                {fmt(p.price)}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 700, color: p.stock < 20 ? 'var(--red)' : 'var(--green)' }}>
                {p.stock}
              </div>
              <div style={{ display: 'flex', gap: 8, paddingLeft: 16 }}>
                <button className="icon-btn" onClick={() => openEditModal(p)} title="Edit">
                  <Edit2 size={15} />
                </button>
                <button className="icon-btn" style={{ color: 'var(--red)' }} onClick={() => handleDelete(p.id)} title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
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
          <div className="card" style={{ width: '100%', maxWidth: 450 }}>
            <div className="card-head">
              <div className="card-title" style={{ fontSize: 18 }}>{editingId ? 'Edit Product' : 'Add Product'}</div>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            
            <form className="card-body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name / सामानको नाम</label>
                <input type="text" className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Aashirvaad Atta 5kg" />
              </div>

              <div className="form-group">
                <label className="form-label">Category (Type or Select)</label>
                <input type="text" className="form-control" list="cat-list" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Groceries" />
                <datalist id="cat-list">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Price (NPR)</label>
                  <input type="number" className="form-control" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input type="number" className="form-control" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
                </div>
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
