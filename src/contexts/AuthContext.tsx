
import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateDailyData } from '@/data/progressData';
export type UserRole = 'student' | 'teacher';
const backend_url = import.meta.env.VITE_backend_url
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  classes: string[];
  sections: string[];
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  isAuthenticated: boolean;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  classes: string[];
  sections: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data for classes and sections
export const MOCK_CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
export const MOCK_SECTIONS = ['A', 'B', 'C', 'D'];

// Mock users database
const MOCK_USERS: User[] = [
  {
    id: '1',
    fullName: 'John Smith',
    email: 'teacher@echo.ai',
    role: 'teacher',
    classes: ['Class 8', 'Class 9'],
    sections: ['A', 'B']
  },
  {
    id: '2',
    fullName: 'Alice Johnson',
    email: 'student@echo.ai',
    role: 'student',
    classes: ['Class 8'],
    sections: ['A']
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('echo_user');
    const authToken = localStorage.getItem('authToken');
    
    if (savedUser && authToken) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Simulate API call
    //const foundUser = MOCK_USERS.find(u => u.email === email && u.role === role);
    const response = await fetch(backend_url + "login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    // await checkandUpdateData()
    // console.log(data)
    
    if (data.success) {
      const foundUser = {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        classes: data.classes || [],
        sections: data.sections || []
      };
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('echo_user', JSON.stringify(foundUser));
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('userSession', JSON.stringify({
        email: data.email,
        name: data.fullName,
        role: data.role,
        loginTime: new Date().toISOString()
      }));
      if (role === 'student') 
      await generateDailyData(); // Fetch daily data on login
      return true;
    }
    
    return false;
  };
      // send.ts
    async function createStudentAccount(email: string, classes, section, password: string, fullName: string, role) {
      console.log('Creating student account:', { email, classes, section, password });
      try {
        const res = await fetch(backend_url + 'create_account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            classes,
            section,
            password,
            fullName,
            role
          }),
        });

        const data = await res.json();
        console.log(data);
        
        return data;
      } catch (err) {
        console.error('Error:', err);
        throw err;
      }
    }


  const register = async (userData: RegisterData): Promise<boolean> => {
    // Simulate API call - check if user already exists
    // const existingUser = MOCK_USERS.find(u => u.email === userData.email);/
    
    // if (existingUser) {
    //   return false; // User already exists
    // }

    // Create new user
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role,
      classes: userData.classes,
      sections: userData.sections
    };
    let data = await createStudentAccount(userData.email, userData.classes, userData.sections, userData.password, userData.fullName, userData.role );
    if (data.status === "exists") {
        // alert("Warning: Account already exists!");
        return false;
      }
    // Add to mock database
    // MOCK_USERS.push(newUser);
    
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('echo_user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userSession');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      isAuthenticated
    }}>
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
