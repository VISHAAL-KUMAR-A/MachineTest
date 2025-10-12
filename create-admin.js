#!/usr/bin/env node

/**
 * Helper script to create an admin account
 * Usage: node create-admin.js <email> <password>
 * Example: node create-admin.js admin@example.com admin123
 */

const http = require('http');

const args = process.argv.slice(2);
const email = args[0] || 'admin@example.com';
const password = args[1] || 'admin123';

const data = JSON.stringify({
  email: email,
  password: password
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('================================');
console.log('Creating Admin Account');
console.log('================================');
console.log('Email:', email);
console.log('Password:', password);
console.log('');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(responseData);
      
      if (response.success) {
        console.log('✓ Admin account created successfully!');
        console.log('');
        console.log('Details:');
        console.log('- Email:', response.data.email);
        console.log('- Role:', response.data.role);
        console.log('');
        console.log('You can now login at http://localhost:3000');
      } else {
        console.log('✗ Failed to create admin account');
        console.log('Error:', response.message);
      }
    } catch (error) {
      console.log('✗ Error parsing response:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.log('✗ Error creating admin account');
  console.log('');
  console.log('Make sure the backend server is running!');
  console.log('Run: npm run dev (in Backend directory)');
  console.log('');
  console.log('Error details:', error.message);
});

req.write(data);
req.end();

