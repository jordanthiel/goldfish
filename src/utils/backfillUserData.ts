import { supabase } from '@/integrations/supabase/client';

const createSampleAppointmentsForClient = async (therapistId: string, clientId: string) => {
  const sampleAppointments = [
    {
      title: 'Initial Consultation',
      start_time: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      end_time: new Date(new Date().setDate(new Date().getDate() + 7)).setHours(new Date().getHours() + 1).toISOString(),
      status: 'Scheduled',
      notes: 'Discuss client history and goals for therapy.'
    },
    {
      title: 'Follow-up Session',
      start_time: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
      end_time: new Date(new Date().setDate(new Date().getDate() + 14)).setHours(new Date().getHours() + 1).toISOString(),
      status: 'Scheduled',
      notes: 'Review progress and adjust treatment plan.'
    }
  ];
  
  for (const appointmentData of sampleAppointments) {
    const { error: appError } = await supabase
      .from('appointments')
      .insert({
        therapist_id: therapistId,
        client_id: clientId,
        title: appointmentData.title,
        start_time: appointmentData.start_time,
        end_time: appointmentData.end_time,
        status: appointmentData.status,
        notes: appointmentData.notes
      });
      
    if (appError) {
      console.error('Error creating sample appointment:', appError);
    }
  }
};

export const backfillUserData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found when trying to backfill data');
      return false;
    }
    
    console.log('Starting backfill for user:', user.id);
    
    // Check if this user already has a therapist profile
    const { data: existingTherapist } = await supabase
      .from('therapist_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (!existingTherapist) {
      // Create therapist profile if it doesn't exist
      const { error: therapistError } = await supabase
        .from('therapist_profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Dr. Example Therapist',
          specialty: 'Clinical Psychology',
          license_number: 'ABC12345',
          years_experience: 8,
          bio: 'Experienced therapist specializing in anxiety, depression, and relationship issues.',
          profile_image_url: 'https://randomuser.me/api/portraits/men/1.jpg',
        });
        
      if (therapistError) {
        console.error('Error creating therapist profile:', therapistError);
        return false;
      }
    }
    
    // Create sample clients
    const sampleClients = [
      {
        first_name: 'Alex',
        last_name: 'Johnson',
        phone: '555-123-4567',
        date_of_birth: '1985-06-15',
        address: '123 Main St, Anytown, USA',
        status: 'Active'
      },
      {
        first_name: 'Jordan',
        last_name: 'Smith',
        phone: '555-987-6543',
        date_of_birth: '1990-03-22',
        address: '456 Oak Ave, Somewhere, USA',
        status: 'Active'
      },
      {
        first_name: 'Taylor',
        last_name: 'Williams',
        phone: '555-555-5555',
        date_of_birth: '1978-11-30',
        address: '789 Pine Blvd, Nowhere, USA',
        status: 'Inactive'
      }
    ];
    
    // Create each client
    for (const clientData of sampleClients) {
      // Insert client profile
      const { data: client, error: clientError } = await supabase
        .from('client_profiles')
        .insert({
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          phone: clientData.phone,
          date_of_birth: clientData.date_of_birth,
          address: clientData.address,
          status: clientData.status
        })
        .select()
        .single();
        
      if (clientError || !client) {
        console.error('Error creating sample client:', clientError);
        continue;
      }
      
      // Create relationship between therapist and client
      const { error: relError } = await supabase
        .from('therapist_clients')
        .insert({
          therapist_id: user.id,
          client_id: client.id,
          status: clientData.status
        });
        
      if (relError) {
        console.error('Error creating therapist-client relationship:', relError);
        continue;
      }
      
      // Create sample appointments for this client
      await createSampleAppointmentsForClient(user.id, client.id);
    }
    
    // Add a therapist role if not already assigned
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: 'therapist' })
      .select();
      
    if (roleError) {
      // Ignore duplicate key errors for roles
      if (!roleError.message.includes('duplicate key')) {
        console.error('Error assigning therapist role:', roleError);
      }
    }
    
    console.log('Backfill completed successfully');
    return true;
  } catch (error) {
    console.error('Error during backfill:', error);
    return false;
  }
};
