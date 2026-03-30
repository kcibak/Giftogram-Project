const test = require("node:test");
const assert = require("node:assert/strict");

const { createUserBlockRepository } = require("./userBlockRepository");

test("blockExistsBetweenUsers checks both directions", async () => {
  let capturedSql;
  let capturedParams;
  const repository = createUserBlockRepository({
    db: {
      async execute(sql, params) {
        capturedSql = sql;
        capturedParams = params;
        return [[{ id: 1 }]];
      },
    },
  });

  const result = await repository.blockExistsBetweenUsers(10, 20);

  assert.equal(result, true);
  assert.match(capturedSql, /WHERE \(blocker_id = \? AND blocked_id = \?\)/);
  assert.deepEqual(capturedParams, [10, 20, 20, 10]);
});

test("createBlock uses parameterized insert", async () => {
  let capturedSql;
  let capturedParams;
  const repository = createUserBlockRepository({
    db: {
      async execute(sql, params) {
        capturedSql = sql;
        capturedParams = params;
        return [{ affectedRows: 1 }];
      },
    },
  });

  await repository.createBlock(1, 2);

  assert.match(capturedSql, /INSERT INTO user_blocks/);
  assert.deepEqual(capturedParams, [1, 2]);
});

test("deleteBlock returns affected rows", async () => {
  const repository = createUserBlockRepository({
    db: {
      async execute() {
        return [{ affectedRows: 1 }];
      },
    },
  });

  const affectedRows = await repository.deleteBlock(1, 2);

  assert.equal(affectedRows, 1);
});
