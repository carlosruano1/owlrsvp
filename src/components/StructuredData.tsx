export function WebSiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://owlrsvp.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'OwlRSVP',
    url: baseUrl,
    description: 'Modern event management infrastructure for creating beautiful RSVP pages in seconds. No signup required for guests.',
    publisher: {
      '@type': 'Organization',
      name: 'OwlRSVP',
      url: baseUrl,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/faq?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function SoftwareApplicationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://owlrsvp.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'OwlRSVP',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
    description: 'Create beautiful RSVP pages in seconds. Track attendance, manage guests, and export data with our simple yet powerful event management platform.',
    url: baseUrl,
    screenshot: `${baseUrl}/images/owlrsvp-og.png`,
    featureList: [
      'No signup required for guests',
      'Custom branding and colors',
      'QR code generation',
      'Real-time RSVP tracking',
      'CSV export',
      'Mobile-responsive design',
      'Advanced analytics',
    ],
  }
}
