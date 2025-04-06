
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/services/clientService';
import { auditService } from '@/services/auditService';
import { encryptAES, decryptAES } from '@/lib/utils';

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

// Encryption/decryption functions
const encryptContent = (content: string): string => {
  try {
    // Use AES encryption from utils
    return encryptAES(content);
  } catch (error) {
    console.error('Error encrypting content:', error);
    return content; // Fallback to unencrypted content
  }
};

const decryptContent = (encryptedContent: string): string => {
  try {
    // Use AES decryption from utils
    return decryptAES(encryptedContent);
  } catch (error) {
    console.error('Error decrypting content:', error);
    return encryptedContent; // Return as is if decryption fails
  }
};

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

    // Decrypt the content of each note
    const decryptedNotes = data?.map(note => ({
      ...note,
      content: note.content ? decryptContent(note.content) : ''
    })) || [];

    return decryptedNotes;
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

    // Decrypt the content of each note
    const decryptedNotes = data?.map(note => ({
      ...note,
      content: note.content ? decryptContent(note.content) : ''
    })) || [];

    return decryptedNotes;
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

    // Decrypt the content of each note
    const decryptedNotes = data?.map(note => ({
      ...note,
      content: note.content ? decryptContent(note.content) : ''
    })) || [];

    return decryptedNotes;
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

    // Decrypt the note content
    return {
      ...data,
      content: data.content ? decryptContent(data.content) : ''
    };
  },

  // Create a new note
  async createNote(note: SessionNoteInput): Promise<SessionNote> {
    // Get current user id
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Encrypt the note content before saving
    const encryptedNote = {
      ...note,
      content: encryptContent(note.content)
    };
    
    const { data, error } = await supabase
      .from('session_notes')
      .insert({
        ...encryptedNote,
        therapist_id: user.id,
        is_private: note.is_private !== undefined ? note.is_private : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      throw new Error(error.message);
    }

    // Return the decrypted note for immediate use
    return {
      ...data,
      content: decryptContent(data.content)
    };
  },

  // Update an existing note
  async updateNote(id: string, updates: Partial<SessionNoteInput>): Promise<SessionNote> {
    // If content is being updated, encrypt it
    const encryptedUpdates = { ...updates };
    if (updates.content) {
      encryptedUpdates.content = encryptContent(updates.content);
    }
    
    const { data, error } = await supabase
      .from('session_notes')
      .update({
        ...encryptedUpdates,
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

    // Return the decrypted note
    return {
      ...data,
      content: decryptContent(data.content)
    };
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
