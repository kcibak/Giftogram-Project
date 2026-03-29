// Stricter email pattern: no consecutive dots, domain labels separated by dots, TLD length >= 2.
const EMAIL_PATTERN = /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]*[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;
const PUBLIC_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidEmail(email) {
  return EMAIL_PATTERN.test(email);
}

function isValidPassword(password) {
  return PASSWORD_PATTERN.test(password);
}

function isValidPublicId(value) {
  return PUBLIC_ID_PATTERN.test(value);
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidPublicId,
};
