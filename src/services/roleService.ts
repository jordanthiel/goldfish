
import { supabase } from '@/integrations/supabase/client';

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const roleService = {
  // Get current user's roles using our security definer function
  async getUserRoles(userId: string): Promise<UserRole[]> {
    // Use the RPC endpoint to call our security definer function
    const { data, error } = await supabase
      .rpc('get_user_roles', { user_id_param: userId });

    if (error) {
      console.error('Error fetching user roles:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Check if the user has a specific role using our security definer function
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('user_has_role', { 
        user_id_param: userId,
        role_name: roleName
      });

    if (error) {
      console.error('Error checking user role:', error);
      throw new Error(error.message);
    }

    return data || false;
  },

  // Assign a role to a user
  async assignRole(userId: string, roleName: string): Promise<UserRole> {
    // First try to use our new add_role_to_user function
    try {
      // Use a direct function call with the appropriate parameters instead of rpc
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: roleName
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (rpError) {
      console.error('Error assigning role, falling back to direct insert:', rpError);
      
      // Fallback to direct insert if first attempt fails
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
    }
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
