const test = require("node:test");
const assert = require("node:assert/strict");

const { createRegisterUser } = require("./registerUser");
const { ApiError } = require("../utils/apiError");

test("registerUser normalizes input and hashes the password before persisting", async () => {
  let capturedUser;
  const registerUser = createRegisterUser({
    userRepository: {
      async createUser(user) {
        capturedUser = user;
        return user;
      },
    },
  });

  const result = await registerUser({
    email: " Info@Giftogram.com ",
    password: "Test1234",
    first_name: " John ",
    last_name: " Doe ",
  });

  assert.match(capturedUser.publicId, /^[0-9a-f-]{36}$/);
  assert.equal(capturedUser.email, "info@giftogram.com");
  assert.notEqual(capturedUser.passwordHash, "Test1234");
  assert.match(capturedUser.passwordHash, /^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
  assert.equal(capturedUser.firstName, "John");
  assert.equal(capturedUser.lastName, "Doe");

  assert.deepEqual(result, {
    user_id: capturedUser.publicId,
    email: "info@giftogram.com",
    first_name: "John",
    last_name: "Doe",
  });
});

test("registerUser rejects invalid input with the validation error contract", async () => {
  const registerUser = createRegisterUser({
    userRepository: {
      async createUser() {
        throw new Error("createUser should not be called");
      },
    },
  });

  await assert.rejects(
    () =>
      registerUser({
        email: "not-an-email",
        password: "short",
        first_name: "",
        last_name: "Doe",
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 400);
      assert.equal(error.errorCode, 1001);
      assert.equal(error.errorTitle, "Validation Error");
      assert.equal(error.errorMessage, "Email must be a valid email address.");
      return true;
    }
  );
});

test("registerUser rejects overly long passwords", async () => {
  const registerUser = createRegisterUser({
    userRepository: {
      async createUser() {
        throw new Error("createUser should not be called");
      },
    },
  });

  const longPassword = "a".repeat(129) + "1"; // 130 chars with a digit

  await assert.rejects(
    () =>
      registerUser({
        email: "info@giftogram.com",
        password: longPassword,
        first_name: "John",
        last_name: "Doe",
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

test("registerUser maps duplicate email errors to a 409 response shape", async () => {
  const registerUser = createRegisterUser({
    userRepository: {
      async createUser() {
        const error = new Error("Duplicate entry");
        error.code = "ER_DUP_ENTRY";
        throw error;
      },
    },
  });

  await assert.rejects(
    () =>
      registerUser({
        email: "info@giftogram.com",
        password: "Test1234",
        first_name: "John",
        last_name: "Doe",
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 409);
      assert.equal(error.errorCode, 1002);
      assert.equal(error.errorTitle, "Email Already Registered");
      return true;
    }
  );
});
