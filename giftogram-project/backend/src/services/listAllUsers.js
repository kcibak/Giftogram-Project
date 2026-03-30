const { createUserRepository } = require("../repositories/userRepository");
const { ApiError, errorCatalog } = require("../utils/apiError");
const { toUserResponse } = require("../utils/mappers");
const { isValidPublicId } = require("../utils/validators");

function createListAllUsers({ userRepository = createUserRepository() } = {}) {
  return async function listAllUsers(query = {}) {
    const normalizedInput = normalizeListAllUsersInput(query);
    validateListAllUsersInput(normalizedInput);
    validatePagination(normalizedInput);
    validateListAuthorization(normalizedInput);

    try {
      const requester = await userRepository.findUserByPublicId(normalizedInput.requesterUserId);

      if (!requester) {
        throw errorCatalog.listUsersUserNotFound();
      }

      const users = normalizedInput.excludeBlocked
        ? await userRepository.listUsersExcludingPublicIdBlockedByUser(normalizedInput.requesterUserId, requester.id, {
            limit: normalizedInput.limit,
            offset: normalizedInput.offset,
          })
        : await userRepository.listUsersExcludingPublicId(normalizedInput.requesterUserId, {
            limit: normalizedInput.limit,
            offset: normalizedInput.offset,
          });

      return {
        users: users.map(toUserResponse),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error("listAllUsers unexpected error", error);
      throw errorCatalog.listUsersFailed();
    }
  };
}

function normalizeListAllUsersInput(query) {
  const requesterUserId =
    typeof query.requester_user_id === "string" && query.requester_user_id.trim()
      ? query.requester_user_id.trim()
      : typeof query.user_id === "string" && query.user_id.trim()
        ? query.user_id.trim()
        : "";
  const authenticatedUserId =
    typeof query.authenticated_user_id === "string" ? query.authenticated_user_id.trim() : "";

  return {
    requesterUserId: requesterUserId || authenticatedUserId,
    authenticatedUserId,
    excludeBlocked: normalizeBoolean(query.exclude_blocked),
    limit: Number.isInteger(Number(query.limit)) ? Number(query.limit) : 50,
    offset: Number.isInteger(Number(query.offset)) ? Number(query.offset) : 0,
  };
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  return ["1", "true", "yes"].includes(value.trim().toLowerCase());
}

function validateListAllUsersInput({ requesterUserId }) {
  if (!requesterUserId) {
    throw errorCatalog.validation("requester_user_id is required.");
  }

  if (!isValidPublicId(requesterUserId)) {
    throw errorCatalog.validation("requester_user_id must be a valid UUID.");
  }
}

function validateListAuthorization({ requesterUserId, authenticatedUserId }) {
  if (authenticatedUserId && requesterUserId !== authenticatedUserId) {
    throw errorCatalog.authUserMismatch();
  }
}

function validatePagination({ limit, offset }) {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw errorCatalog.validation("limit must be a positive integer.");
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw errorCatalog.validation("offset must be a non-negative integer.");
  }
}

module.exports = {
  createListAllUsers,
  normalizeListAllUsersInput,
  validateListAllUsersInput,
};
