
import { supabase } from '@/integrations/supabase/client';

export interface ClientInvitation {
  id: string;
  therapist_id: string;
  client_id: string;
  email: string;
  invite_code: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export const invitationService = {
  // Create a new invitation for a client
  async createInvitation(clientId: string, email: string): Promise<ClientInvitation> {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase.rpc(
      'create_client_invitation',
      {
        therapist_id_param: userData.user.id,
        client_id_param: clientId,
        email_param: email
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data as unknown as ClientInvitation;
  },

  // Send invitation email to client
  async sendInvitationEmail(invitationId: string): Promise<any> {
    const { data, error } = await supabase.rpc(
      'send_client_invitation_email',
      {
        invite_id: invitationId
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Get all invitations for the current user's clients
  async getClientInvitations(): Promise<ClientInvitation[]> {
    const { data, error } = await supabase
      .from('client_invitations')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data as ClientInvitation[];
  },

  // Verify an invitation code
  async verifyInviteCode(code: string): Promise<any> {
    const { data, error } = await supabase.rpc(
      'verify_invite_code',
      {
        invite_code_param: code
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Accept an invitation and link it to a user account
  async acceptInvitation(code: string, userId: string): Promise<any> {
    const { data, error } = await supabase.rpc(
      'accept_client_invitation',
      {
        invite_code_param: code,
        user_id_param: userId
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
};
