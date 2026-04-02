import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Vehicles from './pages/Vehicles';
import JobCards from './pages/JobCards';
import JobCardDetail from './pages/JobCardDetail';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';

// Protected route wrapper
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <p>Loading GarageFlow...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}

// Public route — redirect to dashboard if logged in
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              background: '#1e293b',
              color: '#fff',
              padding: '12px 20px',
              fontSize: '0.9375rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' }
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' }
            }
          }}
        />
        <Routes>
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />

          <Route element={
            <ProtectedRoute><AppLayout /></ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="jobcards" element={<JobCards />} />
            <Route path="jobcards/:id" element={<JobCardDetail />} />
            <Route path="inventory" element={
              <ProtectedRoute roles={['owner', 'admin', 'service_advisor']}>
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="invoices" element={
              <ProtectedRoute roles={['owner', 'admin', 'service_advisor']}>
                <Invoices />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute roles={['owner', 'admin']}>
                <Settings />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
