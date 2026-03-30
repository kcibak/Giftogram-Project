const { ApiError, errorCatalog } = require("../utils/apiError");

function notFoundHandler(req, res) {
  res.status(404).json({
    error_code: 1404,
    error_title: "Not Found",
    error_message: "The requested endpoint does not exist.",
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    const validationError = errorCatalog.validation("Request body must be valid JSON.");
    res.status(validationError.statusCode).json(validationError.toResponse());
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json(err.toResponse());
    return;
  }

  const serverError = errorCatalog.internalServerError();
  res.status(serverError.statusCode).json(serverError.toResponse());
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
