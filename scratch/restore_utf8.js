const fs = require('fs');

function restoreUtf8(content) {
  // Map corrupted characters back to their likely original bytes (CP1252 to Byte)
  const charToByte = (c) => {
    const code = c.charCodeAt(0);
    // CP1252 specific mappings for high-bit characters
    const special = {
      0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
      0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
      0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
      0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
      0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
      0x017E: 0x9E, 0x0178: 0x9F
    };
    if (special[code]) return special[code];
    // For others, we assume the low byte is the intended byte (standard for many encodings)
    return code & 0xFF;
  };

  const buffer = [];
  for (let i = 0; i < content.length; i++) {
    const b1 = charToByte(content[i]);
    
    if (b1 >= 0xF0 && i + 3 < content.length) {
      // Possible 4-byte sequence
      const b2 = charToByte(content[i+1]);
      const b3 = charToByte(content[i+2]);
      const b4 = charToByte(content[i+3]);
      if (b2 >= 0x80 && b2 <= 0xBF && b3 >= 0x80 && b3 <= 0xBF && b4 >= 0x80 && b4 <= 0xBF) {
        buffer.push(b1, b2, b3, b4);
        i += 3; continue;
      }
    }
    
    if (b1 >= 0xE0 && i + 2 < content.length) {
      // Possible 3-byte sequence
      const b2 = charToByte(content[i+1]);
      const b3 = charToByte(content[i+2]);
      if (b2 >= 0x80 && b2 <= 0xBF && b3 >= 0x80 && b3 <= 0xBF) {
        buffer.push(b1, b2, b3);
        i += 2; continue;
      }
    }
    
    if (b1 >= 0xC0 && i + 1 < content.length) {
      // Possible 2-byte sequence
      const b2 = charToByte(content[i+1]);
      if (b2 >= 0x80 && b2 <= 0xBF) {
        buffer.push(b1, b2);
        i += 1; continue;
      }
    }
    
    buffer.push(b1);
  }

  return Buffer.from(buffer).toString('utf8');
}

const filename = 'AppScript_v2_10.gs';
const content = fs.readFileSync(filename, 'utf8');
const restored = restoreUtf8(content);
fs.writeFileSync(filename, restored, 'utf8');
console.log(`Restored ${filename} using generic UTF-8 restoration.`);
