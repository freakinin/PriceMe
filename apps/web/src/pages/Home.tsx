import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { Navigate } from 'react-router-dom';

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <PageHeader title={`Hi ${user?.name || 'Amir'}`} />
      <div className="p-6">
        <div className="text-muted-foreground">
          Welcome to your pricing dashboard
        </div>
      </div>
    </>
  );
}

