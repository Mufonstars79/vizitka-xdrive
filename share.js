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
