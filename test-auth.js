const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config/jwt');

// Test JWT token creation and verification
console.log('Testing JWT authentication...');
console.log('JWT_SECRET:', JWT_SECRET);

// Create a test token
const testUser = {
  id: 'test-user-id',
  role: 'employee',
  permissions: { canReviewApplications: true }
};

const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '24h' });
console.log('Created token:', token);

// Verify the token
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Decoded token:', decoded);
  console.log('Token verification successful!');
} catch (error) {
  console.error('Token verification failed:', error);
}

// Test with different secret
try {
  const decoded = jwt.verify(token, 'wrong-secret');
  console.log('Decoded with wrong secret:', decoded);
} catch (error) {
  console.log('Expected error with wrong secret:', error.message);
}
