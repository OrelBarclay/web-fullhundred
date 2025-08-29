# Firebase Configuration

You need to set up environment variables in your `.env.local` file for both client-side Firebase and server-side admin authentication:

## Client-Side Firebase (NEXT_PUBLIC_*)

```bash
# Firebase Web App Config (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDMyQTg7F9-LJXNV2iwOWXPJlVwoFY-GDw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fullhundred-e1487.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fullhundred-e1487
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fullhundred-e1487.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=774067863491
NEXT_PUBLIC_FIREBASE_APP_ID=1:774067863491:web:d6ef0f6a7a79b81a644776
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-NQF81WTR83
```

## Server-Side Firebase Admin (for auth)

```bash
# Firebase Admin SDK (for server-side auth)
FIREBASE_PROJECT_ID=fullhundred-e1487
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@fullhundred-e1487.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----"
```

## Cloudinary

```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Getting Firebase Config:

1. Go to [Firebase Console](https://console.firebase.google.com/project/fullhundred-e1487)
2. Navigate to Project Settings → General
3. Scroll down to "Your apps" section
4. Copy the config values from the Firebase SDK snippet

## Getting Firebase Admin SDK Keys:

1. Go to [Firebase Console](https://console.firebase.google.com/project/fullhundred-e1487)
2. Navigate to Project Settings → Service Accounts
3. Click "Generate new private key"
4. Download the JSON file and copy the values:
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the \n newlines)
   - `project_id` → `FIREBASE_PROJECT_ID`

## Getting Cloudinary Config:

1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Copy your cloud name, API key, and API secret
3. Create an unsigned preset if needed for client-side signed/unsigned uploads (we use server-side here)

## Current Firebase Project:
- **Project ID**: fullhundred-e1487
- **Auth Domain**: fullhundred-e1487.firebaseapp.com
- **Storage Bucket**: fullhundred-e1487.firebasestorage.app
