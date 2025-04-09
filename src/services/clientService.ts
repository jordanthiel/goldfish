
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

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

  // Create a new client with HIPAA compliance and invitation if email is provided
  async createClient(client: ClientInput): Promise<Client> {
    // Get current user id
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Insert the client record
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

    // If email is provided, check if the user exists and create an invitation if needed
    if (client.email) {
      // Check if a user with this email already exists
      const { data: existingUser, error: userCheckError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', client.email)
        .maybeSingle();

      // Create client invitation to link this client with their user account
      try {
        // Use the Supabase function to create an invitation
        const { data: inviteData, error: inviteError } = await supabase
          .rpc('create_client_invitation', {
            therapist_id_param: user.id,
            client_id_param: data.id,
            email_param: client.email
          });

        if (inviteError) {
          console.error('Error creating client invitation:', inviteError);
        } else {
          // Send invitation email (in a real implementation, you would use a server-side function)
          console.log('Client invitation created:', inviteData);
          
          // Optionally send email notification via RPC function
          const { data: emailData, error: emailError } = await supabase
            .rpc('send_client_invitation_email', {
              invite_id: inviteData.id
            });
            
          if (emailError) {
            console.error('Error sending invitation email:', emailError);
          } else {
            console.log('Invitation email notification prepared:', emailData);
          }
        }
      } catch (inviteError) {
        console.error('Error in invitation process:', inviteError);
      }
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
  },

  // Send an invitation to a client to claim their account
  async sendClientInvitation(clientId: string): Promise<void> {
    // Get the client details first
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError) {
      throw new Error(clientError.message);
    }

    if (!client.email) {
      throw new Error('Client has no email address');
    }

    // Get current therapist
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create client invitation
    const { data: inviteData, error: inviteError } = await supabase
      .rpc('create_client_invitation', {
        therapist_id_param: user.id,
        client_id_param: clientId,
        email_param: client.email
      });

    if (inviteError) {
      throw new Error(inviteError.message);
    }

    // Send invitation email via RPC function
    const { data: emailData, error: emailError } = await supabase
      .rpc('send_client_invitation_email', {
        invite_id: inviteData.id
      });
        
    if (emailError) {
      throw new Error(emailError.message);
    }

    console.log('Client invitation sent successfully');
  }
};
