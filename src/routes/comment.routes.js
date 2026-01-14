const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment.controller");
const auth = require("../middleware/auth");

router.get("/:commentId", commentController.getComment);
router.delete("/:commentId", auth, commentController.deleteComment);
router.post("/:commentId/like", auth, commentController.likeComment);
router.delete("/:commentId/like", auth, commentController.unlikeComment);

module.exports = router;
