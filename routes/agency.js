const express = require("express");
const Agency = require("../models/Agency");
const agencyRouter = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken')

//register
agencyRouter.post("/register", async (req, res) => {
  const {
    fullname,
    email,
    agencyName,
    phone,
    agencyAddress,
    agencyWebsite,
    password,
  } = req.body;
  try {
    //validate input
    if (
      !fullname ||
      !email ||
      !agencyName ||
      !phone ||
      !agencyAddress ||
      !password
    ) {
      return res.status(400).json({ message: "fields should not be empty" });
    }

    //Check existing Agency
    const agency = await Agency.findOne({ email: email });
    if (agency) {
      return res.status(500).json({ message: "agency already exists" });
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAgency = new Agency({
      fullname,
      email,
      agencyName,
      phone,
      agencyAddress,
      agencyWebsite,
      password: hashedPassword,
    });

    await newAgency.save();
    res.status(201).json({ message: "Agency registration successfully" });
  } catch (err) {
    res.status(400).json({ message: "Server Error", error: err.message });
  }
});


module.exports = agencyRouter;
