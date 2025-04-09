import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/services/clientService';

export interface SessionNote {
  id: string;
  therapist_id: string;
  client_id: string;
  appointment_id?: string | null;
  content: string;
  is_private: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface SessionNoteWithClient extends SessionNote {
  client: Client;
}

export interface NoteAccessLog {
  id: string;
  note_id: string;
  user_id: string;
  access_type: string;
  accessed_at: string;
}

const getNotes = async (): Promise<SessionNoteWithClient[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user');
      return [];
    }
    
    // Get notes with client information
    const { data: notes, error } = await supabase
      .from('session_notes')
      .select(`
        *
      `)
      .eq('therapist_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
    
    // Get client information for each note
    const notesWithClients: SessionNoteWithClient[] = [];
    
    for (const note of notes) {
      const { data: client, error: clientError } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', note.client_id)
        .single();
        
      if (clientError) {
        console.error('Error fetching client for note:', clientError);
        continue;
      }
      
      // Get email from user_id if available
      let email = '';
      if (client.user_id) {
        const { data: userData, error: userError } = await supabase
          .rpc('get_client_user_info', { client_id_param: client.id });
        
        if (!userError && userData && userData.success) {
          email = userData.email || '';
        }
      }
      
      notesWithClients.push({
        ...note,
        client: {
          ...client,
          email,
          // Add other required client fields with defaults
          phone: client.phone || '',
          date_of_birth: client.date_of_birth || '',
          address: client.address || '',
          emergency_contact: client.emergency_contact || '',
          status: client.status || 'Active',
          first_name: client.first_name || '',
          last_name: client.last_name || '',
          updated_at: client.updated_at || client.created_at,
          phi_data: client.phi_data || null
        }
      });
    }
    
    return notesWithClients;
    
  } catch (error) {
    console.error('Error in getNotes:', error);
    return [];
  }
};

// Get notes by client ID
const getNotesByClient = async (clientId: string): Promise<SessionNote[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user');
      return [];
    }
    
    const { data: notes, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('client_id', clientId)
      .eq('therapist_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching notes by client ID:', error);
      return [];
    }
    
    return notes || [];
  } catch (error) {
    console.error('Error in getNotesByClient:', error);
    return [];
  }
};

// Get client notes by client ID (alias for getNotesByClient for backward compatibility)
const getClientNotes = async (clientId: string): Promise<SessionNote[]> => {
  return getNotesByClient(clientId);
};

// Get notes by appointment ID
const getAppointmentNotes = async (appointmentId: string): Promise<SessionNote[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user');
      return [];
    }
    
    const { data: notes, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('therapist_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching notes by appointment ID:', error);
      return [];
    }
    
    return notes || [];
  } catch (error) {
    console.error('Error in getAppointmentNotes:', error);
    return [];
  }
};

// Get a single note by ID
const getNote = async (noteId: string): Promise<SessionNote | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user');
      return null;
    }
    
    const { data: note, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('id', noteId)
      .eq('therapist_id', user.id)
      .single();
      
    if (error) {
      console.error('Error fetching note:', error);
      return null;
    }
    
    return note || null;
  } catch (error) {
    console.error('Error in getNote:', error);
    return null;
  }
};

// Create a new note
const createNote = async (noteData: Partial<SessionNote>): Promise<SessionNote> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    if (!noteData.client_id || !noteData.content) {
      throw new Error('Client ID and content are required');
    }
    
    const { data: note, error } = await supabase
      .from('session_notes')
      .insert({
        therapist_id: user.id,
        client_id: noteData.client_id,
        appointment_id: noteData.appointment_id,
        content: noteData.content,
        is_private: noteData.is_private || false
      })
      .select('*')
      .single();
      
    if (error) {
      console.error('Error creating note:', error);
      throw new Error(error.message);
    }
    
    return note;
  } catch (error: any) {
    console.error('Error in createNote:', error);
    throw new Error(error.message || 'Failed to create note');
  }
};

// Update an existing note
const updateNote = async (noteId: string, noteData: Partial<SessionNote>): Promise<SessionNote> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    const { data: note, error } = await supabase
      .from('session_notes')
      .update({
        content: noteData.content,
        is_private: noteData.is_private,
        appointment_id: noteData.appointment_id
      })
      .eq('id', noteId)
      .eq('therapist_id', user.id)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating note:', error);
      throw new Error(error.message);
    }
    
    return note;
  } catch (error: any) {
    console.error('Error in updateNote:', error);
    throw new Error(error.message || 'Failed to update note');
  }
};

// Delete a note
const deleteNote = async (noteId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, message: 'No authenticated user' };
    }
    
    const { error } = await supabase
      .from('session_notes')
      .delete()
      .eq('id', noteId)
      .eq('therapist_id', user.id);
      
    if (error) {
      console.error('Error deleting note:', error);
      return { success: false, message: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteNote:', error);
    return { success: false, message: error.message };
  }
};

// Log access to a note
const logNoteAccess = async (noteId: string, accessType: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user');
      return false;
    }
    
    const { error } = await supabase
      .from('note_access_logs')
      .insert({
        note_id: noteId,
        user_id: user.id,
        access_type: accessType
      });
      
    if (error) {
      console.error('Error logging note access:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error logging note access:', error);
    return false;
  }
};

export const noteService = {
  getNotes,
  getNotesByClient,
  getClientNotes,
  getAppointmentNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  logNoteAccess
};
