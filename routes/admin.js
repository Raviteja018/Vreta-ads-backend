const express = require("express");
const adminRouter = express.Router();
const jwt = require("jsonwebtoken");
const Client = require("../models/Client");
const Agency = require("../models/Agency");
const Advertisement = require("../models/Advertisement");
const Application = require("../models/Application");
const Employee = require("../models/Employee"); // Added Employee model
const User = require("../models/User"); // Added User model
const bcrypt = require("bcryptjs"); // Added bcrypt

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Test endpoint to verify admin routes are working
adminRouter.get("/test", (req, res) => {
  res.json({ message: "Admin routes are working!", timestamp: new Date().toISOString() });
});

// Get dashboard analytics
adminRouter.get("/analytics", requireAdmin, async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const totalAgencies = await Agency.countDocuments();
    const totalAds = await Advertisement.countDocuments();
    const totalApplications = await Application.countDocuments();
    
    const pendingClients = await Client.countDocuments({ isApproved: false });
    const pendingAgencies = await Agency.countDocuments({ isApproved: false });
    const activeAds = await Advertisement.countDocuments({ status: 'active' });
    const pausedAds = await Advertisement.countDocuments({ status: 'paused' });

    const analytics = {
      totalUsers: totalClients + totalAgencies,
      totalAds,
      totalApplications,
      pendingApprovals: pendingClients + pendingAgencies,
      activeCampaigns: activeAds,
      pausedCampaigns: pausedAds,
      totalClients,
      totalAgencies
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// Get all clients with pagination
adminRouter.get("/clients", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const clients = await Client.find()
      .select('fullname email company isApproved createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Client.countDocuments();

    res.json({
      clients,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalClients: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
});

// Get all agencies with pagination
adminRouter.get("/agencies", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const agencies = await Agency.find()
      .select('fullname email agencyName isApproved createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Agency.countDocuments();

    res.json({
      agencies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAgencies: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agencies', error: error.message });
  }
});

// Get all advertisements with pagination
adminRouter.get("/advertisements", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const advertisements = await Advertisement.find()
      .populate('client', 'fullname company')
      .select('productName productDescription budget category status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Advertisement.countDocuments();

    res.json({
      advertisements,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAds: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching advertisements', error: error.message });
  }
});

// Get all applications with pagination
adminRouter.get("/applications", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status; // Filter by status

    let query = {};
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('advertisement', 'productName client budget')
      .populate('agency', 'fullname agencyName')
      .populate('employeeReview.reviewedBy', 'username')
      .select('message proposal budget timeline status createdAt employeeReview')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments(query);

    res.json({
      applications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalApplications: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

// Get applications pending employee review
adminRouter.get("/applications/pending-review", requireAdmin, async (req, res) => {
  try {
    const applications = await Application.find({ status: 'employee_review' })
      .populate('advertisement', 'productName client budget category')
      .populate('agency', 'fullname agencyName email')
      .populate('portfolio')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Pending review applications retrieved successfully',
      data: applications
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending review applications', error: error.message });
  }
});

// Get application details for review
adminRouter.get("/applications/:id/review", requireAdmin, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('advertisement', 'productName productDescription budget category client')
      .populate('agency', 'fullname agencyName email portfolio')
      .populate('employeeReview.reviewedBy', 'username');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({
      message: 'Application details retrieved successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching application details', error: error.message });
  }
});

// Employee review application
adminRouter.post("/applications/:id/review", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      budgetApproved, 
      proposalQuality, 
      portfolioQuality, 
      notes, 
      decision 
    } = req.body;
    
    if (!decision || !['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: "Valid decision is required" });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== 'employee_review') {
      return res.status(400).json({ message: "Application is not in employee review status" });
    }

    // Update application with employee review
    const updateData = {
      status: decision === 'approve' ? 'client_review' : 'rejected',
      employeeReview: {
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        budgetApproved: budgetApproved || false,
        proposalQuality: proposalQuality || 'fair',
        portfolioQuality: portfolioQuality || 'fair',
        notes: notes || '',
        decision: decision
      }
    };

    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('advertisement', 'productName productDescription budget category status')
     .populate('agency', 'fullname agencyName')
     .populate('employeeReview.reviewedBy', 'username');
    
    res.json({
      message: `Application ${decision === 'approve' ? 'approved and sent to client' : 'rejected'}`,
      data: updatedApplication
    });
  } catch (error) {
    console.error("Error reviewing application:", error);
    res.status(500).json({ message: "Error reviewing application", error: error.message });
  }
});

// Get application statistics for admin dashboard
adminRouter.get("/applications/stats", requireAdmin, async (req, res) => {
  try {
    const stats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = await Application.countDocuments();
    const pendingReview = await Application.countDocuments({ status: 'employee_review' });
    const clientReview = await Application.countDocuments({ status: 'client_review' });
    const approved = await Application.countDocuments({ status: 'approved' });
    const rejected = await Application.countDocuments({ status: 'rejected' });

    res.json({
      message: 'Application statistics retrieved successfully',
      data: {
        total: totalApplications,
        pendingReview,
        clientReview,
        approved,
        rejected,
        breakdown: stats
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching application statistics', error: error.message });
  }
});

// Approve/Reject client
adminRouter.patch("/clients/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    // Validate action
    if (!['active', 'inactive'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: "Action must be either 'active' or 'inactive'" 
      });
    }

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: "Client not found" 
      });
    }

    // Update client status
    client.isApproved = action === 'active';
    await client.save();

    res.json({
      success: true,
      message: `Client ${action === 'active' ? 'activated' : 'deactivated'} successfully`,
      client
    });
  } catch (error) {
    console.error("Error updating client status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update client status" 
    });
  }
});

// Approve/Reject agency
adminRouter.patch("/agencies/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    // Validate action
    if (!['active', 'inactive'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: "Action must be either 'active' or 'inactive'" 
      });
    }

    const agency = await Agency.findById(id);
    if (!agency) {
      return res.status(404).json({ 
        success: false, 
        message: "Agency not found" 
      });
    }

    // Update agency status
    agency.isApproved = action === 'active';
    await agency.save();

    res.json({
      success: true,
      message: `Agency ${action === 'active' ? 'activated' : 'deactivated'} successfully`,
      agency
    });
  } catch (error) {
    console.error("Error updating agency status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update agency status" 
    });
  }
});

// Edit client
adminRouter.put("/clients/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, company, email } = req.body;
    
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: "Client not found" 
      });
    }

    // Update client fields
    if (fullname) client.fullname = fullname;
    if (company) client.company = company;
    if (email) client.email = email;
    
    await client.save();

    res.json({
      success: true,
      message: "Client updated successfully",
      client
    });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update client" 
    });
  }
});

// Edit agency
adminRouter.put("/agencies/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, agencyName, email } = req.body;
    
    const agency = await Agency.findById(id);
    if (!agency) {
      return res.status(404).json({ 
        success: false, 
        message: "Agency not found" 
      });
    }

    // Update agency fields
    if (fullname) agency.fullname = fullname;
    if (agencyName) agency.agencyName = agencyName;
    if (email) agency.email = email;
    
    await agency.save();

    res.json({
      success: true,
      message: "Agency updated successfully",
      agency
    });
  } catch (error) {
    console.error("Error updating agency:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update agency" 
    });
  }
});

// Get recent activity
adminRouter.get("/recent-activity", requireAdmin, async (req, res) => {
  try {
    const recentClients = await Client.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullname company createdAt');

    const recentAgencies = await Agency.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullname agencyName createdAt');

    const recentAds = await Advertisement.find()
      .populate('client', 'fullname company')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('productName client createdAt');

    const recentApplications = await Application.find()
      .populate('advertisement', 'productName')
      .populate('agency', 'fullname agencyName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('advertisement agency status createdAt');

    const activity = [
      ...recentClients.map(client => ({
        type: 'client_registration',
        message: `New client registration: ${client.fullname}`,
        timestamp: client.createdAt,
        data: client
      })),
      ...recentAgencies.map(agency => ({
        type: 'agency_registration',
        message: `New agency registration: ${agency.fullname}`,
        timestamp: agency.createdAt,
        data: agency
      })),
      ...recentAds.map(ad => ({
        type: 'new_advertisement',
        message: `New advertisement: ${ad.productName}`,
        timestamp: ad.createdAt,
        data: ad
      })),
      ...recentApplications.map(app => ({
        type: 'new_application',
        message: `New application for ${app.advertisement.productName}`,
        timestamp: app.createdAt,
        data: app
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
     .slice(0, 10);

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent activity', error: error.message });
  }
});

// Get employees with pagination
adminRouter.get('/employees', requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const employees = await Employee.find()
            .populate('userId', 'username role')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Employee.countDocuments();

        res.json({
            employees,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                total,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new employee
adminRouter.post('/employees', requireAdmin, async (req, res) => {
    try {
        const { username, password, fullName, email, department, position, permissions } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Check if employee email already exists
        const existingEmployee = await Employee.findOne({ email });
        if (existingEmployee) {
            return res.status(400).json({ message: 'Employee email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = new User({
            username,
            password: hashedPassword,
            role: 'employee'
        });
        await user.save();

        // Create employee profile
        const employee = new Employee({
            userId: user._id,
            fullName,
            email,
            department,
            position,
            permissions: permissions || {
                canReviewApplications: true,
                canManageUsers: false,
                canViewAnalytics: true
            }
        });
        await employee.save();

        res.status(201).json({
            message: 'Employee created successfully',
            employee: {
                id: employee._id,
                username: user.username,
                fullName: employee.fullName,
                email: employee.email,
                department: employee.department,
                position: employee.position,
                permissions: employee.permissions
            }
        });
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update employee
adminRouter.put('/employees/:id', requireAdmin, async (req, res) => {
    try {
        const { fullName, email, department, position, permissions, isActive } = req.body;

        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Update employee fields
        employee.fullName = fullName || employee.fullName;
        employee.email = email || employee.email;
        employee.department = department || employee.department;
        employee.position = position || employee.position;
        employee.permissions = permissions || employee.permissions;
        employee.isActive = isActive !== undefined ? isActive : employee.isActive;

        await employee.save();

        res.json({
            message: 'Employee updated successfully',
            employee
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete employee
adminRouter.delete('/employees/:id', requireAdmin, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Delete the user account
        await User.findByIdAndDelete(employee.userId);
        
        // Delete the employee profile
        await Employee.findByIdAndDelete(req.params.id);

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset employee password
adminRouter.post('/employees/:id/reset-password', requireAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;

        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        await User.findByIdAndUpdate(employee.userId, { password: hashedPassword });

        res.json({ message: 'Employee password reset successfully' });
    } catch (error) {
        console.error('Error resetting employee password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = adminRouter;
