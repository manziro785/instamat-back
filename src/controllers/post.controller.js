const db = require("../config/database");

// Создать пост
exports.createPost = async (req, res) => {
  try {
    const { caption, image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: "Image is required" });
    }

    const result = await db.query(
      "INSERT INTO posts (user_id, caption, image_url) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, caption, image_url]
    );

    // Извлечь хештеги
    if (caption) {
      const hashtags = caption.match(/#[\wа-яА-Я]+/g);
      if (hashtags) {
        for (let tag of hashtags) {
          const cleanTag = tag.slice(1).toLowerCase();
          const hashtagResult = await db.query(
            "INSERT INTO hashtags (tag) VALUES ($1) ON CONFLICT (tag) DO UPDATE SET tag = $1 RETURNING id",
            [cleanTag]
          );
          await db.query(
            "INSERT INTO post_hashtags (post_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [result.rows[0].id, hashtagResult.rows[0].id]
          );
        }
      }
    }

    res.status(201).json({ message: "Post created", post: result.rows[0] });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Получить пост
exports.getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await db.query(
      `SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $2) as is_liked,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = $2) as is_saved
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [postId, req.user?.id || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Обновить пост
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { caption } = req.body;

    // Проверка владельца
    const checkOwner = await db.query(
      "SELECT user_id FROM posts WHERE id = $1",
      [postId]
    );
    if (checkOwner.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (checkOwner.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const result = await db.query(
      "UPDATE posts SET caption = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [caption, postId]
    );

    res.json({ message: "Post updated", post: result.rows[0] });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Удалить пост
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const checkOwner = await db.query(
      "SELECT user_id FROM posts WHERE id = $1",
      [postId]
    );
    if (checkOwner.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (checkOwner.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await db.query("DELETE FROM posts WHERE id = $1", [postId]);
    res.json({ message: "Post deleted" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Лента постов
exports.getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20, cursor } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as is_liked,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = $1) as is_saved
      FROM posts p
      JOIN users u ON p.user_id = u.id
    `;

    let params = [req.user?.id || null];

    if (cursor) {
      query += " WHERE p.id < $2";
      params.push(cursor);
    }

    query +=
      " ORDER BY p.created_at DESC LIMIT $" +
      (params.length + 1) +
      " OFFSET $" +
      (params.length + 2);
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      posts: result.rows,
      page: parseInt(page),
      limit: parseInt(limit),
      nextCursor:
        result.rows.length > 0 ? result.rows[result.rows.length - 1].id : null,
    });
  } catch (error) {
    console.error("Get feed error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Лайкнуть пост
exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;

    await db.query(
      "INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [postId, req.user.id]
    );

    res.json({ message: "Post liked" });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Убрать лайк
exports.unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;

    await db.query(
      "DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, req.user.id]
    );

    res.json({ message: "Post unliked" });
  } catch (error) {
    console.error("Unlike post error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Сохранить пост
exports.savePost = async (req, res) => {
  try {
    const { postId } = req.params;

    await db.query(
      "INSERT INTO saved_posts (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [postId, req.user.id]
    );

    res.json({ message: "Post saved" });
  } catch (error) {
    console.error("Save post error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Удалить из сохраненных
exports.unsavePost = async (req, res) => {
  try {
    const { postId } = req.params;

    await db.query(
      "DELETE FROM saved_posts WHERE post_id = $1 AND user_id = $2",
      [postId, req.user.id]
    );

    res.json({ message: "Post unsaved" });
  } catch (error) {
    console.error("Unsave post error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
