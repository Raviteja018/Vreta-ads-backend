const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, 'Full name is required'],
    minlength: 3,
    maxlength: 50,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    match: [/.+\@.+\..+/, 'Enter a valid email'],
    lowercase: true,
    trim: true,
    unique: true,
  },
  company: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^[6-9]\d{9}$/.test(v),
      message: (props) => `${props.value} is not a valid Indian phone number`,
    },
  },
  companyAddress: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 100,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 1024, // increase to handle hashed passwords
    trim: true,
  },
}, { timestamps: true });

const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);

module.exports = Client;
