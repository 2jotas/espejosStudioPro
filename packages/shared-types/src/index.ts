export type PlanType = 'free' | 'pro';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export type AuthMethod = 'passkey' | 'otp';

export interface UserSession {
  id: string;
  email: string;
  slug: string;
  businessName: string;
  plan: PlanType;
  bio?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
}

export interface HealthCheckResponse {
  status: string;
  db: string;
  redis: string;
  timestamp: string;
}
