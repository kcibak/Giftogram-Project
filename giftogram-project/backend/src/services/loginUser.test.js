const test = require("node:test");
const assert = require("node:assert/strict");

const { createLoginUser } = require("./loginUser");
const { ApiError } = require("../utils/apiError");
const { hashPassword } = require("../utils/passwordHash");
const { hashToken } = require("../utils/sessionToken");

test("loginUser authenticates valid credentials and returns token plus public user payload", async () => {
  const passwordHash = await hashPassword("Test1234");
  let capturedSession;
  const loginUser = createLoginUser({
    userRepository: {
      async findUserByEmail(email) {
        return {
          id: 1,
          publicId: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
          email,
          passwordHash,
          firstName: "John",
          lastName: "Doe",
        };
      },
    },
    sessionRepository: {
      async createSession(session) {
        capturedSession = session;
      },
    },
  });

  const result = await loginUser({
    email: " Info@Giftogram.com ",
    password: "Test1234",
  });

  assert.equal(capturedSession.userId, 1);
  assert.ok(capturedSession.expiresAt instanceof Date);
  assert.notEqual(result.token, capturedSession.tokenHash);
  assert.equal(capturedSession.tokenHash, hashToken(result.token));
  assert.deepEqual(result.user, {
    user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
    email: "info@giftogram.com",
    first_name: "John",
    last_name: "Doe",
  });
  assert.match(result.expires_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("loginUser returns the generic login failure when credentials are invalid", async () => {
  const loginUser = createLoginUser({
    userRepository: {
      async findUserByEmail() {
        return null;
      },
    },
    sessionRepository: {
      async createSession() {
        throw new Error("createSession should not be called");
      },
    },
  });

  await assert.rejects(
    () =>
      loginUser({
        email: "info@giftogram.com",
        password: "Test1234",
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 401);
      assert.equal(error.errorCode, 1101);
      assert.equal(error.errorTitle, "Login Failure");
      return true;
    }
  );
});

test("loginUser validates required fields", async () => {
  const loginUser = createLoginUser({
    userRepository: {
      async findUserByEmail() {
        throw new Error("findUserByEmail should not be called");
      },
    },
    sessionRepository: {
      async createSession() {
        throw new Error("createSession should not be called");
      },
    },
  });

  await assert.rejects(
    () =>
      loginUser({
        email: "",
        password: "",
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 400);
      assert.equal(error.errorCode, 1001);
      assert.equal(error.errorMessage, "Email is required.");
      return true;
    }
  );
});

test("loginUser rejects overly long passwords", async () => {
  const loginUser = createLoginUser({
    userRepository: {
      async findUserByEmail() {
        throw new Error("findUserByEmail should not be called");
      },
    },
    sessionRepository: {
      async createSession() {
        throw new Error("createSession should not be called");
      },
    },
  });

  const longPassword = "a".repeat(129) + "1"; // 130 chars with a digit

  await assert.rejects(
    () =>
      loginUser({
        email: "info@giftogram.com",
        password: longPassword,
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 400);
      assert.equal(error.errorCode, 1001);
      assert.equal(
        error.errorMessage,
        "Password must be at least 8 characters and include at least one letter and one number."
      );
      return true;
    }
  );
});
