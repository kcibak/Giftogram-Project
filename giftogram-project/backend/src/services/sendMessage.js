const { randomUUID } = require("node:crypto");

const { createUserBlockRepository } = require("../repositories/userBlockRepository");
const { createMessageRepository } = require("../repositories/messageRepository");
const { createUserRepository } = require("../repositories/userRepository");
const { ApiError, errorCatalog } = require("../utils/apiError");
const { isValidPublicId } = require("../utils/validators");

function createSendMessage({
  userRepository = createUserRepository(),
  messageRepository = createMessageRepository(),
  userBlockRepository = createUserBlockRepository(),
} = {}) {
  return async function sendMessage(payload = {}) {
    const normalizedInput = normalizeSendMessageInput(payload);
    validateSendMessageInput(normalizedInput);
    validateSenderAuthorization(normalizedInput);

    try {
      const users = await userRepository.findUsersByPublicIds(
        uniquePublicIds([normalizedInput.senderUserId, normalizedInput.receiverUserId])
      );
      const userMap = new Map(users.map((user) => [user.publicId, user]));

      if (!userMap.has(normalizedInput.senderUserId) || !userMap.has(normalizedInput.receiverUserId)) {
        throw errorCatalog.sendMessageUserNotFound();
      }

      const sender = userMap.get(normalizedInput.senderUserId);
      const receiver = userMap.get(normalizedInput.receiverUserId);
      const blockExists = await userBlockRepository.blockExistsBetweenUsers(sender.id, receiver.id);

      if (blockExists) {
        throw errorCatalog.messageBlocked();
      }

      await messageRepository.createMessage({
        publicId: randomUUID(),
        senderId: sender.id,
        receiverId: receiver.id,
        message: normalizedInput.message,
        epoch: Math.floor(Date.now() / 1000),
      });

      return {
        success_code: 200,
        success_title: "Message Sent",
        success_message: "Message was sent successfully",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error("sendMessage unexpected error", error);
      throw errorCatalog.messageSendFailed();
    }
  };
}

function normalizeSendMessageInput(payload) {
  return {
    senderUserId: typeof payload.sender_user_id === "string" ? payload.sender_user_id.trim() : "",
    receiverUserId: typeof payload.receiver_user_id === "string" ? payload.receiver_user_id.trim() : "",
    message: typeof payload.message === "string" ? payload.message.trim() : "",
    authenticatedUserId:
      typeof payload.authenticated_user_id === "string" ? payload.authenticated_user_id.trim() : "",
  };
}

function validateSendMessageInput({ senderUserId, receiverUserId, message }) {
  if (!senderUserId) {
    throw errorCatalog.validation("sender_user_id is required.");
  }

  if (!isValidPublicId(senderUserId)) {
    throw errorCatalog.validation("sender_user_id must be a valid UUID.");
  }

  if (!receiverUserId) {
    throw errorCatalog.validation("receiver_user_id is required.");
  }

  if (!isValidPublicId(receiverUserId)) {
    throw errorCatalog.validation("receiver_user_id must be a valid UUID.");
  }

  if (!message) {
    throw errorCatalog.validation("Message is required.");
  }
}

function validateSenderAuthorization({ senderUserId, authenticatedUserId }) {
  if (authenticatedUserId && senderUserId !== authenticatedUserId) {
    throw errorCatalog.authUserMismatch();
  }
}

function uniquePublicIds(publicIds) {
  return [...new Set(publicIds)];
}

module.exports = {
  createSendMessage,
  normalizeSendMessageInput,
  validateSendMessageInput,
};
