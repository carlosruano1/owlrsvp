'use client'

interface FooterProps {
  showDonate?: boolean
}

export default function Footer({ showDonate = false }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="text-2xl">🦉</span>
          <span className="inline-flex items-center gap-2">
            <span>Made by OwlRSVP</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 border border-white/20">
              <span className="text-base">🇺🇸</span>
              <span className="text-xs">USA</span>
            </span>
          </span>
        </div>
        {showDonate && (
          <a
            href="https://www.buymeacoffee.com/owlrsvp"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-donate"
          >
            ☕️ Buy us a coffee
          </a>
        )}
      </div>
    </footer>
  )
}
