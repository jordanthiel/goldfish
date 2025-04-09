
import { supabase } from '@/integrations/supabase/client';

export interface Patient {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Therapist {
  id: string;
  full_name: string;
  specialty?: string;
  license_number?: string;
  years_experience?: number;
  bio?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  therapist_id: string;
  client_id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  type?: string;
  duration?: number;
  session_notes?: any[];
}

export interface PatientDashboardData {
  therapist: Therapist | null;
  upcomingAppointments: Appointment[];
  recentAppointments: Appointment[];
}

export const patientService = {
  // Get the current patient profile
  async getPatientProfile(): Promise<Patient | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Get client record linked to this user
      console.log('Checking for client with user_id:', user.id);
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (clientError) {
        console.error('Error fetching client by user_id:', clientError);
        return null;
      }
      
      if (!client) {
        console.log('No client record found for this user ID:', user.id);
        // Fallback to email check for backwards compatibility
        const { data: clientByEmail, error: emailError } = await supabase
          .from('clients')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
          
        if (emailError || !clientByEmail) {
          console.log('No client record found for this user email either:', user.email);
          return null;
        }
        
        client = clientByEmail;
      }
      
      // Extract insurance information safely from phi_data
      let insuranceProvider: string | undefined;
      let insurancePolicyNumber: string | undefined;
      
      if (client.phi_data && typeof client.phi_data === 'object') {
        const phiData = client.phi_data as Record<string, any>;
        insuranceProvider = phiData.insurance_provider as string | undefined;
        insurancePolicyNumber = phiData.insurance_policy_number as string | undefined;
      }
      
      return {
        id: client.id,
        user_id: user.id,
        first_name: client.first_name,
        last_name: client.last_name,
        email: user.email || '',
        date_of_birth: client.date_of_birth,
        phone: client.phone,
        address: client.address,
        emergency_contact: client.emergency_contact,
        insurance_provider: insuranceProvider,
        insurance_policy_number: insurancePolicyNumber,
        status: client.status,
        created_at: client.created_at,
        updated_at: client.updated_at
      };
    } catch (error) {
      console.error('Error in getPatientProfile:', error);
      return null;
    }
  },

  // Get patient dashboard data including therapist info and appointments
  async getPatientDashboardData(): Promise<PatientDashboardData> {
    console.log('Fetching patient dashboard data');
    
    const dashboardData: PatientDashboardData = {
      therapist: null,
      upcomingAppointments: [],
      recentAppointments: []
    };
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        return dashboardData;
      }
      
      // Get the client record linked to this user ID
      console.log('Checking for client with user_id:', user.id);
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (clientError) {
        console.error('Error fetching client by user_id:', clientError);
        return dashboardData;
      }
      
      // If no client found by user_id, try by email (backwards compatibility)
      if (!client) {
        console.log('No client record found by user_id, checking email:', user.email);
        const { data: clientByEmail, error: emailError } = await supabase
          .from('clients')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
          
        if (emailError || !clientByEmail) {
          console.log('No client record found for this user');
          return dashboardData;
        }
        
        console.log('Found client record by email:', clientByEmail);
        dashboardData.therapist = await this.getTherapistInfo(clientByEmail.therapist_id);
        dashboardData.upcomingAppointments = await this.getUpcomingAppointments(clientByEmail.id);
        dashboardData.recentAppointments = await this.getRecentAppointments(clientByEmail.id);
        return dashboardData;
      }
      
      console.log('Found client record by user_id:', client);
      
      // Get therapist info
      dashboardData.therapist = await this.getTherapistInfo(client.therapist_id);
      
      // Get upcoming and recent appointments
      dashboardData.upcomingAppointments = await this.getUpcomingAppointments(client.id);
      dashboardData.recentAppointments = await this.getRecentAppointments(client.id);
      
    } catch (error) {
      console.error('Error in getPatientDashboardData:', error);
    }
    
    return dashboardData;
  },

  // Helper method to get therapist info
  async getTherapistInfo(therapistId: string): Promise<Therapist | null> {
    const { data: therapist, error: therapistError } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('id', therapistId)
      .maybeSingle();
      
    if (therapistError || !therapist) {
      console.error('Error fetching therapist:', therapistError);
      return null;
    }
    
    console.log('Found therapist:', therapist);
    return {
      id: therapist.id,
      full_name: therapist.full_name || 'Your Therapist',
      specialty: therapist.specialty,
      license_number: therapist.license_number,
      years_experience: therapist.years_experience,
      bio: therapist.bio,
      profile_image_url: therapist.profile_image_url,
      created_at: therapist.created_at,
      updated_at: therapist.updated_at
    };
  },

  // Helper method to get upcoming appointments
  async getUpcomingAppointments(clientId: string): Promise<Appointment[]> {
    const now = new Date();
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        session_notes (*)
      `)
      .eq('client_id', clientId)
      .gte('start_time', now.toISOString())
      .order('start_time', { ascending: true })
      .limit(5);
      
    if (error) {
      console.error('Error fetching upcoming appointments:', error);
      return [];
    }
    
    console.log('Found upcoming appointments:', appointments?.length || 0);
    return (appointments || []).map(appt => ({
      ...appt,
      // Calculate duration in minutes
      duration: Math.round((new Date(appt.end_time).getTime() - new Date(appt.start_time).getTime()) / (1000 * 60)),
      // Default type if not specified
      type: appt.title || 'Therapy Session'
    }));
  },

  // Helper method to get recent appointments
  async getRecentAppointments(clientId: string): Promise<Appointment[]> {
    const now = new Date();
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        session_notes (*)
      `)
      .eq('client_id', clientId)
      .lt('start_time', now.toISOString())
      .order('start_time', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error('Error fetching recent appointments:', error);
      return [];
    }
    
    console.log('Found recent appointments:', appointments?.length || 0);
    return (appointments || []).map(appt => ({
      ...appt,
      // Calculate duration in minutes
      duration: Math.round((new Date(appt.end_time).getTime() - new Date(appt.start_time).getTime()) / (1000 * 60)),
      // Default type if not specified
      type: appt.title || 'Therapy Session'
    }));
  },

  // Fix existing messaging functionality
  async getMessages(clientId: string): Promise<any[]> {
    // This is a stub implementation until we create a proper messages table
    return [];
  },
  
  async sendMessage(clientId: string, message: string): Promise<boolean> {
    // This is a stub implementation until we create a proper messages table
    console.log('Message sending not yet implemented');
    return true;
  }
};
