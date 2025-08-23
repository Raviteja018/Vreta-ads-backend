const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  productDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  targetAudience: {
    type: String,
    trim: true,
    maxlength: 200
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  campaignDuration: {
    type: String,
    required: true,
    enum: ['1 week', '2 weeks', '1 month', '3 months', '6 months', '1 year']
  },
  category: {
    type: String,
    required: true,
    enum: ['fashion', 'electronics', 'health', 'food', 'travel', 'beauty', 'home', 'sports', 'education', 'finance', 'automotive', 'other']
  },
  keyFeatures: [{
    type: String,
    trim: true
  }],
  imageUrl: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: 'draft',
    enum: ['draft', 'active', 'paused', 'completed']
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }]
}, { timestamps: true });

const Advertisement = mongoose.models.Advertisement || mongoose.model('Advertisement', advertisementSchema);

module.exports = Advertisement;
