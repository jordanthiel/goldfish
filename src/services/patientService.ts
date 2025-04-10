
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

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

// Mock data for development - in production, this would come from the database
const mockPatient: PatientProfile = {
  id: 'p123',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '555-123-4567',
  address: '123 Main St, Anytown, USA',
  dateOfBirth: '1990-05-15',
  emergencyContact: 'John Doe, 555-987-6543',
  status: 'Active',
  therapistId: 't456',
  therapistName: 'Dr. Alex Smith'
};

// Simulate getting the patient profile
const getPatientProfile = async (): Promise<PatientProfile> => {
  // In a real implementation, this would fetch from Supabase
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockPatient);
    }, 500);
  });
};

// Fetch encrypted messages for a patient
const getMessages = async (patientId: string): Promise<Message[]> => {
  try {
    // In a real implementation, fetch encrypted messages from Supabase
    // For now, return mock data
    return [
      {
        id: 'm1',
        senderId: 't456', // therapist
        receiverId: patientId,
        content: 'RW5jcnlwdGVkOiBIaSBKYW5lLCBob3cgYXJlIHlvdSBmZWVsaW5nIHRvZGF5Pw==', // Encrypted: "Hi Jane, how are you feeling today?"
        timestamp: new Date(Date.now() - 86400000).toISOString(), // yesterday
        isFromUser: false
      },
      {
        id: 'm2',
        senderId: patientId,
        receiverId: 't456',
        content: 'RW5jcnlwdGVkOiBJJ20gZG9pbmcgcHJldHR5IHdlbGwsIHRoYW5rcyBmb3IgYXNraW5nLg==', // Encrypted: "I'm doing pretty well, thanks for asking."
        timestamp: new Date(Date.now() - 82800000).toISOString(), // yesterday, later
        isFromUser: true
      },
      {
        id: 'm3',
        senderId: 't456',
        receiverId: patientId,
        content: 'RW5jcnlwdGVkOiBHbGFkIHRvIGhlYXIgaXQhIERvbid0IGZvcmdldCBvdXIgc2Vzc2lvbiB0b21vcnJvdy4=', // Encrypted: "Glad to hear it! Don't forget our session tomorrow."
        timestamp: new Date(Date.now() - 43200000).toISOString(), // half day ago
        isFromUser: false
      }
    ];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

// Send an encrypted message
const sendMessage = async (patientId: string, messageData: Partial<Message>): Promise<Message> => {
  try {
    // In a real implementation, this would save to Supabase
    // For now, mock the response
    const newMessage: Message = {
      id: `m${Date.now()}`,
      senderId: messageData.senderId || '',
      receiverId: messageData.receiverId || '',
      content: messageData.content || '',
      timestamp: new Date().toISOString(),
      isFromUser: messageData.isFromUser || false
    };
    
    return newMessage;
  } catch (error) {
    console.error('Error sending message:', error);
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

export const patientService = {
  getPatientProfile,
  getMessages,
  sendMessage,
  getAppointmentStats
};
