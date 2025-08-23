const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  advertisement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true
  },
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  proposal: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  budget: {
    type: Number,
    min: 0
  },
  timeline: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected', 'completed']
  },
  portfolio: [{
    title: String,
    description: String,
    url: String
  }]
}, { timestamps: true });

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

module.exports = Application;
