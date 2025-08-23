const express = require("express");
const Application = require("../models/Application");
const applicationRouter = express.Router();
const jwt = require("jsonwebtoken");

// Create a separate router for refresh operations to avoid route conflicts
const refreshRouter = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Refresh all applications for an agency (to get updated advertisement statuses)
refreshRouter.get("/all-applications", authenticateToken, async (req, res) => {
  try {
    console.log("🔍 REFRESH-ALL-APPLICATIONS route hit!");
    // Get all applications for this agency with fresh advertisement data
    const refreshedApplications = await Application.find({ agency: req.user.id })
      .populate({
        path: 'advertisement',
        select: 'productName productDescription budget category status client',
        populate: {
          path: 'client',
          select: 'fullname company'
        }
      })
      .sort({ createdAt: -1 });
    
    console.log("Refreshed applications for agency:", req.user.id);
    console.log("Updated advertisement statuses:", refreshedApplications.map(app => ({
      id: app._id,
      adName: app.advertisement?.productName,
      adStatus: app.advertisement?.status,
      clientName: app.advertisement?.client?.fullname
    })));
    
    res.json({
      message: "All applications refreshed successfully",
      data: refreshedApplications
    });
  } catch (error) {
    console.error("Error refreshing applications:", error);
    res.status(500).json({ message: "Error refreshing applications", error: error.message });
  }
});

// Refresh application data (to get updated advertisement status)
refreshRouter.get("/:id", authenticateToken, async (req, res) => {
  try {
    console.log("🔍 REFRESH/:ID route hit with ID:", req.params.id);
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    // Check if user owns the application
    if (application.agency.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to access this application" });
    }
    
    // Re-populate with fresh advertisement data
    const refreshedApplication = await Application.findById(req.params.id)
      .populate({
        path: 'advertisement',
        select: 'productName productDescription budget category status client',
        populate: {
          path: 'client',
          select: 'fullname company'
        }
      });
    
    res.json({
      message: "Application refreshed successfully",
      data: refreshedApplication
    });
  } catch (error) {
    console.error("Error refreshing application:", error);
    res.status(500).json({ message: "Error refreshing application", error: error.message });
  }
});

// Create new application
applicationRouter.post("/", authenticateToken, async (req, res) => {
  try {
    const { advertisement, message, proposal, budget, timeline, portfolio } = req.body;
    
    // Validate required fields
    if (!advertisement) {
      return res.status(400).json({ message: "Advertisement ID is required" });
    }

    const newApplication = new Application({
      advertisement: advertisement,
      agency: req.user.id,
      message,
      proposal,
      budget: budget ? parseFloat(budget) : undefined,
      timeline,
      portfolio: portfolio || []
    });

    const savedApplication = await newApplication.save();
    
    // Populate the saved application for response
    const populatedApplication = await Application.findById(savedApplication._id)
      .populate('advertisement', 'productName productDescription budget category status')
      .populate('agency', 'name email company');
    
    res.status(201).json({
      message: "Application submitted successfully",
      data: populatedApplication
    });
  } catch (error) {
    console.error("Error creating application:", error);
    res.status(500).json({ message: "Error creating application", error: error.message });
  }
});

// Get applications by client (for client dashboard)
applicationRouter.get("/client", authenticateToken, async (req, res) => {
  try {
    // Find advertisements owned by this client
    const Advertisement = require('../models/Advertisement');
    const clientAdvertisements = await Advertisement.find({ client: req.user.id });
    const advertisementIds = clientAdvertisements.map(ad => ad._id);
    
    // Find applications for those advertisements
    const applications = await Application.find({ advertisement: { $in: advertisementIds } })
      .populate('advertisement', 'productName productDescription budget category status')
      .populate('agency', 'name email company')
      .sort({ createdAt: -1 });
    
    res.json({
      message: "Client applications retrieved successfully",
      data: applications
    });
  } catch (error) {
    console.error("Error fetching client applications:", error);
    res.status(500).json({ message: "Error fetching client applications", error: error.message });
  }
});

// Get applications by agency (for agency dashboard)
applicationRouter.get("/agency", authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find({ agency: req.user.id })
      .populate({
        path: 'advertisement',
        select: 'productName productDescription budget category status client',
        populate: {
          path: 'client',
          select: 'fullname company'
        }
      })
      .sort({ createdAt: -1 });
    
    console.log("Agency applications found:", applications.length);
    console.log("Application advertisement statuses:", applications.map(app => ({
      id: app._id,
      adName: app.advertisement?.productName,
      adStatus: app.advertisement?.status,
      clientName: app.advertisement?.client?.fullname
    })));
    
    res.json({
      message: "Agency applications retrieved successfully",
      data: applications
    });
  } catch (error) {
    console.error("Error fetching agency applications:", error);
    res.status(500).json({ message: "Error fetching agency applications", error: error.message });
  }
});

// Get applications by advertisement ID
applicationRouter.get("/advertisement/:adId", async (req, res) => {
  try {
    const applications = await Application.find({ advertisement: req.params.adId })
      .populate('agency', 'name email company')
      .sort({ createdAt: -1 });
    
    res.json({
      message: "Advertisement applications retrieved successfully",
      data: applications
    });
  } catch (error) {
    console.error("Error fetching advertisement applications:", error);
    res.status(500).json({ message: "Error fetching advertisement applications", error: error.message });
  }
});

// Get single application by ID
applicationRouter.get("/:id", async (req, res) => {
  try {
    // Validate that the ID parameter is a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid application ID format" });
    }
    
    const application = await Application.findById(req.params.id)
      .populate('advertisement', 'productName productDescription budget category status')
      .populate('agency', 'name email company');
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    res.json({
      message: "Application retrieved successfully",
      data: application
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ message: "Error fetching application", error: error.message });
  }
});

// Update application status
applicationRouter.patch("/:id", authenticateToken, async (req, res) => {
  try {
    // Validate that the ID parameter is a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid application ID format" });
    }
    
    const { status } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    // Check if user owns the advertisement (client) or the application (agency)
    const advertisement = await require('../models/Advertisement').findById(application.advertisement);
    if (!advertisement) {
      return res.status(404).json({ message: "Advertisement not found" });
    }
    
    if (advertisement.client.toString() !== req.user.id && application.agency.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this application" });
    }
    
    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    res.json({
      message: "Application status updated successfully",
      data: updatedApplication
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Error updating application status", error: error.message });
  }
});

// Delete application
applicationRouter.delete("/:id", authenticateToken, async (req, res) => {
  try {
    // Validate that the ID parameter is a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid application ID format" });
    }
    
    const application = await Application.findById(req.params.id);
    
    if (!application.id) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    // Check if user owns the application
    if (application.agency.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this application" });
    }
    
    await Application.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({ message: "Error deleting application", error: error.message });
  }
});

// Mount the refresh router on the main application router
applicationRouter.use("/refresh", refreshRouter);

module.exports = applicationRouter;
