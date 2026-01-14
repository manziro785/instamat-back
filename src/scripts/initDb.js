const db = require("../config/database");
const fs = require("fs");
const path = require("path");

const initDatabase = async () => {
  try {
    console.log("🔄 Initializing database...");

    const sql = fs.readFileSync(
      path.join(__dirname, "../models/schema.sql"),
      "utf8"
    );

    await db.query(sql);

    console.log("✅ Database initialized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    process.exit(1);
  }
};

initDatabase();
