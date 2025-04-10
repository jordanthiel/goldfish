
import { supabase } from '@/integrations/supabase/client';

// Type for note access logs
export interface NoteAccessLog {
  id: string;
  note_id: string;
  user_id: string;
  access_type: string;
  accessed_at: string;
  created_at: string;
}

// Log access to a note
const logNoteAccess = async (noteId?: string, accessType: string = 'view'): Promise<void> => {
  if (!noteId) return;
  
  try {
    const { error } = await supabase
      .from('note_access_logs')
      .insert({
        note_id: noteId,
        access_type: accessType,
        accessed_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error logging note access:', error);
    }
  } catch (error) {
    console.error('Error in logNoteAccess:', error);
  }
};

// Get access logs for a note
const getNoteAccessLogs = async (noteId: string): Promise<NoteAccessLog[]> => {
  try {
    const { data, error } = await supabase
      .from('note_access_logs')
      .select('*')
      .eq('note_id', noteId)
      .order('accessed_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching note access logs:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getNoteAccessLogs:', error);
    return [];
  }
};

// Audit log functions (mock implementations until we have the proper table)
const logAuditEvent = async (event: {
  action: string;
  resourceType: string;
  resourceId: string;
  details?: any;
}): Promise<void> => {
  try {
    console.log('Audit log event:', event);
    // This would insert into a real audit_logs table in production
  } catch (error) {
    console.error('Error in logAuditEvent:', error);
  }
};

// Get audit logs (mock implementation)
const getAuditLogs = async (filters?: {
  resourceType?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<any[]> => {
  try {
    console.log('Getting audit logs with filters:', filters);
    // This would query a real audit_logs table in production
    return [];
  } catch (error) {
    console.error('Error in getAuditLogs:', error);
    return [];
  }
};

export const auditService = {
  logNoteAccess,
  getNoteAccessLogs,
  logAuditEvent,
  getAuditLogs
};
