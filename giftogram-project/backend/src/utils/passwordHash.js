const { randomBytes, scrypt, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);

  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, passwordHash) {
  if (typeof passwordHash !== "string") {
    return false;
  }

  const [algorithm, salt, storedHash] = passwordHash.split("$");

  if (algorithm !== "scrypt" || !salt || !storedHash) {
    return false;
  }

  const derivedKey = await scryptAsync(password, salt, storedHash.length / 2);
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (derivedKey.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedBuffer);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
