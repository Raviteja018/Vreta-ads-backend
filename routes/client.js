const express = require("express");
const Client = require("../models/Client");
const clientRouter = express.Router();
const dotenv = require("dotenv");
dotenv.config();

clientRouter.post("/register/client", async(req, res) => {
    const {fullname, email, company, phone, companyAddress, password} = req.body;
    try {
        //checking existing user
        const client = await Client.findOne({email: email});
        if(client){
            return res.status(500).json({message:'user already exists'});
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
        })

        await newClient.save();

        res.status(201).json({message:'User registered successfully'});
    } catch (err) {
        res.status(400).json({message:'Server Error', error:err.message});
    }
})

clientRouter.post("/user/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    //validate input
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "please provide email and password" });
    }

    //checking user credentials are correct
    const client = await Client.findOne({ username: username });
    const isMatch = client && (await bcrypt.compare(password, client.password));

    if (!isMatch) {
      return res.status(500).json({ message: "Invalid credentials" });
    }

    //create JWT Token
    const token = jwt.sign(
      { id: client._id, role: client.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
        id:client._id,
        username:client.username,
        role:client.role,
        token:token
    })

  } catch (err) {
    res.status(500).json({message: 'Internal Server Error: '+err.message})
  }
});

module.exports = clientRouter;
