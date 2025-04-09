
import { supabase } from '@/integrations/supabase/client';
import { Patient } from './patientService';

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
  therapist_id?: string;
  phi_data?: any;
  appointments?: any[];
}

interface AppointmentDetails {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  client?: any;
}

export const clientService = {
  // Get a list of all clients
  async getClients(): Promise<Client[]> {
    try {
      // Get the current therapist ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found");
        return [];
      }
      
      // Get clients from therapist_clients relationship table
      const { data: relationships, error: relError } = await supabase
        .from('therapist_clients')
        .select('client_id, status')
        .eq('therapist_id', user.id);
      
      if (relError) {
        console.error('Error fetching client relationships:', relError);
        return [];
      }
      
      if (!relationships || relationships.length === 0) {
        console.log('No client relationships found');
        return [];
      }
      
      const clientIds = relationships.map(rel => rel.client_id);
      
      // Get full client information for each client ID
      const { data: clientsData, error: clientsError } = await supabase
        .from('client_profiles')
        .select('*')
        .in('id', clientIds);
      
      if (clientsError) {
        console.error('Error fetching client profiles:', clientsError);
        return [];
      }
      
      const clients = clientsData.map(client => {
        // Get relationship for this client
        const relationship = relationships.find(rel => rel.client_id === client.id);
        
        return {
          id: client.id,
          first_name: client.first_name || '',
          last_name: client.last_name || '',
          phone: client.phone,
          date_of_birth: client.date_of_birth,
          address: client.address,
          emergency_contact: client.emergency_contact,
          status: relationship?.status || client.status || 'Active',
          created_at: client.created_at,
          updated_at: client.updated_at,
          user_id: client.user_id,
          phi_data: client.phi_data
        };
      });
      
      // Now get email info for clients with user accounts
      const userIds = clients.filter(c => c.user_id).map(c => c.user_id);
      
      if (userIds.length > 0) {
        // For email info, you would typically get this from auth.users
        // but since we can't directly query that, we can use get-user-info edge function
        // or a custom RPC function to retrieve that data
        // For this example, we'll leave email as undefined
      }
      
      // Get appointments for each client
      for (const client of clients) {
        const { data: appointments, error: appError } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_id', client.id)
          .order('start_time', { ascending: false });
          
        if (!appError && appointments) {
          client.appointments = appointments;
        }
      }
      
      return clients;
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  },
  
  // Get a single client by ID
  async getClient(clientId: string): Promise<Client | null> {
    try {
      // Get client information
      const { data: client, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (error) {
        console.error('Error fetching client:', error);
        return null;
      }
      
      // Get client relationship to get status
      const { data: relationship, error: relError } = await supabase
        .from('therapist_clients')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();
        
      // Get all appointments for this client
      const { data: appointments, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        .order('start_time', { ascending: false });
      
      const clientWithAppointments: Client = {
        id: client.id,
        user_id: client.user_id,
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        phone: client.phone,
        date_of_birth: client.date_of_birth,
        address: client.address,
        emergency_contact: client.emergency_contact,
        status: relationship?.status || client.status || 'Active',
        created_at: client.created_at,
        updated_at: client.updated_at,
        phi_data: client.phi_data,
        appointments: !appError ? appointments : []
      };
      
      // Get email from auth user if available
      if (client.user_id) {
        // For email info, you would typically get this from auth.users
        // but since we can't directly query that, we can use an edge function
        // For this example, we'll leave email as undefined
      }
      
      return clientWithAppointments;
      
    } catch (error) {
      console.error('Error in getClient:', error);
      return null;
    }
  },
  
  // Alias method for backward compatibility
  async getClientWithAppointments(clientId: string): Promise<Client | null> {
    return this.getClient(clientId);
  },
  
  // Create a new client
  async createClient(clientData: Partial<Client>): Promise<{ success: boolean; client?: Client; message?: string }> {
    try {
      // Get the current therapist ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: "Not authenticated as a therapist" };
      }
      
      // Insert the client profile
      const { data: insertedClient, error: insertError } = await supabase
        .from('client_profiles')
        .insert({
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          phone: clientData.phone,
          date_of_birth: clientData.date_of_birth,
          address: clientData.address,
          emergency_contact: clientData.emergency_contact,
          status: clientData.status || 'Active',
          phi_data: clientData.phi_data || {}
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating client:', insertError);
        return { success: false, message: insertError.message };
      }
      
      // Create relationship between therapist and client
      const { error: relError } = await supabase
        .from('therapist_clients')
        .insert({
          therapist_id: user.id,
          client_id: insertedClient.id,
          status: clientData.status || 'Active'
        });
        
      if (relError) {
        console.error('Error creating therapist-client relationship:', relError);
        
        // If relationship creation fails, delete the client to maintain consistency
        const { error: deleteError } = await supabase
          .from('client_profiles')
          .delete()
          .eq('id', insertedClient.id);
          
        if (deleteError) {
          console.error('Error cleaning up client after failed relationship creation:', deleteError);
        }
        
        return { success: false, message: relError.message };
      }
      
      return { 
        success: true, 
        client: {
          ...insertedClient,
          status: clientData.status || 'Active'
        }
      };
    } catch (error: any) {
      console.error('Error in createClient:', error);
      return { success: false, message: error.message };
    }
  },
  
  // Update an existing client
  async updateClient(clientId: string, clientData: Partial<Client>): Promise<{ success: boolean; client?: Client; message?: string }> {
    try {
      // Update the client profile
      const { data: updatedClient, error: updateError } = await supabase
        .from('client_profiles')
        .update({
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          phone: clientData.phone,
          date_of_birth: clientData.date_of_birth,
          address: clientData.address,
          emergency_contact: clientData.emergency_contact,
          phi_data: clientData.phi_data,
          status: clientData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating client:', updateError);
        return { success: false, message: updateError.message };
      }
      
      // If status changed, update the relationship status too
      if (clientData.status) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: relError } = await supabase
            .from('therapist_clients')
            .update({ status: clientData.status })
            .eq('client_id', clientId)
            .eq('therapist_id', user.id);
            
          if (relError) {
            console.error('Error updating therapist-client relationship:', relError);
            // Continue anyway, this is not critical
          }
        }
      }
      
      return { 
        success: true, 
        client: {
          ...updatedClient,
          status: clientData.status || updatedClient.status || 'Active'
        }
      };
    } catch (error: any) {
      console.error('Error in updateClient:', error);
      return { success: false, message: error.message };
    }
  },
  
  // Delete a client
  async deleteClient(clientId: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Get the current therapist ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: "Not authenticated as a therapist" };
      }
      
      // First remove the therapist-client relationship
      const { error: relError } = await supabase
        .from('therapist_clients')
        .delete()
        .eq('client_id', clientId)
        .eq('therapist_id', user.id);
        
      if (relError) {
        console.error('Error removing therapist-client relationship:', relError);
        return { success: false, message: relError.message };
      }
      
      // Then delete the client profile
      const { error: deleteError } = await supabase
        .from('client_profiles')
        .delete()
        .eq('id', clientId);
        
      if (deleteError) {
        console.error('Error deleting client:', deleteError);
        return { success: false, message: deleteError.message };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error in deleteClient:', error);
      return { success: false, message: error.message };
    }
  },
  
  // Create an appointment for a client
  async createAppointment(
    clientId: string, 
    appointmentData: Partial<AppointmentDetails>
  ): Promise<{ success: boolean; appointment?: AppointmentDetails; message?: string }> {
    try {
      // Get the current therapist ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: "Not authenticated as a therapist" };
      }
      
      // Validate start and end times
      if (!appointmentData.start_time || !appointmentData.end_time) {
        return { success: false, message: "Start time and end time are required" };
      }
      
      // Insert the appointment
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          therapist_id: user.id,
          client_id: clientId,
          title: appointmentData.title || 'Therapy Session',
          start_time: appointmentData.start_time,
          end_time: appointmentData.end_time,
          status: appointmentData.status || 'Scheduled',
          notes: appointmentData.notes
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating appointment:', error);
        return { success: false, message: error.message };
      }
      
      return { 
        success: true, 
        appointment
      };
    } catch (error: any) {
      console.error('Error in createAppointment:', error);
      return { success: false, message: error.message };
    }
  },

  // Send an invitation to a client via email
  async sendClientInvitation(clientId: string, email: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Get the current therapist ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: "Not authenticated as a therapist" };
      }
      
      // Call the create_client_invitation function
      const { data, error } = await supabase.rpc('create_client_invitation', {
        therapist_id_param: user.id,
        client_id_param: clientId,
        email_param: email
      });
      
      if (error) {
        console.error('Error creating client invitation:', error);
        return { success: false, message: error.message };
      }
      
      // Send the invitation email
      const { data: emailResult, error: emailError } = await supabase.rpc('send_client_invitation_email', {
        invite_id: data.id
      });
      
      if (emailError) {
        console.error('Error sending invitation email:', emailError);
        return { success: false, message: emailError.message };
      }
      
      return { success: true, message: "Invitation sent successfully" };
    } catch (error: any) {
      console.error('Error in sendClientInvitation:', error);
      return { success: false, message: error.message };
    }
  },

  async generateInviteLink(client: Client): Promise<{ success: boolean; inviteLink?: string; message?: string }> {
    // Placeholder for invite link generation feature
    return { success: false, message: "Invite link generation not implemented yet" };
  }
};
