const fs = require('fs');
const standard = fs.readFileSync('AppScript_v2_10_standard.gs', 'utf8').split('\n');
const current = fs.readFileSync('AppScript_v2_10.gs', 'utf8').split('\n');

// Standard script block: line 3395 to 5086 (0-indexed: 3394 to 5086)
const scriptBlock = standard.slice(3394, 5086);

// Current script block to replace: line 3556 to 4765 (0-indexed: 3555 to 4765)
const newContent = [
    ...current.slice(0, 3555),
    ...scriptBlock,
    ...current.slice(4765)
];

fs.writeFileSync('AppScript_v2_10.gs', newContent.join('\n'));
console.log("Transplanted clean script block from standard to current file.");
