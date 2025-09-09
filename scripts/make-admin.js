/**
 * Make User Admin Script
 * 
 * This script makes a user admin by calling the set-claims API endpoint.
 * Run this script with: node scripts/make-admin.js <user-uid>
 * 
 * You can get the user UID from the Firebase Console or by checking the users collection in Firestore.
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function makeUserAdmin(uid) {
  try {
    console.log(`🔧 Making user ${uid} an admin...`);
    
    const response = await fetch('http://localhost:3000/api/admin/set-claims', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: uid,
        claims: {
          admin: true,
          role: 'admin'
        }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Successfully made user ${uid} an admin!`);
      console.log('Response:', result);
      console.log('\nThe user now has admin privileges and can access the admin dashboard.');
      console.log('They may need to sign out and sign back in to refresh their token.');
    } else {
      const error = await response.json();
      console.error(`❌ Failed to make user admin:`, error);
      
      if (response.status === 401) {
        console.log('\n🔧 This might be a permissions issue.');
        console.log('Make sure you have admin access first, or try the Firebase Console method.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error making user admin:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Connection refused. Make sure your development server is running:');
      console.log('   yarn dev');
    }
  }
}

// Get UID from command line arguments
const uid = process.argv[2];

if (!uid) {
  console.log('Usage: node scripts/make-admin.js <user-uid>');
  console.log('');
  console.log('To get a user UID:');
  console.log('1. Go to Firebase Console > Authentication > Users');
  console.log('2. Find the user and copy their UID');
  console.log('3. Run: node scripts/make-admin.js <uid>');
  console.log('');
  console.log('Or use the admin dashboard:');
  console.log('1. Go to /admin/users');
  console.log('2. Click "Change Role" for the user');
  console.log('3. Set role to "admin"');
  process.exit(1);
}

makeUserAdmin(uid);
