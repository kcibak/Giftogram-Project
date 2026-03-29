const test = require("node:test");
const assert = require("node:assert/strict");

const { createListAllUsers } = require("./listAllUsers");
const { ApiError } = require("../utils/apiError");

test("listAllUsers returns all users except the requester", async () => {
  const listAllUsers = createListAllUsers({
    userRepository: {
      async findUserByPublicId() {
        return { id: 1, publicId: "4cae9f07-6a7a-4ce3-8529-b19812b71234" };
      },
      async listUsersExcludingPublicId(requesterPublicId, { limit, offset }) {
        assert.equal(requesterPublicId, "4cae9f07-6a7a-4ce3-8529-b19812b71234");
        assert.equal(limit, 50);
        assert.equal(offset, 0);
        return [
          {
            id: 2,
            publicId: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
            email: "preston@giftogram.com",
            firstName: "Preston",
            lastName: "Peck",
          },
          {
            id: 3,
            publicId: "59cbfd78-54d2-44b4-ae6d-6a1d995e77eb",
            email: "jake@giftogram.com",
            firstName: "Jake",
            lastName: "Green",
          },
        ];
      },
    },
  });

  const result = await listAllUsers({
    requester_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
    authenticated_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
  });

  assert.deepEqual(result, {
    users: [
      {
        user_id: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
        email: "preston@giftogram.com",
        first_name: "Preston",
        last_name: "Peck",
      },
      {
        user_id: "59cbfd78-54d2-44b4-ae6d-6a1d995e77eb",
        email: "jake@giftogram.com",
        first_name: "Jake",
        last_name: "Green",
      },
    ],
  });
});

test("listAllUsers falls back to the authenticated user id when requester_user_id is omitted", async () => {
  const listAllUsers = createListAllUsers({
    userRepository: {
      async findUserByPublicId(publicId) {
        assert.equal(publicId, "4cae9f07-6a7a-4ce3-8529-b19812b71234");
        return { id: 1, publicId };
      },
      async listUsersExcludingPublicId(requesterPublicId, { limit, offset }) {
        assert.equal(requesterPublicId, "4cae9f07-6a7a-4ce3-8529-b19812b71234");
        assert.equal(limit, 50);
        assert.equal(offset, 0);
        return [];
      },
    },
  });

  const result = await listAllUsers({
    authenticated_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
  });

  assert.deepEqual(result, {
    users: [],
  });
});

test("listAllUsers returns user not found when requester does not exist", async () => {
  const listAllUsers = createListAllUsers({
    userRepository: {
      async findUserByPublicId() {
        return null;
      },
      async listUsersExcludingPublicId() {
        throw new Error("listUsersExcludingPublicId should not be called");
      },
    },
  });

  await assert.rejects(
    () =>
      listAllUsers({
        requester_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
        authenticated_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 404);
      assert.equal(error.errorCode, 1501);
      return true;
    }
  );
});

test("listAllUsers validates requester_user_id", async () => {
  const listAllUsers = createListAllUsers({
    userRepository: {
      async findUserByPublicId() {
        throw new Error("findUserByPublicId should not be called");
      },
      async listUsersExcludingPublicId() {
        throw new Error("listUsersExcludingPublicId should not be called");
      },
    },
  });

  await assert.rejects(
    () => listAllUsers({ requester_user_id: "" }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 400);
      assert.equal(error.errorCode, 1001);
      assert.equal(error.errorMessage, "requester_user_id is required.");
      return true;
    }
  );
});

test("listAllUsers rejects when requester_user_id does not match authenticated user", async () => {
  const listAllUsers = createListAllUsers({
    userRepository: {
      async findUserByPublicId() {
        throw new Error("findUserByPublicId should not be called");
      },
      async listUsersExcludingPublicId() {
        throw new Error("listUsersExcludingPublicId should not be called");
      },
    },
  });

  await assert.rejects(
    () =>
      listAllUsers({
        requester_user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
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
