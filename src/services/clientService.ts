import { supabase } from '@/integrations/supabase/client';

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
}

export const getClientWithAppointments = async (id: string): Promise<Client & { appointments: any[] }> => {
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
  
  if (data) {
    data.full_name = `${data.first_name} ${data.last_name}`;
  }

  return data;
};

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

    const clientsWithFullName = (data || []).map(client => ({
      ...client,
      full_name: `${client.first_name} ${client.last_name}`
    }));

    return clientsWithFullName;
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

    data.full_name = `${data.first_name} ${data.last_name}`;
    
    return data;
  },

  // Create a new client
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
        therapist_id: user.id
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    data.full_name = `${data.first_name} ${data.last_name}`;
    
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

    data.full_name = `${data.first_name} ${data.last_name}`;
    
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

  // Also keep the method on the service object for backward compatibility
  getClientWithAppointments
};
