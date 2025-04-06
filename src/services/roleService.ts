
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
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user roles:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Check if the user has a specific role
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', roleName)
      .limit(1);

    if (error) {
      console.error('Error checking user role:', error);
      throw new Error(error.message);
    }

    return data && data.length > 0;
  },

  // Assign a role to a user
  async assignRole(userId: string, roleName: string): Promise<UserRole> {
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: roleName
      })
      .select()
      .single();

    if (error) {
      console.error('Error assigning role:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Remove a role from a user
  async removeRole(userId: string, roleName: string): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', roleName);

    if (error) {
      console.error('Error removing role:', error);
      throw new Error(error.message);
    }
  }
};
