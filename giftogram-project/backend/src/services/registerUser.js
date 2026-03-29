const { randomUUID } = require("node:crypto");

const { createUserRepository } = require("../repositories/userRepository");
const { toUserResponse } = require("../utils/mappers");
const { hashPassword } = require("../utils/passwordHash");
const { errorCatalog, isDuplicateEntryError } = require("../utils/apiError");
const { isValidEmail, isValidPassword } = require("../utils/validators");

function createRegisterUser({ userRepository = createUserRepository() } = {}) {
  return async function registerUser(payload = {}) {
    const normalizedInput = normalizeRegistrationInput(payload);
    validateRegistrationInput(normalizedInput);

    const userRecord = {
      publicId: randomUUID(),
      email: normalizedInput.email,
      passwordHash: await hashPassword(normalizedInput.password),
      firstName: normalizedInput.firstName,
      lastName: normalizedInput.lastName,
    };

    try {
      const createdUser = await userRepository.createUser(userRecord);

      return toUserResponse(createdUser);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw errorCatalog.emailAlreadyRegistered();
      }

      throw errorCatalog.registrationFailed();
    }
  };
}

function normalizeRegistrationInput(payload) {
  return {
    email: typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "",
    password: typeof payload.password === "string" ? payload.password : "",
    firstName: typeof payload.first_name === "string" ? payload.first_name.trim() : "",
    lastName: typeof payload.last_name === "string" ? payload.last_name.trim() : "",
  };
}

function validateRegistrationInput({ email, password, firstName, lastName }) {
  if (!email) {
    throw errorCatalog.validation("Email is required.");
  }

  if (!isValidEmail(email)) {
    throw errorCatalog.validation("Email must be a valid email address.");
  }

  if (!password) {
    throw errorCatalog.validation("Password is required.");
  }

  if (!isValidPassword(password)) {
    throw errorCatalog.validation(
      "Password must be at least 8 characters and include at least one letter and one number."
    );
  }

  if (!firstName) {
    throw errorCatalog.validation("First name is required.");
  }

  if (!lastName) {
    throw errorCatalog.validation("Last name is required.");
  }
}

module.exports = {
  createRegisterUser,
  normalizeRegistrationInput,
  validateRegistrationInput,
};
