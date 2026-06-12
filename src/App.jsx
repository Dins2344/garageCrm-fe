import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GlobalLoaderProvider } from './context/GlobalLoaderContext';
import Loader from './components/Loader';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import JobCards from './pages/JobCards';
import JobCardDetail from './pages/JobCardDetail';
// Inventory disabled — users enter parts manually; re-enable by adding back to nav + route
// import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import EstimationApproval from './pages/EstimationApproval';

// Admin Pages
import AdminLogin from './pages/Admin/AdminLogin';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminOverview from './pages/Admin/AdminOverview';
import AdminGarages from './pages/Admin/AdminGarages';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminHealth from './pages/Admin/AdminHealth';

// Protected route wrapper
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader variant="page" text="Loading GaragePulse..." />;
  }

  if (!user) return <Navigate to="/home" />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}

// Auth route — redirect to dashboard if already logged in
function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <GlobalLoaderProvider>
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="bottom-right"
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
          {/* Public: Landing page */}
          <Route path="/home" element={<HomePage />} />

          {/* Auth: Login / Register */}
          <Route path="/login" element={
            <AuthRoute><Login /></AuthRoute>
          } />

          {/* Protected: App shell */}
          <Route element={
            <ProtectedRoute><AppLayout /></ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="vehicles/:id" element={<VehicleDetail />} />
            <Route path="jobcards" element={<JobCards />} />
            <Route path="jobcards/:id" element={<JobCardDetail />} />
            {/* Inventory is disabled — redirect to dashboard */}
            <Route path="inventory" element={<Navigate to="/" replace />} />
            <Route path="invoices" element={
              <ProtectedRoute roles={['owner', 'admin', 'service_advisor']}>
                <Invoices />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
          </Route>

          {/* Public: customer estimation approval — no auth required */}
          <Route path="/estimate/:token" element={<EstimationApproval />} />

          {/* Admin Command Center (Hidden from main UI) */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="overview" element={<AdminOverview />} />
            <Route path="garages" element={<AdminGarages />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="health" element={<AdminHealth />} />
            <Route index element={<Navigate to="overview" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </GlobalLoaderProvider>
  );
}

export default App;
