'use client'

import { useState } from 'react'
import { getStripe } from '@/lib/stripe'

interface StripeCheckoutButtonProps {
  priceId: string
  planName: string
  isAnnual?: boolean
  isLoading?: boolean
  onError?: (error: Error) => void
}

export default function StripeCheckoutButton({
  priceId,
  planName,
  isAnnual = false,
  isLoading = false,
  onError
}: StripeCheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    try {
      setIsProcessing(true)

      // Create checkout session on the server
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout`,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      if (!stripe) {
        throw new Error('Failed to load Stripe')
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })

      if (stripeError) {
        throw new Error(stripeError.message || 'An error occurred during checkout')
      }
    } catch (err) {
      console.error('Stripe checkout error:', err)
      if (onError && err instanceof Error) {
        onError(err)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || isProcessing || !priceId}
      className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
        isLoading || isProcessing
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {isProcessing ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </div>
      ) : (
        `Subscribe to ${planName} ${isAnnual ? 'Yearly' : 'Monthly'}`
      )}
    </button>
  )
}




