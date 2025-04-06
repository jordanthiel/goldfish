
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/services/clientService';
import { auditService } from '@/services/auditService';

export interface SessionNote {
  id: string;
  therapist_id: string;
  client_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  appointment_id?: string;
  is_private?: boolean;
}

export interface SessionNoteWithClient extends SessionNote {
  client?: Client;
}

export interface SessionNoteInput {
  client_id: string;
  content: string;
  appointment_id?: string;
  is_private?: boolean;
}

export const noteService = {
  // Get all notes for the current user/therapist
  async getNotes(): Promise<SessionNoteWithClient[]> {
    const { data, error } = await supabase
      .from('session_notes')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get notes for a specific client
  async getClientNotes(clientId: string): Promise<SessionNote[]> {
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client notes:', error);
      throw new Error(error.message);
    }

    // Log access to the notes for HIPAA compliance
    if (data && data.length > 0) {
      // We only log once for the batch access
      try {
        await auditService.logNoteAccess(data[0].id, 'View Client Notes');
      } catch (error) {
        console.error('Error logging note access:', error);
        // Continue execution - don't let access logging failure prevent note access
      }
    }

    return data || [];
  },

  // Get notes for a specific appointment
  async getAppointmentNotes(appointmentId: string): Promise<SessionNote[]> {
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching appointment notes:', error);
      throw new Error(error.message);
    }

    // Log access to the notes for HIPAA compliance
    if (data && data.length > 0) {
      try {
        await auditService.logNoteAccess(data[0].id, 'View Appointment Notes');
      } catch (error) {
        console.error('Error logging note access:', error);
        // Continue execution - don't let access logging failure prevent note access
      }
    }

    return data || [];
  },

  // Get a single note by ID
  async getNote(id: string): Promise<SessionNote> {
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching note:', error);
      throw new Error(error.message);
    }

    // Log access to the note for HIPAA compliance
    try {
      await auditService.logNoteAccess(id, 'View Note');
    } catch (error) {
      console.error('Error logging note access:', error);
      // Continue execution - don't let access logging failure prevent note access
    }

    return data;
  },

  // Create a new note
  async createNote(note: SessionNoteInput): Promise<SessionNote> {
    // Get current user id
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('session_notes')
      .insert({
        ...note,
        therapist_id: user.id,
        is_private: note.is_private !== undefined ? note.is_private : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Update an existing note
  async updateNote(id: string, updates: Partial<SessionNoteInput>): Promise<SessionNote> {
    const { data, error } = await supabase
      .from('session_notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      throw new Error(error.message);
    }

    // Log the edit for HIPAA compliance
    try {
      await auditService.logNoteAccess(id, 'Edit Note');
    } catch (error) {
      console.error('Error logging note access:', error);
      // Continue execution - don't let access logging failure prevent note access
    }

    return data;
  },

  // Delete a note
  async deleteNote(id: string): Promise<void> {
    // Log the deletion for HIPAA compliance
    try {
      await auditService.logNoteAccess(id, 'Delete Note');
    } catch (error) {
      console.error('Error logging note access:', error);
      // Continue execution - don't let access logging failure prevent note deletion
    }

    const { error } = await supabase
      .from('session_notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting note:', error);
      throw new Error(error.message);
    }
  }
};
