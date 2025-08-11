const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
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
  agencyName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
    trim: true,
  },
  phone: {
    type: String, // ✅ make it string, same reason as in Client
    required: true,
    validate: {
      validator: (v) => /^[6-9]\d{9}$/.test(v),
      message: (props) => `${props.value} is not a valid Indian phone number`,
    },
  },
  agencyAddress: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 100,
    trim: true,
  },
  agencyWebsite: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 1024,
    trim: true,
  },
}, { timestamps: true });

const Agency = mongoose.models.Agency || mongoose.model('Agency', agencySchema);

module.exports = Agency;
