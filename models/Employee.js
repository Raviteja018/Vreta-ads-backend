const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    permissions: {
        canReviewApplications: {
            type: Boolean,
            default: true
        },
        canManageUsers: {
            type: Boolean,
            default: false
        },
        canViewAnalytics: {
            type: Boolean,
            default: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
employeeSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
