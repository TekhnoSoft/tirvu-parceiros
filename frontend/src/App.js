import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import PartnerDashboard from './pages/PartnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminPartners from './pages/AdminPartners';
import AdminUsers from './pages/AdminUsers';
import Finance from './pages/Finance';
import Materials from './pages/Materials';
import Leads from './pages/Leads';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Partner Routes */}
          <Route element={<ProtectedRoute allowedRoles={['partner']} />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<PartnerDashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="chat" element={<Chat />} />
              <Route path="profile" element={<Profile />} />
              <Route path="transactions" element={<Finance />} />
              <Route path="materials" element={<Materials />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'consultor']} />}>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminDashboard />} />
              {/* Only Admin can access users management */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="users" element={<AdminUsers />} />
                <Route path="partners" element={<AdminPartners />} />
              </Route>
              <Route path="leads" element={<Leads />} />
              <Route path="chat" element={<Chat />} />
              <Route path="transactions" element={<Finance />} />
              <Route path="materials" element={<Materials />} />
            </Route>
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
