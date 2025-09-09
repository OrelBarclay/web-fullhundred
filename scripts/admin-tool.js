/**
 * Admin Tool Script
 * 
 * This script provides an interactive way to manage user admin status.
 * Run this script with: node scripts/admin-tool.js
 */

import { getAuthInstance } from '../src/lib/firebase.js';
import { getDb } from '../src/lib/firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listUsersAndMakeAdmin() {
  try {
    console.log('🔍 Loading users from Firestore...');
    
    const db = getDb();
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (users.length === 0) {
      console.log('❌ No users found in the users collection.');
      console.log('Make sure users have signed up and their data is saved to Firestore.');
      return;
    }
    
    console.log('\n📋 Available Users:');
    console.log('==================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName || 'No name'} (${user.email})`);
      console.log(`   UID: ${user.id}`);
      console.log(`   Role: ${user.role || 'user'}`);
      console.log(`   Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    console.log('💡 To make a user admin:');
    console.log('1. Copy their UID from above');
    console.log('2. Run: node scripts/make-admin.js <uid>');
    console.log('');
    console.log('Or use the admin dashboard:');
    console.log('1. Go to /admin/users');
    console.log('2. Click "Change Role" for the user');
    console.log('3. Set role to "admin"');
    
  } catch (error) {
    console.error('❌ Error loading users:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n🔧 Permission denied. This might be a Firestore security rules issue.');
      console.log('Make sure your Firestore rules allow reading the users collection.');
    }
  }
}

listUsersAndMakeAdmin();
