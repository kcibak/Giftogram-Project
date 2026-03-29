const test = require("node:test");
const assert = require("node:assert/strict");

const { createSendMessage } = require("./sendMessage");
const { ApiError } = require("../utils/apiError");

test("sendMessage creates a message and returns the success envelope", async () => {
  let createdMessage;
  const sendMessage = createSendMessage({
    userRepository: {
      async findUsersByPublicIds() {
        return [
          { id: 1, publicId: "4cae9f07-6a7a-4ce3-8529-b19812b71234" },
          { id: 2, publicId: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7" },
        ];
      },
    },
    messageRepository: {
      async createMessage(message) {
        createdMessage = message;
        return message;
      },
    },
    userBlockRepository: {
      async blockExistsBetweenUsers() {
        return false;
      },
    },
  });

  const result = await sendMessage({
    sender_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
    receiver_user_id: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
    message: " Example text ",
    authenticated_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
  });

  assert.match(createdMessage.publicId, /^[0-9a-f-]{36}$/);
  assert.equal(createdMessage.senderId, 1);
  assert.equal(createdMessage.receiverId, 2);
  assert.equal(createdMessage.message, "Example text");
  assert.equal(typeof createdMessage.epoch, "number");
  assert.ok(Number.isInteger(createdMessage.epoch));

  assert.deepEqual(result, {
    success_code: 200,
    success_title: "Message Sent",
    success_message: "Message was sent successfully",
  });
});

test("sendMessage returns user not found when sender or receiver does not exist", async () => {
  const sendMessage = createSendMessage({
    userRepository: {
      async findUsersByPublicIds() {
        return [{ id: 1, publicId: "4cae9f07-6a7a-4ce3-8529-b19812b71234" }];
      },
    },
    messageRepository: {
      async createMessage() {
        throw new Error("createMessage should not be called");
      },
    },
    userBlockRepository: {
      async blockExistsBetweenUsers() {
        return false;
      },
    },
  });

  await assert.rejects(
    () =>
      sendMessage({
        sender_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
        receiver_user_id: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
        message: "hello",
        authenticated_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 404);
      assert.equal(error.errorCode, 1301);
      return true;
    }
  );
});

test("sendMessage validates non-empty message content", async () => {
  const sendMessage = createSendMessage({
    userRepository: {
      async findUsersByPublicIds() {
        throw new Error("findUsersByPublicIds should not be called");
      },
    },
    messageRepository: {
      async createMessage() {
        throw new Error("createMessage should not be called");
      },
    },
    userBlockRepository: {
      async blockExistsBetweenUsers() {
        return false;
      },
    },
  });

  await assert.rejects(
    () =>
      sendMessage({
        sender_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
        receiver_user_id: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
        message: "   ",
        authenticated_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 400);
      assert.equal(error.errorCode, 1001);
      assert.equal(error.errorMessage, "Message is required.");
      return true;
    }
  );
});

test("sendMessage rejects when the authenticated user does not match the sender", async () => {
  const sendMessage = createSendMessage({
    userRepository: {
      async findUsersByPublicIds() {
        throw new Error("findUsersByPublicIds should not be called");
      },
    },
    messageRepository: {
      async createMessage() {
        throw new Error("createMessage should not be called");
      },
    },
    userBlockRepository: {
      async blockExistsBetweenUsers() {
        return false;
      },
    },
  });

  await assert.rejects(
    () =>
      sendMessage({
        sender_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
        receiver_user_id: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
        message: "hello",
        authenticated_user_id: "59cbfd78-54d2-44b4-ae6d-6a1d995e77eb",
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 403);
      assert.equal(error.errorCode, 1604);
      return true;
    }
  );
});

test("sendMessage rejects when a block exists between the users", async () => {
  const sendMessage = createSendMessage({
    userRepository: {
      async findUsersByPublicIds() {
        return [
          { id: 1, publicId: "4cae9f07-6a7a-4ce3-8529-b19812b71234" },
          { id: 2, publicId: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7" },
        ];
      },
    },
    messageRepository: {
      async createMessage() {
        throw new Error("createMessage should not be called");
      },
    },
    userBlockRepository: {
      async blockExistsBetweenUsers() {
        return true;
      },
    },
  });

  await assert.rejects(
    () =>
      sendMessage({
        sender_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
        receiver_user_id: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
        message: "hello",
        authenticated_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 403);
      assert.equal(error.errorCode, 1303);
      return true;
    }
  );
});
