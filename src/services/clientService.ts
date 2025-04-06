
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface Client {
  id: string;
  therapist_id: string;
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

  // Create a new client with HIPAA compliance
  async createClient(client: ClientInput): Promise<Client> {
    // Get current user id
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...client,
        status: client.status || 'Active',
        therapist_id: user.id,
        consent_date: client.consent_date || new Date().toISOString(),
        consent_version: client.consent_version || '1.0'
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
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
