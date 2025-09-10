# Firebase App Hosting Build Troubleshooting Guide

## 🚨 **Build Error: "Build process exited with error code 1"**

This guide helps you resolve common build issues with Firebase App Hosting.

## 🔧 **Fixes Applied**

### **1. Updated Build Configuration**
- **Removed Turbopack**: Changed from `npm run build` to `npx next build`
- **Added Verbose Logging**: Better error visibility during build
- **Increased Timeout**: Extended to 20 minutes for complex builds
- **Added CI Environment**: Set `CI=true` for production builds

### **2. Fixed apphosting.yaml Structure**
```yaml
# Added missing sections:
buildConfig:
  commands:
    - echo "Starting build process..."
    - npm ci --verbose
    - echo "Dependencies installed successfully"
    - npx next build
    - echo "Build completed successfully"
  timeout: "20m"
  env:
    - variable: NODE_ENV
      value: "production"
    - variable: NEXT_TELEMETRY_DISABLED
      value: "1"
    - variable: CI
      value: "true"

deployConfig:
  outputDir: ".next"
  include: [...]
  exclude: [...]
```

### **3. Created .firebaserc**
```json
{
  "projects": {
    "default": "fullhundred-e1487"
  }
}
```

## 🛠️ **Common Build Issues & Solutions**

### **Issue 1: Turbopack Not Supported**
**Error**: Build fails with Turbopack-related errors
**Solution**: Use standard Next.js build without `--turbopack` flag

### **Issue 2: Missing Build Configuration**
**Error**: No build commands specified
**Solution**: Added complete `buildConfig` section to `apphosting.yaml`

### **Issue 3: Environment Variables Not Set**
**Error**: Build fails due to missing environment variables
**Solution**: Ensure all required variables are in `apphosting.yaml`

### **Issue 4: Dependencies Issues**
**Error**: npm install fails or packages missing
**Solution**: Use `npm ci` with verbose logging

### **Issue 5: Timeout Issues**
**Error**: Build times out before completion
**Solution**: Increased timeout to 20 minutes

## 🔍 **Debugging Steps**

### **1. Check Build Logs**
Look for specific error messages in the Firebase console:
- Dependency installation errors
- TypeScript compilation errors
- Missing environment variables
- Memory/timeout issues

### **2. Verify Environment Variables**
Ensure all required variables are set:
```yaml
# Required for build
NODE_ENV: "production"
NEXT_TELEMETRY_DISABLED: "1"
CI: "true"

# Required for runtime
NEXT_PUBLIC_FIREBASE_API_KEY: "..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "..."
# ... etc
```

### **3. Test Local Build**
Test the build locally to identify issues:
```bash
# Test with production environment
NODE_ENV=production npm run build

# Test with CI environment
CI=true NODE_ENV=production npm run build
```

### **4. Check Package.json Scripts**
Ensure build script is compatible:
```json
{
  "scripts": {
    "build": "next build",  // Remove --turbopack for production
    "dev": "next dev --turbopack"  // Keep for development
  }
}
```

## 🚀 **Deployment Steps**

### **1. Update Environment Variables**
Replace placeholder values in `apphosting.yaml`:
```yaml
- variable: STRIPE_SECRET_KEY
  value: "sk_live_your_actual_key_here"  # Replace with real key
  
- variable: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  value: "pk_live_your_actual_key_here"  # Replace with real key
```

### **2. Deploy to Firebase**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy to App Hosting
firebase apphosting:backends:create
```

### **3. Monitor Build Process**
- Check Firebase Console for build logs
- Look for specific error messages
- Verify all environment variables are set

## 🔧 **Alternative Build Configuration**

If the current build still fails, try this alternative configuration:

```yaml
buildConfig:
  commands:
    - npm install --production=false
    - npm run build
  timeout: "25m"
  env:
    - variable: NODE_ENV
      value: "production"
    - variable: NEXT_TELEMETRY_DISABLED
      value: "1"
    - variable: CI
      value: "true"
    - variable: SKIP_ENV_VALIDATION
      value: "true"
```

## 📞 **Getting Help**

### **Firebase Support**
- [Firebase Documentation](https://firebase.google.com/docs/app-hosting)
- [Firebase Support](https://firebase.google.com/support)
- [Firebase Community](https://github.com/firebase/firebase-tools)

### **Next.js Support**
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

### **Common Solutions**
1. **Clear Build Cache**: Delete `.next` folder and rebuild
2. **Update Dependencies**: Run `npm update`
3. **Check Node Version**: Ensure compatible Node.js version
4. **Verify File Permissions**: Check file access permissions

## ✅ **Success Indicators**

Your build should succeed when you see:
- ✅ "Dependencies installed successfully"
- ✅ "Build completed successfully"
- ✅ No TypeScript errors
- ✅ All environment variables loaded
- ✅ Static files generated in `.next` folder

---

**Note**: If you continue to experience build issues, please share the specific error messages from the Firebase console for more targeted assistance.
