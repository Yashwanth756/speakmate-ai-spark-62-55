import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser: User = {
          id: '1',
          email: email,
          fullName: 'John Doe',
          role: 'student',
          class: 'A',
          section: '1'
        };
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setIsLoading(false);
        resolve(true);
      }, 1000);
    });
  };

  const register = async (userData: Omit<User, 'id'> & { password: string }) => {
    setIsLoading(true);
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser: User = {
          id: '2',
          email: userData.email,
          fullName: userData.fullName,
          role: 'student',
          class: userData.class,
          section: userData.section
        };
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setIsLoading(false);
        resolve(true);
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    register,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
};
