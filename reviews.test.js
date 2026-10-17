import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStats, sortByTimestampDesc, isHoneypotTriggered, validateReviewInput, validateReferralInput,
} from './reviews.js';

test('computeStats returns zeroes for an empty list', () => {
  assert.deepEqual(computeStats([]), { average: 0, count: 0 });
});

test('computeStats averages ratings rounded to one decimal', () => {
  const reviews = [{ rating: 5 }, { rating: 4 }, { rating: 5 }];
  assert.deepEqual(computeStats(reviews), { average: 4.7, count: 3 });
});

test('sortByTimestampDesc orders newest first without mutating the input', () => {
  const reviews = [
    { id: 'a', timestamp: '2026-01-01T10:00:00Z' },
    { id: 'b', timestamp: '2026-03-01T10:00:00Z' },
    { id: 'c', timestamp: '2026-02-01T10:00:00Z' },
  ];
  const sorted = sortByTimestampDesc(reviews);
  assert.deepEqual(sorted.map((r) => r.id), ['b', 'c', 'a']);
  assert.deepEqual(reviews.map((r) => r.id), ['a', 'b', 'c']);
});

test('isHoneypotTriggered is true only when the honeypot field has content', () => {
  assert.equal(isHoneypotTriggered({ website: '' }), false);
  assert.equal(isHoneypotTriggered({ website: '   ' }), false);
  assert.equal(isHoneypotTriggered({}), false);
  assert.equal(isHoneypotTriggered({ website: 'http://spam.example' }), true);
});

test('validateReviewInput rejects a missing name', () => {
  const result = validateReviewInput({
    name: '', category: 'B', period: '09.2026', rating: 5, text: 'Супер!', consent: true,
  });
  assert.equal(result.valid, false);
});

test('validateReviewInput rejects a rating outside 1-5', () => {
  const result = validateReviewInput({
    name: 'Иван', category: 'B', period: '09.2026', rating: 6, text: 'Супер!', consent: true,
  });
  assert.equal(result.valid, false);
});

test('validateReviewInput rejects text over 500 characters', () => {
  const result = validateReviewInput({
    name: 'Иван', category: 'B', period: '09.2026', rating: 5, text: 'x'.repeat(501), consent: true,
  });
  assert.equal(result.valid, false);
});

test('validateReviewInput rejects missing consent', () => {
  const result = validateReviewInput({
    name: 'Иван', category: 'B', period: '09.2026', rating: 5, text: 'Супер!', consent: false,
  });
  assert.equal(result.valid, false);
});

test('validateReviewInput accepts a fully valid review', () => {
  const result = validateReviewInput({
    name: 'Иван', category: 'B', period: '09.2026', rating: 5, text: 'Супер!', consent: true,
  });
  assert.equal(result.valid, true);
});

test('validateReferralInput requires friend name and phone plus consent', () => {
  assert.equal(validateReferralInput({ referrerName: 'Иван', friendName: '', friendPhone: '0888', consent: true }).valid, false);
  assert.equal(validateReferralInput({ referrerName: 'Иван', friendName: 'Петър', friendPhone: '', consent: true }).valid, false);
  assert.equal(validateReferralInput({ referrerName: 'Иван', friendName: 'Петър', friendPhone: '0888', consent: false }).valid, false);
  assert.equal(validateReferralInput({ referrerName: 'Иван', friendName: 'Петър', friendPhone: '0888', consent: true }).valid, true);
});
