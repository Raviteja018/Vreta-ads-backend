const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Application = require('../models/Application');

// Middleware to check if user is authenticated and is an employee
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'employee') {
      return res.status(403).json({ message: 'Employee access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Employee login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find employee by username (through User model)
        const user = await User.findOne({ username, role: 'employee' });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Find employee profile
        const employee = await Employee.findOne({ userId: user._id });
        if (!employee || !employee.isActive) {
            return res.status(401).json({ message: 'Invalid credentials or inactive account' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { 
                userId: user._id, 
                role: 'employee',
                permissions: employee.permissions
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: 'employee',
                fullName: employee.fullName,
                email: employee.email,
                department: employee.department,
                position: employee.position,
                permissions: employee.permissions
            }
        });
    } catch (error) {
        console.error('Employee login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get employee dashboard data
router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        if (req.user.role !== 'employee') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get pending review applications
        const pendingApplications = await Application.find({ status: 'employee_review' })
            .populate('advertisement', 'productName description')
            .populate('agency', 'fullname agencyName')
            .populate('client', 'fullname company')
            .limit(10);

        // Get application statistics
        const totalPending = await Application.countDocuments({ status: 'employee_review' });
        const totalReviewed = await Application.countDocuments({ 
            'employeeReview.reviewedBy': req.user.userId 
        });

        res.json({
            pendingApplications,
            stats: {
                totalPending,
                totalReviewed
            }
        });
    } catch (error) {
        console.error('Error fetching employee dashboard:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get pending review applications
router.get('/applications/pending', requireAuth, async (req, res) => {
    try {
        if (req.user.role !== 'employee') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const applications = await Application.find({ status: 'employee_review' })
            .populate('advertisement', 'productName description budget')
            .populate('agency', 'fullname agencyName')
            .populate('client', 'fullname company')
            .sort({ createdAt: -1 });

        res.json(applications);
    } catch (error) {
        console.error('Error fetching pending applications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get application for review
router.get('/applications/:id', requireAuth, async (req, res) => {
    try {
        if (req.user.role !== 'employee') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const application = await Application.findById(req.params.id)
            .populate('advertisement', 'productName description budget requirements')
            .populate('agency', 'fullname agencyName email phone')
            .populate('client', 'fullname company email')
            .populate('employeeReview.reviewedBy', 'username');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.json(application);
    } catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit employee review
router.post('/applications/:id/review', requireAuth, async (req, res) => {
    try {
        if (req.user.role !== 'employee') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { budgetApproved, proposalQuality, portfolioQuality, notes, decision } = req.body;

        if (!decision) {
            return res.status(400).json({ message: 'Decision is required' });
        }

        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (application.status !== 'employee_review') {
            return res.status(400).json({ message: 'Application is not in employee review status' });
        }

        // Update application with employee review
        application.employeeReview = {
            reviewedBy: req.user.userId,
            reviewedAt: new Date(),
            budgetApproved,
            proposalQuality,
            portfolioQuality,
            notes,
            decision
        };

        // Update status based on decision
        if (decision === 'approve') {
            application.status = 'client_review';
        } else {
            application.status = 'rejected';
        }

        await application.save();

        res.json({ 
            message: `Application ${decision === 'approve' ? 'approved and sent to client' : 'rejected'}`,
            application 
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get employee profile
router.get('/profile', requireAuth, async (req, res) => {
    try {
        if (req.user.role !== 'employee') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const employee = await Employee.findOne({ userId: req.user.userId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        res.json(employee);
    } catch (error) {
        console.error('Error fetching employee profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
