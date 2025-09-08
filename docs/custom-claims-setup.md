# Firebase Custom Claims Setup

This document explains how to set up and use Firebase Custom Claims for admin role management in the Full Hundred application.

## Overview

Custom Claims provide a secure way to manage user roles and permissions. Instead of checking email addresses, we now use Firebase Custom Claims to determine if a user is an admin.

## How It Works

1. **Custom Claims**: Stored in Firebase Auth and included in ID tokens
2. **Client-Side Check**: `isUserAdmin()` function checks custom claims
3. **Server-Side Management**: Admin users can set custom claims for other users

## Setting Up Your First Admin User

### Method 1: Using the Setup Script

1. **Get the User UID**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Navigate to Authentication > Users
   - Find your user and copy the UID

2. **Run the Setup Script**:
   ```bash
   node scripts/setup-admin.js <user-uid>
   ```

### Method 2: Using Firebase Console

1. Go to Firebase Console > Authentication > Users
2. Find the user you want to make admin
3. Click on the user to open details
4. Scroll down to "Custom Claims"
5. Add the following JSON:
   ```json
   {
     "admin": true,
     "role": "admin"
   }
   ```

### Method 3: Using the Admin Dashboard

1. **Temporary Access**: First, you need to temporarily modify the admin check to allow your email
2. **Access Admin Dashboard**: Go to `/admin/users`
3. **Set Admin Role**: Use the "Change Role" button to set a user as admin
4. **Revert Changes**: Remove the temporary email check

## Custom Claims Structure

```typescript
interface CustomClaims {
  admin?: boolean;    // Quick admin check
  role?: string;      // Specific role (admin, user, etc.)
}
```

## API Endpoints

### Set Custom Claims
- **Endpoint**: `POST /api/admin/set-claims`
- **Body**: 
  ```json
  {
    "uid": "user-uid",
    "claims": {
      "admin": true,
      "role": "admin"
    }
  }
  ```

## Security Benefits

1. **Server-Side Validation**: Claims are verified on the server
2. **Tamper-Proof**: Claims are signed by Firebase and cannot be modified client-side
3. **Scalable**: Easy to add new roles and permissions
4. **Audit Trail**: All role changes are logged

## Troubleshooting

### User Still Can't Access Admin Dashboard

1. **Check Claims**: Verify custom claims are set correctly
2. **Token Refresh**: The user may need to sign out and sign back in
3. **Force Refresh**: Use `getIdTokenResult(user, true)` to force token refresh

### Claims Not Updating

1. **Token Caching**: Firebase caches ID tokens for 1 hour
2. **Force Refresh**: Use the `true` parameter in `getIdTokenResult`
3. **Sign Out/In**: User may need to sign out and back in

## Development vs Production

### Development
- Use the setup script for quick admin setup
- Test with multiple users and roles

### Production
- Use the admin dashboard for role management
- Implement proper audit logging
- Consider role hierarchies (super-admin, admin, moderator, etc.)

## Example Usage

```typescript
import { isUserAdmin, getUserRole } from '@/lib/auth-utils';

// Check if user is admin
const isAdmin = await isUserAdmin();

// Get user's specific role
const role = await getUserRole();

// Use in components
if (isAdmin) {
  // Show admin features
}
```

## Best Practices

1. **Principle of Least Privilege**: Only grant necessary permissions
2. **Regular Audits**: Review user roles periodically
3. **Role Hierarchy**: Design clear role structures
4. **Documentation**: Keep role definitions documented
5. **Testing**: Test role changes thoroughly
