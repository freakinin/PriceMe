import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { Toaster } from './components/ui/toaster';
import Home from './pages/Home';
import CreateProduct from './pages/CreateProduct';
import CreateProduct2 from './pages/CreateProduct2';
import Products from './pages/Products';
import Materials from './pages/Materials';
import Settings from './pages/Settings';
import Roadmap from './pages/Roadmap';
import OnSale from './pages/OnSale';
import Login from './pages/Login';
import Signup from './pages/Signup';
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
          path="/products/add2"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CreateProduct2 />
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
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
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
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
