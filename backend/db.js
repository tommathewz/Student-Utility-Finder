const mongoose = require('mongoose');

// Connect to MongoDB database
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/student_finder_db';
    await mongoose.connect(mongoURI);
    
    // Log success message if connected
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    // Log error message if connection fails
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1); // Exit process with failure
  }
};

// Export the connection function
module.exports = connectDB;
