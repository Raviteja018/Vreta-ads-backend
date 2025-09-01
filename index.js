const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRouter = require("./routes/auth");
dotenv.config();
const cors = require('cors');
const clientRouter = require("./routes/client");
const agencyRouter = require("./routes/agency");

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
})); 

app.use(express.json())
app.use('/api', authRouter);
app.use('/api/client', clientRouter);
app.use('/api/agency', agencyRouter);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/employee', require('./routes/employee'));
app.use('/api/advertisements', require('./routes/advertisement'));
app.use('/api/applications', require('./routes/application'));

const PORT = process.env.PORT;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server is running on PORT: ${PORT}`);
  });
});














