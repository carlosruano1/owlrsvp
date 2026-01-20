import { Resend } from 'resend'

// Lazy initialization to avoid build-time errors when API key is not available
let resend: Resend | null = null

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }
    resend = new Resend(apiKey)
  }
  return resend
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const client = getResendClient()
    const { data, error } = await client.emails.send({
      from: 'OwlRSVP <noreply@owlrsvp.com>', // Use your verified domain
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export function generateVerificationEmail(username: string, verificationUrl: string) {
  const subject = 'Verify your OwlRSVP account'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your OwlRSVP account</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #007AFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">owl<span style="color: #4FC3F7;">rsvp</span></div>
        <h1>Welcome to OwlRSVP!</h1>
      </div>
      <div class="content">
        <h2>Hi ${username}!</h2>
        <p>Thank you for creating an account with OwlRSVP. To get started creating beautiful RSVP pages for your events, please verify your email address.</p>
        
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </div>
        
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">${verificationUrl}</p>
        
        <p><strong>This link will expire in 24 hours.</strong></p>
        
        <p>Once verified, you'll be able to:</p>
        <ul>
          <li>Create unlimited RSVP pages for your events</li>
          <li>Track attendance and manage guest lists</li>
          <li>Customize your event pages with your branding</li>
          <li>Export attendee data to CSV</li>
        </ul>
        
        <p>If you didn't create an account with OwlRSVP, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>Best regards,<br>The OwlRSVP Team</p>
        <p>This email was sent from noreply@owlrsvp.com</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Welcome to OwlRSVP!
    
    Hi ${username},
    
    Thank you for creating an account with OwlRSVP. To get started creating beautiful RSVP pages for your events, please verify your email address by clicking the link below:
    
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    Once verified, you'll be able to:
    - Create unlimited RSVP pages for your events
    - Track attendance and manage guest lists
    - Customize your event pages with your branding
    - Export attendee data to CSV
    
    If you didn't create an account with OwlRSVP, you can safely ignore this email.
    
    Best regards,
    The OwlRSVP Team
  `
  
  return { subject, html, text }
}

export function generatePasswordResetEmail(username: string, resetUrl: string) {
  const subject = 'Reset your OwlRSVP password'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your OwlRSVP password</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #007AFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">owl<span style="color: #4FC3F7;">rsvp</span></div>
        <h1>Password Reset Request</h1>
      </div>
      <div class="content">
        <h2>Hi ${username}!</h2>
        <p>We received a request to reset your OwlRSVP account password.</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">${resetUrl}</p>
        
        <div class="warning">
          <strong>Important:</strong> This link will expire in 1 hour for security reasons.
        </div>
        
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        
        <p>For security reasons, we recommend:</p>
        <ul>
          <li>Using a strong, unique password</li>
          <li>Not sharing your account credentials</li>
          <li>Logging out from shared devices</li>
        </ul>
      </div>
      <div class="footer">
        <p>Best regards,<br>The OwlRSVP Team</p>
        <p>This email was sent from noreply@owlrsvp.com</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Password Reset Request - OwlRSVP
    
    Hi ${username},
    
    We received a request to reset your OwlRSVP account password.
    
    To reset your password, click the link below:
    ${resetUrl}
    
    This link will expire in 1 hour for security reasons.
    
    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    
    Best regards,
    The OwlRSVP Team
  `
  
  return { subject, html, text }
}

export function generateMagicLinkEmail(username: string, magicLinkUrl: string) {
  const subject = 'Your OwlRSVP Magic Login Link'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your OwlRSVP Magic Login Link</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #007AFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">owl<span style="color: #4FC3F7;">rsvp</span></div>
        <h1>Magic Login Link</h1>
      </div>
      <div class="content">
        <h2>Hi ${username}!</h2>
        <p>Here's your magic login link for OwlRSVP. Click the button below to sign in instantly - no password needed!</p>
        
        <div style="text-align: center;">
          <a href="${magicLinkUrl}" class="button">Sign In Now</a>
        </div>
        
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">${magicLinkUrl}</p>
        
        <div class="warning">
          <strong>Important:</strong> This link will expire in 1 hour for security reasons.
        </div>
        
        <p>If you didn't request this login link, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>Best regards,<br>The OwlRSVP Team</p>
        <p>This email was sent from noreply@owlrsvp.com</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Your OwlRSVP Magic Login Link
    
    Hi ${username},
    
    Here's your magic login link for OwlRSVP. Click the link below to sign in instantly - no password needed!
    
    ${magicLinkUrl}
    
    This link will expire in 1 hour for security reasons.
    
    If you didn't request this login link, you can safely ignore this email.
    
    Best regards,
    The OwlRSVP Team
  `
  
  return { subject, html, text }
}

export function generateEventAccessEmail(username: string, eventTitle: string, accessCode: string, eventUrl: string) {
  const subject = `Your Access Code for ${eventTitle}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Event Access Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #007AFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .access-code { font-size: 32px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0; color: #007AFF; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">owl<span style="color: #4FC3F7;">rsvp</span></div>
        <h1>Event Access Code</h1>
      </div>
      <div class="content">
        <h2>Hi ${username}!</h2>
        <p>You've been granted access to manage the event: <strong>${eventTitle}</strong></p>
        
        <p>Your unique access code is:</p>
        <div class="access-code">${accessCode}</div>
        
        <p>To access the event management dashboard:</p>
        <ol>
          <li>Visit the event admin page</li>
          <li>Enter this access code when prompted</li>
        </ol>
        
        <div style="text-align: center;">
          <a href="${eventUrl}" class="button">Go to Event Dashboard</a>
        </div>
        
        <p>This access code will expire in 7 days for security reasons.</p>
        <p>If you didn't request access to this event, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>Best regards,<br>The OwlRSVP Team</p>
        <p>This email was sent from noreply@owlrsvp.com</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Your Access Code for ${eventTitle}
    
    Hi ${username},
    
    You've been granted access to manage the event: ${eventTitle}
    
    Your unique access code is: ${accessCode}
    
    To access the event management dashboard:
    1. Visit the event admin page: ${eventUrl}
    2. Enter this access code when prompted
    
    This access code will expire in 7 days for security reasons.
    
    If you didn't request access to this event, you can safely ignore this email.
    
    Best regards,
    The OwlRSVP Team
  `
  
  return { subject, html, text }
}

export function generateCollaboratorInviteEmail(inviterName: string, eventTitle: string, inviteUrl: string, message?: string) {
  const subject = `${inviterName} invited you to collaborate on "${eventTitle}"`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation to Collaborate</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #007AFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .message { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">owl<span style="color: #4FC3F7;">rsvp</span></div>
        <h1>You're Invited to Collaborate</h1>
      </div>
      <div class="content">
        <h2>Collaboration Invitation</h2>
        <p><strong>${inviterName}</strong> has invited you to collaborate on the event: <strong>${eventTitle}</strong></p>
        
        ${message ? `<div class="message">"${message}"</div>` : ''}
        
        <p>As a collaborator, you'll be able to:</p>
        <ul>
          <li>View and manage RSVPs</li>
          <li>Update event details</li>
          <li>Export attendee data</li>
          <li>Send communications to guests</li>
        </ul>
        
        <div style="text-align: center;">
          <a href="${inviteUrl}" class="button">Accept Invitation</a>
        </div>
        
        <p>This invitation will expire in 7 days.</p>
        <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>Best regards,<br>The OwlRSVP Team</p>
        <p>This email was sent from noreply@owlrsvp.com</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    ${inviterName} invited you to collaborate on "${eventTitle}"
    
    Collaboration Invitation
    
    ${inviterName} has invited you to collaborate on the event: ${eventTitle}
    
    ${message ? `Message from ${inviterName}: "${message}"` : ''}
    
    As a collaborator, you'll be able to:
    - View and manage RSVPs
    - Update event details
    - Export attendee data
    - Send communications to guests
    
    To accept this invitation, visit:
    ${inviteUrl}
    
    This invitation will expire in 7 days.
    
    If you weren't expecting this invitation, you can safely ignore this email.
    
    Best regards,
    The OwlRSVP Team
  `
  
  return { subject, html, text }
}

// RSVP Confirmation Email with Calendar Attachment
export function generateRSVPConfirmationEmail(
  attendeeName: string,
  eventTitle: string,
  eventDate?: string,
  eventEndTime?: string,
  eventLocation?: string,
  calendarIcs?: string
) {
  const subject = `RSVP Confirmation: ${eventTitle}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RSVP Confirmation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #007AFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .event-details { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">owl<span style="color: #4FC3F7;">rsvp</span></div>
        <h1>RSVP Confirmed!</h1>
      </div>
      <div class="content">
        <h2>Hi ${attendeeName}!</h2>
        <p>Thank you for RSVPing to <strong>${eventTitle}</strong>!</p>
        
        <div class="event-details">
          ${eventDate ? `<p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
          ${eventEndTime ? `<p><strong>Time:</strong> ${eventEndTime}</p>` : ''}
          ${eventLocation ? `<p><strong>Location:</strong> ${eventLocation}</p>` : ''}
        </div>
        
        ${calendarIcs ? `
          <div style="text-align: center;">
            <a href="data:text/calendar;charset=utf8,${encodeURIComponent(calendarIcs)}" class="button" download="event.ics">Add to Calendar</a>
          </div>
        ` : ''}
        
        <p>We look forward to seeing you there!</p>
        <p>If you need to update your RSVP, please contact the event organizer.</p>
      </div>
      <div class="footer">
        <p>Best regards,<br>The OwlRSVP Team</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    RSVP Confirmation: ${eventTitle}
    
    Hi ${attendeeName},
    
    Thank you for RSVPing to ${eventTitle}!
    
    ${eventDate ? `Date: ${new Date(eventDate).toLocaleDateString()}` : ''}
    ${eventEndTime ? `Time: ${eventEndTime}` : ''}
    ${eventLocation ? `Location: ${eventLocation}` : ''}
    
    We look forward to seeing you there!
    
    Best regards,
    The OwlRSVP Team
  `
  
  return { subject, html, text }
}

// Generate ICS Calendar File
export function generateCalendarICS(
  eventTitle: string,
  eventDate: string,
  eventEndTime?: string,
  eventLocation?: string,
  description?: string
): string {
  const startDate = new Date(eventDate)
  let endDate: Date
  
  if (eventEndTime) {
    // Try to parse the end time and combine with date
    const [hours, minutes] = eventEndTime.split(':').map(Number)
    endDate = new Date(startDate)
    endDate.setHours(hours || startDate.getHours() + 2, minutes || 0, 0, 0)
  } else {
    // Default 2 hours duration
    endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)
  }
  
  // Format dates for ICS (YYYYMMDDTHHmmssZ)
  const formatICSDate = (date: Date): string => {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    const seconds = String(date.getUTCSeconds()).padStart(2, '0')
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
  }
  
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OwlRSVP//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@owlrsvp.com`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${eventTitle.replace(/[,;\\]/g, '')}`,
    description ? `DESCRIPTION:${description.replace(/[,;\\]/g, '').replace(/\n/g, '\\n')}` : '',
    eventLocation ? `LOCATION:${eventLocation.replace(/[,;\\]/g, '')}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')
  
  return ics
}

// Organizer Notification Email
export function generateOrganizerNotificationEmail(
  organizerName: string,
  eventTitle: string,
  attendeeName: string,
  attendeeEmail: string | null,
  attendeePhone: string | null,
  guestCount: number,
  eventAdminUrl: string
) {
  const subject = `New RSVP: ${attendeeName}${guestCount > 0 ? ` (+${guestCount} guest${guestCount > 1 ? 's' : ''})` : ''} - ${eventTitle}`
  const guestText = guestCount > 0 ? ` (+${guestCount} guest${guestCount > 1 ? 's' : ''})` : ''
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New RSVP</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #007AFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .attendee-info { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">owl<span style="color: #4FC3F7;">rsvp</span></div>
        <h1>New RSVP Received!</h1>
      </div>
      <div class="content">
        <h2>Hi ${organizerName || 'Event Organizer'}!</h2>
        <p>Someone just RSVP'd to your event <strong>${eventTitle}</strong>!</p>
        
        <div class="attendee-info">
          <p><strong>Name:</strong> ${attendeeName}${guestText}</p>
          ${attendeeEmail ? `<p><strong>Email:</strong> ${attendeeEmail}</p>` : ''}
          ${attendeePhone ? `<p><strong>Phone:</strong> ${attendeePhone}</p>` : ''}
        </div>
        
        <div style="text-align: center;">
          <a href="${eventAdminUrl}" class="button">View All RSVPs</a>
        </div>
      </div>
      <div class="footer">
        <p>Best regards,<br>The OwlRSVP Team</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    New RSVP Received!
    
    Hi ${organizerName || 'Event Organizer'},
    
    Someone just RSVP'd to your event: ${eventTitle}
    
    Name: ${attendeeName}${guestText}
    ${attendeeEmail ? `Email: ${attendeeEmail}` : ''}
    ${attendeePhone ? `Phone: ${attendeePhone}` : ''}
    
    View all RSVPs: ${eventAdminUrl}
    
    Best regards,
    The OwlRSVP Team
  `
  
  return { subject, html, text }
}
