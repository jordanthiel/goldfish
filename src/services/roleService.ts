
import { supabase } from '@/integrations/supabase/client';

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const roleService = {
  // Get all roles for a user
  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
      .rpc('get_user_roles', { user_id_param: userId });

    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }

    return data || [];
  },

  // Check if a user has a specific role
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('user_has_role', { user_id_param: userId, role_name: roleName });

    if (error) {
      console.error('Error checking role:', error);
      return false;
    }

    return data || false;
  },

  // Assign a role to a user
  async assignRole(userId: string, roleName: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase
      .rpc('add_role_to_user', { user_id_param: userId, role_name: roleName });

    if (error) {
      console.error('Error assigning role:', error);
      return { success: false, message: error.message };
    }

    return { success: true, message: data as string };
  },

  // Remove a role from a user
  async removeRole(userId: string, roleName: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', roleName);

    if (error) {
      console.error('Error removing role:', error);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Role removed successfully' };
  },
  
  // Add a role to a user (alias for assignRole for backward compatibility)
  async addRole(userId: string, roleName: string): Promise<{ success: boolean; message: string }> {
    return this.assignRole(userId, roleName);
  }
};
