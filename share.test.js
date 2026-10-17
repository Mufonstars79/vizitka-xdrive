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
