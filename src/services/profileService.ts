import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export const profileService = {
  // Get the current user's profile
  async getCurrentProfile(): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error in getCurrentProfile:', error);
      return null;
    }
  },

  // Get a profile by user ID
  async getProfileById(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error in getProfileById:', error);
      return null;
    }
  },

  // Update the current user's profile
  async updateProfile(updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return null;
    }
  },

  // Get all profiles (for internal users)
  async getAllProfiles(options?: {
    limit?: number;
    offset?: number;
    searchQuery?: string;
  }): Promise<{ data: Profile[]; count: number }> {
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (options?.searchQuery) {
        query = query.or(
          `email.ilike.%${options.searchQuery}%,full_name.ilike.%${options.searchQuery}%`
        );
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching profiles:', error);
        return { data: [], count: 0 };
      }

      return { data: (data || []) as Profile[], count: count || 0 };
    } catch (error) {
      console.error('Error in getAllProfiles:', error);
      return { data: [], count: 0 };
    }
  },

  // Check if a profile exists for a user
  async profileExists(userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('id', userId);

      if (error) {
        console.error('Error checking profile existence:', error);
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error in profileExists:', error);
      return false;
    }
  },

  // Manually create a profile (useful for edge cases)
  async createProfile(userId: string, profileData: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...profileData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error in createProfile:', error);
      return null;
    }
  },
};
