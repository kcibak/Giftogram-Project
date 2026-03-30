const { getDbPool } = require("../config/db");

function mapUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    publicId: row.public_id,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
  };
}

function mapUserSummaryRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    publicId: row.public_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
  };
}

function normalizePaginationValue(value, fallback) {
  const normalized = Number(value);

  if (!Number.isInteger(normalized) || normalized < 0) {
    return fallback;
  }

  return normalized;
}

function createUserRepository({ db = getDbPool() } = {}) {
  return {
    async createUser({ publicId, email, passwordHash, firstName, lastName }) {
      await db.execute(
        `INSERT INTO users (public_id, email, password_hash, first_name, last_name)
         VALUES (?, ?, ?, ?, ?)`,
        [publicId, email, passwordHash, firstName, lastName]
      );

      return {
        publicId,
        email,
        firstName,
        lastName,
      };
    },

    async findUserByEmail(email) {
      const [rows] = await db.execute(
        `SELECT id, public_id, email, password_hash, first_name, last_name
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email]
      );

      return mapUserRow(rows[0]);
    },

    async findUserByPublicId(publicId) {
      const [rows] = await db.execute(
        `SELECT id, public_id, email, password_hash, first_name, last_name
         FROM users
         WHERE public_id = ?
         LIMIT 1`,
        [publicId]
      );

      return mapUserRow(rows[0]);
    },

    async findUsersByPublicIds(publicIds) {
      if (!Array.isArray(publicIds) || publicIds.length === 0) {
        return [];
      }

      const placeholders = publicIds.map(() => "?").join(", ");
      const [rows] = await db.execute(
        `SELECT id, public_id, email, password_hash, first_name, last_name
         FROM users
         WHERE public_id IN (${placeholders})`,
        publicIds
      );

      return rows.map(mapUserRow);
    },

    async findUsersByIds(userIds) {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return [];
      }

      const placeholders = userIds.map(() => "?").join(", ");
      const [rows] = await db.execute(
        `SELECT id, public_id, email, password_hash, first_name, last_name
         FROM users
         WHERE id IN (${placeholders})`,
        userIds
      );

      return rows.map(mapUserRow);
    },

    async listUsersExcludingPublicId(requesterPublicId, { limit = 50, offset = 0 } = {}) {
      const normalizedLimit = normalizePaginationValue(limit, 50);
      const normalizedOffset = normalizePaginationValue(offset, 0);
      const [rows] = await db.query(
        `SELECT id, public_id, email, first_name, last_name
         FROM users
         WHERE public_id <> ?
         ORDER BY first_name ASC, last_name ASC, email ASC
         LIMIT ${normalizedLimit} OFFSET ${normalizedOffset}`,
        [requesterPublicId]
      );

      return rows.map(mapUserSummaryRow);
    },

    async listUsersExcludingPublicIdBlockedByUser(requesterPublicId, blockerId, { limit = 50, offset = 0 } = {}) {
      const normalizedLimit = normalizePaginationValue(limit, 50);
      const normalizedOffset = normalizePaginationValue(offset, 0);
      const [rows] = await db.query(
        `SELECT u.id, u.public_id, u.email, u.first_name, u.last_name
         FROM users u
         WHERE u.public_id <> ?
           AND NOT EXISTS (
             SELECT 1
             FROM user_blocks ub
             WHERE ub.blocker_id = ?
               AND ub.blocked_id = u.id
           )
         ORDER BY u.first_name ASC, u.last_name ASC, u.email ASC
         LIMIT ${normalizedLimit} OFFSET ${normalizedOffset}`,
        [requesterPublicId, blockerId]
      );

      return rows.map(mapUserSummaryRow);
    },
  };
}

module.exports = {
  createUserRepository,
};
