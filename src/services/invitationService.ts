
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
  // Create an invitation for a client
  async createInvitation(clientId: string, email: string): Promise<ClientInvitation> {
    // Get current user id (therapist)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Use the create_client_invitation function
    const { data, error } = await supabase
      .rpc('create_client_invitation', {
        therapist_id_param: user.id,
        client_id_param: clientId,
        email_param: email
      });

    if (error) {
      console.error('Error creating invitation:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Send an invitation email
  async sendInvitationEmail(invitationId: string): Promise<any> {
    try {
      // First get the invitation data
      const { data: emailData, error: emailDataError } = await supabase
        .rpc('send_client_invitation_email', {
          invite_id: invitationId
        });

      if (emailDataError) throw emailDataError;

      // Then call our edge function to send the actual email
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: { invitationId },
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw error;
    }
  },

  // Get all invitations for a client
  async getClientInvitations(clientId: string): Promise<ClientInvitation[]> {
    const { data, error } = await supabase
      .from('client_invitations')
      .select('*')
      .eq('client_id', clientId);

    if (error) {
      console.error('Error fetching invitations:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Verify an invitation code
  async verifyInviteCode(inviteCode: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('verify_invite_code', {
        invite_code_param: inviteCode
      });

    if (error) {
      console.error('Error verifying invitation code:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Accept an invitation and link to user
  async acceptInvitation(inviteCode: string, userId: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('accept_client_invitation', {
        invite_code_param: inviteCode,
        user_id_param: userId
      });

    if (error) {
      console.error('Error accepting invitation:', error);
      throw new Error(error.message);
    }

    return data;
  }
};
