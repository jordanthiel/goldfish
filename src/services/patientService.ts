
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

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isFromUser: boolean;
}

export const patientService = {
  // Get the current patient profile
  async getPatientProfile(): Promise<Patient | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Get client record linked to this user
      console.log('Checking for client with user_id:', user.id);
      const { data: clientData, error: clientError } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (clientError) {
        console.error('Error fetching client by user_id:', clientError);
        return null;
      }
      
      if (!clientData) {
        console.log('No client record found for this user ID:', user.id);
        return null;
      }
      
      // Get user info
      const { data: userData, error: userError } = await supabase.functions.invoke('get-user-info');
      
      if (userError || !userData) {
        console.error('Error fetching user info:', userError);
        return null;
      }
      
      // Extract insurance information safely from phi_data
      let insuranceProvider: string | undefined;
      let insurancePolicyNumber: string | undefined;
      
      if (clientData.phi_data && typeof clientData.phi_data === 'object') {
        const phiData = clientData.phi_data as Record<string, any>;
        insuranceProvider = phiData.insurance_provider as string | undefined;
        insurancePolicyNumber = phiData.insurance_policy_number as string | undefined;
      }
      
      return {
        id: clientData.id,
        user_id: user.id,
        first_name: userData.firstName || clientData.first_name || '',
        last_name: userData.lastName || clientData.last_name || '',
        email: userData.email || '',
        date_of_birth: clientData.date_of_birth,
        phone: clientData.phone,
        address: clientData.address,
        emergency_contact: clientData.emergency_contact,
        insurance_provider: insuranceProvider,
        insurance_policy_number: insurancePolicyNumber,
        status: clientData.status || 'Active',
        created_at: clientData.created_at,
        updated_at: clientData.updated_at || clientData.created_at
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
      const { data: clientData, error: clientError } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (clientError) {
        console.error('Error fetching client by user_id:', clientError);
        return dashboardData;
      }
      
      if (!clientData) {
        console.log('No client record found for this user');
        return dashboardData;
      }
      
      console.log('Found client record by user_id:', clientData);
      
      // Get therapist relationship
      const { data: relationship, error: relError } = await supabase
        .from('therapist_clients')
        .select('*')
        .eq('client_id', clientData.id)
        .maybeSingle();
        
      if (relError || !relationship) {
        console.error('Error fetching therapist relationship:', relError);
        return dashboardData;
      }
      
      // Get therapist info
      dashboardData.therapist = await this.getTherapistInfo(relationship.therapist_id);
      
      // Get upcoming and recent appointments
      dashboardData.upcomingAppointments = await this.getUpcomingAppointments(clientData.id);
      dashboardData.recentAppointments = await this.getRecentAppointments(clientData.id);
      
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

  // Claim a patient account using the direct user-client relationship
  async claimPatientAccount(inviteCode: string): Promise<{ success: boolean; message?: string; client_id?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, message: 'Not authenticated' };
      }
      
      // Check if this is a valid user
      console.log('Attempting to claim account for user ID:', user.id);
      
      // Look up client by email to link them
      const { data: client, error: clientError } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (clientError) {
        console.error('Error checking for existing client:', clientError);
        return { success: false, message: 'Error checking for client record' };
      }
      
      if (!client) {
        return { success: false, message: 'No client record found for this email' };
      }
      
      // Ensure user has client role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'client' });
        
      if (roleError) {
        console.error('Error assigning client role:', roleError);
        // Continue anyway since this might be a duplicate role
      }
      
      return { 
        success: true, 
        client_id: client.id,
        message: 'Account successfully linked' 
      };
    } catch (error: any) {
      console.error('Error in claimPatientAccount:', error);
      return { 
        success: false, 
        message: error.message || 'Unknown error occurred' 
      };
    }
  },

  // Messages functionality
  async getMessages(clientId: string): Promise<Message[]> {
    // This is a stub implementation until we create a proper messages table
    return [];
  },
  
  async sendMessage(clientId: string, message: string): Promise<boolean> {
    // This is a stub implementation until we create a proper messages table
    console.log('Message sending not yet implemented');
    return true;
  }
};
