import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Record from './pages/Record';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import CustomerDetail from './pages/CustomerDetail';
import Transactions from './pages/Transactions';
import Auth from './pages/Auth';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="splash"><Loader className="spin" size={28} /></div>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function AppRoutes() {
  // Bumped on every save so pages re-fetch from the API
  const [refreshKey, setRefreshKey] = useState(0);
  const handleSave = () => setRefreshKey((k) => k + 1);

  return (
    <Routes>
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />
      <Route
        path="/*"
        element={
          <Protected>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard refreshKey={refreshKey} />} />
                <Route path="/record" element={<Record onSave={handleSave} />} />
                <Route path="/customers" element={<Customers refreshKey={refreshKey} />} />
                <Route path="/customers/:id" element={<CustomerDetail refreshKey={refreshKey} />} />
                <Route path="/products" element={<Products refreshKey={refreshKey} />} />
                <Route path="/transactions" element={<Transactions refreshKey={refreshKey} />} />
                <Route path="/reports" element={<Reports refreshKey={refreshKey} />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Protected>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
