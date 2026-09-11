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
  galleryLook?: string;
  galleryBulkImportEnabled?: boolean;
}

export interface HealthCheckResponse {
  status: string;
  db: string;
  redis: string;
  timestamp: string;
}

export interface GalleryItem {
  id: string;
  professionalId: string;
  url: string;
  thumbUrl: string | null;
  rawUrl?: string | null;
  title: string | null;
  sort: number;
  published: boolean;
  hasFaceConsent: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
