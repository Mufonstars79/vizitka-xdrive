import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, sortByTimestampDesc } from './reviews.js';

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
