const SHEET_ID = 'ЗАМЕНИ_С_ID_НА_ТВОЯ_GOOGLE_SHEET';
const REVIEWS_SHEET = 'Reviews';
const REFERRALS_SHEET = 'Referrals';
const MAX_TEXT_LENGTH = 500;

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(REVIEWS_SHEET);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const data = rows.slice(1).map((row) => toObject(headers, row));
  const approved = data
    .filter((r) => r.approved === true)
    .map((r) => ({
      name: r.name,
      category: r.category,
      period: r.period,
      rating: r.rating,
      text: r.text,
      timestamp: r.timestamp,
    }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return jsonResponse(approved);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  if (data.website && String(data.website).trim().length > 0) {
    return jsonResponse({ ok: true });
  }

  if (data.type === 'review') {
    if (!isValidReview(data)) return jsonResponse({ ok: false, error: 'invalid' });
    appendReview(data);
  } else if (data.type === 'referral') {
    if (!isValidReferral(data)) return jsonResponse({ ok: false, error: 'invalid' });
    appendReferral(data);
  } else {
    return jsonResponse({ ok: false, error: 'unknown type' });
  }

  return jsonResponse({ ok: true });
}

function isValidReview(data) {
  if (!data.name || !data.category || !data.period || !data.text) return false;
  const rating = Number(data.rating);
  if (!(rating >= 1 && rating <= 5)) return false;
  if (String(data.text).length > MAX_TEXT_LENGTH) return false;
  if (!data.consent) return false;
  return true;
}

function isValidReferral(data) {
  if (!data.referrerName || !data.friendName || !data.friendPhone) return false;
  if (!data.consent) return false;
  return true;
}

function appendReview(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(REVIEWS_SHEET);
  sheet.appendRow([
    new Date().toISOString(),
    Utilities.getUuid(),
    data.name,
    data.category,
    data.period,
    Number(data.rating),
    data.text,
    Boolean(data.consent),
    false,
  ]);
}

function appendReferral(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(REFERRALS_SHEET);
  sheet.appendRow([
    new Date().toISOString(),
    Utilities.getUuid(),
    data.referrerName,
    data.friendName,
    data.friendPhone,
    Boolean(data.consent),
  ]);
}

function toObject(headers, row) {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i]; });
  return obj;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
