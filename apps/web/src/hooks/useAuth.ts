import { useState, useEffect } from 'react';
import { identify, reset } from '@/lib/analytics';

interface User {
  id: number;
  email: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

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
      const payload = parseJwt(token);
      if (payload) {
        const resolved = { id: payload.userId, email: payload.email };
        setUser(prev => prev || resolved);
        identify(payload.userId, { email: payload.email });
      } else {
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
    reset();
    window.location.href = '/login';
  };

  return { user, loading, logout, isAuthenticated: !!localStorage.getItem('token') };
}

