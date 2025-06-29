const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserProfile,
  searchUsers,
  getUsersByID,
  getMessagedUsers,
  updateProfile,
  followUser,
  getMessagedFollowers,
  getFolowingUsers,
} = require("../controllers/userController");
const verifyToken = require("../middleware/verifyToken");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User"); // ✅ Fix 1

router.get("/following", authMiddleware, getFolowingUsers);

// routes/user.js
router.get("/followers/messaged", authMiddleware, getMessagedFollowers);

// Get all users (for chat lists, etc.)
router.get("/", verifyToken, getAllUsers);

// Search users
router.get("/search", verifyToken, searchUsers); // ✅ Fix 2

// Get user by ID
router.get("/:id", getUsersByID);

// Get logged-in user profile
router.get("/me", verifyToken, getUserProfile);

router.get("/messaged", verifyToken, getMessagedUsers); // GET /api/users/messaged

router.put("/edit", verifyToken, updateProfile);

router.post("/:id/follow", authMiddleware, followUser);

module.exports = router;
