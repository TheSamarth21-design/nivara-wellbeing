import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { AuthContextType, UserProfile, UserRole } from '../types/auth';
import { ApiClient } from '../lib/apiClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const userProfile = await userService.getUserProfile(firebaseUser.uid);
          
          if (userProfile) {
            setProfile(userProfile);
            setRole(userProfile.role);
            if (userProfile.wellbeingId) {
              ApiClient.setWellbeingId(userProfile.wellbeingId);
            }
          } else {
            // Profile does not exist yet; user will need to complete role profile or login with role
            setProfile(null);
            setRole(null);
          }
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      } catch (err) {
        console.error('Error synchronizing auth state:', err);
        setUser(null);
        setProfile(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, selectedRole: UserRole) => {
    setLoading(true);
    try {
      const { user: authedUser, profile: authedProfile } = await authService.loginWithEmail(
        email,
        password,
        selectedRole
      );
      setUser(authedUser);
      setProfile(authedProfile);
      setRole(authedProfile.role);
      if (authedProfile.wellbeingId) {
        ApiClient.setWellbeingId(authedProfile.wellbeingId);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, selectedRole: UserRole) => {
    setLoading(true);
    try {
      const { user: registeredUser, profile: registeredProfile } = await authService.registerWithEmail(
        email,
        password,
        name,
        selectedRole
      );
      setUser(registeredUser);
      setProfile(registeredProfile);
      setRole(registeredProfile.role);
      if (registeredProfile.wellbeingId) {
        ApiClient.setWellbeingId(registeredProfile.wellbeingId);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    role,
    loading,
    isAuthenticated: !!user && !!profile,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
