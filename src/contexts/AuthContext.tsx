import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  account, 
  createAccount, 
  login, 
  loginWithGoogle, 
  loginWithApple, 
  logout, 
  getCurrentUser,
  createUserProfile,
  getUserProfile,
  assignUserToTeam,
  CAR_OWNERS_TEAM_ID,
  GARAGE_OPERATORS_TEAM_ID,
  ADMINS_TEAM_ID
} from '../services/appwrite';
import { Models } from 'appwrite';

// Define user roles
export enum UserRole {
  CAR_OWNER = 'car_owner',
  GARAGE_OPERATOR = 'garage_operator',
  ADMIN = 'admin',
  GUEST = 'guest'
}

// Define user interface
interface User extends Models.User {
  role?: UserRole;
  profile?: any;
}

// Define auth context interface
interface AuthContextProps {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

// Create auth context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Clear error
  const clearError = () => setError(null);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          // Get user profile
          const profile = await getUserProfile(currentUser.$id);
          
          // Set user with profile and role
          setUser({
            ...currentUser,
            profile,
            role: profile?.role || UserRole.GUEST
          });
          
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Register new user
  const register = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      setLoading(true);
      clearError();
      
      // Create account
      const newUser = await createAccount(email, password, name);
      
      if (newUser) {
        // Create user profile with role
        const profile = await createUserProfile(newUser.$id, {
          name,
          email,
          role,
          createdAt: new Date().toISOString(),
        });
        
        // Assign user to appropriate team based on role
        let teamId = '';
        switch (role) {
          case UserRole.CAR_OWNER:
            teamId = CAR_OWNERS_TEAM_ID;
            break;
          case UserRole.GARAGE_OPERATOR:
            teamId = GARAGE_OPERATORS_TEAM_ID;
            break;
          case UserRole.ADMIN:
            teamId = ADMINS_TEAM_ID;
            break;
          default:
            teamId = CAR_OWNERS_TEAM_ID; // Default to car owner
        }
        
        await assignUserToTeam(newUser.$id, teamId);
        
        // Set user with profile and role
        setUser({
          ...newUser,
          profile,
          role
        });
        
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      clearError();
      
      // Login
      await login(email, password);
      
      // Get current user
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        // Get user profile
        const profile = await getUserProfile(currentUser.$id);
        
        // Set user with profile and role
        setUser({
          ...currentUser,
          profile,
          role: profile?.role || UserRole.GUEST
        });
        
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      clearError();
      
      await loginWithGoogle();
      
      // Note: The page will redirect to the callback URL,
      // so we don't need to set the user here.
      // The user will be set when the page loads again and the useEffect runs.
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Google sign in failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Apple
  const signInWithApple = async () => {
    try {
      setLoading(true);
      clearError();
      
      await loginWithApple();
      
      // Note: The page will redirect to the callback URL,
      // so we don't need to set the user here.
      // The user will be set when the page loads again and the useEffect runs.
    } catch (err: any) {
      console.error('Apple sign in error:', err);
      setError(err.message || 'Apple sign in failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      clearError();
      
      await logout();
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Sign out failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auth context value
  const value: AuthContextProps = {
    user,
    loading,
    error,
    isAuthenticated,
    register,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
