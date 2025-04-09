
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

      // First, try to get the client ID
      console.log('Checking for client with email:', user.email);
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();
        
      if (clientError) {
        console.error('Error fetching client by email:', clientError);
        return null;
      }
      
      if (!client) {
        console.log('No client record found for this user email:', user.email);
        return null;
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
        insurance_provider: client.phi_data?.insurance_provider,
        insurance_policy_number: client.phi_data?.insurance_policy_number,
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
      
      // Get the client record that matches this user's email
      console.log('Checking for client with email:', user.email);
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();
        
      if (clientError) {
        console.error('Error fetching client by email:', clientError);
        return dashboardData;
      }
      
      if (!client) {
        console.log('No client record found for this user email:', user.email);
        return dashboardData;
      }
      
      console.log('Found client record:', client);
      
      // Get therapist info
      const { data: therapist, error: therapistError } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('id', client.therapist_id)
        .maybeSingle();
        
      if (therapistError) {
        console.error('Error fetching therapist:', therapistError);
      } else if (therapist) {
        console.log('Found therapist:', therapist);
        dashboardData.therapist = {
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
      }
      
      // Get upcoming appointments
      const now = new Date();
      const { data: upcomingAppointments, error: upcomingError } = await supabase
        .from('appointments')
        .select(`
          *,
          session_notes (*)
        `)
        .eq('client_id', client.id)
        .gte('start_time', now.toISOString())
        .order('start_time', { ascending: true })
        .limit(5);
        
      if (upcomingError) {
        console.error('Error fetching upcoming appointments:', upcomingError);
      } else if (upcomingAppointments) {
        console.log('Found upcoming appointments:', upcomingAppointments.length);
        dashboardData.upcomingAppointments = upcomingAppointments.map(appt => ({
          ...appt,
          // Calculate duration in minutes
          duration: Math.round((new Date(appt.end_time).getTime() - new Date(appt.start_time).getTime()) / (1000 * 60)),
          // Default type if not specified
          type: appt.title || 'Therapy Session'
        }));
      }
      
      // Get recent past appointments
      const { data: recentAppointments, error: recentError } = await supabase
        .from('appointments')
        .select(`
          *,
          session_notes (*)
        `)
        .eq('client_id', client.id)
        .lt('start_time', now.toISOString())
        .order('start_time', { ascending: false })
        .limit(5);
        
      if (recentError) {
        console.error('Error fetching recent appointments:', recentError);
      } else if (recentAppointments) {
        console.log('Found recent appointments:', recentAppointments.length);
        dashboardData.recentAppointments = recentAppointments.map(appt => ({
          ...appt,
          // Calculate duration in minutes
          duration: Math.round((new Date(appt.end_time).getTime() - new Date(appt.start_time).getTime()) / (1000 * 60)),
          // Default type if not specified
          type: appt.title || 'Therapy Session'
        }));
      }
      
    } catch (error) {
      console.error('Error in getPatientDashboardData:', error);
    }
    
    return dashboardData;
  },

  // Claim a patient account using an invite code
  async claimPatientAccount(inviteCode: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Claiming patient account with invite code:', inviteCode);
      
      // Step 1: Verify the invite code
      const { data: verifyData, error: verifyError } = await supabase
        .rpc('verify_invite_code', { invite_code_param: inviteCode });
        
      if (verifyError) {
        console.error('Error verifying invite code:', verifyError);
        return {
          success: false,
          message: 'Invalid invitation code'
        };
      }
      
      // Check if verify data is valid
      if (!verifyData || typeof verifyData !== 'object' || !('valid' in verifyData) || !verifyData.valid) {
        console.error('Invalid verification response:', verifyData);
        return {
          success: false,
          message: 'Invalid or expired invitation code'
        };
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: 'You must be logged in to claim your account'
        };
      }
      
      // Step 2: Accept the invitation
      const { data: acceptData, error: acceptError } = await supabase
        .rpc('accept_client_invitation', { 
          invite_code_param: inviteCode,
          user_id_param: user.id
        });
        
      if (acceptError) {
        console.error('Error accepting invitation:', acceptError);
        return {
          success: false,
          message: 'Error accepting invitation'
        };
      }
      
      // Check if accept data is valid
      if (!acceptData || typeof acceptData !== 'object' || !('success' in acceptData) || !acceptData.success) {
        console.error('Invalid accept response:', acceptData);
        return {
          success: false,
          message: 'Error linking your account'
        };
      }
      
      console.log('Successfully claimed patient account:', acceptData);
      
      // Step 3: Update the client record with the user's ID for future reference
      if ('therapist_id' in acceptData && 'client_id' in acceptData) {
        // Update user_roles to add client role if not already present
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert(
            { user_id: user.id, role: 'client' },
            { onConflict: 'user_id,role' }
          );
          
        if (roleError) {
          console.error('Error adding client role:', roleError);
        }
      }
      
      return {
        success: true,
        message: 'Your account has been successfully linked to your therapist'
      };
    } catch (error: any) {
      console.error('Error in claimPatientAccount:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred'
      };
    }
  }
};
