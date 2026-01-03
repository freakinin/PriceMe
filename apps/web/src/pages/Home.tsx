import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-6">
      <div className="text-muted-foreground">
        Welcome to your pricing dashboard
      </div>
    </div>
  );
}

