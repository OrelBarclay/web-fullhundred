/**
 * List Users Script
 * 
 * This script helps you list all users in your Firebase project so you can find UIDs.
 * Run this script with: node scripts/list-users.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listUsers() {
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

    // List all users
    const listUsersResult = await auth.listUsers();
    
    console.log('📋 Users in your Firebase project:');
    console.log('=====================================');
    
    if (listUsersResult.users.length === 0) {
      console.log('No users found. Make sure users have signed up first.');
      return;
    }

    listUsersResult.users.forEach((userRecord, index) => {
      console.log(`\n${index + 1}. User Details:`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Email: ${userRecord.email || 'No email'}`);
      console.log(`   Display Name: ${userRecord.displayName || 'No display name'}`);
      console.log(`   Created: ${userRecord.metadata.creationTime}`);
      console.log(`   Last Sign In: ${userRecord.metadata.lastSignInTime || 'Never'}`);
      
      // Show custom claims if any
      if (userRecord.customClaims && Object.keys(userRecord.customClaims).length > 0) {
        console.log(`   Custom Claims: ${JSON.stringify(userRecord.customClaims)}`);
      } else {
        console.log(`   Custom Claims: None`);
      }
    });

    console.log('\n💡 To make a user admin, copy their UID and run:');
    console.log('   node scripts/setup-admin.js <uid>');
    
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    
    if (error.code === 'auth/invalid-credential') {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check your Firebase environment variables in .env.local');
      console.log('2. Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set');
      console.log('3. Verify your Firebase service account has the correct permissions');
    }
    
    process.exit(1);
  }
}

listUsers();
