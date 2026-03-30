const { createMessageRepository } = require("../repositories/messageRepository");
const { createUserBlockRepository } = require("../repositories/userBlockRepository");
const { createUserRepository } = require("../repositories/userRepository");
const { ApiError, errorCatalog } = require("../utils/apiError");
const { toMessageResponse } = require("../utils/mappers");
const { isValidPublicId } = require("../utils/validators");

function createViewMessages({
  userRepository = createUserRepository(),
  messageRepository = createMessageRepository(),
  userBlockRepository = createUserBlockRepository(),
} = {}) {
  return async function viewMessages(query = {}) {
    const normalizedInput = normalizeViewMessagesInput(query);
    validateViewMessagesInput(normalizedInput);
    validateViewAuthorization(normalizedInput);

    try {
      const users = await userRepository.findUsersByPublicIds(
        uniquePublicIds([normalizedInput.userIdA, normalizedInput.userIdB])
      );
      const userMap = new Map(users.map((user) => [user.publicId, user]));

      if (!userMap.has(normalizedInput.userIdA) || !userMap.has(normalizedInput.userIdB)) {
        throw errorCatalog.viewMessagesUserNotFound();
      }

      const userA = userMap.get(normalizedInput.userIdA);
      const userB = userMap.get(normalizedInput.userIdB);
      const blockExists = await userBlockRepository.blockExistsBetweenUsers(userA.id, userB.id);

      if (blockExists) {
        throw errorCatalog.conversationBlocked();
      }

      const messages = await messageRepository.findConversationByUserIds(
        userA.id,
        userB.id
      );

      return {
        messages: messages.map(toMessageResponse),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw errorCatalog.viewMessagesFailed();
    }
  };
}

function normalizeViewMessagesInput(query) {
  return {
    userIdA: typeof query.user_id_a === "string" ? query.user_id_a.trim() : "",
    userIdB: typeof query.user_id_b === "string" ? query.user_id_b.trim() : "",
    authenticatedUserId:
      typeof query.authenticated_user_id === "string" ? query.authenticated_user_id.trim() : "",
  };
}

function validateViewMessagesInput({ userIdA, userIdB }) {
  if (!userIdA) {
    throw errorCatalog.validation("user_id_a is required.");
  }

  if (!isValidPublicId(userIdA)) {
    throw errorCatalog.validation("user_id_a must be a valid UUID.");
  }

  if (!userIdB) {
    throw errorCatalog.validation("user_id_b is required.");
  }

  if (!isValidPublicId(userIdB)) {
    throw errorCatalog.validation("user_id_b must be a valid UUID.");
  }
}

function validateViewAuthorization({ userIdA, userIdB, authenticatedUserId }) {
  if (authenticatedUserId && authenticatedUserId !== userIdA && authenticatedUserId !== userIdB) {
    throw errorCatalog.authUserMismatch();
  }
}

function uniquePublicIds(publicIds) {
  return [...new Set(publicIds)];
}

module.exports = {
  createViewMessages,
  normalizeViewMessagesInput,
  validateViewMessagesInput,
};
