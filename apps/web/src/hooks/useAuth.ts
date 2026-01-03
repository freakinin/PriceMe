import { useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // First try to get user from localStorage (set during login)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          // Fallback to JWT decode
        }
      }
      
      // Also decode JWT to get user info (simple decode, not verifying)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(prev => prev || {
          id: payload.userId,
          email: payload.email,
        });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return { user, loading, logout, isAuthenticated: !!localStorage.getItem('token') };
}

