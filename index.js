const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const initializeSocket = require("./socket");
const cookieParser = require("cookie-parser");
const path = require("path"); // ✅ Needed to resolve absolute path

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Init app
const app = express();
const server = http.createServer(app);

// CORS config
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL, // ✅ Netlify or local frontend URL from .env
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static uploads folder correctly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const authRoutes = require("./api/routes/authRoutes");
const messageRoutes = require("./api/routes/messageRoutes");
const userRoutes = require("./api/routes/userRoutes");
const postRoutes = require("./api/routes/postRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

// ✅ Multer error handler
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File is too large. Maximum allowed size is 100MB.",
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }

  return res
    .status(500)
    .json({ message: "Something went wrong", error: err.message });
});

// WebSocket
initializeSocket(server);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
