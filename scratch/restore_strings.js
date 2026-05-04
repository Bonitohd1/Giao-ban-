const fs = require('fs');

function restoreString(s) {
  const charToByte = (c) => {
    const code = c.charCodeAt(0);
    // Extended map based on observation of corrupted file
    const map = {
      0x0102: 0xC3, // Ă -> C3
      0x00E1: 0xE1, // á -> E1
      0x00BB: 0xBB, // » -> BB
      0x00B9: 0xB9, // ¹ -> B9
      0x00AA: 0xAA, // ª -> AA
      0x00BA: 0xBA, // º -> BA
      0x00C4: 0xC4, // Ä -> C4
      0x00C5: 0xC5, // Å -> C5
      0x00C6: 0xC6, // Æ -> C6
      0x0103: 0xC3, // ă? maybe
      0x0111: 0xF0, // đ -> F0 (for emojis)
      0x0178: 0x9F, // Ÿ -> 9F
      0x201C: 0x93, // “ -> 93
      0x0160: 0x8A, // Š -> 8A
      0x0152: 0x8C, // Œ -> 8C
      0x0153: 0x9C, // œ -> 9C
      0x2022: 0x95, // • -> 95
      0x201D: 0x94, // ” -> 94
      0x2122: 0x99, // ™ -> 99
      0x00A0: 0xA0, // nbsp
    };
    if (map[code]) return map[code];
    return code & 0xFF;
  };

  const buffer = [];
  for (let i = 0; i < s.length; i++) {
    const b1 = charToByte(s[i]);
    if (b1 >= 0xF0 && i + 3 < s.length) {
      const b2 = charToByte(s[i+1]), b3 = charToByte(s[i+2]), b4 = charToByte(s[i+3]);
      if (b2 >= 0x80 && b2 <= 0xBF && b3 >= 0x80 && b3 <= 0xBF && b4 >= 0x80 && b4 <= 0xBF) {
        buffer.push(b1, b2, b3, b4); i += 3; continue;
      }
    }
    if (b1 >= 0xE0 && i + 2 < s.length) {
      const b2 = charToByte(s[i+1]), b3 = charToByte(s[i+2]);
      if (b2 >= 0x80 && b2 <= 0xBF && b3 >= 0x80 && b3 <= 0xBF) {
        buffer.push(b1, b2, b3); i += 2; continue;
      }
    }
    if (b1 >= 0xC0 && i + 1 < s.length) {
      const b2 = charToByte(s[i+1]);
      if (b2 >= 0x80 && b2 <= 0xBF) {
        buffer.push(b1, b2); i += 1; continue;
      }
    }
    buffer.push(b1);
  }
  try {
    return Buffer.from(buffer).toString('utf8');
  } catch(e) { return s; }
}

let content = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

// Also fix some specific words that are definitely broken in a way the logic might miss
const manual = {
  'Nhm k thut': 'Nhóm kỹ thuật',
  'Nhm H s': 'Nhóm Hồ sơ',
  'Nhm vt t tiu hao- ha cht': 'Nhóm vật tư tiêu hao- hóa chất',
  'T kho': 'Tổ kho',
  ' xut': 'Đề xuất',
};

for(const k in manual) content = content.split(k).join(manual[k]);

content = content.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
  const quote = match[0];
  const inner = match.substring(1, match.length - 1);
  return quote + restoreString(inner) + quote;
});

content = content.replace(/[\u0080-\u01ff]{2,}/g, (match) => restoreString(match));

fs.writeFileSync('AppScript_v2_10.gs', content, 'utf8');
console.log('Restored all strings and comments in AppScript_v2_10.gs with extended map.');
