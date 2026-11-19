// Tube Sort levels: random deals, kept only when a solver finds a solution.
import { writeFileSync } from 'fs';
import { fileURLToPath as __f } from 'url';
import { dirname as __d } from 'path';
process.chdir(__d(__f(import.meta.url))); // paths below are relative to this folder
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const R = rng(71), CAP = 4, levels = [];
const done = t => t.every(x => x.length === 0 || (x.length === CAP && x.every(c => c === x[0])));
function solve(start, limit = 300000) {
  const seen = new Set(); let nodes = 0;
  const key = t => t.map(x => x.join('')).sort().join('|');
  const dfs = (t, depth) => {
    if (done(t)) return [];
    if (++nodes > limit || depth > 120) return null;
    const k = key(t); if (seen.has(k)) return null; seen.add(k);
    for (let a = 0; a < t.length; a++) {
      const A = t[a]; if (!A.length) continue;
      const c = A[A.length - 1];
      if (A.length === CAP && A.every(x => x === c)) continue;
      for (let b = 0; b < t.length; b++) {
        if (a === b) continue;
        const B = t[b];
        if (B.length >= CAP || (B.length && B[B.length - 1] !== c)) continue;
        if (!B.length && A.every(x => x === c)) continue;
        const n = t.map(x => x.slice()); n[b].push(n[a].pop());
        const r = dfs(n, depth + 1); if (r) return [[a, b], ...r];
      }
    }
    return null;
  };
  return dfs(start, 0);
}
for (const colors of [3, 3, 4, 4, 5, 5, 6, 6, 7, 8]) {
  for (;;) {
    const balls = []; for (let c = 0; c < colors; c++) for (let k = 0; k < CAP; k++) balls.push(c);
    for (let i = balls.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [balls[i], balls[j]] = [balls[j], balls[i]]; }
    const tubes = []; for (let c = 0; c < colors; c++) tubes.push(balls.slice(c * CAP, c * CAP + CAP));
    tubes.push([], []);
    if (tubes.some(t => t.length && t.every(x => x === t[0]))) continue;
    const sol = solve(tubes);
    if (sol) { levels.push({ tubes, moves: sol.length }); break; }
  }
}
writeFileSync('levels/tubes.json', JSON.stringify(levels));
console.log('tube sort solution lengths', levels.map(l => l.moves).join(' '));
