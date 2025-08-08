const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, 'Full name is required'],
    minlength: [3, 'Full name must be at least 3 characters long'],
    maxlength: [50, 'Full name cannot exceed 50 characters'],
    trim: true,
    unique:true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/.+\@.+\..+/, 'Please enter a valid email address'],
    lowercase: true,
    trim: true,
    unique: true, // optional: ensures email is unique
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    minlength: 2,
    maxlength: 50,
    trim: true,
  },
  phone: {
    type: Number,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function (v) {
        return /^[6-9]\d{9}$/.test(v.toString());
      },
      message: (props) => `${props.value} is not a valid 10-digit Indian phone number`,
    },
  },
  companyAddress: {
    type: String,
    required: [true, 'Company address is required'],
    minlength: 5,
    maxlength: 100,
    trim: true,
  },
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
