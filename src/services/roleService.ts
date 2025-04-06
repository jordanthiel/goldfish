
import { supabase } from '@/integrations/supabase/client';

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const roleService = {
  // Get current user's roles
  async getUserRoles(userId: string): Promise<UserRole[]> {
    // Use explicit typing to work around TypeScript limitations
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId) as any;

    if (error) {
      console.error('Error fetching user roles:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Check if the user has a specific role
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    // Use explicit typing to work around TypeScript limitations
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', roleName)
      .single() as any;

    if (error && error.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
      console.error('Error checking user role:', error);
      throw new Error(error.message);
    }

    return !!data;
  },

  // Assign a role to a user
  async assignRole(userId: string, roleName: string): Promise<UserRole> {
    // Use explicit typing to work around TypeScript limitations
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: roleName
      })
      .select()
      .single() as any;

    if (error) {
      console.error('Error assigning role:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Remove a role from a user
  async removeRole(userId: string, roleName: string): Promise<void> {
    // Use explicit typing to work around TypeScript limitations
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', roleName) as any;

    if (error) {
      console.error('Error removing role:', error);
      throw new Error(error.message);
    }
  }
};
