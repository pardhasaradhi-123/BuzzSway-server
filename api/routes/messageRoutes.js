// routes/messageRoutes.js
const express = require("express");
const router = express.Router();
const {
  savePrivateMessage,
  getPrivateMessages,
} = require("../controllers/messageController");

// @route   POST /api/messages/private
router.post("/private", savePrivateMessage);

// ✅ New
router.get("/private/:user1/:user2", getPrivateMessages);

module.exports = router;
