const db = require("../config/database");

// Получить профиль пользователя
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      "SELECT id, username, email, full_name, bio, avatar_url, is_verified, created_at FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Получить свой профиль
exports.getMyProfile = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username, email, full_name, bio, avatar_url, is_verified, email_verified, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get my profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Обновить профиль
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, bio, avatar_url } = req.body;

    const result = await db.query(
      "UPDATE users SET full_name = COALESCE($1, full_name), bio = COALESCE($2, bio), avatar_url = COALESCE($3, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, username, email, full_name, bio, avatar_url",
      [full_name, bio, avatar_url, req.user.id]
    );

    res.json({ message: "Profile updated", user: result.rows[0] });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Получить посты пользователя
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      posts: result.rows,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Получить сохраненные посты
exports.getSavedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
       FROM saved_posts sp
       JOIN posts p ON sp.post_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE sp.user_id = $1
       ORDER BY sp.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json({
      posts: result.rows,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get saved posts error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Статистика профиля
exports.getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM posts WHERE user_id = $1) as posts_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count`,
      [userId]
    );

    res.json(stats.rows[0]);
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Добавь в конец файла
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const avatar_url = req.file.path;

    const result = await db.query(
      "UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, full_name, bio, avatar_url",
      [avatar_url, req.user.id]
    );

    res.json({ message: "Avatar uploaded", user: result.rows[0] });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
