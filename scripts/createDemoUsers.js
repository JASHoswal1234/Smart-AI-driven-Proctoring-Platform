/**
 * Bulk demo user creation script
 * 
 * Usage:
 *   1. Edit the USERS array below with names/emails
 *   2. Run: node scripts/createDemoUsers.js
 *   3. A credentials.csv file will be created with login details
 * 
 * Requires the backend server to be running (npm run server)
 */

import fetch from 'node-fetch';
import fs from 'fs';

const BACKEND_URL = 'http://localhost:5000';

// ── Edit this list ────────────────────────────────────────────────────────────
const USERS = [
  { name: 'Maya Patil',  email: 'maya.patil@kotakeducationfoundation.org' },
  { name: 'Snigdha Priya',  email: 'snigdha.priya@kotakeducationfoundation.org' },
  { name: 'Manoj Barai',  email: 'manoj.barai@kotakeducationfoundation.org' },
  { name: 'Ganesh Mane',  email: 'ganesh.mane@kotakeducationfoundation.org' },
  { name: 'Arati Kaulgud',  email: 'arati.kaulgud@kotakeducationfoundation.org' },
  { name: 'Dharmendra Bari',  email: 'dharmendra.bari@kotakeducationfoundation.org' },
  { name: 'KEF Student 7',  email: 'kef7@test.com' },
  { name: 'KEF Student 8',  email: 'kef8@test.com' },
  { name: 'KEF Student 9',  email: 'kef9@test.com' },
  { name: 'KEF Student 10', email: 'kef10@test.com' },
  { name: 'KEF Student 11', email: 'kef11@test.com' },
  { name: 'KEF Student 12', email: 'kef12@test.com' },
  { name: 'KEF Student 13', email: 'kef13@test.com' },
  { name: 'KEF Student 14', email: 'kef14@test.com' },
  { name: 'KEF Student 15', email: 'kef15@test.com' },
  { name: 'KEF Student 16', email: 'kef16@test.com' },
  { name: 'KEF Student 17', email: 'kef17@test.com' },
  { name: 'KEF Student 18', email: 'kef18@test.com' },
  { name: 'KEF Student 19', email: 'kef19@test.com' },
  { name: 'KEF Student 20', email: 'kef20@test.com' },
];
// Fixed password or generate random ones
const DEFAULT_PASSWORD = 'kefdemo@12345';  // Change this if you want

// ── Script ────────────────────────────────────────────────────────────────────
const results = [];

for (const user of USERS) {
  const password = DEFAULT_PASSWORD;

  try {
    const res = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        password,
        role: 'student',
      }),
    });

    const data = await res.json();

    if (res.ok) {
      console.log(`✅ Created: ${user.name} (${user.email})`);
      results.push({ name: user.name, email: user.email, password, status: 'created' });
    } else {
      console.log(`⚠️  Skipped: ${user.email} — ${data.message}`);
      results.push({ name: user.name, email: user.email, password, status: data.message || 'failed' });
    }
  } catch (err) {
    console.error(`❌ Error creating ${user.email}:`, err.message);
    results.push({ name: user.name, email: user.email, password, status: 'error' });
  }
}

// Write credentials CSV
const csv = [
  'Name,Email,Password,Status',
  ...results.map(r => `"${r.name}","${r.email}","${r.password}","${r.status}"`),
].join('\n');

fs.writeFileSync('scripts/credentials.csv', csv);
console.log('\n📄 Credentials saved to scripts/credentials.csv');
console.log(`✅ ${results.filter(r => r.status === 'created').length} accounts created`);
console.log(`⚠️  ${results.filter(r => r.status !== 'created').length} skipped/failed`);
