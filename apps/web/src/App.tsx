import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import posthog from 'posthog-js';
import { AppLayout } from './components/AppLayout';

function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    posthog.capture('$pageview', { $current_url: window.location.href });
  }, [location.pathname, location.search]);
  return null;
}
import { Toaster } from './components/ui/toaster';
import Home from './pages/Home';
import CreateProduct from './pages/CreateProduct';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Materials from './pages/Materials';
import Suppliers from './pages/Suppliers';
import Roadmap from './pages/Roadmap';
import OnSale from './pages/OnSale';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import MarketAnalysis from './pages/MarketAnalysis';
import Coach from './pages/Coach';
import Help from './pages/Help';
import Onboarding from './pages/Onboarding';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import { useAuth } from './hooks/useAuth';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <RouteTracker />
      <Toaster />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        {/* Protected routes with sidebar */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Home />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Products />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Categories />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/add"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CreateProduct />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CreateProduct />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Materials />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Suppliers />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roadmap"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Roadmap />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/on-sale"
          element={
            <ProtectedRoute>
              <AppLayout>
                <OnSale />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/market-analysis"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MarketAnalysis />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Coach />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Help />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Post-signup onboarding — protected but no AppLayout (full-page wizard) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Google OAuth callback — no auth wrapper needed */}
        <Route path="/auth/callback" element={<GoogleAuthCallback />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
