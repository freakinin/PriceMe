import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function AddProduct() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-6">
      <div className="text-muted-foreground">
        Add a new product to your listing
      </div>
    </div>
  );
}
