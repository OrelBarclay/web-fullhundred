/**
 * Smart Admin Script
 * 
 * This script makes a user admin by calling the set-claims API endpoint.
 * It automatically detects the correct port and provides better error handling.
 * Run this script with: node scripts/smart-admin.js <user-uid>
 */

async function makeUserAdmin(uid) {
  const urls = [
    'http://localhost:3000',
    'https://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3001'
  ];
  let lastError = null;
  
  for (const baseUrl of urls) {
    try {
      console.log(`🔧 Trying to make user ${uid} an admin on ${baseUrl}...`);
      
      const response = await fetch(`${baseUrl}/api/admin/set-claims`, {
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
        console.log(`✅ Successfully made user ${uid} an admin on ${baseUrl}!`);
        console.log('Response:', result);
        console.log('\nThe user now has admin privileges and can access the admin dashboard.');
        console.log('They may need to sign out and sign back in to refresh their token.');
        return;
      } else {
        const error = await response.json();
        console.log(`❌ ${baseUrl} failed:`, error.message || error);
        lastError = error;
      }
      
    } catch (error) {
      console.log(`❌ ${baseUrl} connection failed:`, error.message);
      lastError = error;
    }
  }
  
  console.log('\n🔧 All ports failed. Make sure your development server is running:');
  console.log('   yarn dev');
  console.log('\nOr try the admin dashboard method:');
  console.log('1. Go to /admin/users');
  console.log('2. Click "Change Role" for the user');
  console.log('3. Set role to "admin"');
  
  if (lastError) {
    console.log('\nLast error:', lastError);
  }
}

// Get UID from command line arguments
const uid = process.argv[2];

if (!uid) {
  console.log('Usage: node scripts/smart-admin.js <user-uid>');
  console.log('');
  console.log('To get a user UID:');
  console.log('1. Go to Firebase Console > Authentication > Users');
  console.log('2. Find the user and copy their UID');
  console.log('3. Run: node scripts/smart-admin.js <uid>');
  console.log('');
  console.log('Or use the admin dashboard:');
  console.log('1. Go to /admin/users');
  console.log('2. Click "Change Role" for the user');
  console.log('3. Set role to "admin"');
  process.exit(1);
}

makeUserAdmin(uid);
