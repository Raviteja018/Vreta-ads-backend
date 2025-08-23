const express = require("express");
const User = require("../models/User");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Client = require("../models/Client");
const Agency = require("../models/Agency");

authRouter.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    //validate input
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "please provide email and password" });
    }

    //check user
    const user = await User.findOne({ username });

    const isMatch = user && (await bcrypt.compare(password, user.password));
    if (!isMatch) {
      res.status(500).json({ message: "Invalid credentials" });
      return;
    }

    //create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      token: token,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server error " + err.message });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Please provide email, password and role" });
    }
    let UserModel;
    if (role === "client") {
      UserModel = Client;
    } else if (role === "agency") {
      UserModel = Agency;
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    //checking user credentials are correct
    const user = await UserModel.findOne({ email });
    const isMatch = user && (await bcrypt.compare(password, user.password));

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    //create JWT Token
    const token = jwt.sign(
      { id: user._id, name: user.fullname, role: role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const responseData = {
      message: `${role} Login Successful`,
      id: user._id,
      name: user.fullname,
      role: role,
      token: token,
    };
    
    console.log("Backend sending response:", responseData);
    res.json(responseData);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error: " + err.message });
  }
});

module.exports = authRouter;
