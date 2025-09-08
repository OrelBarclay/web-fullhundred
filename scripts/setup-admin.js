/**
 * Setup Admin User Script
 * 
 * This script helps you set up the first admin user by setting custom claims.
 * Run this script with: node scripts/setup-admin.js <user-uid>
 * 
 * You can get the user UID from the Firebase Console or by checking the users collection in Firestore.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function setupAdmin(uid) {
  try {
    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });

    const auth = getAuth(app);

    // Set custom claims for admin role
    await auth.setCustomUserClaims(uid, {
      admin: true,
      role: 'admin'
    });

    console.log(`✅ Successfully set admin claims for user: ${uid}`);
    console.log('The user now has admin privileges and can access the admin dashboard.');
    
  } catch (error) {
    console.error('❌ Error setting admin claims:', error.message);
    
    if (error.code === 'auth/invalid-credential' || error.message.includes('invalid_grant')) {
      console.log('\n🔧 Firebase Admin SDK credentials issue detected.');
      console.log('Try using the alternative setup methods instead:');
      console.log('   node scripts/setup-admin-simple.js');
      console.log('\nOr use the Firebase Console method:');
      console.log('1. Go to Firebase Console > Authentication > Users');
      console.log('2. Find your user and add custom claims: {"admin": true, "role": "admin"}');
    }
    
    process.exit(1);
  }
}

// Get UID from command line arguments
const uid = process.argv[2];

if (!uid) {
  console.log('Usage: node scripts/setup-admin.js <user-uid>');
  console.log('');
  console.log('To get a user UID:');
  console.log('1. Go to Firebase Console > Authentication > Users');
  console.log('2. Find the user and copy their UID');
  console.log('3. Run: node scripts/setup-admin.js <uid>');
  process.exit(1);
}

setupAdmin(uid);
