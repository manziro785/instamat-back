const db = require("../config/database");

// Поиск пользователей
const db = require("../config/database");

// Простой поиск пользователей
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.json({ users: [] });
    }

    const searchTerm = q.trim();

    const result = await db.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio, u.is_verified,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) as is_following
       FROM users u
       WHERE 
         LOWER(u.username) LIKE LOWER($2)
         OR LOWER(u.full_name) LIKE LOWER($2)
       ORDER BY followers_count DESC
       LIMIT 20`,
      [req.user?.id || null, `%${searchTerm}%`]
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Остальные методы оставь как есть или удали
exports.searchPosts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.json({ posts: [] });
    }

    const result = await db.query(
      `SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.caption ILIKE $1
       ORDER BY p.created_at DESC
       LIMIT 20`,
      [`%${q}%`]
    );

    res.json({ posts: result.rows });
  } catch (error) {
    console.error("Search posts error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.searchHashtags = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.json({ hashtags: [] });
    }

    const searchTerm = q.replace("#", "").trim();

    const result = await db.query(
      `SELECT h.*, COUNT(ph.post_id) as posts_count
       FROM hashtags h
       LEFT JOIN post_hashtags ph ON h.id = ph.hashtag_id
       WHERE h.tag ILIKE $1
       GROUP BY h.id
       ORDER BY posts_count DESC
       LIMIT 20`,
      [`%${searchTerm}%`]
    );

    res.json({ hashtags: result.rows });
  } catch (error) {
    console.error("Search hashtags error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getPostsByHashtag = async (req, res) => {
  try {
    const { tag } = req.params;

    const result = await db.query(
      `SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       JOIN post_hashtags ph ON p.id = ph.post_id
       JOIN hashtags h ON ph.hashtag_id = h.id
       WHERE h.tag = $1
       ORDER BY p.created_at DESC
       LIMIT 20`,
      [tag.toLowerCase()]
    );

    res.json({ posts: result.rows, tag });
  } catch (error) {
    console.error("Get posts by hashtag error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Поиск постов
exports.searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!q || q.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }

    const result = await db.query(
      `SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.caption ILIKE $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [`%${q}%`, limit, offset]
    );

    res.json({
      posts: result.rows,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Search posts error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Поиск хэштегов
exports.searchHashtags = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!q || q.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }

    const result = await db.query(
      `SELECT h.*, COUNT(ph.post_id) as posts_count
       FROM hashtags h
       LEFT JOIN post_hashtags ph ON h.id = ph.hashtag_id
       WHERE h.tag ILIKE $1
       GROUP BY h.id
       ORDER BY posts_count DESC, h.tag
       LIMIT $2 OFFSET $3`,
      [`%${q}%`, limit, offset]
    );

    res.json({
      hashtags: result.rows,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Search hashtags error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Посты по хэштегу
exports.getPostsByHashtag = async (req, res) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       JOIN post_hashtags ph ON p.id = ph.post_id
       JOIN hashtags h ON ph.hashtag_id = h.id
       WHERE h.tag = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [tag.toLowerCase(), limit, offset]
    );

    res.json({
      posts: result.rows,
      tag,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get posts by hashtag error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
