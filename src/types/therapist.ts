
export interface Therapist {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  specialties: string[];
  profileImage: string;
  yearsOfExperience: number;
  rating: number;
  bio: string;
  acceptingNewClients: boolean;
  offersVirtual: boolean;
  location: string;
  insuranceAccepted: string[];
}
