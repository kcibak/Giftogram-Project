const { getDbPool } = require("../config/db");

function createUserBlockRepository({ db = getDbPool() } = {}) {
  return {
    async createBlock(blockerId, blockedId) {
      await db.execute(
        `INSERT INTO user_blocks (blocker_id, blocked_id)
         VALUES (?, ?)`,
        [blockerId, blockedId]
      );
    },

    async deleteBlock(blockerId, blockedId) {
      const [result] = await db.execute(
        `DELETE FROM user_blocks
         WHERE blocker_id = ? AND blocked_id = ?
         LIMIT 1`,
        [blockerId, blockedId]
      );

      return result.affectedRows;
    },

    async blockExistsBetweenUsers(userIdA, userIdB) {
      const [rows] = await db.execute(
        `SELECT id
         FROM user_blocks
         WHERE (blocker_id = ? AND blocked_id = ?)
            OR (blocker_id = ? AND blocked_id = ?)
         LIMIT 1`,
        [userIdA, userIdB, userIdB, userIdA]
      );

      return rows.length > 0;
    },

    async listBlockedUserIds(blockerId) {
      const [rows] = await db.execute(
        `SELECT blocked_id
         FROM user_blocks
         WHERE blocker_id = ?`,
        [blockerId]
      );

      return rows.map((row) => row.blocked_id);
    },
  };
}

module.exports = {
  createUserBlockRepository,
};
