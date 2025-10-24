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
              <span className="inline-block align-middle" aria-label="USA flag" role="img">
                <svg width="16" height="12" viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg">
                  <rect width="64" height="48" fill="#fff"/>
                  <g fill="#B22234">
                    <rect y="0" width="64" height="6"/>
                    <rect y="12" width="64" height="6"/>
                    <rect y="24" width="64" height="6"/>
                    <rect y="36" width="64" height="6"/>
                  </g>
                  <rect width="28" height="26" fill="#3C3B6E"/>
                </svg>
              </span>
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
