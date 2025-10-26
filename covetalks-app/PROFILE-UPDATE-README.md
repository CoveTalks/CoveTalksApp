# Profile Page Enhancement - Implementation Guide

## Overview
This update adds comprehensive profile management features to the CoveTalks speaker profile page, including past talks tracking, achievements, social media links, and improved profile picture upload functionality.

## Features Added

### 1. **Past Speaking Engagements**
- Track previous speaking experiences with details:
  - Talk title
  - Event name
  - Date and location
  - Audience size
  - Topics covered
- Full CRUD operations (Create, Read, Update, Delete)

### 2. **Achievements & Awards**
- Document professional achievements:
  - Title and description
  - Year received
  - Trophy icon display
- Manage multiple achievements

### 3. **Enhanced Social Media Integration**
- Expanded social media links:
  - LinkedIn (existing, improved)
  - Twitter/X (new)
  - Facebook (new)
  - Instagram (new)
  - YouTube (new)
- Professional links:
  - Website
  - Booking/calendar link

### 4. **Improved Profile Picture Upload**
- File size validation (max 5MB)
- File type validation (JPEG, PNG, WebP)
- Old image cleanup on new upload
- Visual upload indicator
- Error handling with user feedback

### 5. **Tabbed Edit Interface**
- Organized editing experience:
  - **Overview Tab**: Basic info, bio, specialties, formats
  - **Experience Tab**: Past talks and achievements
  - **Social Tab**: All links and social media

### 6. **Profile Completion Tracking**
- Visual progress bar
- Checklist of completed/missing items
- Now includes past talks and achievements in calculation

## Database Changes Required

### Step 1: Run Migration
Execute the migration script in Supabase SQL Editor:

```sql
-- File: add-metadata-to-members.sql
-- This adds a JSONB metadata field to store extended profile data
```

### Step 2: Verify Migration
Check that the metadata column was added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'members' 
AND column_name = 'metadata';
```

## File Updates

### Replace the existing profile page:
```bash
# In your covetalks-app repository
cp profile-page-updated.tsx app/(authenticated)/profile/page.tsx
```

## Testing Checklist

### Profile Picture Upload
- [ ] Upload a new profile picture
- [ ] Verify it displays correctly
- [ ] Test file size limit (>5MB should fail)
- [ ] Test invalid file types (should reject non-images)
- [ ] Verify old images are deleted when uploading new ones

### Past Talks Management
- [ ] Add a new past talk
- [ ] Edit an existing talk
- [ ] Delete a talk
- [ ] Verify data persists after save

### Achievements Management
- [ ] Add a new achievement
- [ ] Edit an existing achievement
- [ ] Delete an achievement
- [ ] Verify trophy icon displays

### Social Media Links
- [ ] Add all social media links
- [ ] Verify they save correctly
- [ ] Test that links open in new tabs
- [ ] Verify Website field is visible and editable

### General Profile Editing
- [ ] Edit basic information (name, title, location, phone)
- [ ] Update bio
- [ ] Add/remove specialties
- [ ] Add/remove languages
- [ ] Add/remove preferred formats
- [ ] Update speaking details (experience, fee range, audience size)

### Data Persistence
- [ ] Save profile changes
- [ ] Refresh page and verify data persists
- [ ] Log out and back in, verify data remains

## Storage Bucket Configuration

Ensure your Supabase storage bucket is configured correctly:

1. Go to Supabase Dashboard > Storage
2. Verify `avatars` bucket exists and is public
3. Check bucket structure:
   ```
   avatars/
   └── members/
       └── [member-id]-[timestamp].jpg
   ```

## Environment Variables

Verify these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Known Issues Resolved

1. ✅ **Website field not visible** - Now prominently displayed in social media tab
2. ✅ **Social media links missing** - Added Twitter, Facebook, Instagram, YouTube
3. ✅ **Past talks not stored** - Now stored in metadata field
4. ✅ **Achievements not in database** - Now stored in metadata field
5. ✅ **Profile picture upload issues** - Improved with validation and error handling

## Future Enhancements

Consider adding:
1. Drag-and-drop for profile picture upload
2. Image cropping/resizing before upload
3. Import past talks from LinkedIn
4. Public profile preview
5. Export profile as PDF
6. Video introduction upload
7. Speaker reel/highlights section

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify database migration was successful
3. Ensure storage bucket permissions are correct
4. Check that all environment variables are set

## Notes for Production

1. **Database Backup**: Always backup your database before running migrations
2. **Storage Limits**: Monitor storage usage for profile pictures
3. **Rate Limiting**: Consider adding rate limits for profile updates
4. **Image Optimization**: Consider adding image compression before upload
5. **Caching**: Profile images are cached for 1 hour (3600 seconds)
