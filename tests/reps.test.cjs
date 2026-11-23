const assert = require('node:assert/strict');
const test = require('node:test');
const {read, write, total, uniform} = require('../reps.js');

test('reads legacy results with one or several equal sets', () => {
  for (const [raw, count, reps] of [['1x10', 1, 10], ['2x12', 2, 12], ['3x15', 3, 15], [' 2 Х 12 ', 2, 12], ['10', 1, 10]]) {
    const result = read(raw);
    assert.deepEqual(result, {sets: Array(count).fill(reps), reps});
    assert.equal(total(result.sets), count * reps);
    assert.equal(write(result), `${count}×${reps}`);
  }
});

test('preserves the order and repeated values of unequal sets', () => {
  const result = {sets: [12, 10, 12, 0], reps: 12};
  assert.equal(uniform(result.sets), false);
  assert.equal(total(result.sets), 34);
  assert.equal(write(result), '34 (12 / 10 / 12 / 0)');
  assert.deepEqual(read(write(result)), result);
});

test('keeps zero-result drafts without giving them any repetitions', () => {
  for (const result of [{sets: [], reps: 12}, {sets: [0, 0], reps: 0}]) {
    assert.deepEqual(read(write(result)), result);
    assert.equal(total(result.sets), 0);
  }
});

test('leaves timed, unsupported and out-of-range legacy inputs to the existing reader', () => {
  for (const raw of ['2×20 сек', '100x12', '2x1000', '28 (12 / 10 / 8)', '-1x10', '']) {
    assert.equal(read(raw), null);
  }
});
