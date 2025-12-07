import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock credentials from PRD
const MOCK_EMAIL = 'demo@clinicai.com';
const MOCK_PASS = 'Demo@1234';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage on mount
    const storedUser = localStorage.getItem('clinic_ai_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    // TODO: Replace mock auth with Firebase Authentication
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email === MOCK_EMAIL && pass === MOCK_PASS) {
          const newUser: User = {
            email,
            name: 'Admin User',
            avatar: 'https://picsum.photos/200',
          };
          setUser(newUser);
          localStorage.setItem('clinic_ai_user', JSON.stringify(newUser));
          resolve(true);
        } else {
          resolve(false);
        }
      }, 800); // Simulate network delay
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('clinic_ai_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};