
import { createContext, useState, useContext, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { currentUser } from '../data/mockData';

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(currentUser); // Use mock user for demo
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Set to true for demo

  // Mock login function
  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, this would call an API
    console.log('Login attempt with:', email, password);
    
    // Always succeed for the demo
    setUser(currentUser);
    setIsAuthenticated(true);
    return true;
  };

  // Mock logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  // Mock register function
  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    // In a real app, this would call an API
    console.log('Registration attempt:', name, email, password, role);
    
    // Always succeed for the demo
    setUser({
      ...currentUser,
      name,
      email,
      role,
    });
    setIsAuthenticated(true);
    return true;
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    register,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
