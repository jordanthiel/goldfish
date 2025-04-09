import { supabase } from '@/integrations/supabase/client';

export interface PatientAppointment {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  type?: string;
  duration?: number;
}

export interface PatientTherapist {
  id: string;
  full_name?: string;
  specialty?: string;
  profile_image_url?: string;
  bio?: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'audio' | 'worksheet';
  category: string;
  date: string;
  fileType: string;
  url: string;
}

export const patientService = {
  // Get patient data including therapist info
  async getPatientDashboardData() {
    console.log("Fetching patient dashboard data");
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User not authenticated");
      throw new Error('User not authenticated');
    }

    // First check if the user's email matches any client email in the system
    const userEmail = user.email;
    
    if (!userEmail) {
      console.error('User email not found');
      return {
        therapist: null,
        upcomingAppointments: [],
        recentAppointments: []
      };
    }

    console.log("Checking for client with email:", userEmail);
    
    // Check if the email exists in the clients table
    const { data: clientByEmail, error: emailError } = await supabase
      .from('clients')
      .select('id, therapist_id, first_name, last_name')
      .eq('email', userEmail)
      .maybeSingle();
    
    if (emailError) {
      console.error('Error checking client by email:', emailError);
    }

    console.log("Client found by email:", clientByEmail);
    
    // If no client record found at all
    if (!clientByEmail) {
      console.log('No client record found for this user email:', userEmail);
      return {
        therapist: null,
        upcomingAppointments: [],
        recentAppointments: []
      };
    }

    // If there's no therapist assigned yet, return empty data
    if (!clientByEmail.therapist_id) {
      console.log('No therapist assigned for client');
      return {
        therapist: null,
        upcomingAppointments: [],
        recentAppointments: []
      };
    }

    console.log("Fetching therapist info for ID:", clientByEmail.therapist_id);
    
    // Get therapist details
    const { data: therapist, error: therapistError } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('id', clientByEmail.therapist_id)
      .single();

    if (therapistError) {
      console.error('Error fetching therapist:', therapistError);
    }

    console.log("Therapist found:", therapist);
    
    // Get upcoming appointments
    const now = new Date().toISOString();
    console.log("Fetching upcoming appointments for client ID:", clientByEmail.id);
    
    const { data: upcomingAppointments, error: upcomingError } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', clientByEmail.id)
      .gte('start_time', now)
      .order('start_time', { ascending: true });

    if (upcomingError) {
      console.error('Error fetching upcoming appointments:', upcomingError);
    }

    console.log(`Found ${upcomingAppointments?.length || 0} upcoming appointments`);
    
    // Get recent appointments
    console.log("Fetching recent appointments for client ID:", clientByEmail.id);
    
    const { data: recentAppointments, error: recentError } = await supabase
      .from('appointments')
      .select(`
        *,
        session_notes (content)
      `)
      .eq('client_id', clientByEmail.id)
      .lt('end_time', now)
      .order('start_time', { ascending: false })
      .limit(3);

    if (recentError) {
      console.error('Error fetching recent appointments:', recentError);
    }

    console.log(`Found ${recentAppointments?.length || 0} recent appointments`);
    
    // Process appointments to add duration and type
    const processAppointments = (appointments) => {
      return appointments?.map(appointment => {
        const start = new Date(appointment.start_time);
        const end = new Date(appointment.end_time);
        const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        
        return {
          ...appointment,
          duration: durationMinutes,
          type: appointment.title.includes('Video') ? 'Video Session' : 'In-person Session'
        };
      }) || [];
    };

    const result = {
      therapist: therapist || null,
      upcomingAppointments: processAppointments(upcomingAppointments || []),
      recentAppointments: processAppointments(recentAppointments || [])
    };
    
    console.log("Returning dashboard data with therapist:", result.therapist?.full_name || "None");
    
    return result;
  },

  // Get all patient appointments
  async getPatientAppointments() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userEmail = user.email;
    
    if (!userEmail) {
      console.error('User email not found');
      return [];
    }

    // Check if the email exists in the clients table
    const { data: clientByEmail, error: emailError } = await supabase
      .from('clients')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();
    
    if (emailError) {
      console.error('Error checking client by email:', emailError);
    }

    // If no client record found
    if (!clientByEmail) {
      console.log('No client record found for this user email:', userEmail);
      return [];
    }

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', clientByEmail.id)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }

    // Process appointments to add duration and type
    return data.map(appointment => {
      const start = new Date(appointment.start_time);
      const end = new Date(appointment.end_time);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      
      return {
        ...appointment,
        duration: durationMinutes,
        type: appointment.title.includes('Video') ? 'Video Session' : 'In-person Session'
      };
    });
  },

  // Get all patient resources
  async getPatientResources() {
    // Note: For now we'll return mock data since there's no resources table yet
    // In a real implementation, you would fetch from a resources table
    const resources: ResourceItem[] = [
      {
        id: '1',
        title: 'Understanding Anxiety Disorders',
        description: 'A comprehensive guide to recognizing and managing anxiety symptoms.',
        type: 'guide',
        category: 'anxiety',
        date: '2023-07-12',
        fileType: 'PDF',
        url: '#'
      },
      {
        id: '2',
        title: 'Mindfulness Meditation Practice',
        description: 'Audio guide to mindfulness meditation techniques for stress reduction.',
        type: 'audio',
        category: 'stress',
        date: '2023-06-23',
        fileType: 'MP3',
        url: '#'
      },
      {
        id: '3',
        title: 'Sleep Hygiene Checklist',
        description: 'Practical tips to improve your sleep routine and quality.',
        type: 'worksheet',
        category: 'sleep',
        date: '2023-08-05',
        fileType: 'PDF',
        url: '#'
      },
      {
        id: '4',
        title: 'Depression: Signs, Symptoms and Treatment Options',
        description: 'Educational resource explaining depression and available treatments.',
        type: 'guide',
        category: 'depression',
        date: '2023-05-14',
        fileType: 'PDF',
        url: '#'
      },
      {
        id: '5',
        title: 'Cognitive Behavioral Therapy Workbook',
        description: 'Interactive exercises to challenge negative thought patterns.',
        type: 'worksheet',
        category: 'cbt',
        date: '2023-09-01',
        fileType: 'PDF',
        url: '#'
      },
      {
        id: '6',
        title: 'Guided Progressive Muscle Relaxation',
        description: 'Audio guide for releasing physical tension and promoting relaxation.',
        type: 'audio',
        category: 'stress',
        date: '2023-07-30',
        fileType: 'MP3',
        url: '#'
      }
    ];
    
    return resources;
  },

  // Get messages
  async getPatientMessages() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userEmail = user.email;
    
    if (!userEmail) {
      console.error('User email not found');
      return null;
    }

    // Check if the email exists in the clients table
    const { data: clientByEmail, error: emailError } = await supabase
      .from('clients')
      .select('id, therapist_id, first_name, last_name')
      .eq('email', userEmail)
      .maybeSingle();
    
    if (emailError) {
      console.error('Error checking client by email:', emailError);
      return null;
    }

    // If no client record found
    if (!clientByEmail) {
      console.log('No client record found for this user email:', userEmail);
      return {
        therapist: null,
        patient: {
          name: 'New Patient',
        },
        conversations: []
      };
    }

    // If no therapist assigned yet, return minimal data
    if (!clientByEmail.therapist_id) {
      return {
        therapist: null,
        patient: {
          name: `${clientByEmail.first_name || 'New'} ${clientByEmail.last_name || 'Patient'}`,
        },
        conversations: []
      };
    }

    // Get therapist details
    const { data: therapist, error: therapistError } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('id', clientByEmail.therapist_id)
      .single();

    if (therapistError) {
      console.error('Error fetching therapist:', therapistError);
      return null;
    }

    // Hard-coded messages for now
    return {
      therapist: {
        id: therapist.id,
        name: therapist.full_name || "Your Therapist",
        avatar: therapist.profile_image_url,
        initials: therapist.full_name ? therapist.full_name.split(' ').map(n => n[0]).join('') : "TH"
      },
      patient: {
        name: `${clientByEmail.first_name || 'New'} ${clientByEmail.last_name || 'Patient'}`,
      },
      conversations: [
        {
          id: 1,
          messages: [
            {
              id: 1,
              sender: "therapist",
              content: `Hello ${clientByEmail.first_name}, I hope you're doing well today. I wanted to check in on how you've been managing the stress reduction techniques we discussed in our last session.`,
              timestamp: new Date("2023-09-30T10:30:00"),
              read: true
            },
            {
              id: 2,
              sender: "patient",
              content: `Hi ${therapist.full_name || "Dr."}, I've been practicing the breathing exercises daily and they're definitely helping. I still struggle during high-stress meetings at work, but it's getting better.`,
              timestamp: new Date("2023-09-30T14:45:00"),
              read: true
            },
            {
              id: 3,
              sender: "therapist",
              content: `That's great progress, ${clientByEmail.first_name}! It's normal for the techniques to be more challenging in high-stress situations. Try using the 5-4-3-2-1 grounding technique we discussed when you feel anxiety building up during meetings.`,
              timestamp: new Date("2023-09-30T15:20:00"),
              read: true
            },
            {
              id: 4,
              sender: "therapist",
              content: "I'm also attaching a handout on mindfulness practices that might be helpful for you to review before our next session.",
              timestamp: new Date("2023-09-30T15:22:00"),
              read: true,
              attachment: "Mindfulness_Practices.pdf"
            },
            {
              id: 5,
              sender: "patient",
              content: "Thank you, I'll definitely try that technique! And thanks for the handout, I'll review it before our next appointment.",
              timestamp: new Date("2023-09-30T16:10:00"),
              read: true
            },
            {
              id: 6,
              sender: "therapist",
              content: "You're welcome! Looking forward to our session next week. Don't hesitate to message me if you have any questions before then.",
              timestamp: new Date("2023-09-30T16:15:00"),
              read: true
            },
            {
              id: 7,
              sender: "patient",
              content: "Quick question - do you have any recommendations for sleep issues? I've been having trouble falling asleep lately.",
              timestamp: new Date("2023-10-02T21:30:00"),
              read: true
            },
            {
              id: 8,
              sender: "therapist",
              content: "Sleep difficulties are common with anxiety. Try establishing a wind-down routine 30-60 minutes before bed (no screens, dim lights, possibly reading or light stretching). Also, the body scan relaxation technique we practiced can be helpful. We can discuss more specific strategies in our next session.",
              timestamp: new Date("2023-10-03T09:15:00"),
              read: false
            }
          ]
        }
      ]
    };
  },

  // Claim patient account by invite code
  async claimPatientAccount(inviteCode: string) {
    console.log("Attempting to claim patient account with invite code:", inviteCode);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify the invite code
    console.log("Verifying invite code");
    const { data: verifyData, error: verifyError } = await supabase
      .rpc('verify_invite_code', {
        invite_code_param: inviteCode
      });
    
    if (verifyError) {
      console.error("Error verifying invite code:", verifyError);
      throw new Error(verifyError.message);
    }
    
    // Check if verifyData is an object and has valid: true
    const validInvite = verifyData && typeof verifyData === 'object' && 
      'valid' in verifyData && verifyData.valid === true;
    
    if (!validInvite) {
      console.error("Invalid invitation data:", verifyData);
      throw new Error('Invalid or expired invitation code');
    }

    console.log("Invite code valid, accepting invitation");
    
    // Accept the invitation and link with user account
    const { data: acceptData, error: acceptError } = await supabase
      .rpc('accept_client_invitation', {
        invite_code_param: inviteCode,
        user_id_param: user.id
      });

    if (acceptError) {
      console.error("Error accepting invitation:", acceptError);
      throw new Error(acceptError.message);
    }
    
    // Check if acceptData is an object and has success: true
    const successfulAccept = acceptData && typeof acceptData === 'object' && 
      'success' in acceptData && acceptData.success === true;
    
    if (!successfulAccept) {
      console.error("Failed to accept invitation:", acceptData);
      throw new Error('Failed to claim account');
    }

    console.log("Successfully claimed account:", acceptData);
    
    // Extract therapist_id and client_id from acceptData
    const therapistId = acceptData && typeof acceptData === 'object' && 
      'therapist_id' in acceptData ? acceptData.therapist_id as string : null;
      
    const clientId = acceptData && typeof acceptData === 'object' && 
      'client_id' in acceptData ? acceptData.client_id as string : null;

    // Return success and therapist info
    return {
      success: true,
      therapistId,
      clientId
    };
  }
};
