const db = require("../config/database");

// Добавить комментарий
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const result = await db.query(
      `INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) 
       RETURNING *, (SELECT username FROM users WHERE id = $2) as username,
       (SELECT avatar_url FROM users WHERE id = $2) as avatar_url`,
      [postId, req.user.id, content]
    );

    res.status(201).json({ message: "Comment added", comment: result.rows[0] });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Получить комментарии к посту
exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT c.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );

    res.json({
      comments: result.rows,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Получить комментарий
exports.getComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const result = await db.query(
      `SELECT c.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [commentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get comment error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Удалить комментарий
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const checkOwner = await db.query(
      "SELECT user_id FROM comments WHERE id = $1",
      [commentId]
    );
    if (checkOwner.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }
    if (checkOwner.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await db.query("DELETE FROM comments WHERE id = $1", [commentId]);
    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Лайкнуть комментарий
exports.likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    await db.query(
      "INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [commentId, req.user.id]
    );

    res.json({ message: "Comment liked" });
  } catch (error) {
    console.error("Like comment error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Убрать лайк с комментария
exports.unlikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    await db.query(
      "DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2",
      [commentId, req.user.id]
    );

    res.json({ message: "Comment unliked" });
  } catch (error) {
    console.error("Unlike comment error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
