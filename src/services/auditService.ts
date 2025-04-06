
import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export const auditService = {
  // Get audit logs (only accessible to admins due to RLS policies)
  async getAuditLogs(): Promise<AuditLog[]> {
    // Use explicit typing to work around TypeScript limitations
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false }) as any;
  
      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }
  
      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  },

  // Get audit logs for a specific record
  async getRecordAuditLogs(tableName: string, recordId: string): Promise<AuditLog[]> {
    // Use explicit typing to work around TypeScript limitations
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false }) as any;
  
      if (error) {
        console.error('Error fetching record audit logs:', error);
        return [];
      }
  
      return data || [];
    } catch (error) {
      console.error('Error fetching record audit logs:', error);
      return [];
    }
  },

  // Log note access (manual logging for specific actions not covered by triggers)
  async logNoteAccess(noteId: string, accessType: string): Promise<void> {
    try {
      // Get current user id
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('User not authenticated, skipping access logging');
        return;
      }
      
      // Use explicit typing to work around TypeScript limitations
      const { error } = await supabase
        .from('note_access_logs')
        .insert({
          note_id: noteId,
          access_type: accessType,
          user_id: user.id
        }) as any;
  
      if (error) {
        // Log the error but don't throw - this allows the app to continue functioning
        // even if logging fails due to RLS policies
        console.error('Error logging note access:', error);
      }
    } catch (error) {
      // Just log the error without throwing to prevent disrupting the user experience
      console.error('Error logging note access:', error);
    }
  },

  // Get access logs for a note
  async getNoteAccessLogs(noteId: string): Promise<any[]> {
    try {
      // Fix the query format for joining with users table
      const { data, error } = await supabase
        .from('note_access_logs')
        .select(`
          *,
          users:user_id(email)
        `)
        .eq('note_id', noteId)
        .order('accessed_at', { ascending: false });
  
      if (error) {
        console.error('Error fetching note access logs:', error);
        return [];
      }
  
      return data || [];
    } catch (error) {
      console.error('Error fetching note access logs:', error);
      return [];
    }
  }
};
