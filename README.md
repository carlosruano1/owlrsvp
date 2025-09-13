# 🦉 OwlRSVP

A modern, minimalist RSVP web app designed for extreme simplicity. Perfect for events where you need quick, hassle-free RSVPs.

## Features

### Guest Experience
- **Simple Flow**: Event title → Name → Optional +guests → Yes/No → Submit → Confirmation
- **Clean UI**: Large fonts, intuitive design, grandparent-proof
- **Mobile-First**: Works perfectly on all devices

### Organizer Experience
- **Easy Setup**: Create event in seconds with title and settings
- **Instant Links**: Get shareable RSVP link immediately
- **Admin Dashboard**: Live guest count, attendee list, and analytics
- **QR Code**: Auto-generated for easy sharing
- **CSV Export**: Download guest list for planning
- **Custom Colors**: Personalize your event's appearance

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Domain**: owlrsvp.com

## Quick Start

### 1. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL from `database-schema.sql` in your Supabase SQL editor
3. Get your project URL and API keys from Settings → API

### 2. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to create your first event!

### 4. Deploy to Vercel

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

## URL Structure

- **Homepage**: `owlrsvp.com` - Create new events
- **Guest RSVP**: `owlrsvp.com/e/[eventId]` - Guest response page
- **Admin Dashboard**: `owlrsvp.com/a/[adminToken]` - Event management

## Database Schema

### Events Table
- `id`: UUID (primary key)
- `title`: Event name
- `allow_plus_guests`: Boolean for +guest option
- `background_color`: Hex color for theming
- `admin_token`: Random token for admin access
- `created_at`, `updated_at`: Timestamps

### Attendees Table
- `id`: UUID (primary key)
- `event_id`: Foreign key to events
- `first_name`, `last_name`: Guest names
- `guest_count`: Number of additional guests
- `attending`: Boolean response
- `created_at`, `updated_at`: Timestamps

## API Routes

- `POST /api/events` - Create new event
- `GET /api/events/[id]` - Get event details
- `POST /api/rsvp` - Submit RSVP response
- `GET /api/admin/[token]` - Get admin dashboard data
- `GET /api/admin/[token]/csv` - Download CSV export

## Contributing

This is a simple, focused app. Keep it that way! Any additions should maintain the core principle of extreme simplicity.

## License

MIT License - feel free to use for your events!

---

Made with 🦉 for simple, beautiful RSVPs

## Auto-Deploy Status
✅ **Auto-deployment is now configured!** Any code changes will automatically deploy to Vercel.