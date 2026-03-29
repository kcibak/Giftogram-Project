const { createHash, randomBytes } = require("node:crypto");

function createSessionToken() {
  return randomBytes(32).toString("hex");
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

module.exports = {
  createSessionToken,
  hashToken,
};
