# Authentication Flow Integration Guide

## 🔄 Complete User Flow Between Sites

### Overview
CoveTalks uses a **two-site architecture**:
- **Marketing Site** (www.covetalks.com / localhost:3000) - Public pages, registration
- **App Dashboard** (app.covetalks.com / localhost:3001) - Authenticated user interface

## 📋 Registration Flow (Marketing Site → App)

### Step 1: User Visits Pricing Page
**Location**: Marketing site `/pricing`

User sees two types of plans:
- **Speaker Plans** - Free, Pro, Elite
- **Organization Plans** - Currently free for non-profits

When user clicks "Get Started":
```typescript
// From pricing-client.tsx
const registrationUrl = `/register?type=${userType}&plan=${planId}&priceId=${priceId}`
```

### Step 2: User Fills Registration Form
**Location**: Marketing site `/register`

Form captures:
- Email
- Password
- Name
- User Type (speaker/organization) - from URL parameter
- Plan ID (from URL parameter)

### Step 3: Registration API Call
**Location**: Marketing site `/api/auth/signup`

**What happens:**
```typescript
// 1. Create user in Supabase Auth
const { data: authData } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name, user_type: userType }
})

// 2. Create member profile (CRITICAL!)
const memberType = userType === 'speaker' ? 'Speaker' : 'Organization'
await supabaseAdmin.from('members').insert({
  id: authData.user.id,
  email,
  name,
  member_type: memberType  // ← This is already set!
})

// 3. If organization, create org records
if (userType === 'organization') {
  await supabaseAdmin.from('organizations').insert({...})
  await supabaseAdmin.from('organization_members').insert({...})
}
```

**Important**: The `member_type` is SET DURING REGISTRATION, not in onboarding!

### Step 4: Redirect to App Dashboard
**Location**: Marketing site redirects to app dashboard

After successful registration, redirect user to:
```javascript
window.location.href = 'http://app.covetalks.com/auth/login'
// or for local dev:
window.location.href = 'http://localhost:3001/auth/login'
```

**Recommended redirect with auto-login:**
After registration, you can:
- Option A: Create session and redirect to app dashboard
- Option B: Redirect to login with success message
- Option C: Auto-login and redirect to dashboard

### Step 5: User Logs In (App Dashboard)
**Location**: App dashboard `/auth/login`

User enters credentials:
```typescript
const { data } = await supabase.auth.signInWithPassword({ email, password })

// Check member_type
const { data: member } = await supabase
  .from('members')
  .select('member_type')
  .eq('id', data.user.id)
  .single()

if (!member?.member_type) {
  // Edge case: go to onboarding
  router.push('/auth/onboarding')
} else {
  // Normal case: member_type already set from registration!
  router.push('/dashboard')
}
```

### Step 6: Onboarding (If Needed)
**Location**: App dashboard `/auth/onboarding`

The onboarding page now **checks if member_type is already set**:
```typescript
useEffect(() => {
  async function checkUserType() {
    const { data: member } = await supabase
      .from('members')
      .select('member_type')
      .eq('id', user.id)
      .single()

    if (member?.member_type) {
      // Already set from registration - skip onboarding!
      router.push('/dashboard')
    } else {
      // Edge case - show selection
      setCheckingUser(false)
    }
  }
  checkUserType()
}, [])
```

**For users registered on marketing site**: They skip onboarding automatically!

### Step 7: Dashboard
**Location**: App dashboard `/dashboard`

User sees role-specific dashboard based on their `member_type`:
- **Speaker**: Opportunities to browse, applications to track
- **Organization**: Opportunities to post, applications to review

---

## 🔧 Integration Checklist

### Marketing Site (CovetalksMain) Changes Needed

#### 1. Update Registration Success Handler

In your `/register` page, after successful API call:

```typescript
// After successful registration
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  body: JSON.stringify({ email, password, name, userType, planId })
})

if (response.ok) {
  // Option A: Redirect to app login
  window.location.href = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?registered=true`
    : 'http://localhost:3001/auth/login?registered=true'
  
  // Option B: Create session and redirect to dashboard
  // (requires additional auth setup)
}
```

#### 2. Add Environment Variable

Add to marketing site `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3001
# In production: https://app.covetalks.com
```

#### 3. Update Links to App

Anywhere you link to the app dashboard:
```typescript
<Link href={`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`}>
  Login to Dashboard
</Link>
```

### App Dashboard Changes (Already Done!) ✅

- ✅ Onboarding checks if `member_type` exists
- ✅ Auto-redirects to dashboard if type already set
- ✅ Login page links back to marketing site for registration
- ✅ Standalone register page disabled (moved to `.backup`)

---

## 🎯 User Journey Map

### New User Journey
```
1. www.covetalks.com/pricing
   └─> Clicks "Get Started"
   
2. www.covetalks.com/register?type=speaker
   └─> Fills form
   └─> Submits to /api/auth/signup
   └─> member_type set to "Speaker"
   
3. app.covetalks.com/auth/login
   └─> Enters credentials
   └─> Checks member_type → "Speaker" exists!
   
4. app.covetalks.com/dashboard
   └─> Shows Speaker dashboard
```

### Returning User Journey
```
1. app.covetalks.com/auth/login
   └─> Enters credentials
   
2. app.covetalks.com/dashboard
   └─> Shows role-specific dashboard
```

### Edge Case: member_type Not Set
```
1. app.covetalks.com/auth/login
   └─> Checks member_type → null
   
2. app.covetalks.com/auth/onboarding
   └─> User selects Speaker or Organization
   └─> member_type updated
   
3. app.covetalks.com/dashboard
   └─> Shows dashboard
```

---

## 🔒 Security Considerations

### 1. API Route Protection
The marketing site `/api/auth/signup` uses **service role key**:
```typescript
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ⚠️ Server-side only!
)
```

**Critical**: Never expose service role key to client!

### 2. Email Verification
Currently set to `email_confirm: true` which auto-confirms emails.

**For production**, consider:
- Sending verification emails
- Requiring email confirmation before dashboard access

### 3. Rate Limiting
Add rate limiting to `/api/auth/signup` to prevent abuse:
```typescript
// Use a package like 'express-rate-limit' or Vercel's built-in rate limiting
```

---

## 🧪 Testing the Integration

### Local Development Test

1. **Start both servers:**
   ```bash
   # Terminal 1 - Marketing Site
   cd CovetalksMain/covetalks-nextjs
   npm run dev  # Runs on :3000
   
   # Terminal 2 - App Dashboard
   cd covetalks-app
   npm run dev  # Runs on :3001
   ```

2. **Test registration flow:**
   - Go to http://localhost:3000/pricing
   - Click "Get Started" on any plan
   - Fill registration form
   - Should redirect to http://localhost:3001/auth/login
   - Login with credentials
   - Should land on dashboard (skipping onboarding!)

3. **Verify database:**
   - Check Supabase dashboard
   - Look at `members` table
   - Confirm `member_type` is set to "Speaker" or "Organization"

### Production Deployment Test

1. Deploy marketing site to www.covetalks.com
2. Deploy app dashboard to app.covetalks.com
3. Test full registration flow
4. Monitor error logs in both apps

---

## 🐛 Common Issues & Solutions

### Issue 1: User Stuck in Onboarding Loop
**Symptom**: After registration, user lands on onboarding but it doesn't redirect to dashboard

**Cause**: `member_type` not set during registration

**Solution**: 
- Check registration API logs
- Verify `member_type` is being inserted
- Confirm field name is exactly "member_type" (not "memberType")

### Issue 2: "Account Already Exists" Error
**Symptom**: User tries to register but gets error even though they haven't registered

**Cause**: Previous failed registration attempt left orphan auth user

**Solution**: The API already handles this with cleanup:
```typescript
// Clean up auth user if member creation fails
await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
```

### Issue 3: Wrong Dashboard Type
**Symptom**: Speaker sees organization dashboard or vice versa

**Cause**: `member_type` mismatch

**Solution**:
- Check the mapping in registration API:
  ```typescript
  const memberType = userType === 'speaker' ? 'Speaker' : 'Organization'
  // Must be capitalized: "Speaker" or "Organization"
  ```

### Issue 4: CORS Errors
**Symptom**: Can't redirect between sites

**Solution**: 
- Both sites must use proper redirects (window.location.href)
- Not AJAX calls between domains without CORS setup

---

## 📊 Database Schema Reference

### members table
```sql
CREATE TABLE members (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    member_type TEXT CHECK (member_type IN ('Speaker', 'Organization')),
    -- ↑ Set during registration from marketing site
    bio TEXT,
    location TEXT,
    -- ... other fields
);
```

**Key Point**: `member_type` is set at registration, not in onboarding!

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Marketing site registration creates auth user ✅
- [ ] Marketing site registration creates member record ✅
- [ ] member_type is set correctly ("Speaker" or "Organization") ✅
- [ ] Organizations get org records created ✅
- [ ] Registration redirects to app.covetalks.com ⚠️ (needs implementation)
- [ ] App login checks for member_type ✅
- [ ] App onboarding skips if type exists ✅
- [ ] App dashboard shows correct role-based UI ✅
- [ ] Error handling works on both sites ✅
- [ ] Email confirmations work (if enabled) ⏳
- [ ] Rate limiting prevents abuse ⏳

---

## 🚀 Next Steps for Marketing Site

To complete the integration, update your marketing site `/register` page:

```typescript
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get params from URL
  const userType = searchParams.get('type') || 'speaker'
  const planId = searchParams.get('plan') || 'free'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
      name: formData.get('name'),
      userType,
      planId
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      // Success! Redirect to app dashboard
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      window.location.href = `${appUrl}/auth/login?registered=true&email=${encodeURIComponent(data.email)}`
      
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
    </form>
  )
}
```

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs (both sites)
3. Check Supabase logs
4. Verify environment variables
5. Test with different browsers

---

**Integration Status**: 
- App Dashboard: ✅ Ready
- Marketing Site: ⚠️ Needs redirect implementation

Once you add the redirect to the marketing site registration success handler, the complete flow will work seamlessly!
