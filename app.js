import { CONFIG } from './config.js';
import { buildVCard } from './vcard.js';
import {
  computeStats, sortByTimestampDesc, isHoneypotTriggered, validateReviewInput, validateReferralInput,
} from './reviews.js';

document.getElementById('call-btn').addEventListener('click', () => {
  window.location.href = `tel:${CONFIG.phone}`;
});

document.getElementById('viber-btn').addEventListener('click', () => {
  window.location.href = `viber://chat?number=${encodeURIComponent(CONFIG.viberPhone)}`;
});

document.getElementById('whatsapp-btn').addEventListener('click', () => {
  const digits = CONFIG.whatsappPhone.replace(/[^0-9]/g, '');
  window.location.href = `https://wa.me/${digits}`;
});

document.getElementById('email-btn').addEventListener('click', () => {
  window.location.href = `mailto:${CONFIG.email}`;
});

document.getElementById('book-btn').addEventListener('click', () => {
  window.location.href = `viber://chat?number=${encodeURIComponent(CONFIG.viberPhone)}`;
});

document.getElementById('save-contact-btn').addEventListener('click', () => {
  const vcf = buildVCard({
    fullName: 'Михаил Гребенаров',
    org: 'xDrive',
    title: 'Автоинструктор',
    phone: CONFIG.phone,
    email: CONFIG.email,
  });
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mihail-grebenarov-xdrive.vcf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

const summaryEl = document.getElementById('reviews-summary');
const emptyEl = document.getElementById('reviews-empty');
const listEl = document.getElementById('reviews-list');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderReviews(reviews) {
  const { average, count } = computeStats(reviews);
  if (count === 0) {
    summaryEl.hidden = true;
    emptyEl.hidden = false;
    listEl.innerHTML = '';
    return;
  }
  summaryEl.hidden = false;
  emptyEl.hidden = true;
  summaryEl.textContent = `★ ${average} от 5 (${count} отзива)`;

  const sorted = sortByTimestampDesc(reviews);
  listEl.innerHTML = '';
  sorted.forEach((r) => {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="review-head">
        <strong>${escapeHtml(r.name)}</strong>
        <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
      </div>
      <div class="review-meta">${escapeHtml(r.category)} · ${escapeHtml(r.period)}</div>
      <p class="review-text">${escapeHtml(r.text)}</p>
    `;
    listEl.appendChild(card);
  });
}

async function loadReviews() {
  try {
    const res = await fetch(CONFIG.appsScriptUrl);
    const reviews = await res.json();
    renderReviews(reviews);
  } catch (err) {
    emptyEl.textContent = 'Отзивите не успяха да се заредят в момента.';
    emptyEl.hidden = false;
  }
}

loadReviews();

let selectedRating = 0;

document.querySelectorAll('#star-picker .star').forEach((starBtn) => {
  starBtn.addEventListener('click', () => {
    selectedRating = Number(starBtn.dataset.value);
    document.getElementById('review-rating').value = selectedRating;
    document.querySelectorAll('#star-picker .star').forEach((s) => {
      s.classList.toggle('selected', Number(s.dataset.value) <= selectedRating);
    });
  });
});

const reviewForm = document.getElementById('review-form');
const reviewStatus = document.getElementById('review-status');

reviewForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    type: 'review',
    name: document.getElementById('review-name').value,
    category: document.getElementById('review-category').value,
    period: document.getElementById('review-period').value,
    rating: document.getElementById('review-rating').value,
    text: document.getElementById('review-text').value,
    consent: document.getElementById('review-consent').checked,
    website: document.getElementById('review-website').value,
  };

  reviewStatus.classList.remove('error');

  if (isHoneypotTriggered(data)) {
    reviewStatus.textContent = 'Благодаря! Отзивът ти чака одобрение.';
    reviewStatus.hidden = false;
    reviewForm.reset();
    return;
  }

  const result = validateReviewInput(data);
  if (!result.valid) {
    reviewStatus.textContent = result.error;
    reviewStatus.classList.add('error');
    reviewStatus.hidden = false;
    return;
  }

  try {
    await fetch(CONFIG.appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
    });
    reviewStatus.textContent = 'Благодаря! Отзивът ти чака одобрение.';
    reviewForm.reset();
    selectedRating = 0;
    document.querySelectorAll('#star-picker .star').forEach((s) => s.classList.remove('selected'));
  } catch (err) {
    reviewStatus.textContent = 'Нещо се обърка. Опитай отново по-късно.';
    reviewStatus.classList.add('error');
  }
  reviewStatus.hidden = false;
});

const referralForm = document.getElementById('referral-form');
const referralStatus = document.getElementById('referral-status');

referralForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    type: 'referral',
    referrerName: document.getElementById('referrer-name').value,
    friendName: document.getElementById('friend-name').value,
    friendPhone: document.getElementById('friend-phone').value,
    consent: document.getElementById('referral-consent').checked,
    website: document.getElementById('referral-website').value,
  };

  referralStatus.classList.remove('error');

  if (isHoneypotTriggered(data)) {
    referralStatus.textContent = 'Благодаря! Ще се свържем с приятеля ти.';
    referralStatus.hidden = false;
    referralForm.reset();
    return;
  }

  const result = validateReferralInput(data);
  if (!result.valid) {
    referralStatus.textContent = result.error;
    referralStatus.classList.add('error');
    referralStatus.hidden = false;
    return;
  }

  try {
    await fetch(CONFIG.appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
    });
    referralStatus.textContent = 'Благодаря! Ще се свържем с приятеля ти.';
    referralForm.reset();
  } catch (err) {
    referralStatus.textContent = 'Нещо се обърка. Опитай отново по-късно.';
    referralStatus.classList.add('error');
  }
  referralStatus.hidden = false;
});
