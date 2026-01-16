import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://owlrsvp.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/a/',
          '/checkout/',
          '/magic-login/',
          '/verify-email/',
          '/e/', // Event pages are dynamic and don't need indexing
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/a/',
          '/checkout/',
          '/magic-login/',
          '/verify-email/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
