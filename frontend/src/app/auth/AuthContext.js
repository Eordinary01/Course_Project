"use client";

import { createContext, useState, useContext, useEffect, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await axios.get(`${API_URL}/auth/validate`, {
            headers: { "x-auth-token": token },
          });
          setUser(res.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Token validation error:", error);
          localStorage.removeItem("token");
          router.push('/login');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    validateToken();
  }, [router]);

  const register = async (username, email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { username, email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.response?.data?.msg || "Registration failed",
      };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.response?.data?.msg || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  const value = useMemo(() => ({
    user, loading, isAuthenticated, register, login, logout
  }), [user, loading, isAuthenticated]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
