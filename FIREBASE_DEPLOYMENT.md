# Firebase App Hosting Deployment Guide

This guide explains how to deploy your Full Hundred LLC Next.js application to Firebase App Hosting using the `apphosting.yaml` configuration file.

## 📋 Prerequisites

1. **Firebase Project**: You need a Firebase project set up
2. **Firebase CLI**: Install Firebase CLI (`npm install -g firebase-tools`)
3. **Service Account**: Download your Firebase service account key
4. **Cloudinary Account**: Set up Cloudinary for image uploads

## 🔧 Configuration Steps

### 1. Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > General
4. Scroll down to "Your apps" section
5. Click on the web app icon (</>) or add a new web app
6. Copy the Firebase configuration values

### 2. Get Your Service Account Key

1. In Firebase Console, go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the values you need

### 3. Get Your Cloudinary Configuration

1. Go to [Cloudinary Console](https://console.cloudinary.com/)
2. Go to Dashboard
3. Copy your Cloud Name, API Key, and API Secret

### 4. Update apphosting.yaml

Replace the placeholder values in `apphosting.yaml` with your actual values:

```yaml
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY: "your-actual-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID: "your-actual-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "your-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID: "your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "your-measurement-id"

# Firebase Admin Configuration
FIREBASE_PROJECT_ID: "your-actual-project-id"
FIREBASE_CLIENT_EMAIL: "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY\n-----END PRIVATE KEY-----"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME: "your-cloudinary-cloud-name"
CLOUDINARY_API_KEY: "your-cloudinary-api-key"
CLOUDINARY_API_SECRET: "your-cloudinary-api-secret"
```

## 🚀 Deployment Steps

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase in your project
```bash
firebase init hosting
```

### 4. Deploy to Firebase App Hosting
```bash
firebase deploy --only hosting
```

## 🔍 Verification

After deployment, you can verify your app is working by:

1. **Health Check**: Visit `https://your-app-url/api/health`
2. **Main App**: Visit your deployed URL
3. **Firebase Console**: Check the hosting section for deployment status

## 📁 File Structure

The `apphosting.yaml` file includes:

- **Runtime**: Node.js 20
- **Environment Variables**: All necessary Firebase, Cloudinary, and app configs
- **Build Commands**: `npm ci` and `npm run build`
- **Deployment Files**: Includes all necessary files, excludes unnecessary ones
- **Health Check**: Monitors app health at `/api/health`

## ⚠️ Security Notes

- **Public Variables**: `NEXT_PUBLIC_*` variables are safe to expose
- **Private Variables**: `FIREBASE_PRIVATE_KEY`, `CLOUDINARY_API_SECRET` should be kept secure
- **Service Account**: The private key should be properly formatted with `\n` for newlines

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Failures**: Check that all dependencies are in `package.json`
2. **Environment Variables**: Ensure all required variables are set
3. **Firebase Auth**: Verify your Firebase project has Authentication enabled
4. **Cloudinary**: Make sure your Cloudinary account is active

### Debug Commands:

```bash
# Check Firebase CLI version
firebase --version

# Check project configuration
firebase projects:list

# View deployment logs
firebase hosting:channel:open
```

## 📞 Support

If you encounter issues:

1. Check the Firebase Console for error logs
2. Verify all environment variables are correctly set
3. Ensure your Firebase project has the necessary services enabled
4. Check that your Cloudinary account is properly configured

---

**Note**: This configuration is specifically tailored for the Full Hundred LLC Next.js application with Firebase, Cloudinary, and cart functionality.
