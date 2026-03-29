const test = require("node:test");
const assert = require("node:assert/strict");

const { createAuthenticateSession } = require("./authenticateSession");
const { ApiError } = require("../utils/apiError");
const { hashToken } = require("../utils/sessionToken");

test("authenticateSession returns the authenticated user when the token is valid", async () => {
  const authenticateSession = createAuthenticateSession({
    sessionRepository: {
      async findSessionByTokenHash(tokenHash) {
        assert.equal(tokenHash, hashToken("raw-token"));
        return {
          id: 1,
          userId: 1,
          expiresAt: new Date(Date.now() + 60_000),
          user: {
            id: 1,
            publicId: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
            email: "info@giftogram.com",
            firstName: "John",
            lastName: "Doe",
          },
        };
      },
    },
  });

  const result = await authenticateSession("raw-token");

  assert.equal(result.user.publicId, "4cae9f07-6a7a-4ce3-8529-b19812b71234");
});

test("authenticateSession rejects missing tokens", async () => {
  const authenticateSession = createAuthenticateSession({
    sessionRepository: {
      async findSessionByTokenHash() {
        throw new Error("findSessionByTokenHash should not be called");
      },
    },
  });

  await assert.rejects(
    () => authenticateSession(""),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.errorCode, 1601);
      return true;
    }
  );
});

test("authenticateSession rejects expired sessions", async () => {
  const authenticateSession = createAuthenticateSession({
    sessionRepository: {
      async findSessionByTokenHash() {
        return {
          id: 1,
          userId: 1,
          expiresAt: new Date(Date.now() - 60_000),
          user: {
            id: 1,
            publicId: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
          },
        };
      },
    },
  });

  await assert.rejects(
    () => authenticateSession("raw-token"),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.errorCode, 1603);
      return true;
    }
  );
});
