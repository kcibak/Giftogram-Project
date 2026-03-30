const { createUserBlockRepository } = require("../repositories/userBlockRepository");
const { createUserRepository } = require("../repositories/userRepository");
const { ApiError, errorCatalog } = require("../utils/apiError");
const { isValidPublicId } = require("../utils/validators");

function createUnblockUser({
  userRepository = createUserRepository(),
  userBlockRepository = createUserBlockRepository(),
} = {}) {
  return async function unblockUser(payload = {}) {
    const normalizedInput = normalizeUnblockUserInput(payload);
    validateUnblockUserInput(normalizedInput);
    validateUnblockUserAuthorization(normalizedInput);

    const blockerId = normalizedInput.blockerId || normalizedInput.authenticatedUserInternalId;

    if (!Number.isInteger(blockerId)) {
      throw errorCatalog.validation("blocker_id is required.");
    }

    try {
      const blockedId = await resolveBlockedId(normalizedInput, userRepository);

      if (blockerId === blockedId) {
        throw errorCatalog.blockSelf();
      }

      const users = await userRepository.findUsersByIds(uniqueIds([blockerId, blockedId]));

      if (users.length !== 2) {
        throw errorCatalog.blockUserNotFound();
      }

      const deletedRows = await userBlockRepository.deleteBlock(blockerId, blockedId);

      if (deletedRows === 0) {
        throw errorCatalog.unblockRelationshipNotFound();
      }

      return {
        success_code: 200,
        success_title: "User Unblocked",
        success_message: "User was unblocked successfully.",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error("unblockUser unexpected error", error);
      throw errorCatalog.unblockFailed();
    }
  };
}

function normalizeUnblockUserInput(payload) {
  return {
    blockerId: parsePositiveInteger(payload.blocker_id),
    blockedId: parsePositiveInteger(payload.blocked_id),
    blockedUserId: typeof payload.blocked_user_id === "string" ? payload.blocked_user_id.trim() : "",
    authenticatedUserInternalId: parsePositiveInteger(payload.authenticated_user_internal_id),
  };
}

function validateUnblockUserInput({ blockerId, blockedId, blockedUserId, authenticatedUserInternalId }) {
  if (blockerId != null && !Number.isInteger(blockerId)) {
    throw errorCatalog.validation("blocker_id must be a positive integer.");
  }

  if (authenticatedUserInternalId != null && !Number.isInteger(authenticatedUserInternalId)) {
    throw errorCatalog.validation("authenticated_user_internal_id must be a positive integer.");
  }

  if (!Number.isInteger(blockedId) && !blockedUserId) {
    throw errorCatalog.validation("blocked_id or blocked_user_id is required.");
  }

  if (blockedUserId && !isValidPublicId(blockedUserId)) {
    throw errorCatalog.validation("blocked_user_id must be a valid UUID.");
  }
}

function validateUnblockUserAuthorization({ blockerId, authenticatedUserInternalId }) {
  if (
    Number.isInteger(authenticatedUserInternalId) &&
    Number.isInteger(blockerId) &&
    blockerId !== authenticatedUserInternalId
  ) {
    throw errorCatalog.authUserMismatch();
  }
}

async function resolveBlockedId({ blockedId, blockedUserId }, userRepository) {
  if (Number.isInteger(blockedId)) {
    return blockedId;
  }

  const blockedUser = await userRepository.findUserByPublicId(blockedUserId);

  if (!blockedUser) {
    throw errorCatalog.blockUserNotFound();
  }

  return blockedUser.id;
}

function parsePositiveInteger(value) {
  const normalized = typeof value === "string" ? Number(value.trim()) : Number(value);

  if (!Number.isInteger(normalized) || normalized <= 0) {
    return null;
  }

  return normalized;
}

function uniqueIds(values) {
  return [...new Set(values)];
}

module.exports = {
  createUnblockUser,
  normalizeUnblockUserInput,
  validateUnblockUserInput,
};
