# Employee Review System for Vreta Ads

## Overview

The Employee Review System implements a three-tier approval process for advertising applications, ensuring quality control and proper budget validation before applications reach clients.

## New Application Flow

### Before (Old System)
```
Agency → Client (Direct)
```

### After (New System)
```
Agency → Employee (Review/Approve) → Client (Select/Reject)
```

## Application Status Flow

1. **`employee_review`** (Default) - Application submitted, awaiting employee review
2. **`client_review`** - Employee approved, visible to client for review
3. **`approved`** - Client accepted the application
4. **`rejected`** - Either employee or client rejected
5. **`completed`** - Project completed

## Database Schema Changes

### Application Model Updates

```javascript
// New status enum
status: {
  type: String,
  default: 'employee_review',
  enum: ['employee_review', 'client_review', 'approved', 'rejected', 'completed']
}

// New employee review fields
employeeReview: {
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  budgetApproved: { type: Boolean, default: false },
  proposalQuality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
  portfolioQuality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
  notes: String,
  decision: { type: String, enum: ['approve', 'reject'] }
}

// New client review fields
clientReview: {
  reviewedAt: Date,
  decision: { type: String, enum: ['accepted', 'rejected'] },
  feedback: String
}
```

## API Endpoints

### New Application Routes

#### Employee Review
- `POST /applications/:id/employee-review` - Submit employee review
- **Body:** `{ budgetApproved, proposalQuality, portfolioQuality, notes, decision }`
- **Access:** Admin only

#### Client Review
- `POST /applications/:id/client-review` - Submit client decision
- **Body:** `{ decision, feedback }`
- **Access:** Client (owner of advertisement)

### New Admin Routes

- `GET /admin/applications/pending-review` - Get applications awaiting review
- `GET /admin/applications/:id/review` - Get application details for review
- `POST /admin/applications/:id/review` - Submit employee review
- `GET /admin/applications/stats` - Get application statistics

## Frontend Components

### EmployeeReviewModal
- **Purpose:** Admin interface for reviewing applications
- **Features:**
  - Budget approval toggle
  - Quality ratings (proposal & portfolio)
  - Review notes
  - Approve/Reject decision

### Updated ClientDashboard
- **New Features:**
  - Employee review information display
  - Status-based action buttons
  - Client review interface for approved applications

### Updated AdminDashboard
- **New Tab:** "Pending Reviews"
- **Features:**
  - List of applications awaiting review
  - Quick access to review modal
  - Application statistics

## User Experience Flow

### For Agencies
1. Submit application → Status: `employee_review`
2. Wait for employee review
3. Receive notification of approval/rejection
4. If approved, wait for client decision

### For Employees (Admins)
1. View pending applications in "Pending Reviews" tab
2. Click review button to open detailed review modal
3. Assess budget, proposal quality, portfolio quality
4. Add review notes
5. Approve (send to client) or reject

### For Clients
1. Only see applications that passed employee review
2. Applications appear in "Applications Received" tab
3. Can accept or reject approved applications
4. Provide feedback on decisions

## Security & Access Control

- **Employee Review:** Admin role required
- **Client Review:** Only advertisement owner can review
- **Status Updates:** Proper validation prevents unauthorized changes
- **Data Integrity:** All review actions are logged with timestamps

## Benefits

1. **Quality Control:** Applications are vetted before reaching clients
2. **Budget Validation:** Employee ensures budget is reasonable
3. **Portfolio Assessment:** Professional evaluation of agency capabilities
4. **Client Protection:** Clients only see pre-approved applications
5. **Audit Trail:** Complete review history for compliance

## Migration Notes

- Existing applications with `pending` status will need to be updated
- New applications automatically use `employee_review` status
- Backward compatibility maintained for existing endpoints

## Testing

The system has been tested with:
- ✅ Model validation
- ✅ Status enum validation
- ✅ Frontend build process
- ✅ Backend syntax validation

## Future Enhancements

- Email notifications for status changes
- Review templates and standardized criteria
- Automated quality scoring
- Review performance analytics
- Bulk review operations
