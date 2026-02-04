
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Define the shape of our auth context
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  isInternal: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, meta?: any) => Promise<{ error: any; data?: any }>;
  signOut: () => Promise<void>;
  setUserRole: (role: string) => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  isInternal: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  setUserRole: () => {}
});

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isInternal, setIsInternal] = useState<boolean>(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
          setIsInternal(false);
        }
      }
    );

    // Get current session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserRole(session.user.id);
      }
      
      setLoading(false);
    };

    initializeAuth();

    // Cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user role from database
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, is_internal')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle case where user has no role

      if (error) {
        // Only log non-404 errors (PGRST116 is expected when user has no role)
        if (error.code !== 'PGRST116') {
          console.error('Error fetching user role:', error);
        }
        setUserRole(null);
        setIsInternal(false);
        return;
      }

      if (data) {
        setUserRole(data.role);
        setIsInternal(data.is_internal === true);
      } else {
        setUserRole(null);
        setIsInternal(false);
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setUserRole(null);
      setIsInternal(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!error && data?.user) {
        await fetchUserRole(data.user.id);
      }

      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, meta?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: meta || {}
        }
      });

      return { error, data };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserRole(null);
      setIsInternal(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Context value
  const value = {
    user,
    session,
    loading,
    userRole,
    isInternal,
    signIn,
    signUp,
    signOut,
    setUserRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
