const { getDbPool } = require("../config/db");

function mapMessageRow(row) {
  return {
    publicId: row.public_id,
    senderPublicId: row.sender_public_id,
    receiverPublicId: row.receiver_public_id,
    message: row.message,
    epoch: row.epoch,
  };
}

function createMessageRepository({ db = getDbPool() } = {}) {
  return {
    async createMessage({ publicId, senderId, receiverId, message, epoch }) {
      await db.execute(
        `INSERT INTO messages (public_id, sender_id, receiver_id, message, epoch)
         VALUES (?, ?, ?, ?, ?)`,
        [publicId, senderId, receiverId, message, epoch]
      );

      const [rows] = await db.execute(
        `SELECT m.public_id,
                sender.public_id AS sender_public_id,
                receiver.public_id AS receiver_public_id,
                m.message,
                m.epoch
         FROM messages m
         INNER JOIN users sender ON sender.id = m.sender_id
         INNER JOIN users receiver ON receiver.id = m.receiver_id
         WHERE m.public_id = ?
         LIMIT 1`,
        [publicId]
      );

      return mapMessageRow(rows[0]);
    },

    async findConversationByUserIds(userIdA, userIdB) {
      const [rows] = await db.execute(
        `SELECT m.public_id,
                sender.public_id AS sender_public_id,
                receiver.public_id AS receiver_public_id,
                m.message,
                m.epoch
         FROM messages m
         INNER JOIN users sender ON sender.id = m.sender_id
         INNER JOIN users receiver ON receiver.id = m.receiver_id
         WHERE (m.sender_id = ? AND m.receiver_id = ?)
            OR (m.sender_id = ? AND m.receiver_id = ?)
         ORDER BY m.epoch ASC, m.id ASC`,
        [userIdA, userIdB, userIdB, userIdA]
      );

      return rows.map(mapMessageRow);
    },
  };
}

module.exports = {
  createMessageRepository,
};
