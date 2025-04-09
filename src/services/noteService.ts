
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface SessionNote {
  id: string;
  therapist_id: string;
  client_id: string;
  appointment_id?: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteWithClientInfo extends SessionNote {
  client?: {
    first_name: string | null;
    last_name: string | null;
    email?: string;
  };
}

// Get all notes for a therapist
const getAllNotes = async (): Promise<NoteWithClientInfo[]> => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .select(`
        *,
        client_profiles:client_id(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
    
    // Transform the data to the expected format
    const notes: NoteWithClientInfo[] = await Promise.all((data || []).map(async (note: any) => {
      let clientEmail = '';
      
      // If client profile exists, try to get the email
      if (note.client_profiles && note.client_profiles.user_id) {
        // Get email from client's user_id
        const { data: userData, error: userError } = await supabase
          .rpc('get_client_user_info', { client_id_param: note.client_id });
        
        if (!userError && userData && typeof userData === 'object' && 'success' in userData && userData.success) {
          clientEmail = 'email' in userData ? userData.email as string : '';
        }
      }
      
      return {
        ...note,
        client: note.client_profiles ? {
          first_name: note.client_profiles.first_name,
          last_name: note.client_profiles.last_name,
          email: clientEmail
        } : undefined
      };
    }));
    
    return notes;
  } catch (error) {
    console.error('Error in getAllNotes:', error);
    throw error;
  }
};

// Get notes for a specific client
const getClientNotes = async (clientId: string): Promise<SessionNote[]> => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching client notes:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getClientNotes:', error);
    throw error;
  }
};

// Create a new note
const createNote = async (note: Partial<SessionNote>): Promise<SessionNote> => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .insert([{
        therapist_id: note.therapist_id,
        client_id: note.client_id,
        appointment_id: note.appointment_id,
        content: note.content,
        is_private: note.is_private
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating note:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to create note');
    }
    
    return data;
  } catch (error) {
    console.error('Error in createNote:', error);
    throw error;
  }
};

// Update an existing note
const updateNote = async (id: string, updates: Partial<SessionNote>): Promise<SessionNote> => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .update({
        content: updates.content,
        is_private: updates.is_private,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating note:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to update note');
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateNote:', error);
    throw error;
  }
};

// Delete a note
const deleteNote = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('session_notes')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteNote:', error);
    throw error;
  }
};

// Get notes for a specific appointment
const getAppointmentNotes = async (appointmentId: string): Promise<SessionNote[]> => {
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
    console.error('Error in getAppointmentNotes:', error);
    throw error;
  }
};

export const noteService = {
  getAllNotes,
  getClientNotes,
  createNote,
  updateNote,
  deleteNote,
  getAppointmentNotes
};
