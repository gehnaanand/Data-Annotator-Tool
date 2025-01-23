const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const routes = require("./routes/route");
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();

const assembledImagesDir = `assembled-images`;

// Middleware
app.use(cors());
app.use(express.json());
app.use(multer().single("zipFile"));
app.use('/assembled-images', express.static(path.join(__dirname, `${assembledImagesDir}`)));

app.use('/auth', authRoutes);
app.use("/api", routes);

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${process.env.SERVER_PORT}`);
});