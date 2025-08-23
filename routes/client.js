const express = require("express");
const Client = require("../models/Client");
const clientRouter = express.Router();
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
dotenv.config();
const jwt = require("jsonwebtoken");

// Register a new client
clientRouter.post("/register", async (req, res, next) => {
  const { fullname, email, company, phone, companyAddress, password } =
    req.body;
  try {
    //checking existing user by email
    const existingClient = await Client.findOne({ email: email });
    if (existingClient) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newClient = new Client({
      fullname,
      email,
      company,
      phone,
      companyAddress,
      password: hashedPassword,
    });

    await newClient.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle duplicate key errors more gracefully
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      return res.status(400).json({ 
        message: `${field} '${value}' already exists`,
        field: field,
        value: value
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: errors 
      });
    }
    
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

module.exports = clientRouter;
