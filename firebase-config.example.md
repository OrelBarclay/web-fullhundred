# Firebase Configuration

Your Firebase project is already configured in the code, but you'll need these additional environment variables for server-side authentication:

```bash
# Firebase Admin SDK (for server-side auth)
FIREBASE_PROJECT_ID=fullhundred-e1487
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@fullhundred-e1487.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

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
