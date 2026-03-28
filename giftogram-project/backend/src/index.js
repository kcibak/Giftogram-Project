require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");

const app = express();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

let db;

function connectWithRetry(retryCount = 0) {
  db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      const delayMs = Math.min(30000, 2000 * (retryCount + 1));
      console.error(`DB connection failed (attempt ${retryCount + 1}):`, err.message);
      console.log(`Retrying DB connection in ${delayMs / 1000}s...`);
      setTimeout(() => connectWithRetry(retryCount + 1), delayMs);
      return;
    }

    console.log("Connected to MySQL");
  });

  db.on("error", (err) => {
    if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
      console.warn("DB connection lost. Reconnecting...");
      connectWithRetry(0);
      return;
    }

    console.error("DB error:", err);
  });
}

connectWithRetry();

app.get("/", (req, res) => {
  res.json({ message: "API running" });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});