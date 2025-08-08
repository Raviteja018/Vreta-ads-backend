const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const bcrypt = require('bcryptjs');
const User = require("../models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({role:'admin'});
    if(existingAdmin){
        console.log('Admin user already exists');
        return;
    }

    const hashedPassword = await bcrypt.hash(process.env.PASSWORD, 10);

    const adminUser = new User({
        username : 'Avinash',
        password : hashedPassword,
        role : 'admin'
    });

    await adminUser.save();
    console.log('🎉 Admin user seeded successfully');

    process.exit();
  } catch (err) {
    console.error('❌ Error seeding admin:', err.message);
    process.exit(1);  //If DB fails to connect, stopping the server is often better than running a broken app.
  }
};

seedAdmin();







