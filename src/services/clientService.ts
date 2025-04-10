import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import type { Appointment } from './appointmentService';

// Define the ClientProfile type
export interface ClientProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address: string;
  emergency_contact: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  phi_data?: Json;
}

// Define the Client type
export interface Client {
  id: number;
  client_id: string;
  therapist_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  client_profile: ClientProfile;
  appointmentsList?: Appointment[];
}

// Define the Appointment type
export interface Appointment {
  id: string;
  client_id: string;
  therapist_id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Define the ClientInvitation type
export interface ClientInvitation {
  id: string;
  therapist_id: string;
  client_id: string;
  email: string;
  invite_code: string;
  status: string;
  claimed: boolean;
  created_at: string;
  expires_at: string;
}

// Function to get all clients for a therapist
export const getClients = async (therapistId: string): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('therapist_clients')
      .select(`
        *,
        client_profile:client_profiles!client_id(*)
      `)
      .eq('therapist_id', therapistId);

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    return (data || []).map(client => ({
      ...client,
      client_profile: client.client_profile as ClientProfile
    }));
  } catch (error) {
    console.error('Error in getClients:', error);
    throw error;
  }
};

// Function to get a single client by ID
export const getClientById = async (clientId: string): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('therapist_clients')
      .select(`
        *,
        client_profile:client_profiles!client_id(*)
      `)
      .eq('client_id', clientId)
      .single();

    if (error) {
      console.error('Error fetching client:', error);
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      client_profile: data.client_profile as ClientProfile
    };
  } catch (error) {
    console.error('Error in getClientById:', error);
    throw error;
  }
};

// Function to create a new client
export const createClient = async (clientData: Omit<ClientProfile, 'id' | 'created_at' | 'updated_at'>): Promise<Client> => {
  try {
    // First, create the client profile
    const { data: profileData, error: profileError } = await supabase
      .from('client_profiles')
      .insert([clientData])
      .select()
      .single();

    if (profileError) {
      console.error('Error creating client profile:', profileError);
      throw profileError;
    }

    // Then, create the therapist-client relationship
    const { data: relationData, error: relationError } = await supabase
      .from('therapist_clients')
      .insert([{
        client_id: profileData.id,
        therapist_id: clientData.user_id,
        status: 'active'
      }])
      .select(`
        *,
        client_profiles!client_id(*)
      `)
      .single();

    if (relationError) {
      console.error('Error creating therapist-client relationship:', relationError);
      throw relationError;
    }

    return relationData as Client;
  } catch (error) {
    console.error('Error in createClient:', error);
    throw error;
  }
};

// Function to update a client
export const updateClient = async (clientId: string, updates: Partial<ClientProfile>): Promise<Client> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }

    const client = await getClientById(clientId);
    if (!client) {
      throw new Error('Updated client not found');
    }

    return client;
  } catch (error) {
    console.error('Error in updateClient:', error);
    throw error;
  }
};

// Function to delete a client
export const deleteClient = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting client:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting client:', error);
    return false;
  }
};

// Function to create a new appointment for a client
const createAppointment = async (appointment: Partial<Appointment>): Promise<Appointment | null> => {
  try {
    // Ensure we have all required fields
    if (!appointment.client_id || !appointment.therapist_id || !appointment.title || 
        !appointment.start_time || !appointment.end_time) {
      throw new Error('Missing required appointment fields');
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        client_id: appointment.client_id,
        therapist_id: appointment.therapist_id,
        title: appointment.title,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: appointment.status || 'Scheduled',
        notes: appointment.notes
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

// Function to update an existing appointment
const updateAppointment = async (id: string, updates: Partial<Appointment>): Promise<Appointment | null> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

// Function to delete an appointment
const deleteAppointment = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return false;
  }
};

// Function to get a single appointment by ID
const getAppointment = async (id: string): Promise<Appointment | null> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error getting appointment:', error);
    throw error;
  }
};

// Function to get all appointments
const getAppointments = async (): Promise<Appointment[]> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting appointments:', error);
    throw error;
  }
};

// Function to get all appointments for a single client
const getClientAppointments = async (clientId: string): Promise<Appointment[]> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', clientId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching client appointments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting client appointments:', error);
    throw error;
  }
};

// Function to get a client with their appointments
const getClientWithAppointments = async (clientId: string) => {
  console.log('getClientWithAppointments', clientId)
  try {
    // First, get the client profile data
    const { data: client, error: clientError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', clientId)
      .single();
    
    console.log('getClientWithAppointments', client)
    if (clientError) throw clientError;
    if (!client) throw new Error('Client record not found');
    
    // Then get appointments for this client separately
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', clientId)
      .order('start_time', { ascending: false });
    
    console.log('appointments', appointments)
    if (appointmentsError) throw appointmentsError;

    // Get email from user_id if available
    let email = '';
    if (client.user_id) {
      const { data: userData, error: userError } = await supabase
        .rpc('get_client_user_info', { client_id_param: client.id });
        
        if (!userError && userData && typeof userData === 'object' && 'success' in userData && userData.success) {
          email = 'email' in userData ? userData.email as string : '';
        }
      }

    // Combine the data
    return {
      ...client,
      email,
      appointmentsList: appointments || []  // Use appointmentsList instead of appointments 
    };
  } catch (error) {
    console.error('Error fetching client with appointments:', error);
    throw error;
  }
};

// Function to search for a user by email
const searchUserByEmail = async (email: string): Promise<{exists: boolean, user?: any}> => {
  try {
    // Use Supabase function to search for a user by email
    // Make sure to typecast the response to handle success property
    const { data, error } = await supabase
      .functions.invoke('search-user-by-email', {
        body: { email }
      });
    
    if (error) {
      console.error('Error searching for user:', error);
      return {
        exists: false,
        user: undefined
      };
    }
    
    return {
      exists: data && typeof data === 'object' && 'success' in data ? !!data.success : false,
      user: data && typeof data === 'object' && 'success' in data && data.success ? data : undefined
    };
  } catch (error) {
    console.error('Error searching for user by email:', error);
    throw error;
  }
};

// Function to send a client invitation by email only
const sendClientInvitation = async (email: string): Promise<{ success: boolean; invitation?: any; message?: string }> => {
  try {
    // Generate an invitation code (simplified for this example)
    const inviteCode = Math.random().toString(36).substring(2, 15);
    
    // In a real app, you would send an email with the invitation link
    console.log(`Invitation code generated: ${inviteCode}`);
    console.log(`This would send an email to ${email} with the invitation link`);
    
    return {
      success: true,
      invitation: {
        email,
        invite_code: inviteCode
      }
    };
  } catch (error) {
    console.error('Error sending client invitation:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    } else {
      return { success: false, message: 'Unknown error occurred' };
    }
  }
};

// Function to create a client invitation using RPC
const inviteClient = async (email: string) => {
  try {
    // Since we don't have the actual RPC function, we'll simulate it
    console.log(`Creating invitation for ${email}`);
    
    // Return a simulated successful response
    return { 
      success: true, 
      message: `Invitation sent to ${email}`,
      inviteId: 'simulated-invite-id'
    };
  } catch (error) {
    console.error('Error inviting client:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Failed to invite client' };
  }
};

// Send invitation for an existing client ID
const sendClientInvitationById = async (clientId: string, email: string) => {
  try {
    // Check if the client exists
    const client = await getClientById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    
    // Create the invitation
    return await inviteClient(email);
  } catch (error) {
    console.error('Error sending client invitation:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    } else {
      return { success: false, message: 'Unknown error occurred' };
    }
  }
};

// Add getAppointmentNotes method for CalendarView component
const getAppointmentNotes = async (appointmentId: string) => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching appointment notes:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting appointment notes:', error);
    throw error;
  }
};

export const clientService = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointment,
  getAppointments,
  getClientAppointments,
  getClientWithAppointments,
  sendClientInvitation,
  sendClientInvitationById,
  inviteClient,
  getAppointmentNotes,
  searchUserByEmail
};
