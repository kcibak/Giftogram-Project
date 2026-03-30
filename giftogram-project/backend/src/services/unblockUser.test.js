const test = require("node:test");
const assert = require("node:assert/strict");

const { createUnblockUser } = require("./unblockUser");
const { ApiError } = require("../utils/apiError");

test("unblockUser removes an existing block relationship", async () => {
  let removed;
  const unblockUser = createUnblockUser({
    userRepository: {
      async findUsersByIds(ids) {
        assert.deepEqual(ids, [1, 2]);
        return [{ id: 1 }, { id: 2 }];
      },
    },
    userBlockRepository: {
      async deleteBlock(blockerId, blockedId) {
        removed = { blockerId, blockedId };
        return 1;
      },
    },
  });

  const result = await unblockUser({
    blocker_id: 1,
    blocked_id: 2,
    authenticated_user_internal_id: 1,
  });

  assert.deepEqual(removed, { blockerId: 1, blockedId: 2 });
  assert.deepEqual(result, {
    success_code: 200,
    success_title: "User Unblocked",
    success_message: "User was unblocked successfully.",
  });
});

test("unblockUser rejects self-operation", async () => {
  const unblockUser = createUnblockUser({
    userRepository: {
      async findUsersByIds() {
        throw new Error("findUsersByIds should not be called");
      },
    },
    userBlockRepository: {
      async deleteBlock() {
        throw new Error("deleteBlock should not be called");
      },
    },
  });

  await assert.rejects(
    () => unblockUser({ blocker_id: 1, blocked_id: 1, authenticated_user_internal_id: 1 }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 400);
      assert.equal(error.errorCode, 1701);
      return true;
    }
  );
});

test("unblockUser rejects when authenticated user does not match blocker", async () => {
  const unblockUser = createUnblockUser({
    userRepository: {
      async findUsersByIds() {
        throw new Error("findUsersByIds should not be called");
      },
    },
    userBlockRepository: {
      async deleteBlock() {
        throw new Error("deleteBlock should not be called");
      },
    },
  });

  await assert.rejects(
    () => unblockUser({ blocker_id: 1, blocked_id: 2, authenticated_user_internal_id: 11 }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 403);
      assert.equal(error.errorCode, 1604);
      return true;
    }
  );
});

test("unblockUser rejects when a user does not exist", async () => {
  const unblockUser = createUnblockUser({
    userRepository: {
      async findUsersByIds() {
        return [{ id: 1 }];
      },
    },
    userBlockRepository: {
      async deleteBlock() {
        throw new Error("deleteBlock should not be called");
      },
    },
  });

  await assert.rejects(
    () => unblockUser({ blocker_id: 1, blocked_id: 2, authenticated_user_internal_id: 1 }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 404);
      assert.equal(error.errorCode, 1702);
      return true;
    }
  );
});

test("unblockUser rejects when no block relationship exists", async () => {
  const unblockUser = createUnblockUser({
    userRepository: {
      async findUsersByIds() {
        return [{ id: 1 }, { id: 2 }];
      },
    },
    userBlockRepository: {
      async deleteBlock() {
        return 0;
      },
    },
  });

  await assert.rejects(
    () => unblockUser({ blocker_id: 1, blocked_id: 2, authenticated_user_internal_id: 1 }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 404);
      assert.equal(error.errorCode, 1705);
      return true;
    }
  );
});

test("unblockUser supports bearer-only flow with blocked_user_id UUID", async () => {
  let removed;
  const unblockUser = createUnblockUser({
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
      async deleteBlock(blockerId, blockedId) {
        removed = { blockerId, blockedId };
        return 1;
      },
    },
  });

  const result = await unblockUser({
    blocked_user_id: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
    authenticated_user_internal_id: 1,
  });

  assert.deepEqual(removed, { blockerId: 1, blockedId: 2 });
  assert.equal(result.success_code, 200);
});
