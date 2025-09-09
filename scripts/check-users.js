/**
 * Check Users Script
 * 
 * This script checks the users stored in Firestore.
 * Run this script with: node scripts/check-users.js
 */

import { getFirebaseApp } from '../src/lib/firebase.js';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

async function checkUsers() {
  try {
    console.log('🔍 Checking users in Firestore...');
    
    const app = getFirebaseApp();
    const db = getFirestore(app);
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the users collection.');
      console.log('Make sure users have signed up and their data is saved to Firestore.');
      return;
    }
    
    console.log(`\n📋 Found ${usersSnapshot.size} users:`);
    console.log('=====================================');
    
    usersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n${index + 1}. User ID: ${doc.id}`);
      console.log(`   Email: ${data.email || 'No email'}`);
      console.log(`   Display Name: ${data.displayName || 'No name'}`);
      console.log(`   Role: ${data.role || 'user'}`);
      console.log(`   Admin: ${data.isAdmin ? 'Yes' : 'No'}`);
      console.log(`   Created: ${data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : data.createdAt || 'Unknown'}`);
      console.log(`   Last Login: ${data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toLocaleString() : data.lastLoginAt || 'Unknown'}`);
      console.log(`   Updated: ${data.updatedAt?.toDate ? data.updatedAt.toDate().toLocaleString() : data.updatedAt || 'Unknown'}`);
    });
    
    console.log('\n✅ User check completed!');
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n🔧 Permission denied. This might be a Firestore security rules issue.');
      console.log('Make sure your Firestore rules allow reading the users collection.');
    }
  }
}

checkUsers();
