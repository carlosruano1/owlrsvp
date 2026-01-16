import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://owlrsvp.com'
  
  // Core pages
  const routes = [
    '',
    '/create',
    '/faq',
    '/support',
    '/contact',
    '/about',
    '/checkout',
    // SEO landing pages
    '/online-rsvp',
    '/event-rsvp-website',
    '/qr-code-rsvp',
    '/rsvp-management-software',
    // Blog
    '/blog',
    '/blog/how-to-create-rsvp-website',
    '/blog/rsvp-etiquette-digital-vs-paper',
    '/blog/qr-code-rsvps-benefits-setup-examples',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route.startsWith('/blog') ? 'weekly' as const : 'monthly' as const,
    priority: route === '' ? 1.0 : route.startsWith('/blog') ? 0.7 : 0.8,
  }))
 
  return routes
}
