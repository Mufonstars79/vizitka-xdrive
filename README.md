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
