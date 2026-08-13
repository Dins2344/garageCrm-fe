import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GarageProvider } from './context/GarageContext';
import { GlobalLoaderProvider } from './context/GlobalLoaderContext';
import Loader from './components/Loader';
import AppLayout from './components/layout/AppLayout';
import type { Role } from './types/models';

// Route-level pages are lazy-loaded so the initial bundle only ships the app
// shell + whichever page the visitor actually lands on — not all 19 pages
// (including the whole admin console) up front. See CONTRIBUTING.md
// "Performance Conventions".
const HomePage = lazy(() => import('./pages/HomePage'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const JobCards = lazy(() => import('./pages/JobCards'));
const JobCardDetail = lazy(() => import('./pages/JobCardDetail'));
// Inventory disabled — users enter parts manually; re-enable by adding back to nav + route
// const Inventory = lazy(() => import('./pages/Inventory'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Settings = lazy(() => import('./pages/Settings'));
const EstimationApproval = lazy(() => import('./pages/EstimationApproval'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/Admin/AdminOverview'));
const AdminGarages = lazy(() => import('./pages/Admin/AdminGarages'));
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers'));
const AdminHealth = lazy(() => import('./pages/Admin/AdminHealth'));

// Protected route wrapper
function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
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
function AuthRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <GlobalLoaderProvider>
    <AuthProvider>
    <GarageProvider>
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
        <Suspense fallback={<Loader variant="page" />}>
          <Routes>
            {/* Public: Landing page */}
            <Route path="/home" element={<HomePage />} />

            {/* Auth: Login / Register */}
            <Route path="/login" element={
              <AuthRoute><Login /></AuthRoute>
            } />
            <Route path="/forgot-password" element={
              <AuthRoute><ForgotPassword /></AuthRoute>
            } />

            {/* Public: password reset via emailed token — no auth required */}
            <Route path="/reset-password/:token" element={<ResetPassword />} />

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
        </Suspense>
      </BrowserRouter>
    </GarageProvider>
    </AuthProvider>
    </GlobalLoaderProvider>
  );
}

export default App;
