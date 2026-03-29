const test = require("node:test");
const assert = require("node:assert/strict");

const { createUserRepository, normalizePaginationValue } = require("./userRepository");

test("listUsersExcludingPublicId uses literal limit and offset values", async () => {
  let capturedSql;
  let capturedParams;

  const userRepository = createUserRepository({
    db: {
      async query(sql, params) {
        capturedSql = sql;
        capturedParams = params;
        return [
          [
            {
              id: 2,
              public_id: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
              email: "preston@giftogram.com",
              first_name: "Preston",
              last_name: "Peck",
            },
          ],
        ];
      },
    },
  });

  const result = await userRepository.listUsersExcludingPublicId(
    "4cae9f07-6a7a-4ce3-8529-b19812b71234",
    { limit: 25, offset: 50 }
  );

  assert.match(capturedSql, /LIMIT 25 OFFSET 50/);
  assert.deepEqual(capturedParams, ["4cae9f07-6a7a-4ce3-8529-b19812b71234"]);
  assert.deepEqual(result, [
    {
      id: 2,
      publicId: "3fd2d899-0b62-4ecb-b92f-8f9ef0424dd7",
      email: "preston@giftogram.com",
      firstName: "Preston",
      lastName: "Peck",
    },
  ]);
});

test("normalizePaginationValue falls back for invalid values", () => {
  assert.equal(normalizePaginationValue(10, 50), 10);
  assert.equal(normalizePaginationValue("12", 50), 12);
  assert.equal(normalizePaginationValue(-1, 50), 50);
  assert.equal(normalizePaginationValue("oops", 50), 50);
});
