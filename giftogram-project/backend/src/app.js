const cors = require("cors");
const express = require("express");

const { createListAllUsersController } = require("./controllers/listAllUsersController");
const { createLoginController } = require("./controllers/loginController");
const { createRegisterController } = require("./controllers/registerController");
const { createSendMessageController } = require("./controllers/sendMessageController");
const { createViewMessagesController } = require("./controllers/viewMessagesController");
const { createRequireAuth } = require("./middleware/requireAuth");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { createListAllUsers } = require("./services/listAllUsers");
const { createLoginUser } = require("./services/loginUser");
const { createRegisterUser } = require("./services/registerUser");
const { createSendMessage } = require("./services/sendMessage");
const { createAuthenticateSession } = require("./services/authenticateSession");
const { createViewMessages } = require("./services/viewMessages");

function createApp({
  registerUser,
  loginUser,
  viewMessages,
  sendMessage,
  listAllUsers,
  authenticateSession,
} = {}) {
  const resolvedRegisterUser = registerUser || createRegisterUser();
  const resolvedLoginUser = loginUser || createLoginUser();
  const resolvedViewMessages = viewMessages || createViewMessages();
  const resolvedSendMessage = sendMessage || createSendMessage();
  const resolvedListAllUsers = listAllUsers || createListAllUsers();
  const resolvedAuthenticateSession = authenticateSession || createAuthenticateSession();
  const app = express();
  const requireAuth = createRequireAuth({ authenticateSession: resolvedAuthenticateSession });

  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({ message: "API running" });
  });

  app.post("/register", createRegisterController({ registerUser: resolvedRegisterUser }));
  app.post("/login", createLoginController({ loginUser: resolvedLoginUser }));
  app.get("/view_messages", requireAuth, createViewMessagesController({ viewMessages: resolvedViewMessages }));
  app.post("/send_message", requireAuth, createSendMessageController({ sendMessage: resolvedSendMessage }));
  app.get("/list_all_users", requireAuth, createListAllUsersController({ listAllUsers: resolvedListAllUsers }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
