class ApiError extends Error {
  constructor(statusCode, errorCode, errorTitle, errorMessage) {
    super(errorMessage);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errorTitle = errorTitle;
    this.errorMessage = errorMessage;
  }

  toResponse() {
    return {
      error_code: this.errorCode,
      error_title: this.errorTitle,
      error_message: this.errorMessage,
    };
  }
}

const errorCatalog = {
  validation(message) {
    return new ApiError(400, 1001, "Validation Error", message);
  },
  emailAlreadyRegistered() {
    return new ApiError(409, 1002, "Email Already Registered", "An account already exists for this email.");
  },
  registrationFailed() {
    return new ApiError(500, 1003, "Registration Failed", "Unable to register the user at this time.");
  },
  loginFailure() {
    return new ApiError(401, 1101, "Login Failure", "Email or password was invalid.");
  },
  loginFailed() {
    return new ApiError(500, 1102, "Login Failed", "Unable to log in at this time.");
  },
  authMissingToken() {
    return new ApiError(401, 1601, "Authentication Required", "A valid bearer token is required.");
  },
  authInvalidToken() {
    return new ApiError(401, 1602, "Invalid Session", "The provided session token is invalid.");
  },
  authExpiredToken() {
    return new ApiError(401, 1603, "Session Expired", "The current session has expired.");
  },
  authUserMismatch() {
    return new ApiError(403, 1604, "Forbidden", "You are not authorized to access this resource.");
  },
  viewMessagesUserNotFound() {
    return new ApiError(404, 1201, "User Not Found", "One or more users could not be found.");
  },
  viewMessagesFailed() {
    return new ApiError(500, 1202, "View Messages Failed", "Unable to retrieve messages at this time.");
  },
  sendMessageUserNotFound() {
    return new ApiError(404, 1301, "User Not Found", "The sender or receiver could not be found.");
  },
  messageSendFailed() {
    return new ApiError(500, 1302, "Message Send Failed", "Unable to send the message at this time.");
  },
  messageBlocked() {
    return new ApiError(403, 1303, "Message Blocked", "A block exists between these users, so the message cannot be sent.");
  },
  listUsersUserNotFound() {
    return new ApiError(404, 1501, "User Not Found", "The requester could not be found.");
  },
  listUsersFailed() {
    return new ApiError(500, 1502, "List Users Failed", "Unable to retrieve users at this time.");
  },
  internalServerError() {
    return new ApiError(500, 1500, "Internal Server Error", "An unexpected server error occurred.");
  },
};

function isDuplicateEntryError(error) {
  return error && error.code === "ER_DUP_ENTRY";
}

module.exports = {
  ApiError,
  errorCatalog,
  isDuplicateEntryError,
};
