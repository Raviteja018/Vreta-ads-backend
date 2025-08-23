const express = require("express");
const Advertisement = require("../models/Advertisement");
const advertisementRouter = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

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

// Create new advertisement
advertisementRouter.post("/", authenticateToken, upload.single('productImage'), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request body type:", typeof req.body);
    console.log("Request body keys:", Object.keys(req.body || {}));
    console.log("Request file:", req.file);
    
    // For multipart/form-data, multer populates req.body with text fields
    const productName = req.body.productName;
    const productDescription = req.body.productDescription;
    const targetAudience = req.body.targetAudience;
    const budget = req.body.budget;
    const campaignDuration = req.body.campaignDuration;
    const category = req.body.category;
    const keyFeatures = req.body.keyFeatures;
    
    // Validate required fields
    if (!productName || !productDescription || !budget || !campaignDuration || !category) {
      return res.status(400).json({ 
        message: "Missing required fields",
        received: { productName, productDescription, budget, campaignDuration, category }
      });
    }

    // Handle keyFeatures array from form data
    let keyFeaturesArray = [];
    if (req.body.keyFeatures) {
      // Check if it's already an array or needs to be parsed
      if (Array.isArray(req.body.keyFeatures)) {
        keyFeaturesArray = req.body.keyFeatures;
      } else if (typeof req.body.keyFeatures === 'string') {
        // Handle comma-separated string
        keyFeaturesArray = req.body.keyFeatures.split(',').map(f => f.trim()).filter(f => f);
      } else {
        // Handle array-like format from form data
        const keys = Object.keys(req.body).filter(key => key.startsWith('keyFeatures['));
        if (keys.length > 0) {
          keys.sort().forEach(key => {
            const feature = req.body[key];
            if (feature && feature.trim()) {
              keyFeaturesArray.push(feature.trim());
            }
          });
        }
      }
    }

    const newAdvertisement = new Advertisement({
      productName,
      productDescription,
      targetAudience,
      budget: parseFloat(budget),
      campaignDuration,
      category,
      keyFeatures: keyFeaturesArray,
      client: req.user.id,
      status: 'draft'
    });

    const savedAdvertisement = await newAdvertisement.save();
    
    res.status(201).json({
      message: "Advertisement created successfully",
      data: savedAdvertisement
    });
  } catch (error) {
    console.error("Error creating advertisement:", error);
    res.status(500).json({ message: "Error creating advertisement", error: error.message });
  }
});

// Get public advertisements for agencies to browse
advertisementRouter.get("/public", async (req, res) => {
  try {
    console.log("=== GET /advertisements/public called ===");
    
    // Return active and paused advertisements for public browsing
    // Agencies should see both to understand current project status
    const advertisements = await Advertisement.find({ 
      status: { $in: ['active', 'paused'] } 
    })
      .populate('client', 'fullname company')
      .sort({ createdAt: -1 });
    
    console.log("Public advertisements found:", advertisements.length);
    console.log("Advertisement statuses:", advertisements.map(ad => ({ 
      id: ad._id, 
      name: ad.productName, 
      status: ad.status 
    })));
    
    res.json({
      message: "Public advertisements retrieved successfully",
      data: advertisements
    });
  } catch (error) {
    console.error("Error fetching public advertisements:", error);
    res.status(500).json({ message: "Error fetching public advertisements", error: error.message });
  }
});

// Get all advertisements (for browsing)
advertisementRouter.get("/", async (req, res) => {
  try {
    console.log("=== GET /advertisements called ===");
    
    // Get the authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log("Auth header:", authHeader);
    console.log("Token:", token ? "Present" : "Missing");
    
    if (token) {
      try {
        // If user is authenticated, return their advertisements regardless of status
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded token user ID:", decoded.id);
        console.log("Decoded token full data:", decoded);
        
        const advertisements = await Advertisement.find({ client: decoded.id })
          .populate('client', 'fullname company')
          .sort({ createdAt: -1 });
        
        console.log("Found advertisements for client:", advertisements.length);
        console.log("Advertisements:", advertisements);
        
        // Also check all advertisements to see what's in the database
        const allAds = await Advertisement.find({});
        console.log("All advertisements in DB:", allAds.length);
        allAds.forEach(ad => {
          console.log(`Ad ID: ${ad._id}, Client: ${ad.client}, Product: ${ad.productName}`);
        });
        
        res.json({
          message: "Client advertisements retrieved successfully",
          data: advertisements
        });
      } catch (jwtError) {
        console.log("JWT verification failed:", jwtError.message);
        // If token is invalid, return public active advertisements
        const advertisements = await Advertisement.find({ status: 'active' })
          .populate('client', 'fullname company')
          .sort({ createdAt: -1 });
        
        res.json({
          message: "Public advertisements retrieved successfully",
          data: advertisements
        });
      }
    } else {
      console.log("No token provided, returning public advertisements");
      // If no token, return public active advertisements
      const advertisements = await Advertisement.find({ status: 'active' })
        .populate('client', 'fullname company')
        .sort({ createdAt: -1 });
      
      res.json({
        message: "Public advertisements retrieved successfully",
        data: advertisements
      });
    }
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    res.status(500).json({ message: "Error fetching advertisements", error: error.message });
  }
});

// Get single advertisement by ID
advertisementRouter.get("/:id", async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id)
      .populate('client', 'fullname company');
    
    if (!advertisement) {
      return res.status(404).json({ message: "Advertisement not found" });
    }
    
    res.json({
      message: "Advertisement retrieved successfully",
      data: advertisement
    });
  } catch (error) {
    console.error("Error fetching advertisement:", error);
    res.status(500).json({ message: "Error fetching advertisement", error: error.message });
  }
});

// Update advertisement
advertisementRouter.put("/:id", authenticateToken, upload.single('productImage'), async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);
    
    if (!advertisement) {
      return res.status(404).json({ message: "Advertisement not found" });
    }
    
    // Check if user owns this advertisement
    if (advertisement.client.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this advertisement" });
    }
    
    // Handle keyFeatures array from form data
    let keyFeaturesArray = [];
    if (req.body.keyFeatures) {
      // Check if it's already an array or needs to be parsed
      if (Array.isArray(req.body.keyFeatures)) {
        keyFeaturesArray = req.body.keyFeatures;
      } else if (typeof req.body.keyFeatures === 'string') {
        // Handle comma-separated string
        keyFeaturesArray = req.body.keyFeatures.split(',').map(f => f.trim()).filter(f => f);
      } else {
        // Handle array-like format from form data
        const keys = Object.keys(req.body).filter(key => key.startsWith('keyFeatures['));
        if (keys.length > 0) {
          keys.sort().forEach(key => {
            const feature = req.body[key];
            if (feature && feature.trim()) {
              keyFeaturesArray.push(feature.trim());
            }
          });
        }
      }
    }
    
    // Create update object with processed keyFeatures
    const updateData = { ...req.body };
    if (keyFeaturesArray.length > 0) {
      updateData.keyFeatures = keyFeaturesArray;
    }
    
    const updatedAdvertisement = await Advertisement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      message: "Advertisement updated successfully",
      data: updatedAdvertisement
    });
  } catch (error) {
    console.error("Error updating advertisement:", error);
    res.status(500).json({ message: "Error updating advertisement", error: error.message });
  }
});

// Update advertisement status (draft to active, etc.)
advertisementRouter.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['draft', 'active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    const advertisement = await Advertisement.findById(req.params.id);
    
    if (!advertisement) {
      return res.status(404).json({ message: "Advertisement not found" });
    }
    
    // Check if user owns this advertisement
    if (advertisement.client.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this advertisement" });
    }
    
    const updatedAdvertisement = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    res.json({
      message: "Advertisement status updated successfully",
      data: updatedAdvertisement
    });
  } catch (error) {
    console.error("Error updating advertisement status:", error);
    res.status(500).json({ message: "Error updating advertisement status", error: error.message });
  }
});

// Delete advertisement
advertisementRouter.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);
    
    if (!advertisement) {
      return res.status(404).json({ message: "Advertisement not found" });
    }
    
    // Check if user owns this advertisement
    if (advertisement.client.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this advertisement" });
    }
    
    await Advertisement.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Advertisement deleted successfully" });
  } catch (error) {
    console.error("Error deleting advertisement:", error);
    res.status(500).json({ message: "Error deleting advertisement", error: error.message });
  }
});

module.exports = advertisementRouter;
