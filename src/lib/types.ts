export interface Event {
  id: string
  title: string
  allow_plus_guests: boolean
  background_color: string
  page_background_color?: string
  spotlight_color?: string
  font_color?: string
  admin_token: string
  company_name?: string
  company_logo_url?: string
  info_pdf_url?: string | null
  open_invite?: boolean
  auth_mode?: 'open' | 'code' | 'guest_list'
  promo_code?: string | null
  promo_codes?: Array<{code: string, label?: string}> | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  event_date?: string | null
  event_end_time?: string | null
  event_location?: string | null
  required_rsvp_fields?: {
    email?: boolean
    phone?: boolean
    address?: boolean
    guests?: boolean
  } | null
  ticket_price?: number | null
  currency?: string | null
  payment_required?: boolean | null
  created_at: string
  updated_at: string
  user_id?: string | null
}

export interface Attendee {
  id: string
  event_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  address?: string
  guest_count: number
  attending: boolean
  created_at: string
  updated_at: string
}

export interface CreateEventData {
  title: string
  allow_plus_guests: boolean
  background_color?: string
  page_background_color?: string
  spotlight_color?: string
  font_color?: string
  company_name?: string
  company_logo_url?: string
  open_invite?: boolean
  auth_mode?: 'open' | 'code' | 'guest_list'
  promo_code?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  event_date?: string
  event_end_time?: string
  event_location?: string
  ticket_price?: number
  currency?: string
  payment_required?: boolean
  required_rsvp_fields?: {
    email?: boolean
    phone?: boolean
    address?: boolean
    guests?: boolean
  }
}

export interface CreateRSVPData {
  event_id: string
  first_name: string
  last_name: string
  email?: string
  guest_count: number
  attending: boolean
  promo_code?: string
  matched_promo_code?: string
  phone?: string
  address?: string
}

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise'
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired'
  subscription_period_end?: string
  event_count: number
  total_guest_count: number
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  guest_limit: number
  event_limit: number
  stripe_price_id: string
  features: string[]
  is_popular?: boolean
}

export interface SubscriptionTier {
  name: string
  price: number
  guestLimit: number
  features: string[]
  stripePriceId: string | null | undefined
  isPopular?: boolean
}
