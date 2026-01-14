const express = require("express");
const router = express.Router();
const searchController = require("../controllers/search.controller");

router.get("/users", searchController.searchUsers);
router.get("/posts", searchController.searchPosts);
router.get("/hashtags", searchController.searchHashtags);

module.exports = router;
