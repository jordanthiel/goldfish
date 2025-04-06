
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { roleService } from '@/services/roleService';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<void>;
  signIn: (email: string, password: string, role?: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  // Separate function to fetch user role to avoid recursion issues
  const fetchUserRole = async (userId: string) => {
    try {
      const roles = await roleService.getUserRoles(userId);
      console.log('Fetched roles:', roles);
      if (roles.length > 0) {
        setUserRole(roles[0].role);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // If signed in, fetch the user's role
        if (event === 'SIGNED_IN' && currentSession?.user) {
          // Use setTimeout to prevent recursion issues with Supabase
          setTimeout(async () => {
            try {
              await fetchUserRole(currentSession.user.id);
              
              toast({
                title: "Welcome back!",
                description: "You have successfully signed in.",
              });
            } catch (error) {
              console.error("Error fetching user role:", error);
            }
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          setUserRole(null);
          toast({
            title: "Signed out",
            description: "You have been signed out successfully.",
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log('Getting existing session:', currentSession?.user?.id);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // If session exists, fetch the user's role
      if (currentSession?.user) {
        try {
          await fetchUserRole(currentSession.user.id);
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: string = 'therapist') => {
    try {
      setLoading(true);
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      
      // Assign role to the new user
      if (data.user) {
        try {
          // Assign the selected role to the user
          await roleService.assignRole(data.user.id, role);
          console.log(`${role} role assigned successfully`);
        } catch (roleError) {
          console.error(`Error assigning ${role} role:`, roleError);
          // We'll continue even if role assignment fails, as the user can try again later
        }
      }
      
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      
      // Removed the navigate call to login - the component will now handle the success state
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, role?: string) => {
    try {
      setLoading(true);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // If role is specified, verify that the user has this role
      if (role && data.user) {
        try {
          // Fetch user roles first
          const userRoles = await roleService.getUserRoles(data.user.id);
          console.log('User roles during login:', userRoles);
          
          // Check if the user has the required role
          const hasRole = userRoles.some(userRole => userRole.role === role);
          
          if (!hasRole) {
            // If user doesn't have the specified role, sign out and throw an error
            await supabase.auth.signOut();
            setUserRole(null);
            throw new Error(`You don't have access as a ${role}. Please sign in with the correct account or contact support.`);
          }
          
          setUserRole(role);
        } catch (roleError: any) {
          // If there's an error checking roles, sign out and throw the error
          await supabase.auth.signOut();
          console.error("Error checking user role during login:", roleError);
          throw roleError;
        }
      }

      // Fetch the user's role to determine navigation
      if (data.user) {
        const userRoles = await roleService.getUserRoles(data.user.id);
        const userRole = userRoles.length > 0 ? userRoles[0].role : null;
        setUserRole(userRole);

        // Navigate based on role
        if (userRole === 'client') {
          navigate('/patient/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUserRole(null);
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        signUp,
        signIn,
        signOut,
        loading,
        userRole,
      }}
    >
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
