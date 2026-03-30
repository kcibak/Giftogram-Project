const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("./app");
const { createBlockUserController } = require("./controllers/blockUserController");
const { createHealthController } = require("./controllers/healthController");
const { createListAllUsersController } = require("./controllers/listAllUsersController");
const { createLoginController } = require("./controllers/loginController");
const { createRegisterController } = require("./controllers/registerController");
const { createSendMessageController } = require("./controllers/sendMessageController");
const { createUnblockUserController } = require("./controllers/unblockUserController");
const { createViewMessagesController } = require("./controllers/viewMessagesController");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { createRequireAuth, extractBearerToken } = require("./middleware/requireAuth");
const { errorCatalog } = require("./utils/apiError");

function createMockResponse() {
  return {
    statusCode: 200,
    body: undefined,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.headersSent = true;
      return this;
    },
  };
}

test("registerController returns the created user payload", async () => {
  const controller = createRegisterController({
    registerUser: async (payload) => ({
      user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
      email: payload.email.trim().toLowerCase(),
      first_name: payload.first_name.trim(),
      last_name: payload.last_name.trim(),
    }),
  });
  const req = {
    body: {
      email: "Info@Giftogram.com ",
      password: "Test1234",
      first_name: " John ",
      last_name: " Doe ",
    },
  };
  const res = createMockResponse();

  await controller(req, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, {
    user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
    email: "info@giftogram.com",
    first_name: "John",
    last_name: "Doe",
  });
});

test("loginController returns the authenticated user payload", async () => {
  const controller = createLoginController({
    loginUser: async (payload) => ({
      token: "session-token",
      expires_at: "2026-01-01T00:00:00.000Z",
      user: {
        user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
        email: payload.email.trim().toLowerCase(),
        first_name: "John",
        last_name: "Doe",
      },
    }),
  });
  const req = {
    body: {
      email: "Info@Giftogram.com ",
      password: "Test1234",
    },
  };
  const res = createMockResponse();

  await controller(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    token: "session-token",
    expires_at: "2026-01-01T00:00:00.000Z",
    user: {
      user_id: "4cae9f07-6a7a-4ce3-8529-b19812b71234",
      email: "info@giftogram.com",
      first_name: "John",
      last_name: "Doe",
    },
  });
});

test("healthController returns the health payload", async () => {
  const controller = createHealthController({
    checkHealth: async () => ({
      status: "ok",
      database: "up",
    }),
  });
  const res = createMockResponse();

  await controller({}, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    status: "ok",
    database: "up",
  });
});

test("viewMessagesController returns the message list payload", async () => {
  const controller = createViewMessagesController({
    viewMessages: async () => ({
      messages: [{ message_id: "msg-1", sender_user_id: "user-1", message: "hello", epoch: 123 }],
    }),
  });
  const req = {
    query: {
      user_id_a: "user-1",
      user_id_b: "user-2",
    },
  };
  const res = createMockResponse();

  await controller(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    messages: [{ message_id: "msg-1", sender_user_id: "user-1", message: "hello", epoch: 123 }],
  });
});

test("sendMessageController returns the success payload", async () => {
  const controller = createSendMessageController({
    sendMessage: async () => ({
      success_code: 200,
      success_title: "Message Sent",
      success_message: "Message was sent successfully",
    }),
  });
  const req = {
    body: {
      sender_user_id: "user-1",
      receiver_user_id: "user-2",
      message: "hello",
    },
  };
  const res = createMockResponse();

  await controller(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    success_code: 200,
    success_title: "Message Sent",
    success_message: "Message was sent successfully",
  });
});

test("blockUserController returns the success payload", async () => {
  const controller = createBlockUserController({
    blockUser: async () => ({
      success_code: 200,
      success_title: "User Blocked",
      success_message: "User was blocked successfully.",
    }),
  });
  const req = {
    body: {
      blocker_id: 1,
      blocked_id: 2,
    },
  };
  const res = createMockResponse();

  await controller(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    success_code: 200,
    success_title: "User Blocked",
    success_message: "User was blocked successfully.",
  });
});

test("unblockUserController returns the success payload", async () => {
  const controller = createUnblockUserController({
    unblockUser: async () => ({
      success_code: 200,
      success_title: "User Unblocked",
      success_message: "User was unblocked successfully.",
    }),
  });
  const req = {
    body: {
      blocker_id: 1,
      blocked_id: 2,
    },
  };
  const res = createMockResponse();

  await controller(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    success_code: 200,
    success_title: "User Unblocked",
    success_message: "User was unblocked successfully.",
  });
});

test("listAllUsersController returns the users payload", async () => {
  const controller = createListAllUsersController({
    listAllUsers: async () => ({
      users: [{ user_id: "user-2", email: "jane@example.com", first_name: "Jane", last_name: "Doe" }],
    }),
  });
  const req = {
    query: {
      requester_user_id: "user-1",
    },
  };
  const res = createMockResponse();

  await controller(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    users: [{ user_id: "user-2", email: "jane@example.com", first_name: "Jane", last_name: "Doe" }],
  });
});

test("errorHandler returns standardized validation errors", () => {
  const res = createMockResponse();

  errorHandler(errorCatalog.validation("Email is required."), {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    error_code: 1001,
    error_title: "Validation Error",
    error_message: "Email is required.",
  });
});

test("errorHandler formats invalid JSON as a validation error", () => {
  const res = createMockResponse();
  const syntaxError = new SyntaxError("Unexpected token");
  syntaxError.status = 400;
  syntaxError.body = "{";

  errorHandler(syntaxError, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    error_code: 1001,
    error_title: "Validation Error",
    error_message: "Request body must be valid JSON.",
  });
});

test("notFoundHandler returns the shared 404 error shape", () => {
  const res = createMockResponse();

  notFoundHandler({}, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, {
    error_code: 1404,
    error_title: "Not Found",
    error_message: "The requested endpoint does not exist.",
  });
});

test("createApp registers all API routes", () => {
  const app = createApp({
    blockUser: async () => ({}),
    registerUser: async () => ({}),
    loginUser: async () => ({}),
    viewMessages: async () => ({ messages: [] }),
    sendMessage: async () => ({}),
    listAllUsers: async () => ({ users: [] }),
    unblockUser: async () => ({}),
    authenticateSession: async () => ({
      userId: 1,
      user: {
        publicId: "user-1",
      },
    }),
    checkHealth: async () => ({
      status: "ok",
      database: "up",
    }),
  });

  const routes = app.router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods),
    }));

  assert.deepEqual(routes, [
    { path: "/", methods: ["get"] },
    { path: "/health", methods: ["get"] },
    { path: "/register", methods: ["post"] },
    { path: "/login", methods: ["post"] },
    { path: "/block_user", methods: ["post"] },
    { path: "/unblock_user", methods: ["post"] },
    { path: "/view_messages", methods: ["get"] },
    { path: "/send_message", methods: ["post"] },
    { path: "/list_all_users", methods: ["get"] },
  ]);
});

test("extractBearerToken returns the token portion of the auth header", () => {
  assert.equal(extractBearerToken("Bearer test-token"), "test-token");
});

test("requireAuth attaches auth context to the request", async () => {
  const middleware = createRequireAuth({
    authenticateSession: async (token) => ({
      token,
      userId: 42,
      user: {
        publicId: "user-123",
      },
    }),
  });
  const req = {
    headers: {
      authorization: "Bearer test-token",
    },
    body: {},
    query: {},
  };

  await new Promise((resolve, reject) => {
    middleware(req, {}, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  assert.equal(req.auth.token, "test-token");
  assert.equal(req.auth.userId, 42);
  assert.equal(req.body.authenticated_user_id, "user-123");
  assert.equal(req.body.authenticated_user_internal_id, 42);
  assert.equal(req.query.authenticated_user_id, "user-123");
  assert.equal(req.query.authenticated_user_internal_id, 42);
});
