
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Backfills test data for the currently logged-in user
 * This is for development/testing purposes only
 */
export const backfillUserData = async () => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You need to be logged in to backfill data",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Backfilling data",
      description: "Adding test data for your account...",
    });

    // Check if user already has a client record
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('id', user.id)
      .single();

    // Create a therapist for the client if needed
    let therapistId: string;
    const { data: existingTherapist } = await supabase
      .from('therapist_profiles')
      .select('id')
      .limit(1)
      .single();

    if (existingTherapist) {
      therapistId = existingTherapist.id;
    } else {
      // Create a sample therapist if none exists
      const { data: newTherapist, error: therapistError } = await supabase
        .from('therapist_profiles')
        .insert({
          id: crypto.randomUUID(),
          full_name: 'Dr. Jane Smith',
          specialty: 'Clinical Psychologist',
          bio: 'Specialized in cognitive behavioral therapy with 15 years of experience.',
          license_number: 'PSY12345',
          years_experience: 15,
          profile_image_url: 'https://randomuser.me/api/portraits/women/65.jpg'
        })
        .select()
        .single();

      if (therapistError) {
        console.error('Error creating therapist:', therapistError);
        throw therapistError;
      }
      
      therapistId = newTherapist.id;
    }

    // Create or update client record
    if (!existingClient) {
      await supabase
        .from('clients')
        .insert({
          id: user.id,
          first_name: user.user_metadata?.full_name?.split(' ')[0] || 'Test',
          last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'Client',
          email: user.email,
          therapist_id: therapistId,
          date_of_birth: '1990-01-01',
          phone: '555-123-4567',
          address: '123 Main St, Anytown, USA',
          status: 'Active'
        });
    }

    // Create sample appointments (past)
    const past30Days = new Date();
    past30Days.setDate(past30Days.getDate() - 30);
    
    const past14Days = new Date();
    past14Days.setDate(past14Days.getDate() - 14);
    
    const past7Days = new Date();
    past7Days.setDate(past7Days.getDate() - 7);

    // Create past appointments
    await supabase
      .from('appointments')
      .insert([
        {
          therapist_id: therapistId,
          client_id: user.id,
          title: 'Initial Assessment - Video Session',
          start_time: new Date(past30Days.setHours(10, 0, 0, 0)).toISOString(),
          end_time: new Date(past30Days.setHours(11, 0, 0, 0)).toISOString(),
          status: 'Completed',
          notes: 'Completed initial assessment. Client expressed anxiety about work situations.'
        },
        {
          therapist_id: therapistId,
          client_id: user.id,
          title: 'Follow-up Session - Video Session',
          start_time: new Date(past14Days.setHours(14, 0, 0, 0)).toISOString(),
          end_time: new Date(past14Days.setHours(15, 0, 0, 0)).toISOString(),
          status: 'Completed',
          notes: 'Discussed coping mechanisms for workplace anxiety.'
        },
        {
          therapist_id: therapistId,
          client_id: user.id,
          title: 'Weekly Session - Video Session',
          start_time: new Date(past7Days.setHours(15, 30, 0, 0)).toISOString(),
          end_time: new Date(past7Days.setHours(16, 30, 0, 0)).toISOString(),
          status: 'Completed',
          notes: 'Client reported improvement with using breathing techniques during stressful situations.'
        }
      ]);

    // Create session notes for past appointments
    await supabase
      .from('session_notes')
      .insert([
        {
          therapist_id: therapistId,
          client_id: user.id,
          content: 'Client presented with symptoms of anxiety related to workplace stress. Recommended daily mindfulness practice and scheduled weekly follow-up.',
          is_private: false
        },
        {
          therapist_id: therapistId,
          client_id: user.id,
          content: 'Follow-up session showed positive response to mindfulness techniques. Client is implementing breathing exercises during stressful moments at work.',
          is_private: false
        },
        {
          therapist_id: therapistId,
          client_id: user.id,
          content: 'Client reports significant reduction in anxiety symptoms. Will continue with current approach and add journaling as an additional coping strategy.',
          is_private: false
        }
      ]);

    // Create upcoming appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    await supabase
      .from('appointments')
      .insert([
        {
          therapist_id: therapistId,
          client_id: user.id,
          title: 'Weekly Check-in - Video Session',
          start_time: new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString(),
          end_time: new Date(tomorrow.setHours(11, 0, 0, 0)).toISOString(),
          status: 'Scheduled'
        },
        {
          therapist_id: therapistId,
          client_id: user.id,
          title: 'Progress Review - Video Session',
          start_time: new Date(nextWeek.setHours(15, 0, 0, 0)).toISOString(),
          end_time: new Date(nextWeek.setHours(16, 0, 0, 0)).toISOString(),
          status: 'Scheduled'
        },
        {
          therapist_id: therapistId,
          client_id: user.id,
          title: 'Monthly Assessment - Video Session',
          start_time: new Date(twoWeeksLater.setHours(14, 30, 0, 0)).toISOString(),
          end_time: new Date(twoWeeksLater.setHours(15, 30, 0, 0)).toISOString(),
          status: 'Scheduled'
        }
      ]);

    // Ensure the user has the client role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'client')
      .single();

    if (!existingRole) {
      await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'client'
        });
    }

    toast({
      title: "Data backfilled successfully",
      description: "Your account now has test data. Please refresh or navigate to the patient dashboard to see it.",
    });

    return true;
  } catch (error) {
    console.error('Error backfilling data:', error);
    toast({
      title: "Error backfilling data",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    });
    return false;
  }
};
