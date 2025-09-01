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
    default: 'employee_review',
    enum: ['employee_review', 'client_review', 'approved', 'rejected', 'completed']
  },
  portfolio: [{
    title: String,
    description: String,
    url: String
  }],
  // Employee review fields
  employeeReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    budgetApproved: {
      type: Boolean,
      default: false
    },
    proposalQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'fair'
    },
    portfolioQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'fair'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    decision: {
      type: String,
      enum: ['approve', 'reject'],
      required: true
    }
  },
  // Client review fields
  clientReview: {
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['accepted', 'rejected'],
      required: false
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  }
}, { timestamps: true });

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

module.exports = Application;
