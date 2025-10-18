'use client'

import Link from 'next/link'

interface FooterProps {
  showDonate?: boolean;
}

export default function Footer({ showDonate = false }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="inline-flex items-center gap-3">
            <span className="sr-only">OwlRSVP</span>
            <span className="text-lg md:text-xl tracking-tight logo-anim">
              <span className="logo-word-owl">owl</span>
              <span className="logo-word-rsvp">rsvp</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 border border-white/20">
              <img src="/flags/us.svg" width={16} height={16} alt="USA flag" className="inline-block" />
              <span className="text-xs">USA</span>
            </span>
          </span>
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
