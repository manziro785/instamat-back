const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const commentController = require("../controllers/comment.controller");
const auth = require("../middleware/auth");

router.post("/", auth, postController.createPost);
router.get("/feed", postController.getFeed);
router.get("/:postId", postController.getPost);
router.put("/:postId", auth, postController.updatePost);
router.delete("/:postId", auth, postController.deletePost);

router.post("/:postId/like", auth, postController.likePost);
router.delete("/:postId/like", auth, postController.unlikePost);
router.post("/:postId/save", auth, postController.savePost);
router.delete("/:postId/save", auth, postController.unsavePost);

// Комментарии
router.post("/:postId/comments", auth, commentController.addComment);
router.get("/:postId/comments", commentController.getPostComments);

module.exports = router;
