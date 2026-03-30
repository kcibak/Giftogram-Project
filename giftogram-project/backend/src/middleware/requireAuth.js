const { errorCatalog } = require("../utils/apiError");

function createRequireAuth({ authenticateSession }) {
  return async function requireAuth(req, res, next) {
    try {
      const token = extractBearerToken(req.headers.authorization);
      const auth = await authenticateSession(token);
      const userPublicId = auth?.user?.publicId || null;
      const userInternalId = Number.isInteger(auth?.userId) ? auth.userId : null;

      req.auth = auth;
      req.body = {
        ...(req.body || {}),
        authenticated_user_id: userPublicId,
        authenticated_user_internal_id: userInternalId,
      };
      req.query = {
        ...(req.query || {}),
        authenticated_user_id: userPublicId,
        authenticated_user_internal_id: userInternalId,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== "string" || !authorizationHeader.trim()) {
    throw errorCatalog.authMissingToken();
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw errorCatalog.authMissingToken();
  }

  return match[1];
}

module.exports = {
  createRequireAuth,
  extractBearerToken,
};
