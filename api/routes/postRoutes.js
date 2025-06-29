const express = require("express");
const router = express.Router();
const {
  getUserPosts,
  createPost,
  deletePost,
  likePost,
  commentOnPost,
  deleteCommentFromPost,
  getAllPosts,
} = require("../controllers/postController");
const upload = require("../middleware/upload");

router.get("/user/:userId", getUserPosts);
router.post("/:userId/create", upload.single("media"), createPost);
router.delete("/:userId/delete/:postId", deletePost); // ✅ New
router.post("/:postId/like", likePost);
router.post("/:postId/comment", commentOnPost);
router.delete("/:postId/comment/:commentId", deleteCommentFromPost);
router.get("/allPosts", getAllPosts);

module.exports = router;
