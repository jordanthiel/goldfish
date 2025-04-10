
import { supabase } from '@/integrations/supabase/client';

export interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  status: string;
  therapistId?: string;
  therapistName?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isFromUser: boolean;
}

export interface AppointmentStatus {
  upcoming: number;
  completed: number;
  cancelled: number;
}

export interface PatientDashboardData {
  upcomingAppointments: any[];
  recentAppointments: any[];
  appointmentStats: AppointmentStatus;
}

// Simulate getting the patient profile
const getPatientProfile = async (): Promise<PatientProfile> => {
  try {
    // Get current user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // In a real implementation, fetch the patient profile from Supabase
    // For now, return mock data until we have the patient profile table set up
    const mockPatient: PatientProfile = {
      id: user.id,
      firstName: 'Jane',
      lastName: 'Doe',
      email: user.email || 'jane.doe@example.com',
      phone: '555-123-4567',
      address: '123 Main St, Anytown, USA',
      dateOfBirth: '1990-05-15',
      emergencyContact: 'John Doe, 555-987-6543',
      status: 'Active',
      therapistId: 't456',
      therapistName: 'Dr. Alex Smith'
    };
    
    return mockPatient;
  } catch (error) {
    console.error('Error getting patient profile:', error);
    
    // Return a minimal fallback patient profile
    return {
      id: 'p123',
      firstName: 'Unknown',
      lastName: 'Patient',
      email: 'unknown@example.com',
      status: 'Unknown'
    };
  }
};

// Fetch messages for a patient from Supabase
const getMessages = async (patientId: string): Promise<Message[]> => {
  try {
    // Check if messages table exists
    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${patientId},receiver_id.eq.${patientId}`)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
    
    if (!messagesData || messagesData.length === 0) {
      return [];
    }
    
    // Transform the database records to our Message interface
    const messages: Message[] = messagesData.map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      content: msg.content,
      timestamp: msg.created_at,
      isFromUser: msg.is_from_user
    }));
    
    return messages;
  } catch (error) {
    console.error('Error in getMessages:', error);
    
    // Return empty array in case of error
    return [];
  }
};

// Send a message using Supabase
const sendMessage = async (patientId: string, messageData: Partial<Message>): Promise<Message> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: messageData.senderId,
        receiver_id: messageData.receiverId,
        content: messageData.content,
        is_from_user: messageData.isFromUser || true
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from insert operation');
    }
    
    // Transform the response to our Message interface
    const newMessage: Message = {
      id: data.id,
      senderId: data.sender_id,
      receiverId: data.receiver_id,
      content: data.content,
      timestamp: data.created_at,
      isFromUser: data.is_from_user
    };
    
    return newMessage;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};

// Get appointment statistics
const getAppointmentStats = async (): Promise<AppointmentStatus> => {
  // In a real implementation, fetch from Supabase
  return {
    upcoming: 3,
    completed: 12,
    cancelled: 1
  };
};

// Get patient dashboard data
const getPatientDashboardData = async (patientId: string): Promise<PatientDashboardData> => {
  // For now, return mock data
  return {
    upcomingAppointments: [
      {
        id: 'a1',
        title: 'Therapy Session',
        therapistName: 'Dr. Sarah Johnson',
        start: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
        end: new Date(new Date().getTime() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
        status: 'Scheduled'
      },
      {
        id: 'a2',
        title: 'Follow-up Session',
        therapistName: 'Dr. Sarah Johnson',
        start: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week later
        end: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
        status: 'Scheduled'
      }
    ],
    recentAppointments: [
      {
        id: 'a3',
        title: 'Initial Consultation',
        therapistName: 'Dr. Sarah Johnson',
        start: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        end: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
        status: 'Completed'
      }
    ],
    appointmentStats: {
      upcoming: 2,
      completed: 5,
      cancelled: 0
    }
  };
};

// Function to handle claiming a patient account
const claimPatientAccount = async (inviteCode: string, userData: any): Promise<boolean> => {
  try {
    // This would normally involve:
    // 1. Verifying the invite code
    // 2. Creating or updating the user record
    // 3. Setting up proper permissions
    
    // For this demo, we'll simulate a successful response
    console.log('Claiming account with invite code:', inviteCode, 'and user data:', userData);
    
    return true;
  } catch (error) {
    console.error('Error claiming patient account:', error);
    return false;
  }
};

export const patientService = {
  getPatientProfile,
  getMessages,
  sendMessage,
  getAppointmentStats,
  getPatientDashboardData,
  claimPatientAccount
};
