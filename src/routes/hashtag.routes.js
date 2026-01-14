const express = require("express");
const router = express.Router();
const searchController = require("../controllers/search.controller");

router.get("/:tag/posts", searchController.getPostsByHashtag);

module.exports = router;
