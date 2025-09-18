export interface Event {
  id: string
  title: string
  allow_plus_guests: boolean
  background_color: string
  admin_token: string
  company_name?: string
  company_logo_url?: string
  open_invite?: boolean
  created_at: string
  updated_at: string
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
  company_name?: string
  company_logo_url?: string
  open_invite?: boolean
}

export interface CreateRSVPData {
  event_id: string
  first_name: string
  last_name: string
  email?: string
  guest_count: number
  attending: boolean
}
