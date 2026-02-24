
export enum UserRole {
  DRIVER = 'DRIVER',
  PASSENGER = 'PASSENGER',
  BOTH = 'BOTH'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  skills: string[]; // For Mission 4 (Peer Tutoring)
  accessibilityNeeds: string[]; // For Mission 5 (Disability Support)
  credits: number; // CO2 Eco-Credits
  password?: string; // Simple password storage for prototype
  theme?: 'light' | 'dark'; // Tema preferito dell'utente
  rating?: number | null; // Average rating (1-5)
  totalReviews?: number; // Total number of reviews
}

export interface Trip {
  id: string;
  driverId: string;
  driverName: string;
  from: string;
  to: string;
  departureTime: string;
  seatsAvailable: number;
  distanceKm: number;
  co2Saved: number;
  tutoringSubject?: string; // Mission 4
  assistanceOffered: boolean; // Mission 5
  specialEquipment?: string[]; // e.g., Ramp, Visual guide
  passengerIds?: string[]; // New: track who joined
}

export interface CreditLog {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  timestamp: string;
}

export interface Message {
  id: string;
  tripId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  attachmentUrl?: string; // URL dell'immagine allegata
  attachmentType?: 'image' | 'file'; // Tipo di allegato
}

export interface StudyGroup {
  id: string;
  trainNumber: string;
  trainLine: string;
  departureTime: string;
  subject: string;
  from: string; // Station name
  creatorId: string;
  members: string[]; // Array of user IDs
  maxMembers: number;
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
  timestamp: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export interface Review {
  id: string;
  tripId: string;
  reviewerId: string;
  reviewerName: string;
  reviewedId: string;
  reviewedName: string;
  type: 'driver_to_passenger' | 'passenger_to_driver';
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface UserRating {
  rating: number | null;
  totalReviews: number;
}
