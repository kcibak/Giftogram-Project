const test = require("node:test");
const assert = require("node:assert/strict");

const { createBlockUser } = require("./blockUser");
const { ApiError } = require("../utils/apiError");

test("blockUser creates a block relationship", async () => {
  let inserted;
  const blockUser = createBlockUser({
    userRepository: {
      async findUsersByIds(ids) {
        assert.deepEqual(ids, [1, 2]);
        return [{ id: 1 }, { id: 2 }];
      },
    },
    userBlockRepository: {
      async createBlock(blockerId, blockedId) {
        inserted = { blockerId, blockedId };
      },
    },
  });

  const result = await blockUser({
    blocker_id: 1,
    blocked_id: 2,
    authenticated_user_internal_id: 1,
  });

  assert.deepEqual(inserted, { blockerId: 1, blockedId: 2 });
  assert.deepEqual(result, {
    success_code: 200,
    success_title: "User Blocked",
    success_message: "User was blocked successfully.",
  });
});

test("blockUser rejects self-blocking", async () => {
  const blockUser = createBlockUser({
    userRepository: {
      async findUsersByIds() {
        throw new Error("findUsersByIds should not be called");
      },
    },
    userBlockRepository: {
      async createBlock() {
        throw new Error("createBlock should not be called");
      },
    },
  });

  await assert.rejects(
    () => blockUser({ blocker_id: 1, blocked_id: 1, authenticated_user_internal_id: 1 }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 400);
      assert.equal(error.errorCode, 1701);
      return true;
    }
  );
});

test("blockUser rejects when authenticated user does not match blocker", async () => {
  const blockUser = createBlockUser({
    userRepository: {
      async findUsersByIds() {
        throw new Error("findUsersByIds should not be called");
      },
    },
    userBlockRepository: {
      async createBlock() {
        throw new Error("createBlock should not be called");
      },
    },
  });

  await assert.rejects(
    () => blockUser({ blocker_id: 1, blocked_id: 2, authenticated_user_internal_id: 99 }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 403);
      assert.equal(error.errorCode, 1604);
      return true;
    }
  );
});

test("blockUser rejects when a user does not exist", async () => {
  const blockUser = createBlockUser({
    userRepository: {
      async findUsersByIds() {
        return [{ id: 1 }];
      },
    },
    userBlockRepository: {
      async createBlock() {
        throw new Error("createBlock should not be called");
      },
    },
  });

  await assert.rejects(
    () => blockUser({ blocker_id: 1, blocked_id: 2, authenticated_user_internal_id: 1 }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 404);
      assert.equal(error.errorCode, 1702);
      return true;
    }
  );
});

test("blockUser handles duplicate block attempts", async () => {
  const duplicateError = new Error("duplicate");
  duplicateError.code = "ER_DUP_ENTRY";

  const blockUser = createBlockUser({
    userRepository: {
      async findUsersByIds() {
        return [{ id: 1 }, { id: 2 }];
      },
    },
    userBlockRepository: {
      async createBlock() {
        throw duplicateError;
      },
    },
  });

  await assert.rejects(
    () => blockUser({ blocker_id: 1, blocked_id: 2, authenticated_user_internal_id: 1 }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 409);
      assert.equal(error.errorCode, 1703);
      return true;
    }
  );
});

test("blockUser supports bearer-only flow with blocked_user_id UUID", async () => {
  let inserted;
  const blockUser = createBlockUser({
    userRepository: {
      async findUserByPublicId(publicId) {
        assert.equal(publicId, "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7");
        return { id: 2, publicId };
      },
      async findUsersByIds(ids) {
        assert.deepEqual(ids, [1, 2]);
        return [{ id: 1 }, { id: 2 }];
      },
    },
    userBlockRepository: {
      async createBlock(blockerId, blockedId) {
        inserted = { blockerId, blockedId };
      },
    },
  });

  const result = await blockUser({
    blocked_user_id: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
    authenticated_user_internal_id: 1,
  });

  assert.deepEqual(inserted, { blockerId: 1, blockedId: 2 });
  assert.equal(result.success_code, 200);
});
