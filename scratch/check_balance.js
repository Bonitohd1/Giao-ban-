const fs = require('fs');
const content = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

let stack = [];
let inString = false;
let stringChar = '';
let inComment = false;
let commentType = ''; // 'line' or 'block'

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const nextChar = content[i+1];
  
  if (!inString && !inComment) {
    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
    } else if (char === '/' && nextChar === '/') {
      inComment = true;
      commentType = 'line';
      i++;
    } else if (char === '/' && nextChar === '*') {
      inComment = true;
      commentType = 'block';
      i++;
    } else if (char === '{' || char === '(' || char === '[') {
      stack.push({ char, line: content.substring(0, i).split('\n').length });
    } else if (char === '}' || char === ')' || char === ']') {
      const last = stack.pop();
      const expected = { '}': '{', ')': '(', ']': '[' }[char];
      if (!last || last.char !== expected) {
        console.log(`Unexpected ${char} at line ${content.substring(0, i).split('\n').length}`);
      }
    }
  } else if (inString) {
    if (char === stringChar && content[i-1] !== '\\') {
      inString = false;
    }
  } else if (inComment) {
    if (commentType === 'line' && char === '\n') {
      inComment = false;
    } else if (commentType === 'block' && char === '*' && nextChar === '/') {
      inComment = false;
      i++;
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed blocks:');
  stack.forEach(s => console.log(`${s.char} opened at line ${s.line}`));
}
if (inString) console.log(`Unclosed string started with ${stringChar}`);
if (inComment) console.log(`Unclosed comment type ${commentType}`);

if (stack.length === 0 && !inString && !inComment) {
  console.log('All blocks and strings balanced!');
}

