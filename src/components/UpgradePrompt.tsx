'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UpgradePromptProps {
  reason?: 'event_limit' | 'attendee_limit' | 'branding' | 'analytics' | 'general'
  message?: string
  className?: string
  variant?: 'banner' | 'card' | 'inline'
}

export default function UpgradePrompt({ 
  reason = 'general', 
  message,
  className = '',
  variant = 'card'
}: UpgradePromptProps) {
  const router = useRouter()

  const getMessage = () => {
    if (message) return message
    
    switch (reason) {
      case 'event_limit':
        return "You've reached your event limit. Upgrade to create more events!"
      case 'attendee_limit':
        return "You've reached your attendee limit. Upgrade to invite more guests!"
      case 'branding':
        return "Custom branding is only available on paid plans. Upgrade to customize your events!"
      case 'analytics':
        return "Advanced analytics is only available on Pro and Enterprise plans. Upgrade to see detailed insights!"
      default:
        return "Upgrade your plan to unlock more features!"
    }
  }

  const upgradeUrl = `/?upgrade=true&reason=${reason}#pricing`

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <svg className="w-6 h-6 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white/90 text-sm md:text-base">{getMessage()}</p>
          </div>
          <Link
            href={upgradeUrl}
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all shrink-0 whitespace-nowrap"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`text-center py-2 ${className}`}>
        <p className="text-white/50 text-xs mb-2">{getMessage()}</p>
        <Link
          href={upgradeUrl}
          className="inline-block px-4 py-1.5 bg-white/10 text-white/70 text-xs font-medium rounded-lg hover:bg-white/20 transition-all border border-white/10"
        >
          Upgrade
        </Link>
      </div>
    )
  }

  // Default card variant
  return (
    <div className={`glass-card rounded-xl p-6 border border-white/10 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">Upgrade Required</h3>
          <p className="text-white/80 text-sm mb-4">{getMessage()}</p>
          <Link
            href={upgradeUrl}
            className="inline-block px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  )
}

