# Електронна визитка — xDrive автоинструктор — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Статична, мобилна-първо електронна визитка на български за автоинструктор Михаил Гребенаров (xDrive), с контакти, галерия, vCard, отзиви с модерация през Google Sheets, препоръки на приятели, споделяне и QR код, публикувана в GitHub Pages.

**Architecture:** Чисти статични файлове (без build стъпка). Цялата бизнес логика, която може да се сгреши тихо (vCard форматиране, пресмятане на рейтинг, валидация на форми, текстове за споделяне), живее в малки, чисти, тествани модули (`vcard.js`, `reviews.js`, `share.js`), внасяни от `app.js`, който ги свързва с DOM и Google Apps Script бекенда. Самият Apps Script (`apps-script.gs`) живее извън repo-то изпълнение (качва се ръчно в Google Sheet), но кодът му се пази в repo-то като единствен източник на истина.

**Tech Stack:** Vanilla HTML/CSS/JS (ES modules), Google Apps Script (Web App), Google Sheets, Node.js built-in test runner (`node --test`) за unit тестовете на чистите модули, GitHub Pages ("Deploy from branch").

**Бележка за тестване:** `vcard.js`, `reviews.js` и `share.js` са чиста логика и се покриват с unit тестове. `app.js` wire-ва тази логика към DOM, `fetch` и браузърни API-та (Web Share, Clipboard, downloads) — интеграция, която не се юнит-тества смислено без emulator/jsdom инфраструктура. Вместо това всяка такава стъпка завършва с конкретна ръчна проверка в браузър, а финалната задача е пълен end-to-end чеклист. `apps-script.gs` се преглежда внимателно на ръка (логиката му огледално следва вече тествания `reviews.js`), тъй като не може да се изпълнява локално.

---

## Task 1: Скелет на проекта

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Създай `package.json`**

```json
{
  "name": "vizitka-xdrive",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Създай `.gitignore`**

```
node_modules/
```

- [ ] **Step 3: Commit**

```bash
git add package.json .gitignore
git commit -m "chore: project scaffolding"
```

---

## Task 2: Контакти (`config.js`)

**Files:**
- Create: `config.js`

- [ ] **Step 1: Създай `config.js`**

```js
export const CONFIG = {
  phone: '+359896270674',
  email: 'mihailgrebenarov@gmail.com',
  viberPhone: '+359896270674',
  whatsappPhone: '+359896270674',
  appsScriptUrl: 'ЗАМЕНИ_СЛЕД_ПУБЛИКУВАНЕ_НА_APPS_SCRIPT',
};
```

- [ ] **Step 2: Проверка на синтаксиса**

Run: `node --check config.js`
Expected: без изход.

- [ ] **Step 3: Commit**

```bash
git add config.js
git commit -m "feat: add contact configuration"
```

---

## Task 3: `vcard.js` — генериране на vCard

**Files:**
- Create: `vcard.js`
- Create: `vcard.test.js`

- [ ] **Step 1: Напиши провалящия се тест в `vcard.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVCard } from './vcard.js';

test('buildVCard includes all fields in vCard 3.0 format with CRLF line endings', () => {
  const vcf = buildVCard({
    fullName: 'Михаил Гребенаров',
    org: 'xDrive',
    title: 'Автоинструктор',
    phone: '+359896270674',
    email: 'mihailgrebenarov@gmail.com',
  });
  assert.match(vcf, /^BEGIN:VCARD\r\n/);
  assert.match(vcf, /VERSION:3\.0\r\n/);
  assert.match(vcf, /FN:Михаил Гребенаров\r\n/);
  assert.match(vcf, /ORG:xDrive\r\n/);
  assert.match(vcf, /TITLE:Автоинструктор\r\n/);
  assert.match(vcf, /TEL;TYPE=CELL:\+359896270674\r\n/);
  assert.match(vcf, /EMAIL:mihailgrebenarov@gmail\.com\r\n/);
  assert.match(vcf, /END:VCARD\r\n$/);
});
```

- [ ] **Step 2: Създай празен `vcard.js` и стартирай теста, за да видиш провал**

Run: `npm test`
Expected: FAIL — `buildVCard is not a function`.

- [ ] **Step 3: Напиши имплементацията**

```js
export function buildVCard({ fullName, org, title, phone, email }) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${fullName}`,
    `ORG:${org}`,
    `TITLE:${title}`,
    `TEL;TYPE=CELL:${phone}`,
    `EMAIL:${email}`,
    'END:VCARD',
  ];
  return lines.join('\r\n') + '\r\n';
}
```

- [ ] **Step 4: Стартирай теста отново**

Run: `npm test`
Expected: PASS (1 passing test)

- [ ] **Step 5: Commit**

```bash
git add vcard.js vcard.test.js
git commit -m "feat: add vCard builder"
```

---

## Task 4: `reviews.js` — статистика и подредба

**Files:**
- Create: `reviews.js`
- Create: `reviews.test.js`

- [ ] **Step 1: Напиши провалящите се тестове в `reviews.test.js`**

```js
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
```

- [ ] **Step 2: Създай празен `reviews.js` и стартирай тестовете, за да видиш провал**

Run: `npm test`
Expected: FAIL — `computeStats is not a function`.

- [ ] **Step 3: Напиши имплементацията**

```js
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
```

- [ ] **Step 4: Стартирай тестовете отново**

Run: `npm test`
Expected: PASS (3 passing tests)

- [ ] **Step 5: Commit**

```bash
git add reviews.js reviews.test.js
git commit -m "feat: add review stats and sorting helpers"
```

---

## Task 5: `reviews.js` — валидация на формите

**Files:**
- Modify: `reviews.js`
- Modify: `reviews.test.js`

- [ ] **Step 1: Добави провалящите се тестове**

```js
import {
  computeStats, sortByTimestampDesc, isHoneypotTriggered, validateReviewInput, validateReferralInput,
} from './reviews.js';

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
```

(добави новите имена към import реда в началото на файла, заедно с вече съществуващите `computeStats, sortByTimestampDesc`)

- [ ] **Step 2: Стартирай тестовете, за да видиш провал**

Run: `npm test`
Expected: FAIL — `isHoneypotTriggered is not a function`.

- [ ] **Step 3: Добави имплементацията в `reviews.js`**

```js
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
```

- [ ] **Step 4: Стартирай тестовете отново**

Run: `npm test`
Expected: PASS (10 passing tests общо)

- [ ] **Step 5: Commit**

```bash
git add reviews.js reviews.test.js
git commit -m "feat: add review and referral form validation"
```

---

## Task 6: `share.js` — текст и линкове за споделяне

**Files:**
- Create: `share.js`
- Create: `share.test.js`

- [ ] **Step 1: Напиши провалящите се тестове в `share.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildShareText, buildShareLinks } from './share.js';

test('buildShareText mentions the name and organization', () => {
  const text = buildShareText({ fullName: 'Михаил Гребенаров', org: 'xDrive' });
  assert.match(text, /Михаил Гребенаров/);
  assert.match(text, /xDrive/);
});

test('buildShareLinks encodes the url and text for each platform', () => {
  const links = buildShareLinks('https://example.com/card', 'Виж визитката');
  assert.match(links.viber, /^viber:\/\/forward\?text=/);
  const viberText = decodeURIComponent(links.viber.replace('viber://forward?text=', ''));
  assert.equal(viberText, 'Виж визитката https://example.com/card');
  assert.match(links.whatsapp, /^https:\/\/wa\.me\/\?text=/);
  assert.equal(links.facebook, 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Fcard');
});
```

- [ ] **Step 2: Създай празен `share.js` и стартирай тестовете, за да видиш провал**

Run: `npm test`
Expected: FAIL — `buildShareText is not a function`.

- [ ] **Step 3: Напиши имплементацията**

```js
export function buildShareText({ fullName, org }) {
  return `Препоръчвам ${fullName} (${org}) като автоинструктор — провери визитката му:`;
}

export function buildShareLinks(url, text) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${text} ${url}`);
  return {
    viber: `viber://forward?text=${encodedText}`,
    whatsapp: `https://wa.me/?text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };
}
```

- [ ] **Step 4: Стартирай тестовете отново**

Run: `npm test`
Expected: PASS (2 passing tests)

- [ ] **Step 5: Commit**

```bash
git add share.js share.test.js
git commit -m "feat: add share text and link builders"
```

---

## Task 7: Placeholder снимки

**Files:**
- Create: `images/foto-3-placeholder.svg`
- Create: `images/foto-4-placeholder.svg`

- [ ] **Step 1: Създай `images/foto-3-placeholder.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#2a3b4c"/>
  <text x="400" y="290" font-family="sans-serif" font-size="36" fill="#ffffff" text-anchor="middle">Снимка предстои</text>
  <text x="400" y="340" font-family="sans-serif" font-size="22" fill="#9db0c2" text-anchor="middle">foto-3-placeholder.svg</text>
</svg>
```

- [ ] **Step 2: Създай `images/foto-4-placeholder.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#3c2a4c"/>
  <text x="400" y="290" font-family="sans-serif" font-size="36" fill="#ffffff" text-anchor="middle">Снимка предстои</text>
  <text x="400" y="340" font-family="sans-serif" font-size="22" fill="#c29db2" text-anchor="middle">foto-4-placeholder.svg</text>
</svg>
```

- [ ] **Step 3: Commit**

```bash
git add images/foto-3-placeholder.svg images/foto-4-placeholder.svg
git commit -m "feat: add placeholder images for the photo gallery"
```

---

## Task 8: Базови стилове (`styles.css`)

**Files:**
- Create: `styles.css`

- [ ] **Step 1: Създай `styles.css`**

```css
:root {
  color-scheme: light;
  --bg: #f6f5f3;
  --card-bg: #ffffff;
  --text: #1c1c1c;
  --muted: #6b6b6b;
  --primary: #1f5fae;
  --primary-text: #ffffff;
  --border: #e0ddd6;
  --star-on: #e0a82d;
  --danger: #b3261e;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #15171a;
    --card-bg: #1f2227;
    --text: #f0efec;
    --muted: #a3a3a3;
    --primary: #5a9bdc;
    --primary-text: #0b0d10;
    --border: #2d3138;
    --star-on: #e0a82d;
    --danger: #ff6b61;
  }
}

:root[data-theme="dark"] {
  --bg: #15171a;
  --card-bg: #1f2227;
  --text: #f0efec;
  --muted: #a3a3a3;
  --primary: #5a9bdc;
  --primary-text: #0b0d10;
  --border: #2d3138;
  --star-on: #e0a82d;
  --danger: #ff6b61;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
}

main { max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }

.hero { text-align: center; }

.avatar {
  width: 128px; height: 128px; border-radius: 50%;
  object-fit: cover; border: 3px solid var(--primary);
  margin: 0 auto 10px;
}

.hero h1 { margin: 0; font-size: 1.3rem; }
.hero .role { color: var(--muted); font-size: 0.95rem; margin-top: 2px; }
.hero .org { font-weight: 700; color: var(--primary); margin-top: 4px; }
.hero .intro { margin-top: 10px; font-size: 0.92rem; line-height: 1.5; }

.contact-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
}

.btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 48px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--card-bg); color: var(--text); font-size: 0.95rem;
  font-weight: 600; cursor: pointer; text-decoration: none;
}

.btn-primary { background: var(--primary); color: var(--primary-text); border-color: var(--primary); width: 100%; }
.btn-wide { width: 100%; }

section { background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
section h2 { margin: 0 0 10px; font-size: 1.1rem; }

.services-list { margin: 0; padding-left: 18px; line-height: 1.7; }

.gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.gallery img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 10px; }

.reviews-summary { font-size: 1.05rem; font-weight: 700; margin-bottom: 10px; }
.review-card { border-top: 1px solid var(--border); padding-top: 10px; margin-top: 10px; }
.review-card:first-child { border-top: none; margin-top: 0; padding-top: 0; }
.review-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.review-stars { color: var(--star-on); font-size: 1rem; white-space: nowrap; }
.review-meta { color: var(--muted); font-size: 0.82rem; margin-top: 2px; }
.review-text { margin: 6px 0 0; font-size: 0.92rem; line-height: 1.5; }
.empty-state { color: var(--muted); font-style: italic; text-align: center; padding: 12px 0; }

form { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
label { font-size: 0.85rem; color: var(--muted); }
input[type="text"], input[type="tel"], select, textarea {
  width: 100%; min-height: 42px; padding: 8px 10px; border: 1px solid var(--border);
  border-radius: 8px; background: var(--bg); color: var(--text); font-size: 0.95rem;
  font-family: inherit;
}
textarea { min-height: 80px; resize: vertical; }

.star-picker { display: flex; gap: 4px; font-size: 1.8rem; }
.star-picker .star { cursor: pointer; color: var(--border); }
.star-picker .star.selected { color: var(--star-on); }

.checkbox-row { display: flex; align-items: flex-start; gap: 8px; font-size: 0.85rem; }
.checkbox-row input { margin-top: 3px; }

.honeypot-field { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }

.form-status { font-size: 0.88rem; color: var(--primary); }
.form-status.error { color: var(--danger); }

.share-fallback { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }

footer { text-align: center; color: var(--muted); font-size: 0.8rem; padding: 10px 0 0; }
footer a { color: var(--muted); }

[hidden] { display: none !important; }
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "feat: add mobile-first base styles"
```

---

## Task 9: `index.html` — скелет на визитката

**Files:**
- Create: `index.html`

- [ ] **Step 1: Създай `index.html`**

```html
<!doctype html>
<html lang="bg">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Михаил Гребенаров — Автоинструктор xDrive</title>
  <meta name="description" content="Автоинструктор категория B във фирма xDrive. Обучение, допълнителни часове, подготовка за изпит и опреснителни курсове." />
  <meta property="og:title" content="Михаил Гребенаров — Автоинструктор xDrive" />
  <meta property="og:description" content="Автоинструктор категория B във фирма xDrive. Запази контакт, прегледай отзиви и се запиши за час." />
  <meta property="og:image" content="images/og-image.png" />
  <meta property="og:type" content="profile" />
  <meta name="theme-color" content="#1f5fae" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main>
    <section class="hero">
      <img class="avatar" src="images/foto-1-portret.jpg" alt="Михаил Гребенаров" />
      <h1>Михаил Гребенаров</h1>
      <div class="role">Автоинструктор</div>
      <div class="org">xDrive</div>
      <p class="intro">
        [ТУК РЕДАКТИРАЙ: 2–3 изречения за себе си — опит, подход към обучението, защо да изберат теб.]
      </p>
    </section>

    <div class="contact-grid">
      <button id="call-btn" class="btn">📞 Обади се</button>
      <button id="viber-btn" class="btn">💬 Viber</button>
      <button id="whatsapp-btn" class="btn">🟢 WhatsApp</button>
      <button id="email-btn" class="btn">✉️ Имейл</button>
    </div>

    <button id="book-btn" class="btn btn-primary btn-wide">📅 Запиши се за час</button>
    <button id="save-contact-btn" class="btn btn-wide">👤 Запази контакта</button>

    <section>
      <h2>Какво предлагам</h2>
      <ul class="services-list">
        <li>Обучение категория B</li>
        <li>Допълнителни часове</li>
        <li>Подготовка за изпит</li>
        <li>Опреснителни курсове за шофьори с книжка</li>
      </ul>
    </section>

    <section>
      <h2>Снимки</h2>
      <div class="gallery">
        <img src="images/foto-1-portret.jpg" alt="Михаил Гребенаров" />
        <img src="images/foto-2-kolata.jpg" alt="Служебният автомобил на xDrive" />
        <img src="images/foto-3-placeholder.svg" alt="Снимка предстои" />
        <img src="images/foto-4-placeholder.svg" alt="Снимка предстои" />
      </div>
    </section>

    <section id="reviews-section">
      <h2>Отзиви</h2>
      <div id="reviews-summary" class="reviews-summary" hidden></div>
      <div id="reviews-empty" class="empty-state">Бъди първият, който ще остави отзив.</div>
      <div id="reviews-list"></div>

      <form id="review-form">
        <label for="review-name">Име</label>
        <input id="review-name" type="text" maxlength="60" required />

        <label for="review-category">Категория</label>
        <input id="review-category" type="text" maxlength="20" placeholder="напр. B" required />

        <label for="review-period">Месец/година на обучение</label>
        <input id="review-period" type="text" maxlength="20" placeholder="напр. 09.2026" required />

        <label>Оценка</label>
        <div class="star-picker" id="star-picker">
          <span class="star" data-value="1">★</span>
          <span class="star" data-value="2">★</span>
          <span class="star" data-value="3">★</span>
          <span class="star" data-value="4">★</span>
          <span class="star" data-value="5">★</span>
        </div>
        <input type="hidden" id="review-rating" value="0" />

        <label for="review-text">Отзив</label>
        <textarea id="review-text" maxlength="500" required></textarea>

        <div class="checkbox-row">
          <input type="checkbox" id="review-consent" />
          <label for="review-consent">Съгласен съм отзивът да бъде публикуван на сайта.</label>
        </div>

        <div class="honeypot-field">
          <label for="review-website">Website</label>
          <input type="text" id="review-website" tabindex="-1" autocomplete="off" />
        </div>

        <button type="submit" class="btn btn-primary btn-wide">Изпрати отзив</button>
        <p id="review-status" class="form-status" hidden></p>
      </form>
    </section>

    <section>
      <h2>Препоръчай ме</h2>
      <button id="share-btn" class="btn btn-primary btn-wide">📤 Сподели визитката</button>
      <div id="share-fallback" class="share-fallback" hidden>
        <button id="copy-link-btn" class="btn btn-wide">Копирай линк</button>
        <a id="share-viber" class="btn btn-wide" href="#">Сподели във Viber</a>
        <a id="share-whatsapp" class="btn btn-wide" href="#">Сподели в WhatsApp</a>
        <a id="share-facebook" class="btn btn-wide" href="#">Сподели във Facebook</a>
      </div>
    </section>

    <section>
      <h2>Препоръчай приятел</h2>
      <form id="referral-form">
        <label for="referrer-name">Твоето име</label>
        <input id="referrer-name" type="text" maxlength="60" required />

        <label for="friend-name">Име на приятеля</label>
        <input id="friend-name" type="text" maxlength="60" required />

        <label for="friend-phone">Телефон на приятеля</label>
        <input id="friend-phone" type="tel" maxlength="30" required />

        <div class="checkbox-row">
          <input type="checkbox" id="referral-consent" />
          <label for="referral-consent">Приятелят е съгласен да бъде потърсен.</label>
        </div>

        <div class="honeypot-field">
          <label for="referral-website">Website</label>
          <input type="text" id="referral-website" tabindex="-1" autocomplete="off" />
        </div>

        <button type="submit" class="btn btn-primary btn-wide">Изпрати препоръка</button>
        <p id="referral-status" class="form-status" hidden></p>
      </form>
    </section>

    <footer>
      <p>© 2026 xDrive · <a href="privacy.html">Поверителност</a></p>
    </footer>
  </main>

  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Ръчна проверка — страницата се зарежда**

Run: `npx --yes serve . -l 8070` (в отделен терминал)
Отвори `http://localhost:8070/index.html`. Очаквано: виждат се всички секции и двете реални снимки; бутоните все още не правят нищо (JS идва в следващите задачи) — нормално на този етап.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add business card page skeleton"
```

---

## Task 10: `privacy.html`

**Files:**
- Create: `privacy.html`

- [ ] **Step 1: Създай `privacy.html`**

```html
<!doctype html>
<html lang="bg">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Поверителност — xDrive</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main>
    <section>
      <h2>Поверителност</h2>
      <p>
        При изпращане на отзив записваме: име (или кратко име по избор), категория,
        месец/година на обучение, оценка и текста на отзива. Отзивът се показва на сайта
        само след одобрение и само ако си отбелязал съгласие за публикуване.
      </p>
      <p>
        При препоръка на приятел записваме твоето име, името и телефона на приятеля.
        Тези данни <strong>никога не се показват публично</strong> на сайта — използват се
        единствено за да се свържем с препоръчания човек.
      </p>
      <p>
        Ако искаш отзив или препоръка да бъдат изтрити, пиши на
        <a href="mailto:mihailgrebenarov@gmail.com">mihailgrebenarov@gmail.com</a>
        или се обади на <a href="tel:+359896270674">+359 896 270 674</a>.
      </p>
    </section>
    <p><a href="index.html">← Назад към визитката</a></p>
  </main>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add privacy.html
git commit -m "feat: add privacy page"
```

---

## Task 11: `app.js` — контакти и vCard

**Files:**
- Create: `app.js`

- [ ] **Step 1: Създай `app.js` с логиката за контактите**

```js
import { CONFIG } from './config.js';
import { buildVCard } from './vcard.js';

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
```

- [ ] **Step 2: Ръчна проверка на синтаксиса**

Run: `node --check app.js`
Expected: без изход.

- [ ] **Step 3: Ръчна проверка в браузър**

С `npx --yes serve .` стартиран, отвори сайта на телефон (или chrome DevTools device mode) и провери: "Обади се" отваря tel: диалог, "Запази контакта" сваля `.vcf` файл, който при отваряне показва правилно име/телефон/имейл.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: wire up contact buttons and vCard download"
```

---

## Task 12: `app.js` — зареждане и показване на отзиви

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Добави логиката за зареждане на отзиви в края на `app.js`**

Добави към `import` реда от `./reviews.js`:

```js
import { computeStats, sortByTimestampDesc } from './reviews.js';
```

Добави в края на файла:

```js
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
```

- [ ] **Step 2: Ръчна проверка на синтаксиса**

Run: `node --check app.js`
Expected: без изход. Реалното зареждане на отзиви изисква истински Apps Script URL — проверява се ръчно в Task 19, след настройка на бекенда.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: load and render approved reviews"
```

---

## Task 13: `app.js` — изпращане на нов отзив

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Добави логиката за звездния picker и изпращането на отзив**

Добави към `import` реда от `./reviews.js`:

```js
import {
  computeStats, sortByTimestampDesc, isHoneypotTriggered, validateReviewInput,
} from './reviews.js';
```

Добави в края на файла:

```js
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
```

- [ ] **Step 2: Ръчна проверка на синтаксиса**

Run: `node --check app.js`
Expected: без изход. Реалното изпращане се проверява ръчно в Task 19.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: submit new reviews with honeypot and validation"
```

---

## Task 14: `app.js` — изпращане на препоръка

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Добави логиката за формата за препоръка**

Добави към `import` реда от `./reviews.js`:

```js
import {
  computeStats, sortByTimestampDesc, isHoneypotTriggered, validateReviewInput, validateReferralInput,
} from './reviews.js';
```

Добави в края на файла:

```js
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
```

- [ ] **Step 2: Ръчна проверка на синтаксиса**

Run: `node --check app.js`
Expected: без изход.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: submit friend referrals"
```

---

## Task 15: `app.js` — споделяне на визитката

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Добави импорта на `share.js` и логиката за споделяне**

Добави в началото на файла (към съществуващите импорти):

```js
import { buildShareText, buildShareLinks } from './share.js';
```

Добави в края на файла:

```js
const shareBtn = document.getElementById('share-btn');
const shareFallback = document.getElementById('share-fallback');
const copyLinkBtn = document.getElementById('copy-link-btn');

const pageUrl = window.location.href;
const shareText = buildShareText({ fullName: 'Михаил Гребенаров', org: 'xDrive' });
const shareLinks = buildShareLinks(pageUrl, shareText);

document.getElementById('share-viber').href = shareLinks.viber;
document.getElementById('share-whatsapp').href = shareLinks.whatsapp;
document.getElementById('share-facebook').href = shareLinks.facebook;

shareBtn.addEventListener('click', async () => {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'xDrive — Михаил Гребенаров', text: shareText, url: pageUrl });
      return;
    } catch (err) {
      // потребителят е отказал или е възникнала грешка – показваме резервния вариант
    }
  }
  shareFallback.hidden = false;
});

copyLinkBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(pageUrl);
    copyLinkBtn.textContent = 'Копирано!';
    setTimeout(() => { copyLinkBtn.textContent = 'Копирай линк'; }, 2000);
  } catch (err) {
    // clipboard недостъпен на този браузър – бутоните за Viber/WhatsApp/Facebook остават работещи
  }
});
```

- [ ] **Step 2: Ръчна проверка на синтаксиса**

Run: `node --check app.js`
Expected: без изход.

- [ ] **Step 3: Ръчна проверка в браузър**

С `npx --yes serve .`, отвори сайта на телефон (Web Share API работи само на мобилни/HTTPS) и натисни "Сподели визитката" — трябва да се отвори системното меню за споделяне. На десктоп browser без поддръжка — трябва да се покажат резервните бутони.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: add share button with Web Share API and fallback links"
```

---

## Task 16: Google Apps Script бекенд

**Files:**
- Create: `apps-script.gs`

- [ ] **Step 1: Създай `apps-script.gs`**

```js
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
```

**Важно за реда на колоните:** `appendRow` пише по позиция, затова табовете "Reviews" и "Referrals" в Google Sheet трябва да имат заглавен ред точно в този ред — вижте Task 20 (README) за точния списък.

- [ ] **Step 2: Commit**

```bash
git add apps-script.gs
git commit -m "feat: add Google Apps Script backend for reviews and referrals"
```

---

## Task 17: OG изображение за споделяне

**Files:**
- Create: `tools/og-template.html`
- Create: `images/og-image.png` (генериран файл)

- [ ] **Step 1: Създай `tools/og-template.html`**

```html
<!doctype html>
<html lang="bg">
<head>
<meta charset="UTF-8" />
<style>
  body {
    margin: 0; width: 1200px; height: 630px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #1f5fae 0%, #123a6e 100%);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .card { color: #ffffff; text-align: center; padding: 40px; }
  .name { font-size: 64px; font-weight: 800; margin: 0; }
  .role { font-size: 32px; margin: 16px 0 0; opacity: 0.9; }
  .org { font-size: 40px; font-weight: 800; margin-top: 24px; letter-spacing: 2px; }
</style>
</head>
<body>
  <div class="card">
    <p class="name">Михаил Гребенаров</p>
    <p class="role">Автоинструктор</p>
    <p class="org">xDrive</p>
  </div>
</body>
</html>
```

- [ ] **Step 2: Генерирай PNG-то с headless Chrome**

Run (от корена на проекта, замени пътя до Chrome ако е различен):

```bash
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
[ -f "$CH" ] || CH="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
"$CH" --headless --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot="images/og-image.png" "file:///$(pwd)/tools/og-template.html"
```

Expected: файл `images/og-image.png` с размер около 1200×630.

- [ ] **Step 3: Commit**

```bash
git add tools/og-template.html images/og-image.png
git commit -m "feat: add Open Graph preview image"
```

---

## Task 18: README — настройка на Google Sheet, Apps Script и деплой

**Files:**
- Create: `README.md`

- [ ] **Step 1: Създай `README.md`**

```markdown
# Електронна визитка — xDrive автоинструктор

Статична визитка на български: контакти, галерия, vCard, отзиви с модерация, препоръки на приятели.

## 1. Създаване на Google Sheet

1. Отвори https://sheets.google.com и създай нова таблица, напр. "xDrive отзиви".
2. Преименувай първия таб на **Reviews** и въведи заглавен ред (ред 1), точно в този ред:

   `timestamp | id | name | category | period | rating | text | consent | approved`

3. Добави нов таб (долу вляво, "+") и го преименувай на **Referrals**, заглавен ред:

   `timestamp | id | referrerName | friendName | friendPhone | consent`

4. От URL адреса на таблицата копирай ID-то — частта между `/d/` и `/edit`:
   `https://docs.google.com/spreadsheets/d/ТОВА_Е_ID-ТО/edit`

## 2. Публикуване на Apps Script

1. В таблицата: **Extensions → Apps Script**.
2. Изтрий примерния код и постави съдържанието на `apps-script.gs` от този проект.
3. Замени `ЗАМЕНИ_С_ID_НА_ТВОЯ_GOOGLE_SHEET` с ID-то от стъпка 1.4.
4. **Deploy → New deployment** → тип "Web app":
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Натисни "Deploy", разреши достъпа (ще поиска потвърждение на Google акаунта), и копирай показания **Web app URL**.

## 3. Свързване на сайта с бекенда

Отвори `config.js` в проекта и замени:

```js
appsScriptUrl: 'ЗАМЕНИ_СЛЕД_ПУБЛИКУВАНЕ_НА_APPS_SCRIPT',
```

с реалния Web app URL от стъпка 2.5.

## 4. Локално тестване

```bash
npx --yes serve .
```

Отвори показания адрес и провери всички бутони, формата за отзив и формата за препоръка.

## 5. Деплой в GitHub Pages

1. Създай ново **публично** GitHub repo (напр. `vizitka-xdrive`) под акаунт Mufonstars79.
2. От тази папка:

```bash
git remote add origin https://github.com/Mufonstars79/vizitka-xdrive.git
git branch -M main
git push -u origin main
```

3. В GitHub repo → **Settings → Pages** → Source: **"Deploy from a branch"** → Branch: `main`, папка `/ (root)` → Save.
4. След 1-2 минути сайтът е на `https://mufonstars79.github.io/vizitka-xdrive/`.

## 6. Одобряване на отзиви от телефона

1. Отвори приложението **Google Sheets** на телефона.
2. Отвори таблицата с отзивите, таб **Reviews**.
3. Намери новия ред (`approved` = невярно) и чекни колоната **approved**.
4. Отзивът ще се появи на сайта при следващото зареждане на страницата от посетител.

## 7. Смяна на снимки, текст и лого

- Снимките в галерията: замени файловете `images/foto-1-portret.jpg`, `foto-2-kolata.jpg`, `foto-3-placeholder.svg`, `foto-4-placeholder.svg` със свои — просто качи нов файл със **същото име**, или смени `src` атрибута в `index.html`.
- Текстът "2–3 изречения за себе си" в `index.html` (секция `hero`) е маркиран с `[ТУК РЕДАКТИРАЙ: ...]` — замени го.
- Логото на xDrive: засега има само текст "xDrive". Когато получиш официално лого, добави `images/logo.png` и го сложи в `index.html` до/вместо текста.

## 8. QR код

След като сайтът е публикуван в GitHub Pages и знаеш финалния URL:

```bash
npx --yes qrcode@1.5.3 "https://mufonstars79.github.io/vizitka-xdrive/" -o qr-code.png
```

Файлът `qr-code.png` е готов за принтиране на визитки или за колата.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add Google Sheet, Apps Script and GitHub Pages setup instructions"
```

---

## Task 19: Създаване на GitHub repo и деплой

**Files:** (без файлови промени — само git/GitHub операции)

- [ ] **Step 1: Потвърди с потребителя преди да продължиш**

Тази задача пуши код в публичен GitHub repo и прави реален деплой — изисква изричното съгласие на потребителя преди изпълнение.

- [ ] **Step 2: Създай GitHub repo (с потвърждение)**

```bash
gh repo create vizitka-xdrive --public --source=. --remote=origin
```

Ако `gh` не е наличен — създай repo-то ръчно на github.com (виж README, точка 5), после:

```bash
git remote add origin https://github.com/Mufonstars79/vizitka-xdrive.git
```

- [ ] **Step 3: Push**

```bash
git branch -M main
git push -u origin main
```

- [ ] **Step 4: Включи GitHub Pages**

```bash
gh api -X POST repos/Mufonstars79/vizitka-xdrive/pages -f "source[branch]=main" -f "source[path]=/"
```

Или ръчно през Settings → Pages (виж README).

- [ ] **Step 5: Провери деплоя**

Run: `gh api repos/Mufonstars79/vizitka-xdrive/pages --jq .html_url`
Отвори върнатия адрес в браузър след 1-2 минути.

---

## Task 20: QR код

**Files:**
- Create: `qr-code.png`

- [ ] **Step 1: Генерирай QR кода към финалния URL**

Run:

```bash
npx --yes qrcode@1.5.3 "https://mufonstars79.github.io/vizitka-xdrive/" -o qr-code.png
```

Expected: създаден файл `qr-code.png` в корена на проекта.

- [ ] **Step 2: Commit**

```bash
git add qr-code.png
git commit -m "feat: add QR code pointing to the live site"
git push
```

---

## Task 21: Пълна ръчна end-to-end проверка

**Files:** (без файлови промени — проверка)

- [ ] **Step 1: Контакти и vCard**

На живия сайт: провери "Обади се", Viber, WhatsApp, Имейл бутоните отварят правилните приложения/диалози. Свали контакта и провери, че .vcf файлът съдържа правилно име, телефон, имейл, организация.

- [ ] **Step 2: Галерия**

Провери, че и четирите снимки се зареждат (2 реални + 2 placeholder), не прелива хоризонтално на телефон.

- [ ] **Step 3: Отзиви — изпращане**

Изпрати тестов отзив през формата. Провери в Google Sheet (таб Reviews), че се е появил нов ред с `approved = FALSE`.

- [ ] **Step 4: Отзиви — одобрение и показване**

Чекни `approved` в Google Sheet от телефона (през Google Sheets приложението). Презареди сайта — отзивът трябва да се появи в списъка, средната оценка и броят да се обновят.

- [ ] **Step 5: Честен спам тест**

Попълни отзив формата, но и honeypot полето (през browser DevTools, задай стойност на `#review-website`), после изпрати. Провери в Google Sheet, че **не** се е появил нов ред.

- [ ] **Step 6: Препоръка на приятел**

Изпрати тестова препоръка. Провери в Google Sheet (таб Referrals), че данните са записани и че **нищо** от тях не се вижда на живия сайт.

- [ ] **Step 7: Споделяне**

На телефон: натисни "Сподели визитката" — трябва да се отвори системното меню за споделяне. На десктоп: трябва да се покажат резервните бутони (Копирай линк, Viber, WhatsApp, Facebook) и копирането да работи.

- [ ] **Step 8: Open Graph preview**

Прати линка на сайта в Viber или Facebook Messenger (на себе си) и провери, че се показва preview с картинка, заглавие и описание.

- [ ] **Step 9: Тъмен/светъл режим**

Смени системната тема на телефона/компютъра между светла и тъмна и провери, че сайтът остава четим и в двата режима.
