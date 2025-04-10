
import { supabase } from '@/integrations/supabase/client';

export interface Appointment {
  id: string;
  title: string;
  therapist_id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
}

export interface AppointmentInput {
  title: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status?: string;
  notes?: string;
}

export const appointmentService = {
  // Get all appointments for the current user
  async getAppointments(): Promise<Appointment[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client_profiles (first_name, last_name))
      `)
      .eq('therapist_id', user.id)
      .order('start_time');
    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get appointments within a date range
  async getAppointmentsInRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client_profiles (
          first_name,
          last_name,
          phone
        )
      `)
      .eq('therapist_id', user.id)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .order('start_time');

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get a single appointment by ID
  async getAppointment(id: string): Promise<Appointment> {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('id', id)
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client_profiles (
          first_name,
          last_name,
          phone
        )
      `)
      .eq('id', id)
      .eq('therapist_id', user.id)
      .single();
    console.log('data', data)

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Create a new appointment
  async createAppointment(appointment: AppointmentInput): Promise<Appointment> {
    // Get current user id
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...appointment,
        therapist_id: user.id,
        status: appointment.status || 'Scheduled'
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Update an existing appointment
  async updateAppointment(id: string, updates: Partial<AppointmentInput>): Promise<Appointment> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('appointments')
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

  // Delete an appointment
  async deleteAppointment(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
      .eq('therapist_id', user.id);

    if (error) {
      throw new Error(error.message);
    }
  }
};
