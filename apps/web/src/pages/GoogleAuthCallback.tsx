import { useEffect, useState } from 'react';
import { identify } from '@/lib/analytics';

export default function GoogleAuthCallback() {
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userRaw = params.get('user');

    if (!token) {
      setError('Sign-in failed. Please try again.');
      return;
    }

    localStorage.setItem('token', token);

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        localStorage.setItem('user', JSON.stringify(user));
        identify(user.id, { email: user.email, name: user.name });
      } catch {
        // non-fatal — user object is optional
      }
    }

    window.location.replace('/');
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm px-6">
          <p className="text-destructive text-sm">{error}</p>
          <a href="/login" className="text-sm text-primary hover:underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Signing you in…
      </div>
    </div>
  );
}
