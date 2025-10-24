'use client'

import Link from 'next/link'
import Image from 'next/image'

interface FooterProps {
  showDonate?: boolean;
}

export default function Footer({ showDonate = false }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Go to homepage">
            <div className="relative h-8 w-8 overflow-hidden">
              <Image 
                src="/images/owlrsvp_logo_png.png" 
                alt="OwlRSVP Logo" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>
            <span className="text-white text-lg font-bold">
              owl<span className="text-blue-400">rsvp</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/#pricing" className="text-sm text-white/70 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="text-sm text-white/70 hover:text-white transition-colors">
            About
          </Link>
          <Link href="/support" className="text-sm text-white/70 hover:text-white transition-colors">
            Support
          </Link>
        </div>
      </div>
    </footer>
  )
}
