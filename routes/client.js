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
    //checking existing user
    const client = await Client.findOne({ email: email });
    if (client) {
      return res.status(500).json({ message: "user already exists" });
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
    res.status(400).json({ message: "Server Error", error: err.message });
  }
});

module.exports = clientRouter;
