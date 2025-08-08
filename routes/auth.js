const express = require("express");
const User = require("../models/User");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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
    // if (!user) {
    //   return res.status(400).json({ message: "Invalid credentials" });
    // }

    // //compare passwords
    // const enteredPassword = await bcrypt.compare(password, user.password);

    // if (!enteredPassword) {
    //   return res.status(400).json({ message: "Incorrect password" });
    // }

    const isMatch = user && await bcrypt.compare(password, user.password);
    if(!isMatch){
        res.status(500).json({message: 'Invalid credentials'})
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

module.exports = authRouter;
