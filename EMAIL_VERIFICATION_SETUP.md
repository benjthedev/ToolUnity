# Email Verification Implementation Guide

Email verification has been implemented for ToolShare. This document explains the setup and how to enable it.

## Database Changes

Three new columns have been added to the `users_ext` table:

1. **email_verified** (BOOLEAN, default: false)
   - Tracks whether the user's email has been verified
   - New users start with `false`

2. **email_verification_token** (TEXT, unique, nullable)
   - Stores the verification token sent to the user's email
   - Cleared after successful verification

3. **email_verification_sent_at** (TIMESTAMP, nullable)
   - Tracks when the verification email was sent
   - Used to implement 24-hour token expiration

### Manual Database Setup (if migration script doesn't work)

Run these SQL commands in Supabase:

```sql
-- Add email_verified column
ALTER TABLE users_ext ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Add email_verification_token column
ALTER TABLE users_ext ADD COLUMN IF NOT EXISTS email_verification_token TEXT UNIQUE;

-- Add email_verification_sent_at column  
ALTER TABLE users_ext ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP WITH TIME ZONE;
```

## API Endpoints

### 1. Send Verification Email
- **Endpoint**: `POST /api/send-verification-email`
- **Body**: `{ userId: string, email: string }`
- **Returns**: Success message or error

### 2. Verify Email Token
- **Endpoint**: `GET /api/verify-email?token=<token>&email=<email>`
- **Function**: Validates token, checks expiration, marks email as verified
- **Redirects**: To `/verify-email` page with status

## User Pages

### 1. Verification Confirmation Page
- **URL**: `/verify-email-sent?email=<email>`
- **Purpose**: Shown after signup, instructs user to check email
- **Features**: 
  - Shows which email was sent to
  - "Resend verification email" button
  - Link to login page

### 2. Email Verification Result Page
- **URL**: `/verify-email`
- **Purpose**: Displays verification result
- **States**:
  - ✓ Success: Email verified, redirects to login in 3 seconds
  - ✗ Error: Invalid or already-used token
  - ⏰ Expired: Token older than 24 hours
  - Loading: While processing verification

## Signup Flow

1. User fills out signup form (email, username, phone, password)
2. Account created in Supabase Auth
3. User profile created in `users_ext` table (email_verified = false)
4. Verification email sent with unique token
5. Redirect to `/verify-email-sent` page
6. User clicks link in email (valid for 24 hours)
7. System marks `email_verified = true`
8. User can now login and use ToolShare

## Environment Variables

### For Email Service (Resend - Recommended)

```env
# Resend (https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@toolshare.app
```

### For Email Service (Alternative - SMTP)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@toolshare.app
```

**Note**: If no email service is configured, the endpoint logs the verification link to console for development/testing.

## Setting Up Resend (Recommended)

1. Go to https://resend.com
2. Sign up for a free account
3. Get your API key
4. Add to `.env.local`:
   ```
   RESEND_API_KEY=your_api_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```
5. Verify your domain in Resend dashboard for production

## Setting Up Custom Domain Emails

To use your own domain (e.g., noreply@toolshare.app) with Resend:

1. In Resend dashboard, add your domain
2. Add the DNS records provided by Resend to your domain registrar
3. Once verified, use that email in `RESEND_FROM_EMAIL`

## Frontend Integration

The signup flow is already updated:

1. **[app/signup/page.tsx]** - Sends verification email after account creation
2. **[app/verify-email-sent/page.tsx]** - Shows confirmation and resend option
3. **[app/verify-email/page.tsx]** - Displays verification results

## Testing Email Verification

### Development (Without Email Service)

If `RESEND_API_KEY` is not set:
1. User signs up normally
2. Check server logs for verification link
3. Visit the link manually: `/api/verify-email?token=<token>&email=<email>`

### Production (With Resend)

1. User signs up
2. Email sent to their inbox within seconds
3. Click link in email to verify

## Future Enhancements

Possible improvements to implement:

1. **Dashboard Verification Status**
   - Show badge "✓ Verified" or "⚠️ Pending Verification" on user profiles
   - Show unverified warning on first login

2. **Automatic Resend**
   - Auto-resend verification email if not clicked after 1 hour
   - Rate limit to prevent spam

3. **Verification Required for Borrowing**
   - Require email verification before borrowing tools
   - Show requirement on borrowing page

4. **Phone Verification**
   - SMS verification similar to email
   - Use Twilio or similar service

5. **Multi-factor Authentication**
   - 2FA option for additional security

## Troubleshooting

### Email Not Received

1. Check spam/junk folder
2. Verify email address was typed correctly
3. Check that RESEND_API_KEY is set correctly
4. Check Resend dashboard for delivery status

### Verification Link Not Working

1. Link may have expired (24 hours) - request resend
2. Token may have been already used - sign up again
3. Email may not match - check database

### Database Errors

If columns don't exist:
1. Run migration: `node add-email-verification.js`
2. Or manually add columns via Supabase SQL editor

## Security Notes

- Verification tokens are cryptographically random (32 bytes)
- Tokens are single-use (cleared after verification)
- Tokens expire after 24 hours
- Email is primary identifier for verification
- Tokens are stored in database, not transmitted in URLs beyond the initial email
