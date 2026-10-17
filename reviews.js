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

export function isHoneypotTriggered(data) {
  return Boolean(data.website && data.website.trim().length > 0);
}

export function validateReviewInput(data) {
  if (!data.name || !data.name.trim()) return { valid: false, error: 'Моля, въведи име.' };
  if (!data.category || !data.category.trim()) return { valid: false, error: 'Моля, въведи категория.' };
  if (!data.period || !data.period.trim()) return { valid: false, error: 'Моля, въведи месец/година.' };
  const rating = Number(data.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { valid: false, error: 'Моля, избери оценка от 1 до 5.' };
  }
  if (!data.text || !data.text.trim()) return { valid: false, error: 'Моля, напиши отзив.' };
  if (data.text.length > 500) return { valid: false, error: 'Отзивът е твърде дълъг (макс. 500 символа).' };
  if (!data.consent) return { valid: false, error: 'Нужно е съгласие отзивът да бъде публикуван.' };
  return { valid: true };
}

export function validateReferralInput(data) {
  if (!data.referrerName || !data.referrerName.trim()) return { valid: false, error: 'Моля, въведи твоето име.' };
  if (!data.friendName || !data.friendName.trim()) return { valid: false, error: 'Моля, въведи името на приятеля.' };
  if (!data.friendPhone || !data.friendPhone.trim()) return { valid: false, error: 'Моля, въведи телефон на приятеля.' };
  if (!data.consent) return { valid: false, error: 'Нужно е съгласие приятелят да бъде потърсен.' };
  return { valid: true };
}
