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

test('reads legacy seconds with alternate separators and units', () => {
  for (const [raw, sets] of [
    ['2×20 сек', [20, 20]], ['3x30 сек', [30, 30, 30]], ['1×45 сек', [45]],
    [' 2 х 20 секунд ', [20, 20]], ['2 Х 20 с.', [20, 20]], ['2*20SEC', [20, 20]],
    ['20″', [20]], ['45', [45]], ['1 × 0,5 минуты', [30]], ['1:05', [65]], ['2×1 мин. 5 сек', [65, 65]]
  ]) assert.deepEqual(read(raw, 'sec'), {sets, reps: sets[0]});
});

test('round-trips uniform and mixed time in the unit of the card', () => {
  for (const [unit, sets, encoded] of [
    ['sec', [20, 20], '2×20 сек'], ['sec', [20, 25, 15], '60 (20 / 25 / 15) сек'],
    ['min', [2100], '1×35 мин'], ['min', [120, 180], '5 (2 / 3) мин'],
    ['min', [61, 95], '2.6 (1.016666667 / 1.583333333) мин']
  ]) {
    const result = {sets, reps: sets[0]};
    assert.equal(write(result, unit), encoded);
    assert.deepEqual(read(encoded, unit), result);
    assert.equal(total(read(encoded, unit).sets), total(sets));
  }
});

test('uses minutes by default for older cardio records and preserves sub-minute durations', () => {
  for (const [raw, reps] of [['35', 2100], [' 35 минут ', 2100], ['1,5 мин.', 90], ['90 сек', 90], ['1:30', 90], ['1 мин 30 сек', 90]]) {
    assert.deepEqual(read(raw, 'min'), {sets: [reps], reps});
  }
  const draft = {sets: [], reps: 2100};
  assert.deepEqual(read(write(draft, 'min'), 'min'), draft);
});

test('preserves unrecognized time strings for display by the app', () => {
  for (const raw of ['примерно 2×20 сек', '20–30 секунд', '2×20 раз', '-20 сек', '2×1000 сек', '61 (20 / 25 / 15) сек']) {
    assert.equal(read(raw, 'sec'), null);
  }
});
