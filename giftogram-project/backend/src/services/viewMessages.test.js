const test = require("node:test");
const assert = require("node:assert/strict");

const { createViewMessages } = require("./viewMessages");
const { ApiError } = require("../utils/apiError");

test("viewMessages returns the conversation in chronological order with public ids", async () => {
  const viewMessages = createViewMessages({
    userRepository: {
      async findUsersByPublicIds() {
        return [
          { id: 1, publicId: "4cae9f07-6a7a-4ce3-8529-b19812b71234" },
          { id: 2, publicId: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7" },
        ];
      },
    },
    messageRepository: {
      async findConversationByUserIds(userIdA, userIdB) {
        assert.equal(userIdA, 1);
        assert.equal(userIdB, 2);
        return [
          {
            publicId: "81d32d84-55df-4fbd-b86e-436039a2def2",
            senderPublicId: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
            message: "Hey what is up?",
            epoch: 1429220026,
          },
          {
            publicId: "f78d0f3b-c8d0-45fe-b49d-1164f5f9b63c",
            senderPublicId: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
            message: "Not much, how are you?",
            epoch: 1429221050,
          },
        ];
      },
    },
  });

  const result = await viewMessages({
    user_id_a: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
    user_id_b: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
    authenticated_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
  });

  assert.deepEqual(result, {
    messages: [
      {
        message_id: "81d32d84-55df-4fbd-b86e-436039a2def2",
        sender_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
        message: "Hey what is up?",
        epoch: 1429220026,
      },
      {
        message_id: "f78d0f3b-c8d0-45fe-b49d-1164f5f9b63c",
        sender_user_id: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
        message: "Not much, how are you?",
        epoch: 1429221050,
      },
    ],
  });
});

test("viewMessages returns user not found when either user does not exist", async () => {
  const viewMessages = createViewMessages({
    userRepository: {
      async findUsersByPublicIds() {
        return [{ id: 1, publicId: "4cae9f07-6a7a-4ce3-8529-b19812b71234" }];
      },
    },
    messageRepository: {
      async findConversationByUserIds() {
        throw new Error("findConversationByUserIds should not be called");
      },
    },
  });

  await assert.rejects(
    () =>
      viewMessages({
        user_id_a: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
        user_id_b: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
        authenticated_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 404);
      assert.equal(error.errorCode, 1201);
      return true;
    }
  );
});

test("viewMessages validates required query params", async () => {
  const viewMessages = createViewMessages({
    userRepository: {
      async findUsersByPublicIds() {
        throw new Error("findUsersByPublicIds should not be called");
      },
    },
    messageRepository: {
      async findConversationByUserIds() {
        throw new Error("findConversationByUserIds should not be called");
      },
    },
  });

  await assert.rejects(
    () => viewMessages({ user_id_a: "" }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 400);
      assert.equal(error.errorCode, 1001);
      assert.equal(error.errorMessage, "user_id_a is required.");
      return true;
    }
  );
});

test("viewMessages rejects when the authenticated user is not part of the conversation", async () => {
  const viewMessages = createViewMessages({
    userRepository: {
      async findUsersByPublicIds() {
        throw new Error("findUsersByPublicIds should not be called");
      },
    },
    messageRepository: {
      async findConversationByUserIds() {
        throw new Error("findConversationByUserIds should not be called");
      },
    },
  });

  await assert.rejects(
    () =>
      viewMessages({
        user_id_a: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
        user_id_b: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
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
