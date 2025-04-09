
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  therapist_id: string;
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
  updated_at: string;
  // New HIPAA-compliant fields
  phi_data?: any;
  consent_date?: string;
  consent_version?: string;
  encryption_key_id?: string;
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
  // New HIPAA-compliant fields
  phi_data?: any;
  consent_date?: string;
  consent_version?: string;
}

export const clientService = {
  // Get all clients for the current user
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('last_name');

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get a single client by ID
  async getClient(id: string): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
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
        
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();
          
        if (clientError) {
          throw new Error(clientError.message);
        }
        
        return clientData;
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
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Delete a client
  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  // Get client with their appointments
  async getClientWithAppointments(id: string): Promise<Client & { appointments: any[] }> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        appointments (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Store sensitive PHI data
  async updateClientPHI(id: string, phiData: any): Promise<void> {
    const { error } = await supabase
      .from('clients')
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
      .from('clients')
      .update({
        consent_date: new Date().toISOString(),
        consent_version: version,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }
};
