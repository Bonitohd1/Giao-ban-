const fs = require('fs');
let content = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const replacements = [
  { from: /Kh khn, v\?ng m?c/g, to: 'Khó khăn, vướng mắc' },
  { from: /V\?ng m?c/g, to: 'Vướng mắc' },
  { from: /Cha phn lo?i/g, to: 'Chưa phân loại' },
  { from: /i\?n M\? KT/g, to: 'điền Mã KT' },
  { from: /i\?n M\? VT/g, to: 'điền Mã VT' },
  { from: /i\?n M\? H\? s/g, to: 'điền Mã Hồ sơ' },
  { from: /dy th\? ang trong gi th\?u/g, to: 'dây thở đang trong gói thầu' },
  { from: /t?n >1 nm/g, to: 'tồn >1 năm' },
  { from: /pht hnh/g, to: 'phát hành' },
  { from: /ng t?i hsmt/g, to: 'đăng tải HSMT' },
  { from: /ang \?u th\?u/g, to: 'đang đấu thầu' },
  { from: /thng \(>1 nm\)/g, to: 'tháng (>1 năm)' },
  { from: /B?T BU?C r sot/g, to: 'BẮT BUỘC rà soát' },
  { from: /chuy\?n dng/g, to: 'chuyển dòng' },
  { from: /i\?u chuy\?n/g, to: 'điều chuyển' },
  { from: /thanh l\? n\?u h?t h?n/g, to: 'thanh lý nếu hết hạn' },
  { from: /Kh khn/g, to: 'Khó khăn' }
];

for (const r of replacements) {
  content = content.replace(r.from, r.to);
}

fs.writeFileSync('AppScript_v2_10.gs', content, 'utf8');
console.log('Final targeted string fix applied.');
