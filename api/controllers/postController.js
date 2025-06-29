const User = require("../models/User");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// get all users posts
const getAllPosts = async (req, res) => {
  try {
    const users = await User.find().select("posts username").lean();

    const allPosts = [];

    users.forEach((user) => {
      user.posts?.forEach((post) => {
        allPosts.push({
          ...post,
          user: {
            _id: user._id,
            username: user.username,
          },
        });
      });
    });

    // Sort newest to oldest
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(allPosts);
  } catch (err) {
    console.error("Failed to fetch posts:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Existing: getUserPosts
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).lean(); // lean gives raw JS object
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.posts || user.posts.length === 0) {
      return res.status(200).json({ message: "No posts yet", posts: [] });
    }

    // ✅ Fetch usernames for each comment
    const populatedPosts = await Promise.all(
      user.posts.map(async (post) => {
        const populatedComments = await Promise.all(
          (post.comments || []).map(async (comment) => {
            const commenter = await User.findById(comment.postedBy).select(
              "username"
            );
            return {
              ...comment,
              postedBy: {
                _id: commenter?._id,
                username: commenter?.username || "Unknown",
              },
            };
          })
        );
        return {
          ...post,
          comments: populatedComments,
        };
      })
    );

    res.status(200).json(populatedPosts);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const createPost = async (req, res) => {
  try {
    const { userId } = req.params;
    const caption = req.body.caption || "";
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Media file is required" });
    }

    const mediaPath = `/uploads/${file.filename}`; // ✅ Store correct path

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.posts.unshift({ image: mediaPath, caption }); // using `image` for both image/video
    await user.save();

    res.status(201).json({ message: "Post uploaded successfully" });
  } catch (err) {
    console.error("Post creation failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const deletePost = async (req, res) => {
  const { userId, postId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const postIndex = user.posts.findIndex((p) => p._id.toString() === postId);
    if (postIndex === -1)
      return res.status(404).json({ error: "Post not found" });

    // ✅ Get image path from post
    const imagePath = user.posts[postIndex].image;

    // ✅ Convert relative path to absolute path correctly
    const absoluteImagePath = path.resolve(__dirname, "..", "..", imagePath);

    // ✅ Delete the image from file system
    fs.unlink(absoluteImagePath, (err) => {
      if (err) {
        console.error("Image deletion failed:", err.message);
        // You might still want to continue deletion
      }
    });

    // ✅ Remove post from user's posts array
    user.posts.splice(postIndex, 1);
    await user.save();

    res.status(200).json({ message: "Post and image deleted successfully" });
  } catch (err) {
    console.error("Post deletion failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const likePost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  try {
    const user = await User.findOne({ "posts._id": postId });

    if (!user) return res.status(404).json({ message: "Post not found" });

    const post = user.posts.id(postId);
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await user.save();
    res.status(200).json({ message: alreadyLiked ? "Unliked" : "Liked" });
  } catch (err) {
    console.error("Error liking post", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Comment on Post
const commentOnPost = async (req, res) => {
  const { postId } = req.params;
  const { userId, text } = req.body;

  if (!text) return res.status(400).json({ error: "Comment text required" });

  try {
    const user = await User.findOne({ "posts._id": postId });

    if (!user) return res.status(404).json({ message: "Post not found" });

    const post = user.posts.id(postId);

    const newComment = {
      text,
      postedBy: new mongoose.Types.ObjectId(userId),
      createdAt: new Date(),
    };

    post.comments.push(newComment);

    await user.save();

    res.status(201).json({ message: "Comment added", comment: newComment });
  } catch (err) {
    console.error("Error adding comment", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteCommentFromPost = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId } = req.body;

    const user = await User.findOne({ "posts._id": postId });
    if (!user) return res.status(404).json({ message: "Post not found" });

    const post = user.posts.id(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Optional: Check if user is the owner of the comment
    if (comment.postedBy.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Remove comment
    post.comments.pull(commentId);

    await user.save();

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllPosts,
  getUserPosts,
  createPost,
  deletePost,
  commentOnPost,
  likePost,
  deleteCommentFromPost,
};
