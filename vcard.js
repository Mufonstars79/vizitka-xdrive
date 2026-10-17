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
