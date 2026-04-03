const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const placeRoutes = require('./routes/placeRoutes');

// Initialize app wrapper
const app = express();

// Define port
const PORT = 5000;

// Connect to MongoDB
connectDB();

// Middleware
// Enable Cross-Origin Resource Sharing
app.use(cors()); 
// Parse incoming JSON requests
app.use(express.json());

// Main Routes
app.use('/places', placeRoutes);

// Base route test
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Run server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
