// controllers/userController.js
const User = require("../models/User");

// GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // exclude passwords
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err });
  }
};

// GET /api/users/me
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to get user profile", error: err });
  }
};

const searchUsers = async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      username: { $regex: query, $options: "i" },
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("User search error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUsersByID = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};

// GET /api/users/messaged
const getMessagedUsers = async (req, res) => {
  try {
    const userId = req.userId;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    const usernames = new Set();
    for (const msg of messages) {
      if (msg.senderId.toString() !== userId.toString())
        usernames.add(msg.senderUsername);
      if (msg.receiverId.toString() !== userId.toString())
        usernames.add(msg.receiverUsername);
    }

    res.json({ users: Array.from(usernames) });
  } catch (err) {
    console.error("Failed to fetch messaged users:", err);
    res.status(500).json({ message: "Failed to fetch messaged users" });
  }
};

// PUT /api/users/edit
const updateProfile = async (req, res) => {
  try {
    const { username, email, bio } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.userId,
      { username, email, bio },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json(updated);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// POST /api/users/:id/follow
const followUser = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const targetUserId = req.params.id;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = targetUser.followers.includes(currentUserId);

    if (isFollowing) {
      // Unfollow
      targetUser.followers.pull(currentUserId);
      currentUser.following.pull(targetUserId);
      await targetUser.save();
      await currentUser.save();
      return res.json({ followed: false });
    } else {
      // Follow
      targetUser.followers.push(currentUserId);
      currentUser.following.push(targetUserId);
      await targetUser.save();
      await currentUser.save();
      return res.json({ followed: true });
    }
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};

const getFolowingUsers = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate(
      "following",
      "username"
    );
    const followingUsernames = user.following.map((u) => u.username);
    res.json({ users: followingUsernames });
  } catch (error) {
    console.error("Error fetching following users:", error);
    res.status(500).json({ message: "Failed to get following users" });
  }
};

const getMessagedFollowers = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).populate("followers", "username");

    // Get followers
    const followers = user.followers;

    // Find usernames who sent a message to this user
    const messages = await Message.find({ recipient: user.username }).distinct(
      "sender"
    );

    // Return only followers who messaged
    const filtered = followers
      .filter((f) => messages.includes(f.username))
      .map((f) => f.username);

    return res.json({ users: filtered });
  } catch (err) {
    console.error("Error in getMessagedFollowers:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllUsers,
  getUserProfile,
  searchUsers,
  getUsersByID,
  getMessagedUsers,
  updateProfile,
  followUser,
  getFolowingUsers,
  getMessagedFollowers,
};
