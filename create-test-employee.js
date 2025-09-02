const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Employee = require('./models/Employee');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vreta-ads');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create test employee
const createTestEmployee = async () => {
  try {
    console.log('Creating test employee account...');
    
    // Check if test employee already exists
    const existingUser = await User.findOne({ username: 'testemployee' });
    if (existingUser) {
      console.log('Test employee already exists');
      return;
    }
    
    // Create user account
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({
      username: 'testemployee',
      password: hashedPassword,
      role: 'employee'
    });
    
    await user.save();
    console.log('User account created:', user._id);
    
    // Create employee profile
    const employee = new Employee({
      userId: user._id,
      fullName: 'Test Employee',
      email: 'test.employee@company.com',
      department: 'Marketing',
      position: 'Review Specialist',
      isActive: true,
      permissions: {
        canReviewApplications: true,
        canManageUsers: false,
        canViewAnalytics: true
      }
    });
    
    await employee.save();
    console.log('Employee profile created:', employee._id);
    
    console.log('\n=== Test Employee Account Created ===');
    console.log('Username: testemployee');
    console.log('Password: password123');
    console.log('Role: employee');
    console.log('Department: Marketing');
    console.log('Position: Review Specialist');
    console.log('=====================================\n');
    
  } catch (error) {
    console.error('Error creating test employee:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
connectDB().then(createTestEmployee);
