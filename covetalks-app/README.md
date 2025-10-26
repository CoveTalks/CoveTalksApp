# CoveTalks App Dashboard

The authenticated dashboard application for **app.covetalks.com** - A role-based speaker booking platform.

## 🎯 Overview

This is the main application dashboard for CoveTalks, where authenticated users (Speakers and Organizations) can:

- **Speakers**: Browse opportunities, submit applications, manage their profile, and communicate with organizations
- **Organizations**: Post opportunities, browse speakers, review applications, and manage events

## ✨ Key Features

### Role-Based Access Control
- ✅ Automatic role detection (Speaker vs Organization)
- ✅ Different navigation menus based on user type
- ✅ Role-specific dashboard views and statistics
- ✅ Protected routes with authentication middleware

### Collapsible Sidebar Navigation
- ✅ Persistent left sidebar with role-specific menu items
- ✅ Collapse/expand functionality for more workspace
- ✅ Active route highlighting
- ✅ User profile display with avatar

### Authentication System
- ✅ Email/password login and registration
- ✅ Onboarding flow for account type selection
- ✅ Session management with Supabase Auth
- ✅ Protected routes and automatic redirects

### Dashboard Features
- ✅ Role-specific statistics and metrics
- ✅ Quick action buttons
- ✅ Recent activity feed
- ✅ Search functionality
- ✅ Notification system (UI ready)

## 🏗️ Project Structure

```
covetalks-app/
├── app/
│   ├── auth/
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   └── onboarding/     # Account type selection
│   ├── dashboard/          # Main dashboard
│   ├── opportunities/      # Opportunities (TODO)
│   ├── applications/       # Applications (TODO)
│   ├── messages/          # Messaging system (TODO)
│   ├── profile/           # User profile (TODO)
│   ├── organization/      # Organization management (TODO)
│   ├── settings/          # Settings (TODO)
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home (redirects to dashboard/login)
│   └── globals.css        # Global styles
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # Collapsible sidebar navigation
│   │   └── DashboardHeader.tsx   # Top header bar
│   └── ui/
│       └── button.tsx            # Button component
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   ├── server.ts            # Server Supabase client
│   │   └── database.types.ts    # TypeScript types
│   └── utils.ts                 # Utility functions
├── middleware.ts                # Auth middleware
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase project set up
- Database schema from `DATABASE.md` applied

### 1. Install Dependencies

```bash
cd covetalks-app
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_MARKETING_URL=http://localhost:3000
```

### 3. Run the Development Server

```bash
npm run dev
```

The app will run on **http://localhost:3001** (configured for port 3001 to avoid conflict with the marketing site on port 3000).

## 📊 Database Setup

Make sure your Supabase database has the following tables from the schema:

- `members` - User profiles with member_type (Speaker/Organization)
- `organizations` - Organization details
- `organization_members` - Organization team members
- `speaking_opportunities` - Posted opportunities
- `applications` - Speaker applications
- `messages` - Internal messaging
- `reviews` - Speaker reviews

### Row Level Security (RLS)

Ensure RLS policies are set up to:
- Users can only see their own data
- Organizations can see their opportunities and applications
- Speakers can see open opportunities

## 🎨 Styling & Branding

The app uses the same CoveTalks brand colors as the marketing site:

- **Deep**: `#063A54` - Primary dark color
- **Calm**: `#00758F` - Primary brand color
- **Sand**: `#E2AD79` - Accent color
- **Foam**: `#E8F0F4` - Light background

Font: **Brandon Text** (matches marketing site)

## 🔐 Authentication Flow

1. **New User**
   - Register → Onboarding (select account type) → Dashboard

2. **Returning User**
   - Login → Dashboard (role-specific)

3. **Middleware Protection**
   - Unauthenticated users redirected to login
   - Auth pages redirect authenticated users to dashboard

## 👥 User Roles

### Speaker Navigation
- Dashboard
- Opportunities (browse)
- My Applications
- Messages
- Profile
- Reviews
- Settings

### Organization Navigation
- Dashboard
- My Opportunities (manage)
- Browse Speakers
- Applications (review)
- Messages
- Organization (settings)
- Saved Speakers
- Calendar
- Settings

## 📝 TODO: Pages to Build

The following pages have been stubbed but need implementation:

### For All Users
- [ ] Messages system
- [ ] Settings page
- [ ] Profile editing

### For Speakers
- [ ] Opportunities browse/search
- [ ] Application submission
- [ ] Application tracking
- [ ] Reviews page

### For Organizations
- [ ] Post new opportunity
- [ ] Edit opportunities
- [ ] Browse speakers with filters
- [ ] Review applications
- [ ] Organization profile
- [ ] Saved speakers list
- [ ] Calendar/Events

## 🔌 API Routes

Create these API routes as needed:

- `/api/opportunities` - CRUD operations
- `/api/applications` - Application management
- `/api/messages` - Messaging system
- `/api/profile` - Profile updates
- `/api/upload` - File uploads

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

## 🚢 Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Self-Hosted

```bash
# Build
npm run build

# Start
npm start
```

### Environment Variables in Production

Don't forget to set all environment variables in your deployment platform.

## 🔧 Development Tips

1. **Hot Reload**: Changes automatically refresh in development
2. **Type Safety**: TypeScript will catch errors at compile time
3. **Database Types**: Run Supabase CLI to generate latest types
4. **Component Library**: Add more UI components in `components/ui/`

## 🤝 Integration with Marketing Site

- Marketing site: `http://localhost:3000` (CovetalksMain repo)
- App dashboard: `http://localhost:3001` (this repo)
- Use `NEXT_PUBLIC_MARKETING_URL` to link between them

## 📚 Key Technologies

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Custom + Radix UI primitives
- **Icons**: Lucide React

## 🐛 Troubleshooting

### Port 3001 Already in Use
```bash
# Kill the process on port 3001
npx kill-port 3001
```

### Database Connection Issues
- Verify Supabase URL and keys in `.env.local`
- Check that database tables exist
- Ensure RLS policies are configured

### Type Errors
- Run `npm run type-check` to see all errors
- Regenerate database types from Supabase

## 📄 License

MIT

---

**Built with ❤️ for CoveTalks**
