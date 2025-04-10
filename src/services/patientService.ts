
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { encryptAES, decryptAES } from '@/lib/utils';

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
  unreadMessages: number;
  nextAppointment: any | null;
}

// Simulate getting the patient profile
const getPatientProfile = async (): Promise<PatientProfile> => {
  try {
    const { user } = useAuth();
    
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
    
    // Get the encryption key (using patient ID as part of the key in this example)
    const encryptionKey = `${patientId}-therapy-key-change-in-production`;
    
    // Transform the database records to our Message interface
    const messages: Message[] = messagesData.map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      content: decryptAES(msg.content, encryptionKey),
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
    // Get the encryption key (using patient ID as part of the key in this example)
    const encryptionKey = `${patientId}-therapy-key-change-in-production`;
    
    // Encrypt the message content
    const encryptedContent = encryptAES(messageData.content || '', encryptionKey);
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: messageData.senderId,
        receiver_id: messageData.receiverId,
        content: encryptedContent,
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
      content: messageData.content || '', // Use the original unencrypted content
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
  try {
    // In a real implementation, fetch from Supabase
    // For now, return mock data
    return {
      upcomingAppointments: [
        { 
          id: 'a1', 
          title: 'Therapy Session',
          start_time: new Date(Date.now() + 86400000).toISOString(), // tomorrow
          end_time: new Date(Date.now() + 90000000).toISOString(),
          therapist_name: 'Dr. Alex Smith'
        }
      ],
      recentAppointments: [
        { 
          id: 'a2', 
          title: 'Initial Consultation',
          start_time: new Date(Date.now() - 604800000).toISOString(), // last week
          end_time: new Date(Date.now() - 601200000).toISOString(),
          therapist_name: 'Dr. Alex Smith'
        }
      ],
      unreadMessages: 2,
      nextAppointment: { 
        id: 'a1', 
        title: 'Therapy Session',
        start_time: new Date(Date.now() + 86400000).toISOString(),
        end_time: new Date(Date.now() + 90000000).toISOString(),
        therapist_name: 'Dr. Alex Smith'
      }
    };
  } catch (error) {
    console.error('Error fetching patient dashboard data:', error);
    return {
      upcomingAppointments: [],
      recentAppointments: [],
      unreadMessages: 0,
      nextAppointment: null
    };
  }
};

// Add claim account function
const claimPatientAccount = async (inviteCode: string, userData: any): Promise<any> => {
  try {
    // In a real implementation, this would call a Supabase function or RPC
    console.log('Claiming account with invite code:', inviteCode);
    console.log('User data:', userData);
    
    // Return mock success response
    return {
      success: true,
      message: 'Account claimed successfully'
    };
  } catch (error) {
    console.error('Error claiming patient account:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
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
