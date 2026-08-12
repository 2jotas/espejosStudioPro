export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'login',
  'register',
  'registro',
  'dashboard',
  'assets',
  'static',
  'www',
  'soporte',
  'help',
  'docs',
  'espejos',
  'precios',
  'settings',
  'configuracion',
  'privacy',
  'terms',
  'terms-of-service',
  'health',
]);

export function isSlugReserved(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.trim().toLowerCase());
}
