const SHEET_ID = 'ЗАМЕНИ_С_ID_НА_ТВОЯ_GOOGLE_SHEET';
const REVIEWS_SHEET = 'Reviews';
const REFERRALS_SHEET = 'Referrals';
const MAX_TEXT_LENGTH = 500;
const NOTIFY_EMAIL = 'mihailgrebenarov@gmail.com';
const GALLERY_FOLDER_ID = '1yoeaGMHqNbWb904Lt7xp4bPuDlCsMv0T';

function testMail() {
  MailApp.sendEmail(NOTIFY_EMAIL, 'Тест', 'Това е тестов имейл от Apps Script.');
}

function doGet(e) {
  if (e.parameter.type === 'gallery') {
    return jsonResponse(getGalleryPhotos());
  }
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(REVIEWS_SHEET);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const data = rows.slice(1).map((row) => toObject(headers, row));
  const approved = data
    .filter((r) => r.approved === true)
    .map((r) => ({
      name: r.name,
      category: r.category,
      period: formatPeriod(r.period),
      rating: r.rating,
      text: r.text,
      timestamp: r.timestamp,
    }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return jsonResponse(approved);
}

// Google Sheets sometimes auto-converts a typed value like "10.2026" into a
// real Date. If that happened (on older rows), show it back as "MM.YYYY"
// instead of a raw timestamp.
function formatPeriod(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return month + '.' + year;
  }
  return value;
}

function getGalleryPhotos() {
  const folder = DriveApp.getFolderById(GALLERY_FOLDER_ID);
  const files = folder.getFiles();
  const photos = [];
  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType().indexOf('image/') !== 0) continue;
    photos.push({
      url: 'https://lh3.googleusercontent.com/d/' + file.getId() + '=w1000',
      createdAt: file.getDateCreated().toISOString(),
    });
  }
  photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return photos;
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

const AUTO_APPROVE_MIN_RATING = 4;

function appendReview(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(REVIEWS_SHEET);
  const autoApproved = Number(data.rating) >= AUTO_APPROVE_MIN_RATING;
  sheet.appendRow([
    new Date().toISOString(),
    Utilities.getUuid(),
    data.name,
    data.category,
    data.period,
    Number(data.rating),
    data.text,
    Boolean(data.consent),
    autoApproved,
  ]);
  // Google Sheets auto-detects values like "10.2026" as dates; force this
  // cell back to plain text so it stores and displays exactly what was typed.
  const periodColumn = 5;
  sheet.getRange(sheet.getLastRow(), periodColumn).setNumberFormat('@').setValue(data.period);
  notifyNewReview(data, autoApproved);
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
  notifyNewReferral(data);
}

function notifyNewReview(data, autoApproved) {
  const statusLine = autoApproved
    ? 'Оценката е ' + data.rating + '★, затова отзивът вече е публикуван автоматично на сайта.'
    : 'Оценката е ' + data.rating + '★ — отзивът чака твоето одобрение в Google Sheet, преди да се покаже.';
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: autoApproved
      ? 'Нов отзив (публикуван автоматично) — Xdrive визитка'
      : 'Нов отзив чака одобрение — Xdrive визитка',
    body: statusLine + '\n\n'
      + 'Име: ' + data.name + '\n'
      + 'Категория: ' + data.category + '\n'
      + 'Период: ' + data.period + '\n'
      + 'Оценка: ' + data.rating + '/5\n'
      + 'Текст: ' + data.text + '\n\n'
      + 'Виж/коригирай в Google Sheet, таб Reviews.',
  });
}

function notifyNewReferral(data) {
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'Нова препоръка на приятел — Xdrive визитка',
    body: data.referrerName + ' препоръча приятел:\n\n'
      + 'Име на приятеля: ' + data.friendName + '\n'
      + 'Телефон: ' + data.friendPhone + '\n\n'
      + 'Виж в Google Sheet, таб Referrals.',
  });
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
