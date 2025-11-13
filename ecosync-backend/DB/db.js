require('dotenv').config();
const mongoose = require('mongoose');

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB);
    console.log("MongoDB is connected");
  } catch (err) {
    console.log("Error connecting to MongoDB:", err);
  }
};

module.exports = connectDb;
