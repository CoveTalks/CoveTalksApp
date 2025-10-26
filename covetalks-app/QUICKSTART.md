# 🚀 CoveTalks App - Quick Start Guide

## Get Up and Running in 5 Minutes!

### Step 1: Install Dependencies
```bash
cd covetalks-app
npm install
```

### Step 2: Set Up Environment Variables
Create a `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_MARKETING_URL=http://localhost:3000
```

**Where to find these values:**
1. Go to your Supabase dashboard
2. Click on your project
3. Go to Settings → API
4. Copy the "Project URL" and "anon/public" key

### Step 3: Verify Database Schema
Make sure your Supabase database has these tables:
- ✅ members
- ✅ organizations
- ✅ organization_members
- ✅ speaking_opportunities
- ✅ applications
- ✅ messages

If not, run the SQL from `DATABASE.md` in your Supabase SQL Editor.

### Step 4: Run the App
```bash
npm run dev
```

Open **http://localhost:3001** in your browser.

## 🎯 Test the Flow

### 1. Register a New Account
- Go to http://localhost:3001/auth/register
- Fill in your details
- Click "Create Account"

### 2. Choose Account Type
- Select "Speaker" or "Organization"
- Click "Continue"

### 3. Explore the Dashboard
- See role-specific navigation in the sidebar
- Toggle the sidebar collapse/expand
- Check out the statistics

## 🎨 What You Get

### ✅ Authentication System
- Login, Register, Onboarding pages
- Session management with Supabase Auth
- Protected routes

### ✅ Role-Based Interface
- **Speakers** see: Opportunities, Applications, Profile, Reviews
- **Organizations** see: My Opportunities, Browse Speakers, Applications, Calendar

### ✅ Collapsible Sidebar
- Clean, modern navigation
- Collapses to icons for more space
- Active route highlighting
- User profile display

### ✅ Dashboard
- Role-specific statistics
- Quick action buttons
- Ready for customization

## 📋 Next Steps

### Immediate (Core Functionality)
1. Build Opportunities page (browse/post)
2. Build Applications flow
3. Build Profile editing
4. Build Messaging system

### Soon After
5. Build Organization settings
6. Build Speaker profile public view
7. Build Review system
8. Build Calendar/Events

### Nice to Have
9. Add file upload for photos
10. Add search/filters
11. Add notifications
12. Add analytics

## 🔗 Integration with Marketing Site

Your marketing site (CovetalksMain) should link to this app:

- "Login" button → `http://app.covetalks.com/auth/login`
- "Register" button → `http://app.covetalks.com/auth/register`
- "Dashboard" link → `http://app.covetalks.com/dashboard`

In development:
- Marketing: `http://localhost:3000`
- App: `http://localhost:3001`

## 🐛 Common Issues

### Port Already in Use
```bash
# Kill the process on port 3001
npx kill-port 3001
# Or use a different port:
npm run dev -- -p 3002
```

### Database Connection Failed
- Double-check your `.env.local` file
- Make sure Supabase project is not paused
- Verify the anon key (not the service role key!)

### Authentication Not Working
- Clear browser cookies/localStorage
- Check Supabase Auth settings
- Ensure email confirmations are disabled (for testing)

### Types/Linting Errors
```bash
# Check types
npm run type-check

# Fix linting
npm run lint
```

## 📞 Need Help?

1. Check the README.md for detailed documentation
2. Review the DATABASE.md for schema reference
3. Check Supabase logs in the dashboard
4. Use browser DevTools to debug network requests

## 🎉 You're All Set!

Your CoveTalks app dashboard is ready to go. Start building out the features and customize it to your needs!

**Happy coding! 🚀**
