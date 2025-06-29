// controllers/messageController.js
const Message = require("../models/Message");

// Save private message
const savePrivateMessage = async (req, res) => {
  try {
    const { sender, receiver, content, time } = req.body;
    if (!sender || !receiver || !content) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const message = new Message({ sender, receiver, content, time });
    await message.save();

    res.status(201).json({ message: "Private message saved.", data: message });
  } catch (error) {
    res.status(500).json({ message: "Error saving private message.", error });
  }
};

// Get chat history between two users
const getPrivateMessages = async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort("time");

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to get messages", error: err });
  }
};

module.exports = {
  savePrivateMessage,
  getPrivateMessages,
};
