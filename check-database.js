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

// Check database contents
const checkDatabase = async () => {
  try {
    console.log('\n=== Database Contents Check ===');
    
    // Check applications
    const applications = await Application.find({});
    console.log(`Total applications: ${applications.length}`);
    
    if (applications.length > 0) {
      console.log('\nExisting applications:');
      applications.forEach((app, index) => {
        console.log(`  ${index + 1}. ID: ${app._id}`);
        console.log(`     Status: ${app.status}`);
        console.log(`     Advertisement: ${app.advertisement}`);
        console.log(`     Agency: ${app.agency}`);
        console.log(`     Budget: ${app.budget}`);
        console.log(`     Timeline: ${app.timeline}`);
        console.log('');
      });
    }
    
    const employeeReviewApps = await Application.find({ status: 'employee_review' });
    console.log(`Applications with employee_review status: ${employeeReviewApps.length}`);
    
    if (employeeReviewApps.length > 0) {
      console.log('Employee review applications:');
      employeeReviewApps.forEach((app, index) => {
        console.log(`  ${index + 1}. ID: ${app._id}, Status: ${app.status}`);
      });
    }
    
    // Check advertisements
    const advertisements = await Advertisement.find({});
    console.log(`Total advertisements: ${advertisements.length}`);
    
    // Check agencies
    const agencies = await Agency.find({});
    console.log(`Total agencies: ${agencies.length}`);
    
    // Check clients
    const clients = await Client.find({});
    console.log(`Total clients: ${clients.length}`);
    
    console.log('================================\n');
    
    // If no employee_review applications exist, try to update existing ones or create sample data
    if (employeeReviewApps.length === 0) {
      console.log('No applications with employee_review status found.');
      
      // Try to update an existing application to employee_review status
      if (applications.length > 0) {
        console.log('Updating existing application to employee_review status...');
        await updateExistingApplication(applications[0]._id);
      } else {
        console.log('Creating sample data...');
        await createSampleApplications();
      }
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Update existing application to employee_review status
const updateExistingApplication = async (applicationId) => {
  try {
    const result = await Application.findByIdAndUpdate(
      applicationId,
      { status: 'employee_review' },
      { new: true }
    );
    
    if (result) {
      console.log(`Application ${applicationId} updated to employee_review status`);
      console.log('Now you should see data in the Employee Dashboard!');
    }
  } catch (error) {
    console.error('Error updating application:', error);
  }
};

// Create sample applications
const createSampleApplications = async () => {
  try {
    // Get existing agencies and clients
    const agencies = await Agency.find({});
    const clients = await Client.find({});
    
    if (agencies.length === 0 || clients.length === 0) {
      console.log('Need at least one agency and one client to create applications');
      return;
    }
    
    // Create sample advertisements first
    const sampleAd = new Advertisement({
      productName: 'Sample Product Campaign',
      productDescription: 'A sample advertising campaign for testing purposes',
      targetAudience: 'General consumers',
      budget: 15000,
      campaignDuration: '3 months',
      category: 'other',
      status: 'active',
      client: clients[0]._id
    });
    
    await sampleAd.save();
    console.log('Sample advertisement created:', sampleAd._id);
    
    // Create sample applications
    const sampleApp = new Application({
      advertisement: sampleAd._id,
      agency: agencies[0]._id,
      message: 'This is a sample application message for testing the employee dashboard.',
      proposal: 'We propose to create a comprehensive marketing campaign including social media, print ads, and digital marketing strategies.',
      budget: 12000,
      timeline: '3 months',
      status: 'employee_review',
      portfolio: [
        {
          title: 'Sample Project 1',
          description: 'A successful marketing campaign for a retail brand',
          url: 'https://example.com/project1'
        },
        {
          title: 'Sample Project 2',
          description: 'Digital marketing strategy for a tech startup',
          url: 'https://example.com/project2'
        }
      ]
    });
    
    await sampleApp.save();
    console.log('Sample application created:', sampleApp._id);
    
    console.log('\n=== Sample Data Created ===');
    console.log('Advertisement: Sample Product Campaign');
    console.log('Application: Sample application with employee_review status');
    console.log('Status: Ready for employee review');
    console.log('================================\n');
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

// Run the script
connectDB().then(checkDatabase);
