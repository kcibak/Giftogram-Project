const test = require("node:test");
const assert = require("node:assert/strict");

const { isValidEmail } = require("./validators");

test("isValidEmail accepts common valid addresses", () => {
  assert.equal(isValidEmail("user.name+tag@example.co.uk"), true);
  assert.equal(isValidEmail("a_b-c.d@example.io"), true);
});

test("isValidEmail rejects consecutive dots in domain", () => {
  assert.equal(isValidEmail("test@domain..com"), false);
});

test("isValidEmail rejects too-short TLD", () => {
  assert.equal(isValidEmail("a@b.c"), false);
});

test("isValidEmail rejects empty or whitespace", () => {
  assert.equal(isValidEmail(""), false);
  assert.equal(isValidEmail("   @example.com"), false);
});
