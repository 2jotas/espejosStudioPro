import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const INTERNAL_SLUGS = new Set([
  'panel',
  'admin',
  'login',
  'registro',
  'demo',
  'super-admin',
  'performance',
  'visagismo',
  'auto',
  'studio',
]);

function upsertMeta(attrName: 'name' | 'property', attrValue: string, content: string | null) {
  let element = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!content) {
    if (element) element.remove();
    return;
  }
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertCanonical(url: string | null) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!url) {
    if (element) element.remove();
    return;
  }
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

export default function SeoHead() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    const firstSegment = pathname.split('/').filter(Boolean)[0] || '';

    let title = 'Espejos Agenda | Reservas por link y WhatsApp para barberos en Chile';
    let description = 'Agenda online para barberos y estilistas en Chile. Link propio, WhatsApp y ficha de corte. Sin comisión al cliente.';
    let canonical = 'https://espejosstudio.cl/';
    let robots = 'index, follow';
    let ogTitle = 'Espejos Agenda | Reservas por link y WhatsApp';
    let ogDescription = 'Agenda online para barberos y estilistas. Link propio, WhatsApp y ficha de corte. Sin comisión al cliente.';
    let ogUrl = 'https://espejosstudio.cl/';

    if (pathname === '/') {
      title = 'Espejos Agenda | Reservas por link y WhatsApp para barberos en Chile';
      description = 'Agenda online para barberos y estilistas en Chile. Link propio, WhatsApp y ficha de corte. Sin comisión al cliente.';
      canonical = 'https://espejosstudio.cl/';
      robots = 'index, follow';
      ogTitle = 'Espejos Agenda | Reservas por link y WhatsApp';
      ogDescription = description;
      ogUrl = 'https://espejosstudio.cl/';
    } else if (pathname === '/login') {
      title = 'Iniciar sesión | Espejos Agenda';
      robots = 'noindex, nofollow';
      canonical = 'https://espejosstudio.cl/login';
      ogTitle = title;
      ogUrl = canonical;
    } else if (pathname === '/registro') {
      title = 'Crear espacio | Espejos Agenda';
      robots = 'noindex, nofollow';
      canonical = 'https://espejosstudio.cl/registro';
      ogTitle = title;
      ogUrl = canonical;
    } else if (
      pathname === '/panel' ||
      pathname === '/admin' ||
      pathname === '/super-admin' ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/panel')
    ) {
      title = 'Panel | Espejos Agenda';
      robots = 'noindex, nofollow';
      canonical = `https://espejosstudio.cl${pathname}`;
      ogTitle = title;
      ogUrl = canonical;
    } else if (pathname === '/demo') {
      title = 'Demo | Espejos Agenda';
      description = 'Ejemplo de agenda pública Espejos.';
      canonical = 'https://espejosstudio.cl/demo';
      robots = 'index, follow';
      ogTitle = title;
      ogDescription = description;
      ogUrl = canonical;
    } else if (firstSegment && !INTERNAL_SLUGS.has(firstSegment)) {
      const formattedSlug = firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
      title = `${formattedSlug} | Espejos Agenda`;
      description = `Agenda online y galería de cortes de ${formattedSlug} en Espejos Agenda.`;
      canonical = `https://espejosstudio.cl/${firstSegment}`;
      robots = 'index, follow';
      ogTitle = title;
      ogDescription = description;
      ogUrl = canonical;
    } else if (INTERNAL_SLUGS.has(firstSegment)) {
      const formattedSlug = firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
      title = `${formattedSlug} | Espejos Agenda`;
      robots = 'noindex, nofollow';
      canonical = `https://espejosstudio.cl/${firstSegment}`;
      ogTitle = title;
      ogUrl = canonical;
    }

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertMeta('property', 'og:title', ogTitle);
    upsertMeta('property', 'og:description', ogDescription);
    upsertMeta('property', 'og:url', ogUrl);
    upsertCanonical(canonical);
  }, [location.pathname]);

  return null;
}
