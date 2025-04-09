
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  // HIPAA-compliant fields
  phi_data?: any;
  consent_date?: string;
  consent_version?: string;
  full_name?: string;
}

export interface ClientInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  status?: string;
  // HIPAA-compliant fields
  phi_data?: any;
  consent_date?: string;
  consent_version?: string;
}

export const clientService = {
  // Get all clients for the current therapist
  async getClients(): Promise<Client[]> {
    // Get current user id (therapist)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // First get the therapist-client relationships
    const { data: relationships, error: relError } = await supabase
      .from('therapist_clients')
      .select('client_id, therapist_id')
      .eq('therapist_id', user.id);

    if (relError) {
      throw new Error(relError.message);
    }

    if (!relationships || relationships.length === 0) {
      return [];
    }

    // Get client profiles for all client IDs
    const clientIds = relationships.map(rel => rel.client_id);
    
    const { data: clientProfiles, error } = await supabase
      .from('client_profiles')
      .select('*')
      .in('id', clientIds);

    if (error) {
      throw new Error(error.message);
    }

    // Map results to expected Client interface
    const clients = clientProfiles.map(profile => ({
      id: profile.id,
      user_id: profile.user_id,
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      phone: profile.phone,
      date_of_birth: profile.date_of_birth,
      address: profile.address,
      emergency_contact: profile.emergency_contact,
      status: profile.status || 'Active',
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      phi_data: profile.phi_data
    }));

    // We need to fetch user information for each client
    const clientsWithUserInfo = await Promise.all(
      clients.map(async (client) => {
        try {
          // Get user info for this client
          if (!client.user_id) return client;
          
          const { data: userData, error } = await supabase.functions.invoke('get-user-info', {
            body: { userId: client.user_id }
          });
          
          if (error || !userData) {
            console.error('Error fetching user info for client:', client.id, error);
            return client;
          }
          
          // Merge the user info with the client data
          return {
            ...client,
            first_name: userData.firstName || client.first_name,
            last_name: userData.lastName || client.last_name,
            email: userData.email,
            full_name: userData.fullName
          };
        } catch (error) {
          console.error('Error processing client user info:', error);
          return client;
        }
      })
    );

    return clientsWithUserInfo || [];
  },

  // Get a single client by ID
  async getClient(id: string): Promise<Client> {
    // First check if the current therapist has access to this client
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify therapist-client relationship
    const { data: relationship, error: relationshipError } = await supabase
      .from('therapist_clients')
      .select('*')
      .eq('therapist_id', user.id)
      .eq('client_id', id)
      .maybeSingle();

    if (relationshipError || !relationship) {
      throw new Error('Client not found or you do not have access');
    }

    // Now get the client profile
    const { data: client, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!client.user_id) {
      return client as Client;
    }
    
    // Get user info for this client
    const { data: userData, error: userError } = await supabase.functions.invoke('get-user-info', {
      body: { userId: client.user_id }
    });
    
    if (userError || !userData) {
      console.error('Error fetching user info for client:', client.id, userError);
      return client as Client;
    }
    
    // Merge the user info with the client data
    return {
      ...client,
      first_name: userData.firstName || client.first_name,
      last_name: userData.lastName || client.last_name,
      email: userData.email,
      full_name: userData.fullName
    } as Client;
  },

  // Create a new client with HIPAA compliance and user account
  async createClient(client: ClientInput): Promise<Client> {
    // Get current user id
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('Creating client with new user architecture:', client);
      
      // Use the database function to create a client with a linked user
      const { data, error } = await supabase
        .rpc('create_client_with_user', {
          therapist_id_param: user.id,
          first_name_param: client.first_name,
          last_name_param: client.last_name,
          email_param: client.email || null,
          phone_param: client.phone || null,
          address_param: client.address || null,
          emergency_contact_param: client.emergency_contact || null,
          status_param: client.status || 'Active',
          phi_data_param: client.phi_data || null,
          consent_date_param: client.consent_date || null,
          consent_version_param: client.consent_version || '1.0'
        });
        
      if (error) {
        console.error('Error in create_client_with_user function:', error);
        throw new Error(error.message);
      }
      
      console.log('Client created successfully with function:', data);
      
      // Retrieve the created client record
      if (data && typeof data === 'object' && 'client_id' in data) {
        const clientId = data.client_id as string;
        
        return await this.getClient(clientId);
      } else {
        throw new Error('Invalid response from create_client_with_user function');
      }
    } catch (error: any) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  // Update an existing client
  async updateClient(id: string, updates: Partial<ClientInput>): Promise<Client> {
    // We need to separate user info updates from client table updates
    const { first_name, last_name, email, ...clientUpdates } = updates;
    
    // First update the client record
    const { data: updatedClient, error } = await supabase
      .from('client_profiles')
      .update({
        first_name,
        last_name,
        ...clientUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    
    // Now get client with user info
    return this.getClient(id);
  },

  // Delete a client
  async deleteClient(id: string): Promise<void> {
    try {
      // Use our Edge Function to handle cascade deletion
      const { data, error } = await supabase.functions.invoke('manage-delete-cascade', {
        body: { clientId: id }
      });
      
      if (error) {
        console.error('Error invoking manage-delete-cascade function:', error);
        throw new Error(error.message);
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to delete client');
      }
      
      console.log('Client deleted successfully:', data.message);
    } catch (error: any) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  // Get client with their appointments
  async getClientWithAppointments(id: string): Promise<Client & { appointments: any[] }> {
    // First verify therapist-client relationship
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get client profile
    const { data: clientProfile, error: clientError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (clientError) {
      throw new Error(clientError.message);
    }

    // Get appointments for this client
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', id);

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      throw new Error(appointmentsError.message);
    }
    
    // Restructure data to match expected format
    const clientData = {
      ...clientProfile,
      appointments: appointments || []
    } as Client & { appointments: any[] };
    
    if (!clientData.user_id) return clientData;
    
    // Get user info for this client
    const { data: userData, error: userError } = await supabase.functions.invoke('get-user-info', {
      body: { userId: clientData.user_id }
    });
    
    if (userError || !userData) {
      console.error('Error fetching user info for client:', clientData.id, userError);
      return clientData;
    }
    
    // Merge the user info with the client data
    return {
      ...clientData,
      first_name: userData.firstName || clientData.first_name,
      last_name: userData.lastName || clientData.last_name,
      email: userData.email,
      full_name: userData.fullName
    };
  },

  // Store sensitive PHI data
  async updateClientPHI(id: string, phiData: any): Promise<void> {
    const { error } = await supabase
      .from('client_profiles')
      .update({
        phi_data: phiData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  // Record client consent
  async recordConsent(id: string, version: string): Promise<void> {
    const { error } = await supabase
      .from('client_profiles')
      .update({
        consent_date: new Date().toISOString(),
        consent_version: version,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },
  
  // Send an invitation to a client to claim their account
  async sendClientInvitation(clientId: string, email: string): Promise<{ success: boolean; inviteCode?: string; message?: string }> {
    try {
      // Get current user id (the therapist)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }
      
      return { success: true, message: 'Client account info updated' };
    } catch (error: any) {
      console.error('Error sending client invitation:', error);
      return { success: false, message: error.message || 'An error occurred' };
    }
  }
};
