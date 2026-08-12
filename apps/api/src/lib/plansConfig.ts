export interface PlanDefinition {
  name: 'free' | 'pro';
  displayName: string;
  priceClp: number;
  maxServices: number;
  maxClients: number;
  maxGalleryImages: number;
  googleCalendarAllowed: boolean;
  autoWatchFolderAllowed: boolean;
  features: string[];
}

export const PLANS: Record<'free' | 'pro', PlanDefinition> = {
  free: {
    name: 'free',
    displayName: 'Plan Free',
    priceClp: 0,
    maxServices: 5,
    maxClients: 50,
    maxGalleryImages: 10,
    googleCalendarAllowed: false,
    autoWatchFolderAllowed: false,
    features: [
      'Página web pública espejos.cl/{slug}',
      'Hasta 5 servicios publicados',
      'Hasta 50 clientes en base CRM',
      'Galería con límite de 10 fotos',
      'Agendamiento 1-Tap para clientes',
    ],
  },
  pro: {
    name: 'pro',
    displayName: 'Espejos Studio Pro',
    priceClp: 9900,
    maxServices: Infinity,
    maxClients: Infinity,
    maxGalleryImages: Infinity,
    googleCalendarAllowed: true,
    autoWatchFolderAllowed: true,
    features: [
      'Servicios y clientes ilimitados',
      'Sincronización completa con Google Calendar',
      'Galería ilimitada con auto-publicación desde carpeta',
      'Ficha técnica de cliente avanzada con tags',
      'Soporte prioritario 24/7',
    ],
  },
};

export function getPlanConfig(plan: string): PlanDefinition {
  return PLANS[(plan as 'free' | 'pro') || 'free'] || PLANS.free;
}
