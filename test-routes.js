const mongoose = require('mongoose');
const Application = require('./models/Application');
const Advertisement = require('./models/Advertisement');
const Agency = require('./models/Agency');
const Client = require('./models/Client');
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

// Test the populate operations that were failing
const testPopulateOperations = async () => {
  try {
    console.log('\n=== Testing Populate Operations ===');
    
    // Test finding applications with employee_review status
    const applications = await Application.find({ status: 'employee_review' })
      .populate('advertisement', 'productName productDescription budget category status')
      .populate('agency', 'fullname agencyName email phone')
      .sort({ createdAt: -1 });
    
    console.log('✅ Applications found:', applications.length);
    
    if (applications.length > 0) {
      const app = applications[0];
      console.log('✅ First application populated successfully');
      console.log('   Advertisement:', app.advertisement ? '✅' : '❌');
      console.log('   Agency:', app.agency ? '✅' : '❌');
      
      if (app.advertisement) {
        console.log('   Advertisement fields:', Object.keys(app.advertisement.toObject()));
      }
      if (app.agency) {
        console.log('   Agency fields:', Object.keys(app.agency.toObject()));
      }
    }
    
    console.log('================================\n');
    
  } catch (error) {
    console.error('❌ Error testing populate operations:', error);
    console.error('Error stack:', error.stack);
  } finally {
    mongoose.connection.close();
  }
};

// Run the test
connectDB().then(testPopulateOperations);
