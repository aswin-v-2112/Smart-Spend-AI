import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { simulateDelay, generateId } from '../utils';

interface AuthContextType {
  user: User | null;
  login: (email: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage on load
    const storedUser = localStorage.getItem('sa_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, name: string) => {
    setIsLoading(true);
    await simulateDelay(800); // Fake network delay
    
    // In a real app, we would validate password hash here.
    // For this demo, we just create/retrieve a user session.
    const newUser: User = {
      id: btoa(email), // Simple stable ID based on email for demo
      email,
      name
    };

    localStorage.setItem('sa_user', JSON.stringify(newUser));
    setUser(newUser);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('sa_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};