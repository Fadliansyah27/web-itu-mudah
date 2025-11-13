// scripts/gen-parts.js
const fs = require('fs');
const path = require('path');

const FLAG = process.env.CTF_FLAG || 'PBL{sT00P_jUD4YYY}';
const outDir = path.join(__dirname, '..', 'public', 'hidden');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const encoded = Buffer.from(FLAG, 'utf8').toString('base64');
const len = encoded.length;

// simple split into 3 parts (you may adjust)
const p1len = Math.floor(len / 3);
const p2len = Math.floor((len - p1len) / 2);
const p1 = encoded.slice(0, p1len);
const p2 = encoded.slice(p1len, p1len + p2len);
const p3 = encoded.slice(p1len + p2len);

fs.writeFileSync(path.join(outDir, 'p_a.txt'), p1, 'utf8');
fs.writeFileSync(path.join(outDir, 'p_b.txt'), p2, 'utf8');
fs.writeFileSync(path.join(outDir, 'p_c.txt'), p3, 'utf8');

console.log('Wrote parts lengths:', p1.length, p2.length, p3.length);
console.log('Files written to:', outDir);