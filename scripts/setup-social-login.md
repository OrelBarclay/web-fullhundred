# Social Login Setup Guide

## Firebase Console Configuration

To enable social logins, you need to configure them in the Firebase Console:

### 1. Go to Firebase Console
- Visit: https://console.firebase.google.com
- Select your project: `fullhundred-e1487`

### 2. Enable Authentication Methods
- Go to **Authentication** > **Sign-in method**
- Enable the following providers:

#### Google (Already enabled)
- Status: ✅ Enabled
- No additional setup needed

#### Facebook
- Click **Facebook** > **Enable**
- You'll need to create a Facebook App:
  1. Go to https://developers.facebook.com
  2. Create a new app
  3. Add Facebook Login product
  4. Get App ID and App Secret
  5. Add authorized domains:
     - `localhost` (for development)
     - `your-domain.com` (for production)
  6. Copy App ID and App Secret to Firebase

#### GitHub
- Click **GitHub** > **Enable**
- You'll need to create a GitHub OAuth App:
  1. Go to https://github.com/settings/developers
  2. Click "New OAuth App"
  3. Set Authorization callback URL: `https://fullhundred-e1487.firebaseapp.com/__/auth/handler`
  4. Copy Client ID and Client Secret to Firebase

#### Twitter
- Click **Twitter** > **Enable**
- You'll need to create a Twitter App:
  1. Go to https://developer.twitter.com
  2. Create a new app
  3. Enable OAuth 2.0
  4. Set callback URL: `https://fullhundred-e1487.firebaseapp.com/__/auth/handler`
  5. Copy API Key and API Secret to Firebase

### 3. Update Authorized Domains
In Firebase Console > Authentication > Settings > Authorized domains:
- Add: `localhost` (for development)
- Add: `your-production-domain.com` (when deployed)

### 4. Test the Login
Once configured, users can sign in with:
- ✅ Google (already working)
- 🔧 Facebook (needs setup)
- 🔧 GitHub (needs setup)
- 🔧 Twitter (needs setup)

## Current Status
- **Google**: ✅ Ready to use
- **Facebook**: ⚠️ Needs Firebase configuration
- **GitHub**: ⚠️ Needs Firebase configuration  
- **Twitter**: ⚠️ Needs Firebase configuration

## Notes
- All social providers will work with the same user management system
- Users will be stored in the same Firestore `users` collection
- Admin status is determined by email or custom claims
- The UI is ready - just needs Firebase configuration
