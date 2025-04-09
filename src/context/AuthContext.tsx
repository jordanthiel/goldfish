
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

// Update the context types
interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  userRoles: string[];
  isClient: boolean;
  isTherapist: boolean;
  isAdmin: boolean;
  checkHasRole: (role: string) => boolean;
  checkClaim: (key: string, value?: any) => boolean;
  getSession: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const navigate = useNavigate();

  // Function to check for pending client invitations for a user
  const checkPendingInvitations = async (userId: string, userEmail: string) => {
    try {
      // This function doesn't exist, so we should avoid calling it directly
      // const { data, error } = await supabase.rpc('check_pending_invitations', {
      //   user_id_param: userId,
      //   email_param: userEmail
      // });

      // Instead, we'll check directly from the client_invitations table
      const { data, error } = await supabase
        .from('client_invitations')
        .select('*')
        .eq('email', userEmail)
        .eq('status', 'pending')
        .eq('claimed', false);
      
      if (error) throw error;
      
      // Process any pending invitations
      if (data && data.length > 0) {
        console.log('Found pending invitations:', data);
        
        // We would handle pending invitations here
        // For example, auto-claim them or show a notification to the user
      }
    } catch (error) {
      console.error('Error checking pending invitations:', error);
    }
  };

  // Function to sync user auth state with our state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      
      if (session && session.user) {
        setUser(session.user);
        
        try {
          // Get user roles
          const { data: roles, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);
            
          if (error) throw error;
          
          const roleNames = roles.map(r => r.role);
          setUserRoles(roleNames);
          
          // Check for pending invitations after login
          if (event === 'SIGNED_IN') {
            await checkPendingInvitations(session.user.id, session.user.email || '');
          }
        } catch (error) {
          console.error('Error getting user roles:', error);
          setUserRoles([]);
        }
      } else {
        setUser(null);
        setUserRoles([]);
      }
      
      setLoading(false);
    });

    // Check current session on mount
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user) {
          setUser(session.user);
          
          // Get user roles
          const { data: roles, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);
            
          if (error) throw error;
          
          const roleNames = roles.map(r => r.role);
          setUserRoles(roleNames);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
      
      setLoading(false);
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign in. Please check your credentials.' 
      };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign up. Please try again.' 
      };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check if the user has a specific role
  const checkHasRole = (role: string) => {
    return userRoles.includes(role);
  };

  // Check if the user has a specific claim
  const checkClaim = (key: string, value?: any) => {
    if (!user) return false;
    
    const claims = user.app_metadata;
    if (!claims) return false;
    
    return value !== undefined ? claims[key] === value : !!claims[key];
  };

  // Get the current session
  const getSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  };

  // Computed properties
  const isClient = checkHasRole('client');
  const isTherapist = checkHasRole('therapist');
  const isAdmin = checkHasRole('admin');

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      userRoles,
      isClient,
      isTherapist,
      isAdmin,
      checkHasRole,
      checkClaim,
      getSession,
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
