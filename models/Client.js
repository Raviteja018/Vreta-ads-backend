const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, 'Full name is required'],
    minlength: 3,
    maxlength: 50,
    trim: true,
    // No unique constraint - multiple people can have the same name
  },
  email: {
    type: String,
    required: true,
    match: [/.+\@.+\..+/, 'Enter a valid email'],
    lowercase: true,
    trim: true,
    unique: true,
    index: true, // Explicitly create index for email
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
  role: {
    type: String,
    default: 'client',
    enum: ['client'],
    required: true,
  },
}, { timestamps: true });

const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);

module.exports = Client;
