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
