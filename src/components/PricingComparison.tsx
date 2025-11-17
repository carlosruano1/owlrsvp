'use client'

import { useState } from 'react'
import { PLAN_DETAILS, PLANS } from '@/lib/stripe'

// Eventbrite charges 2.5% + $0.99 per paid ticket
// Assuming average ticket price of $25 for paid events
const AVERAGE_TICKET_PRICE = 25
const EVENTBRITE_FEE_PERCENT = 0.025
const EVENTBRITE_FIXED_FEE = 0.99

function calculateEventbriteFee(attendees: number): number {
  // Eventbrite charges 2.5% + $0.99 per paid ticket
  const feePerTicket = (AVERAGE_TICKET_PRICE * EVENTBRITE_FEE_PERCENT) + EVENTBRITE_FIXED_FEE
  return attendees * feePerTicket
}

function getOwlRSVPPrice(selectedPlan: 'free' | 'basic' | 'pro'): { price: number; planName: string; guestLimit: number; eventsLimit: string } {
  switch (selectedPlan) {
    case 'free':
      return {
        price: PLAN_DETAILS[PLANS.FREE].price,
        planName: 'Free Plan',
        guestLimit: PLAN_DETAILS[PLANS.FREE].guestLimit,
        eventsLimit: '1 event'
      }
    case 'basic':
      return {
        price: PLAN_DETAILS[PLANS.BASIC].price,
        planName: 'Basic Plan',
        guestLimit: PLAN_DETAILS[PLANS.BASIC].guestLimit,
        eventsLimit: '5 events/month'
      }
    case 'pro':
      return {
        price: PLAN_DETAILS[PLANS.PRO].price,
        planName: 'Pro Plan',
        guestLimit: PLAN_DETAILS[PLANS.PRO].guestLimit,
        eventsLimit: '25 events/month'
      }
  }
}

export default function PricingComparison() {
  const [attendees, setAttendees] = useState(100)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'basic' | 'pro'>('basic')

  // Get OwlRSVP pricing for selected plan
  const owlrsvpData = getOwlRSVPPrice(selectedPlan)
  
  // Calculate Eventbrite cost (always assumes paid/ticketed event)
  const eventbriteCost = calculateEventbriteFee(attendees)
  
  // Calculate savings percentage
  const savings = eventbriteCost > 0 && owlrsvpData.price < eventbriteCost
    ? ((eventbriteCost - owlrsvpData.price) / eventbriteCost) * 100
    : 0

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttendees(Number(e.target.value))
  }

  return (
    <div className="w-full py-16 bg-gradient-to-b from-gray-900/50 to-transparent">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="apple-kicker text-blue-400 mb-4">PRICING COMPARISON</div>
          <h2 className="apple-section-title mb-4">See how much you'll save</h2>
          <p className="apple-subtitle text-white/80 mb-6">
            Compare OwlRSVP's flat monthly pricing to Eventbrite's per-ticket fees for ticketed events. 
            <span className="block mt-2 text-blue-400 font-semibold">
              For events with 50+ attendees, OwlRSVP saves you 50-90%!
            </span>
          </p>
          
          {/* Plan Selector */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="text-sm font-medium text-white/70">Compare:</span>
            <div className="flex gap-2 bg-white/10 rounded-lg p-1">
              {(['free', 'basic', 'pro'] as const).map((plan) => (
                <button
                  key={plan}
                  onClick={() => setSelectedPlan(plan)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedPlan === plan
                      ? 'bg-blue-500 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Comparison Card */}
        <div className="glass-card rounded-2xl p-8 mb-8 border-2 border-blue-500/30">
          <div className="grid md:grid-cols-2 gap-8">
            {/* OwlRSVP */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-2xl">🦉</span>
                <h3 className="text-2xl font-bold text-white">OwlRSVP</h3>
              </div>
              <div className="text-5xl font-bold text-blue-400 mb-2">
                ${owlrsvpData.price}
                {selectedPlan !== 'free' && <span className="text-xl text-white/60">/mo</span>}
              </div>
              <p className="text-white/70 text-sm mb-4">
                {owlrsvpData.planName}
              </p>
              <div className="bg-blue-500/20 rounded-lg p-4">
                <p className="text-white/90 text-sm">
                  Up to {owlrsvpData.guestLimit === Infinity ? 'Unlimited' : owlrsvpData.guestLimit.toLocaleString()} guests per event
                </p>
                <p className="text-white/70 text-xs mt-1">
                  {owlrsvpData.eventsLimit}
                </p>
              </div>
            </div>

            {/* Eventbrite */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-2xl">📅</span>
                <h3 className="text-2xl font-bold text-white">Eventbrite</h3>
              </div>
              <div className="text-5xl font-bold text-red-400 mb-2">
                ${eventbriteCost.toFixed(0)}
              </div>
              <p className="text-white/70 text-sm mb-4">
                Per event (2.5% + $0.99/ticket)
              </p>
              <div className="bg-red-500/20 rounded-lg p-4">
                <p className="text-white/90 text-sm">
                  ${eventbriteCost.toFixed(0)} in fees for {attendees} attendees
                </p>
                <p className="text-white/70 text-xs mt-1">
                  No monthly limit, but fees add up fast
                </p>
              </div>
            </div>
          </div>

          {/* Savings Badge */}
          {savings > 0 && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-xl px-8 py-4">
                <div className="text-4xl">💰</div>
                <div>
                  <div className="text-3xl font-bold text-green-400">
                    {savings.toFixed(0)}% cheaper
                  </div>
                  <div className="text-white/80 text-sm mt-1">
                    Save ${(eventbriteCost - owlrsvpData.price).toFixed(0)} per event vs. Eventbrite
                  </div>
                  {selectedPlan !== 'free' && (
                    <div className="text-white/60 text-xs mt-2">
                      Plus you get {owlrsvpData.eventsLimit}, not just one!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Slider */}
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-6">
            <label className="block text-center text-white/90 font-medium mb-4">
              Number of Attendees: <span className="text-blue-400 font-bold text-xl">{attendees}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={attendees}
              onChange={handleSliderChange}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(attendees / 1000) * 100}%, #374151 ${(attendees / 1000) * 100}%, #374151 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-white/50 mt-2">
              <span>0</span>
              <span>250</span>
              <span>500</span>
              <span>750</span>
              <span>1000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

