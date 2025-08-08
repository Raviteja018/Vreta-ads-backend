const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async() =>{
    try{
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log('✅ Database connection is established');
    }catch(err){
        console.error('❌ Error Connecting DB: '+ err.message);
        process.nextTick(1);
    }
}

module.exports = connectDB;









