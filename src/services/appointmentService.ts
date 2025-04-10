
import { supabase } from '@/integrations/supabase/client';

export interface Appointment {
  id: string;
  therapist_id: string;
  client_id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithClient extends Appointment {
  client_profiles?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  };
}

// Get all appointments for a therapist
export const getTherapistAppointments = async (therapistId: string): Promise<AppointmentWithClient[]> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client_profiles(first_name, last_name, phone)
      `)
      .eq('therapist_id', therapistId)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTherapistAppointments:', error);
    return [];
  }
};

// Get appointments for a specific date range
export const getAppointmentsByDateRange = async (
  therapistId: string,
  startDate: string,
  endDate: string
): Promise<AppointmentWithClient[]> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client_profiles(first_name, last_name, phone)
      `)
      .eq('therapist_id', therapistId)
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments by date range:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAppointmentsByDateRange:', error);
    return [];
  }
};

// Create a new appointment
export const createAppointment = async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointment])
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from insert operation');
    }

    return data;
  } catch (error) {
    console.error('Error in createAppointment:', error);
    throw error;
  }
};

// Update an existing appointment
export const updateAppointment = async (id: string, updates: Partial<Appointment>): Promise<Appointment> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from update operation');
    }

    return data;
  } catch (error) {
    console.error('Error in updateAppointment:', error);
    throw error;
  }
};

// Delete an appointment
export const deleteAppointment = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteAppointment:', error);
    throw error;
  }
};

// Get a single appointment by ID
export const getAppointmentById = async (id: string): Promise<AppointmentWithClient | null> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client_profiles(first_name, last_name, phone)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getAppointmentById:', error);
    return null;
  }
};

// Export service
export const appointmentService = {
  getTherapistAppointments,
  getAppointmentsByDateRange,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentById
};
