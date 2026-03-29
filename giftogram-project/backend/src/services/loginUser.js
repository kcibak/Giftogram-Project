const { createUserRepository } = require("../repositories/userRepository");
const { createSessionRepository } = require("../repositories/sessionRepository");
const { ApiError, errorCatalog } = require("../utils/apiError");
const { addDays, formatDateAsIsoString } = require("../utils/dateTime");
const { createSessionToken, hashToken } = require("../utils/sessionToken");
const { toLoginResponse } = require("../utils/mappers");
const { verifyPassword } = require("../utils/passwordHash");
const { isValidEmail, isValidPassword } = require("../utils/validators");

const SESSION_DURATION_DAYS = Number(process.env.SESSION_DURATION_DAYS) || 7;
// Static hash to equalize verification time when user is missing.
const DUMMY_PASSWORD_HASH =
  "scrypt$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000";

function createLoginUser({
  userRepository = createUserRepository(),
  sessionRepository = createSessionRepository(),
} = {}) {
  return async function loginUser(payload = {}) {
    const normalizedInput = normalizeLoginInput(payload);
    validateLoginInput(normalizedInput);

    try {
      const user = await userRepository.findUserByEmail(normalizedInput.email);
      const passwordHash = user?.passwordHash || DUMMY_PASSWORD_HASH;
      const passwordMatches = await verifyPassword(normalizedInput.password, passwordHash);

      if (!user || !passwordMatches) {
        throw errorCatalog.loginFailure();
      }

      const token = createSessionToken();
      const expiresAt = addDays(new Date(), SESSION_DURATION_DAYS);

      await sessionRepository.createSession({
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt,
      });

      return toLoginResponse({
        token,
        expiresAt,
        user,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error("loginUser unexpected error", error);
      throw errorCatalog.loginFailed();
    }
  };
}

function normalizeLoginInput(payload) {
  return {
    email: typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "",
    password: typeof payload.password === "string" ? payload.password : "",
  };
}

function validateLoginInput({ email, password }) {
  if (!email) {
    throw errorCatalog.validation("Email is required.");
  }

  if (!isValidEmail(email)) {
    throw errorCatalog.validation("Email must be a valid email address.");
  }

  if (!password) {
    throw errorCatalog.validation("Password is required.");
  }

  if (!isValidPassword(password)) {
    throw errorCatalog.validation(
      "Password must be at least 8 characters and include at least one letter and one number."
    );
  }
}

module.exports = {
  createLoginUser,
  normalizeLoginInput,
  validateLoginInput,
};
