require("dotenv").config();
const apiRoutes = require("./routes/r-api/apiRoutes");
const express = require("express");
const path = require("path");
const routes = require("./routes");

const app = express();

// Set custom views directory
app.set("views", path.join(__dirname, "public/view"));

// Set the view engine to EJS
app.set("view engine", "ejs");

// Serve static files
app.use(express.static("public"));

// Middleware to set base_url globally
app.use((req, res, next) => {
  res.locals.base_url = process.env.BASE_URL; // For EJS templates
  req.base_url = process.env.BASE_URL; // For routes
  next();
});

// Use general routes
app.use("/", routes);

// Use API routes
app.use("/api", apiRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Base URL is set to ${process.env.BASE_URL}`);
});
