const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const followController = require("../controllers/follow.controller");
const auth = require("../middleware/auth");

router.get("/me", auth, userController.getMyProfile);
router.put("/me", auth, userController.updateProfile);
router.get("/:userId", userController.getUserProfile);
router.get("/:userId/posts", userController.getUserPosts);
router.get("/:userId/saved", auth, userController.getSavedPosts);
router.get("/:userId/stats", userController.getUserStats);

// Подписки
router.post("/:userId/follow", auth, followController.followUser);
router.delete("/:userId/follow", auth, followController.unfollowUser);
router.get("/:userId/followers", followController.getFollowers);
router.get("/:userId/following", followController.getFollowing);
router.get("/:userId/follow-status", auth, followController.getFollowStatus);

module.exports = router;
