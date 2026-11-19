import { readFileSync, writeFileSync } from 'fs';
import { LEVELS } from './levels.mjs';
import { fileURLToPath as __f } from 'url';
import { dirname as __d } from 'path';
process.chdir(__d(__f(import.meta.url))); // paths below are relative to this folder

const levels = LEVELS.map(({ name, k, pic, mask, timers }) => ({ name, k, pic: pic.slice(), mask, timers: timers || [] }));
// Pinwheel: the centre pin shows white once a domino is placed there.
const pw = levels.find(l => l.name === 'Pinwheel');
pw.pic[4] = pw.pic[4].slice(0, 4) + 'w' + pw.pic[4].slice(5);

const src = readFileSync('topple.src.html', 'utf8');
if (!src.includes('/*LEVELS*/[]')) throw new Error('placeholder missing');
const page = src.replace('/*LEVELS*/[]', JSON.stringify(levels));
writeFileSync('topple.html', page);
// Local test copy with the skeleton the Artifact host adds.
writeFileSync('topple.test.html', '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + page + '</body></html>');
console.log('built', page.length, 'bytes');
