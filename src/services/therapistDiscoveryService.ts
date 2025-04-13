
import { Therapist } from "@/types/therapist";

// Mock data for therapist discovery
const therapists: Therapist[] = [
  {
    id: "1",
    firstName: "Emma",
    lastName: "Wilson",
    age: 28,
    specialties: ["Anxiety", "Depression", "Young Adult Issues"],
    profileImage: "https://i.pravatar.cc/150?img=1",
    yearsOfExperience: 3,
    rating: 4.8,
    bio: "I'm passionate about helping young adults navigate life transitions and manage anxiety. My approach is collaborative and evidence-based.",
    acceptingNewClients: true,
    offersVirtual: true,
    location: "San Francisco, CA",
    insuranceAccepted: ["Blue Cross", "Aetna", "United Healthcare"]
  },
  {
    id: "2",
    firstName: "Jason",
    lastName: "Patel",
    age: 31,
    specialties: ["Trauma", "LGBTQ+ Issues", "Relationship Counseling"],
    profileImage: "https://i.pravatar.cc/150?img=12",
    yearsOfExperience: 5,
    rating: 4.9,
    bio: "I specialize in trauma-informed care and creating a safe space for all individuals. My therapeutic approach draws from cognitive-behavioral and mindfulness techniques.",
    acceptingNewClients: true,
    offersVirtual: true,
    location: "Chicago, IL",
    insuranceAccepted: ["Blue Cross", "Cigna", "Medicare"]
  },
  {
    id: "3",
    firstName: "Sarah",
    lastName: "Johnson",
    age: 27,
    specialties: ["Stress Management", "Life Transitions", "Self-Esteem"],
    profileImage: "https://i.pravatar.cc/150?img=5",
    yearsOfExperience: 2,
    rating: 4.7,
    bio: "I help clients develop practical skills to manage stress and build confidence. My approach is warm, direct, and focused on your goals.",
    acceptingNewClients: true,
    offersVirtual: true,
    location: "Austin, TX",
    insuranceAccepted: ["Aetna", "United Healthcare"]
  },
  {
    id: "4",
    firstName: "Michael",
    lastName: "Chen",
    age: 29,
    specialties: ["Depression", "Anxiety", "Cultural Identity"],
    profileImage: "https://i.pravatar.cc/150?img=15",
    yearsOfExperience: 4,
    rating: 4.6,
    bio: "I believe therapy should be accessible and practical. I combine evidence-based approaches with cultural sensitivity to help you thrive.",
    acceptingNewClients: false,
    offersVirtual: true,
    location: "Seattle, WA",
    insuranceAccepted: ["Kaiser", "Premera", "Blue Cross"]
  },
  {
    id: "5",
    firstName: "Olivia",
    lastName: "Martinez",
    age: 26,
    specialties: ["Eating Disorders", "Body Image", "Student Issues"],
    profileImage: "https://i.pravatar.cc/150?img=9",
    yearsOfExperience: 2,
    rating: 4.8,
    bio: "As a therapist specializing in eating disorders and body image, I create a supportive environment for healing and growth.",
    acceptingNewClients: true,
    offersVirtual: true,
    location: "Denver, CO",
    insuranceAccepted: ["Cigna", "Aetna", "Beacon Health"]
  },
  {
    id: "6",
    firstName: "Robert",
    lastName: "Taylor",
    age: 45,
    specialties: ["Marriage Counseling", "Family Therapy", "Parenting"],
    profileImage: "https://i.pravatar.cc/150?img=11",
    yearsOfExperience: 15,
    rating: 4.9,
    bio: "With over 15 years of experience, I help couples and families communicate effectively and build stronger relationships.",
    acceptingNewClients: true,
    offersVirtual: false,
    location: "Portland, OR",
    insuranceAccepted: ["Blue Cross", "Aetna", "Cigna", "Medicare"]
  },
  {
    id: "7",
    firstName: "Zoe",
    lastName: "Williams",
    age: 32,
    specialties: ["ADHD", "Executive Functioning", "Career Guidance"],
    profileImage: "https://i.pravatar.cc/150?img=3",
    yearsOfExperience: 6,
    rating: 4.7,
    bio: "I specialize in helping adults with ADHD develop strategies for success in their personal and professional lives.",
    acceptingNewClients: true,
    offersVirtual: true,
    location: "Boston, MA",
    insuranceAccepted: ["Blue Cross", "Harvard Pilgrim", "United Healthcare"]
  },
  {
    id: "8",
    firstName: "David",
    lastName: "Kim",
    age: 34,
    specialties: ["Substance Use", "Recovery", "Men's Issues"],
    profileImage: "https://i.pravatar.cc/150?img=18",
    yearsOfExperience: 7,
    rating: 4.6,
    bio: "I support individuals on their journey to recovery and help them build meaningful, fulfilling lives free from substance dependency.",
    acceptingNewClients: true,
    offersVirtual: false,
    location: "Los Angeles, CA",
    insuranceAccepted: ["Blue Cross", "Kaiser", "MHN"]
  },
  {
    id: "9",
    firstName: "Grace",
    lastName: "Liu",
    age: 29,
    specialties: ["Grief and Loss", "Trauma", "Cultural Adjustment"],
    profileImage: "https://i.pravatar.cc/150?img=7",
    yearsOfExperience: 4,
    rating: 4.8,
    bio: "I provide compassionate support for those navigating grief, loss, and major life changes with cultural sensitivity.",
    acceptingNewClients: true,
    offersVirtual: true,
    location: "New York, NY",
    insuranceAccepted: ["Cigna", "Oscar", "Empire BCBS"]
  },
  {
    id: "10",
    firstName: "Eleanor",
    lastName: "Davis",
    age: 52,
    specialties: ["Chronic Illness", "Pain Management", "Mindfulness"],
    profileImage: "https://i.pravatar.cc/150?img=6",
    yearsOfExperience: 20,
    rating: 4.9,
    bio: "Drawing from 20 years of experience, I help clients manage chronic health conditions and find peace through mindfulness practices.",
    acceptingNewClients: false,
    offersVirtual: true,
    location: "Minneapolis, MN",
    insuranceAccepted: ["Blue Cross", "HealthPartners", "Medicare", "Medicaid"]
  }
];

export const therapistDiscoveryService = {
  // Get all therapists
  getAllTherapists: (): Promise<Therapist[]> => {
    return Promise.resolve(therapists);
  },
  
  // Get therapist by ID
  getTherapistById: (id: string): Promise<Therapist | undefined> => {
    const therapist = therapists.find(t => t.id === id);
    return Promise.resolve(therapist);
  },
  
  // Search therapists by criteria (simple implementation for now)
  searchTherapists: (query: string): Promise<Therapist[]> => {
    if (!query) return Promise.resolve(therapists);
    
    const lowercaseQuery = query.toLowerCase();
    const results = therapists.filter(therapist => 
      therapist.firstName.toLowerCase().includes(lowercaseQuery) ||
      therapist.lastName.toLowerCase().includes(lowercaseQuery) ||
      therapist.specialties.some(s => s.toLowerCase().includes(lowercaseQuery)) ||
      therapist.location.toLowerCase().includes(lowercaseQuery)
    );
    
    return Promise.resolve(results);
  },
  
  // Filter therapists by accepting new clients
  filterByAcceptingClients: (accepting: boolean): Promise<Therapist[]> => {
    return Promise.resolve(therapists.filter(t => t.acceptingNewClients === accepting));
  },
  
  // Filter therapists by virtual options
  filterByVirtual: (virtual: boolean): Promise<Therapist[]> => {
    return Promise.resolve(therapists.filter(t => t.offersVirtual === virtual));
  }
};
