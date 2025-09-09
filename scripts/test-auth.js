/**
 * Test Authentication Script
 * 
 * This script helps debug authentication issues by testing the current setup.
 */

import { getAuthInstance } from '../src/lib/firebase.js';
import { isUserAdmin, getUserCustomClaims } from '../src/lib/auth-utils.js';

console.log('🔍 Testing Authentication Setup');
console.log('================================\n');

async function testAuth() {
  try {
    const auth = getAuthInstance();
    const user = auth.currentUser;
    
    if (!user) {
      console.log('❌ No user is currently signed in.');
      console.log('Please sign in to your app first, then run this script.');
      return;
    }
    
    console.log('✅ User is signed in:');
    console.log(`   Email: ${user.email}`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Display Name: ${user.displayName || 'None'}\n`);
    
    console.log('🔍 Testing Custom Claims...');
    const claims = await getUserCustomClaims();
    console.log('Custom Claims:', claims);
    
    console.log('\n🔍 Testing Admin Status...');
    const isAdmin = await isUserAdmin();
    console.log(`Is Admin: ${isAdmin}`);
    
    if (isAdmin) {
      console.log('\n✅ You have admin access! You should be able to access /admin');
    } else {
      console.log('\n❌ You do not have admin access.');
      console.log('Follow the setup instructions to add custom claims.');
    }
    
  } catch (error) {
    console.error('❌ Error testing authentication:', error.message);
  }
}

testAuth();
