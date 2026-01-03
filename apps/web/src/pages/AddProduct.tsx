import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { Navigate } from 'react-router-dom';

export default function AddProduct() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <PageHeader title="Add Product" />
      <div className="p-6">
        <div className="text-muted-foreground">
          Add a new product to your listing
        </div>
      </div>
    </>
  );
}
