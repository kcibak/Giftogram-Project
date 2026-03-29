const { createSessionRepository } = require("../repositories/sessionRepository");
const { ApiError, errorCatalog } = require("../utils/apiError");
const { isExpired } = require("../utils/dateTime");
const { hashToken } = require("../utils/sessionToken");

function createAuthenticateSession({ sessionRepository = createSessionRepository() } = {}) {
  return async function authenticateSession(token) {
    const normalizedToken = typeof token === "string" ? token.trim() : "";

    if (!normalizedToken) {
      throw errorCatalog.authMissingToken();
    }

    try {
      const session = await sessionRepository.findSessionByTokenHash(hashToken(normalizedToken));

      if (!session) {
        throw errorCatalog.authInvalidToken();
      }

      if (isExpired(session.expiresAt)) {
        throw errorCatalog.authExpiredToken();
      }

      return {
        token: normalizedToken,
        sessionId: session.id,
        userId: session.userId,
        user: session.user,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw errorCatalog.authInvalidToken();
    }
  };
}

module.exports = {
  createAuthenticateSession,
};
