
import { supabase } from '@/integrations/supabase/client';

export interface SessionNote {
  id: string;
  therapist_id: string;
  client_id: string;
  content: string;
  appointment_id?: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionNoteInput {
  client_id: string;
  content: string;
  appointment_id?: string;
  is_private?: boolean;
}

export interface SessionNoteWithClient extends SessionNote {
  client?: {
    first_name: string;
    last_name: string;
  };
}

export const noteService = {
  // Get all notes for the current therapist
  async getNotes(): Promise<SessionNoteWithClient[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('session_notes')
      .select(`
        *,
        clients (
          first_name,
          last_name
        )
      `)
      .eq('therapist_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get notes for a specific client
  async getClientNotes(clientId: string): Promise<SessionNote[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('therapist_id', user.id)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get notes for a specific appointment
  async getAppointmentNotes(appointmentId: string): Promise<SessionNote[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('therapist_id', user.id)
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get a single note by ID
  async getNote(id: string): Promise<SessionNote> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('id', id)
      .eq('therapist_id', user.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Create a new note
  async createNote(note: SessionNoteInput): Promise<SessionNote> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('session_notes')
      .insert({
        ...note,
        therapist_id: user.id,
        is_private: note.is_private ?? true
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Update an existing note
  async updateNote(id: string, updates: Partial<SessionNoteInput>): Promise<SessionNote> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('session_notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('therapist_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Delete a note
  async deleteNote(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('session_notes')
      .delete()
      .eq('id', id)
      .eq('therapist_id', user.id);

    if (error) {
      throw new Error(error.message);
    }
  }
};
