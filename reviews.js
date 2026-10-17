export function computeStats(reviews) {
  if (!reviews || reviews.length === 0) {
    return { average: 0, count: 0 };
  }
  const sum = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
  const average = Math.round((sum / reviews.length) * 10) / 10;
  return { average, count: reviews.length };
}

export function sortByTimestampDesc(reviews) {
  return [...reviews].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
