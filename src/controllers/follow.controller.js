const db = require("../config/database");

// Подписаться
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    await db.query(
      "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.user.id, userId]
    );

    res.json({ message: "User followed" });
  } catch (error) {
    console.error("Follow user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Отписаться
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await db.query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
      [req.user.id, userId]
    );

    res.json({ message: "User unfollowed" });
  } catch (error) {
    console.error("Unfollow user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Получить подписчиков
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) as is_following
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, req.user?.id || null, limit, offset]
    );

    res.json({
      followers: result.rows,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Получить подписки
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) as is_following
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, req.user?.id || null, limit, offset]
    );

    res.json({
      following: result.rows,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Проверить статус подписки
exports.getFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      "SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2) as is_following",
      [req.user.id, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get follow status error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
