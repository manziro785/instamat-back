const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

// Регистрация
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Валидация
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide all required fields" });
    }

    // Проверка существования пользователя
    const userExists = await db.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Создание пользователя
    const result = await db.query(
      "INSERT INTO users (username, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name, created_at",
      [username, email, hashedPassword, full_name || null]
    );

    const user = result.rows[0];

    // Создание токена
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Логин
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide email and password" });
    }

    // Поиск пользователя
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Создание токена
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Google OAuth
exports.googleAuth = async (req, res) => {
  try {
    const { email, username, googleId, picture } = req.body;

    // Валидация
    if (!email || !googleId) {
      return res.status(400).json({ error: "Email and googleId are required" });
    }

    // Проверяем существует ли пользователь с таким email
    let userResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    let user;

    if (userResult.rows.length > 0) {
      // Пользователь существует - обновляем данные если нужно
      user = userResult.rows[0];

      // Обновляем аватар если его нет, но есть от Google
      if (!user.avatar_url && picture) {
        await db.query("UPDATE users SET avatar_url = $1 WHERE id = $2", [
          picture,
          user.id,
        ]);
        user.avatar_url = picture;
      }
    } else {
      // Создаем нового пользователя
      // Генерируем уникальный username если не передан
      let finalUsername = username || email.split("@")[0];

      // Проверяем уникальность username
      const usernameCheck = await db.query(
        "SELECT username FROM users WHERE username = $1",
        [finalUsername]
      );

      if (usernameCheck.rows.length > 0) {
        // Добавляем случайные цифры к username
        finalUsername = `${finalUsername}${Math.floor(Math.random() * 10000)}`;
      }

      // Создаем пользователя (без пароля, так как OAuth)
      const createResult = await db.query(
        `INSERT INTO users (username, email, password, full_name, avatar_url, email_verified) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, username, email, full_name, avatar_url, email_verified, created_at`,
        [
          finalUsername,
          email,
          "google_oauth_" + googleId, // Храним googleId как "пароль"
          username || finalUsername,
          picture || null,
          true, // Google email уже верифицирован
        ]
      );

      user = createResult.rows[0];
    }

    // Создание токена
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.json({
      message: "Google authentication successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        email_verified: user.email_verified,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Logout (клиент просто удаляет токен)
exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};
