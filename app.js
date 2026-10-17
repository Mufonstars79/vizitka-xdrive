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
