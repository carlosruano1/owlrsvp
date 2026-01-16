export interface FAQ {
  question: string;
  answer: string;
  category: 'getting-started' | 'features' | 'pricing' | 'use-cases' | 'technical';
  keywords?: string[];
}

export const FAQ_CATEGORIES = {
  'getting-started': 'Getting Started',
  'features': 'Features',
  'pricing': 'Pricing & Plans',
  'use-cases': 'Use Cases',
  'technical': 'Technical'
} as const;

// Top 10 most relevant FAQs for homepage
export const TOP_10_FAQS: FAQ[] = [
  {
    question: 'What is OwlRSVP and how does it work?',
    answer: 'OwlRSVP is a modern event management infrastructure platform that allows you to create beautiful RSVP pages in seconds. Simply create an event, customize your branding, and share the link with guests. Guests can RSVP instantly without creating an account, and you can track all responses in real-time through your admin dashboard. No complex setup required—get started in under 60 seconds.',
    category: 'getting-started',
    keywords: ['what is owlrsvp', 'how does owlrsvp work', 'event management platform']
  },
  {
    question: 'How do I create an RSVP page without signing up?',
    answer: 'You can create your first event immediately without any signup required. Just visit our create page, enter your event details (title, date, optional description), customize colors and branding if desired, and you\'ll instantly receive a shareable RSVP link. For guests, no account is needed—they simply click your link and RSVP with their name.',
    category: 'getting-started',
    keywords: ['create rsvp page', 'no signup', 'quick setup']
  },
  {
    question: 'Is OwlRSVP free to use?',
    answer: 'Yes! OwlRSVP offers a free plan that includes one event with up to 25 guests, basic RSVP pages, CSV export, and QR code generation. For more events, custom branding, advanced analytics, and higher guest limits, we offer affordable paid plans starting at $9/month. You can always start free and upgrade when you need more features.',
    category: 'pricing',
    keywords: ['free rsvp', 'pricing', 'cost']
  },
  {
    question: 'How do I share my RSVP link with guests?',
    answer: 'After creating your event, you\'ll receive a unique RSVP link that you can share via email, text message, social media, or embed in your website. We also automatically generate a QR code for each event, which you can print on invitations or display at your venue. Guests simply click the link or scan the QR code to RSVP—no app download required.',
    category: 'features',
    keywords: ['share rsvp link', 'qr code', 'invitations']
  },
  {
    question: 'Can guests RSVP without creating an account?',
    answer: 'Absolutely! One of OwlRSVP\'s key features is that guests never need to create an account or download an app. They simply click your RSVP link, enter their name (and optional plus-ones), select Yes or No, and submit. This makes the experience seamless and accessible for all your guests, regardless of their technical comfort level.',
    category: 'features',
    keywords: ['no account required', 'guest experience', 'simple rsvp']
  },
  {
    question: 'What\'s the difference between OwlRSVP and Eventbrite/Paperless Post/RSVPify?',
    answer: 'Unlike traditional event platforms, OwlRSVP focuses on simplicity and speed. We don\'t require guests to download apps or create accounts. Our setup takes under 60 seconds compared to lengthy onboarding processes. We offer custom branding without design limitations, better mobile-first experiences, and transparent pricing without hidden fees. OwlRSVP is built as event management infrastructure—fast, reliable, and designed to scale with your needs.',
    category: 'use-cases',
    keywords: ['vs eventbrite', 'alternative', 'comparison']
  },
  {
    question: 'How do QR codes work for RSVP pages?',
    answer: 'Every event you create automatically generates a unique QR code. You can download this QR code as an image and print it on physical invitations, display it at your venue, or share it digitally. When guests scan the QR code with their phone camera, it instantly opens your RSVP page. No special QR code reader app is needed—modern smartphones can scan QR codes directly from the camera app.',
    category: 'features',
    keywords: ['qr code', 'how qr codes work', 'scan to rsvp']
  },
  {
    question: 'Can I customize the colors and branding of my RSVP page?',
    answer: 'Yes! On our Basic plan and above, you can fully customize your RSVP page with your company logo, brand colors, and personalized styling. This helps maintain brand consistency across all your events. The free plan includes basic color customization, while paid plans unlock full branding capabilities including logo uploads.',
    category: 'features',
    keywords: ['custom branding', 'logo', 'colors', 'branding']
  },
  {
    question: 'How do I export my guest list to CSV?',
    answer: 'Exporting your guest list is simple. From your admin dashboard, click the "Export CSV" button, and you\'ll instantly download a spreadsheet with all attendee information including names, guest counts, RSVP status, and timestamps. This makes it easy to import into other tools, send to caterers, or use for event planning. CSV export is available on all plans, including free.',
    category: 'features',
    keywords: ['export csv', 'guest list', 'download attendees']
  },
  {
    question: 'What happens if I exceed my guest limit?',
    answer: 'If you exceed your plan\'s guest limit, you can continue accepting RSVPs. On paid plans (Basic, Pro, Enterprise), you\'ll be charged $0.05 per guest over your limit at the end of your billing cycle. This ensures you never have to turn away guests due to plan restrictions. The free plan allows up to 25 guests per event—upgrade to a paid plan for higher limits.',
    category: 'pricing',
    keywords: ['guest limit', 'overage', 'pricing']
  }
];

// Complete FAQ list organized by category
export const ALL_FAQS: FAQ[] = [
  // Getting Started
  ...TOP_10_FAQS.slice(0, 2),
  {
    question: 'Does OwlRSVP work on mobile devices?',
    answer: 'Yes! OwlRSVP is built mobile-first, meaning it works beautifully on smartphones, tablets, and desktops. Your RSVP pages are fully responsive and optimized for touch interactions. Guests can easily RSVP from any device, and your admin dashboard is also mobile-friendly so you can manage events on the go.',
    category: 'getting-started',
    keywords: ['mobile', 'responsive', 'phone']
  },
  {
    question: 'How do I add a logo to my RSVP page?',
    answer: 'On Basic plan and above, you can upload your company logo directly from the event creation or editing page. Simply click the logo upload area, select your image file, and it will appear on your RSVP page. We support common image formats (PNG, JPG, SVG) and recommend logos that are at least 200x200 pixels for best quality.',
    category: 'features',
    keywords: ['logo upload', 'add logo', 'branding']
  },
  {
    question: 'Can guests bring plus-ones to my event?',
    answer: 'Yes! When creating or editing your event, you can enable the "Allow plus guests" option. This adds a field where guests can specify how many additional people they\'re bringing. You\'ll see the total guest count (including plus-ones) in your admin dashboard, making it easy to plan for the right number of attendees.',
    category: 'features',
    keywords: ['plus ones', 'additional guests', 'guest count']
  },
  {
    question: 'How do I track RSVPs in real-time?',
    answer: 'Your admin dashboard updates in real-time as guests submit their RSVPs. You can see the total number of attendees, view the complete guest list with names and responses, and monitor response rates. The dashboard also shows timestamps for each RSVP, helping you track when responses come in.',
    category: 'features',
    keywords: ['track rsvps', 'real-time', 'dashboard']
  },
  {
    question: 'What analytics are available on OwlRSVP?',
    answer: 'Basic plans include essential analytics like total RSVPs, response rates, and guest lists. Pro and Enterprise plans unlock advanced analytics including response trends over time, response velocity (how quickly guests RSVP), guest insights, and comparison tools to analyze multiple events. All analytics are available in your admin dashboard and can be exported for further analysis.',
    category: 'features',
    keywords: ['analytics', 'insights', 'statistics']
  },
  {
    question: 'How secure is my event data?',
    answer: 'Security is a top priority. All event data is encrypted in transit and at rest. Admin access is protected by secure tokens, and we never share your guest information with third parties. We use industry-standard security practices and regularly update our systems to protect your data.',
    category: 'technical',
    keywords: ['security', 'privacy', 'data protection']
  },
  {
    question: 'Can I edit my event after creating it?',
    answer: 'Yes! You can edit your event details, colors, branding, and settings at any time from your admin dashboard. Changes take effect immediately, and existing RSVPs remain intact. However, you cannot change the event ID or admin token once created.',
    category: 'features',
    keywords: ['edit event', 'update', 'modify']
  },
  {
    question: 'How long are RSVP links active?',
    answer: 'RSVP links remain active indefinitely unless you archive or delete the event. This means guests can RSVP at any time, even months after you create the event. You can set custom RSVP deadlines in your event settings if you want to close responses by a specific date.',
    category: 'technical',
    keywords: ['link expiration', 'active links', 'deadline']
  },
  {
    question: 'Can I embed my RSVP page on my website?',
    answer: 'Yes! You can embed your RSVP page on your website using an iframe. Simply use your RSVP link as the iframe source. This allows you to maintain your website\'s design while providing the full OwlRSVP functionality. Contact support if you need help with embedding.',
    category: 'technical',
    keywords: ['embed', 'iframe', 'website integration']
  },
  {
    question: 'Does OwlRSVP send email reminders to guests?',
    answer: 'Currently, OwlRSVP focuses on the RSVP collection experience. Email reminders are not automatically sent, but you can manually send your RSVP link via email to remind guests. We\'re continuously adding features based on user feedback, so automated reminders may be available in future updates.',
    category: 'features',
    keywords: ['email reminders', 'notifications', 'follow-up']
  },
  // Pricing
  {
    question: 'What\'s included in the free plan?',
    answer: 'The free plan includes one event with up to 25 guests, basic RSVP pages with color customization, automatic QR code generation, CSV export of guest lists, and access to the admin dashboard. It\'s perfect for small events, testing the platform, or occasional use.',
    category: 'pricing',
    keywords: ['free plan', 'what\'s included', 'features']
  },
  {
    question: 'When do I need to upgrade from free to paid?',
    answer: 'Consider upgrading if you need multiple events, more than 25 guests per event, custom branding (logo uploads), advanced analytics, or want to remove the free-tier watermark. Paid plans start at just $9/month and unlock powerful features for growing event needs.',
    category: 'pricing',
    keywords: ['upgrade', 'when to upgrade', 'paid plans']
  },
  {
    question: 'What\'s the difference between Basic, Pro, and Enterprise plans?',
    answer: 'Basic ($9/mo) includes 5 events, up to 200 guests per event, custom branding, and basic analytics. Pro ($29/mo) includes 25 events, up to 1,000 guests per event, and advanced analytics. Enterprise ($99/mo) includes unlimited events, unlimited guests, and all features. All paid plans include CSV export, email notifications, and no watermarks.',
    category: 'pricing',
    keywords: ['plan comparison', 'basic vs pro', 'enterprise']
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time from your account settings. Your subscription will remain active until the end of your current billing period, and you\'ll retain access to all features during that time. After cancellation, you can continue using the free plan.',
    category: 'pricing',
    keywords: ['cancel', 'subscription', 'billing']
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer refunds on a case-by-case basis. If you\'re not satisfied with OwlRSVP, please contact us at carlos@owlrsvp.com within 30 days of your subscription, and we\'ll work with you to resolve any issues or process a refund if appropriate.',
    category: 'pricing',
    keywords: ['refund', 'money back', 'satisfaction']
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through our secure Stripe payment processing. Payments are processed securely and automatically charged monthly on your subscription anniversary date.',
    category: 'pricing',
    keywords: ['payment methods', 'credit card', 'stripe']
  },
  {
    question: 'Are there any hidden fees?',
    answer: 'No hidden fees! Our pricing is transparent. You pay your monthly subscription fee, and if you exceed your guest limit on paid plans, you\'ll be charged $0.05 per additional guest. That\'s it—no setup fees, no transaction fees, no surprises.',
    category: 'pricing',
    keywords: ['hidden fees', 'transparent pricing', 'cost']
  },
  // Use Cases
  {
    question: 'Is OwlRSVP good for corporate events?',
    answer: 'Absolutely! OwlRSVP is perfect for corporate events including conferences, team building, product launches, and company parties. Custom branding ensures your events match your company identity, and the professional interface reflects well on your organization. Advanced analytics help you measure event success and plan future events.',
    category: 'use-cases',
    keywords: ['corporate events', 'business', 'conferences']
  },
  {
    question: 'Can I use OwlRSVP for wedding RSVPs?',
    answer: 'Yes! Many couples use OwlRSVP for their wedding RSVPs. The elegant design, easy guest experience, and ability to track plus-ones make it perfect for weddings. You can customize colors to match your wedding theme and export guest lists for seating charts and catering.',
    category: 'use-cases',
    keywords: ['wedding', 'wedding rsvp', 'bridal']
  },
  {
    question: 'How do I manage RSVPs for a conference?',
    answer: 'OwlRSVP excels at conference management. Create separate events for different conference sessions or use one event for the main conference. Track attendance across sessions, export data for badge printing, and use analytics to understand attendee engagement. The QR code feature makes on-site check-in quick and easy.',
    category: 'use-cases',
    keywords: ['conference', 'conference management', 'multi-session']
  },
  {
    question: 'Is OwlRSVP suitable for small parties?',
    answer: 'Perfect for small parties! The free plan is ideal for casual gatherings, birthday parties, or small celebrations. Setup takes seconds, and guests can RSVP easily from their phones. No need for complex event management tools—just simple, beautiful RSVP pages that get the job done.',
    category: 'use-cases',
    keywords: ['small parties', 'birthday', 'casual events']
  },
  {
    question: 'Can I use OwlRSVP for virtual events?',
    answer: 'Yes! OwlRSVP works great for virtual events. You can collect RSVPs and then share the event link (Zoom, Teams, etc.) with confirmed attendees. The platform helps you track who\'s attending virtual events and manage your guest list just like in-person events.',
    category: 'use-cases',
    keywords: ['virtual events', 'online', 'webinar']
  },
  {
    question: 'How do I handle last-minute cancellations?',
    answer: 'Guests can\'t directly cancel through the RSVP page, but you can manually update their status in your admin dashboard. Simply access the attendee list, find the guest, and mark them as "Not Attending" or remove them from the list. Your guest count will update automatically.',
    category: 'use-cases',
    keywords: ['cancellations', 'changes', 'updates']
  },
  {
    question: 'Can I set an RSVP deadline?',
    answer: 'Currently, RSVP deadlines are managed manually through your event settings. You can note a deadline in your event description, and guests will see it on the RSVP page. We\'re working on automated deadline features that will close RSVPs automatically at your specified date and time.',
    category: 'use-cases',
    keywords: ['deadline', 'rsvp deadline', 'cutoff date']
  },
  // Competitive Differentiation
  {
    question: 'Why choose OwlRSVP over Eventbrite?',
    answer: 'OwlRSVP is faster to set up (under 60 seconds vs. lengthy onboarding), doesn\'t require guests to download apps or create accounts, offers transparent pricing without ticket fees, and focuses on simplicity rather than overwhelming features. If you need a quick, elegant RSVP solution without the complexity of full event ticketing platforms, OwlRSVP is the better choice.',
    category: 'use-cases',
    keywords: ['vs eventbrite', 'alternative', 'better than']
  },
  {
    question: 'How is OwlRSVP different from RSVPify?',
    answer: 'OwlRSVP emphasizes speed and simplicity. We don\'t require guest accounts, offer faster setup, modern mobile-first design, and transparent pricing. While RSVPify offers more customization options, OwlRSVP provides a streamlined experience that gets you from creation to sharing in under a minute.',
    category: 'use-cases',
    keywords: ['vs rsvpify', 'comparison', 'difference']
  },
  {
    question: 'What makes OwlRSVP faster than other RSVP tools?',
    answer: 'OwlRSVP is built as infrastructure, not just a tool. We\'ve eliminated unnecessary steps—no lengthy forms, no account requirements for guests, no complex settings. Our minimalist approach means you can create and share an event in under 60 seconds, while competitors often require 5-10 minutes of setup and configuration.',
    category: 'use-cases',
    keywords: ['fast', 'quick', 'speed', 'efficiency']
  },
  {
    question: 'Why is OwlRSVP better for simple events?',
    answer: 'Many event platforms are over-engineered for simple RSVP needs. OwlRSVP strips away the complexity and focuses on what matters: beautiful RSVP pages, easy guest experience, and reliable tracking. If you just need to collect RSVPs without ticketing, payment processing, or complex event management, OwlRSVP is purpose-built for you.',
    category: 'use-cases',
    keywords: ['simple events', 'minimalist', 'focused']
  },
  {
    question: 'Does OwlRSVP require guests to download an app?',
    answer: 'No! OwlRSVP works entirely in web browsers. Guests simply click your link or scan your QR code—no app download, no account creation, no friction. This makes it accessible to everyone, regardless of their device or technical comfort level.',
    category: 'features',
    keywords: ['no app', 'web-based', 'browser']
  }
];
