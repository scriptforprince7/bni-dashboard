require('dotenv').config(); // Load environment variables from .env file
const apiRoutes = require('./routes/r-api/apiRoutes'); // Adjust the path as needed
const express = require('express');
const path = require('path');
const routes = require('./routes'); // Import all routes from index.js

const app = express();

// Set custom views directory
app.set('views', path.join(__dirname, 'public/view'));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files like CSS or images from the 'public' directory
app.use(express.static('public'));

// Use the consolidated routes
app.use('/', routes); // All routes are prefixed with /api

app.use('/api', apiRoutes); // This will handle routes starting with /api

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
