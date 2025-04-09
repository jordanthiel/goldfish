import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { roleService } from '@/services/roleService';
import { patientService } from '@/services/patientService';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<void>;
  signIn: (email: string, password: string, role?: string, inviteCode?: string) => Promise<void>;
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

  const checkPendingInvitations = async (email: string) => {
    try {
      console.log("Checking for pending invitations for email:", email);
      
      try {
        const { error } = await supabase.rpc('check_pending_invitations', { 
          email_param: email 
        });
        
        if (error) {
          console.log("Client invitations system not set up yet:", error.message);
          return;
        }
      } catch (error) {
        console.log("Client invitations system not available:", error);
        return;
      }
      
      try {
        const result = await patientService.claimPatientAccount("");
        
        if (result && result.success) {
          toast({
            title: "Account linked",
            description: "Your account has been successfully linked to your therapist.",
          });
        }
      } catch (claimError) {
        console.error("Error claiming patient account:", claimError);
      }
    } catch (error) {
      console.error("Error in invitation check:", error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN' && currentSession?.user) {
          setTimeout(async () => {
            try {
              await fetchUserRole(currentSession.user.id);
              
              if (currentSession.user.email) {
                await checkPendingInvitations(currentSession.user.email);
              }
              
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

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log('Getting existing session:', currentSession?.user?.id);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        try {
          await fetchUserRole(currentSession.user.id);
          
          if (currentSession.user.email) {
            await checkPendingInvitations(currentSession.user.email);
          }
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

  useEffect(() => {
    const fetchRoles = async () => {
      if (user) {
        try {
          const roles = await roleService.getUserRoles(user.id);
          console.log('Fetched roles:', roles);
          if (roles.length > 0) {
            setUserRole(roles[0].role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
    };

    if (user) {
      fetchRoles();
      
      const checkInvitations = async () => {
        try {
          console.log("Checking for pending invitations for email:", user.email);
          const { data, error } = await supabase.functions.invoke('check-client-invitations', {
            body: { email: user.email }
          });
          
          if (error) {
            console.error('Client invitations system not set up yet:', error.message);
          } else if (data && data.invitations && data.invitations.length > 0) {
            console.log("Found pending invitations:", data.invitations);
            // Handle invitations logic here
          }
        } catch (err) {
          console.error('Client invitations system not set up yet:', err);
        }
      };
      
      checkInvitations();
    }
  }, [user]);

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
      
      if (data.user) {
        try {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: role
            });
            
          if (roleError) {
            console.error(`Error assigning ${role} role:`, roleError);
          } else {
            console.log(`${role} role assigned successfully`);
          }
        } catch (roleError) {
          console.error(`Error assigning ${role} role:`, roleError);
          // We'll continue even if role assignment fails, as the user can try again later
        }
      }
      
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      
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

  const signIn = async (email: string, password: string, role?: string, inviteCode?: string) => {
    try {
      setLoading(true);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      let userRoles: any[] = [];
      if (data.user) {
        try {
          userRoles = await roleService.getUserRoles(data.user.id);
          console.log('User roles during login:', userRoles);
        } catch (roleError) {
          console.error("Error checking user roles during login:", roleError);
        }
      }

      if (role && data.user) {
        const hasRole = userRoles.some(userRole => userRole.role === role);
        
        if (!hasRole) {
          if (userRoles.length === 0) {
            console.warn("No roles found for user, but continuing login");
          } else {
            await supabase.auth.signOut();
            setUserRole(null);
            throw new Error(`You don't have access as a ${role}. Please sign in with the correct account or contact support.`);
          }
        }
      }

      const userRole = userRoles.length > 0 ? userRoles[0].role : null;
      setUserRole(userRole);

      if (inviteCode && data.user) {
        try {
          console.log("Processing invite code during login:", inviteCode);
          const result = await patientService.claimPatientAccount(inviteCode);
          
          if (result && typeof result === 'object' && 'success' in result && result.success) {
            toast({
              title: "Account linked",
              description: "Your account has been successfully linked to your therapist.",
            });
            
            if (!userRoles.some(r => r.role === 'client')) {
              try {
                await roleService.assignRole(data.user.id, 'client');
                console.log("Added client role to user");
                setUserRole('client');
              } catch (roleError) {
                console.error("Error adding client role:", roleError);
              }
            }
          }
        } catch (inviteError: any) {
          console.error("Error processing invite during login:", inviteError);
          toast({
            title: "Invitation error",
            description: inviteError.message || "Could not process your invitation",
            variant: "destructive",
          });
        }
      } else {
        if (data.user?.email) {
          await checkPendingInvitations(data.user.email);
        }
      }

      if (userRole === 'client') {
        navigate('/patient/dashboard');
      } else {
        navigate('/dashboard');
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
