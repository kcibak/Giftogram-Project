const mysql = require("mysql2/promise");

let pool;

function createDbPool() {
  const requiredEnv = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing required database env vars: ${missing.join(", ")}`);
  }

  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

function getDbPool() {
  if (!pool) {
    pool = createDbPool();
  }

  return pool;
}

async function checkDatabaseHealth() {
  const db = getDbPool();
  await db.query("SELECT 1 AS ok");

  return {
    status: "ok",
    database: "up",
  };
}

module.exports = {
  checkDatabaseHealth,
  getDbPool,
};
