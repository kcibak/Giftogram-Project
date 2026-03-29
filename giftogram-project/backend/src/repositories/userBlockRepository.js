const { getDbPool } = require("../config/db");

function createUserBlockRepository({ db = getDbPool() } = {}) {
  return {
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
  };
}

module.exports = {
  createUserBlockRepository,
};
