// Picture Logic (nonogram) and Mini Sudoku levels, each checked to have exactly one answer.
import { writeFileSync } from 'fs';
import { fileURLToPath as __f } from 'url';
import { dirname as __d } from 'path';
process.chdir(__d(__f(import.meta.url))); // paths below are relative to this folder
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// ---------- nonogram: random symmetric blobs, kept when line-by-line logic alone solves them ----------
const clue = line => { const out = []; let run = 0; for (const v of line) { if (v) run++; else if (run) { out.push(run); run = 0; } } if (run) out.push(run); return out; };
function lineSolve(cl, cur) {
  // cur: -1 unknown, 0 empty, 1 filled. Returns refined line or null if impossible.
  const n = cur.length, opts = [];
  const place = (k, pos, acc) => {
    if (opts.length > 20000) return;
    if (k === cl.length) { const l = acc.concat(new Array(n - acc.length).fill(0)); if (l.every((v, i) => cur[i] < 0 || cur[i] === v)) opts.push(l); return; }
    for (let s = pos; s + cl[k] <= n; s++) {
      const l = acc.concat(new Array(s - acc.length).fill(0), new Array(cl[k]).fill(1));
      if (k < cl.length - 1) l.push(0);
      if (!l.every((v, i) => i >= n || cur[i] < 0 || cur[i] === v)) continue;
      place(k + 1, l.length, l);
    }
  };
  place(0, 0, []);
  if (!opts.length) return null;
  return cur.map((v, i) => (opts.every(o => o[i] === 1) ? 1 : opts.every(o => o[i] === 0) ? 0 : v));
}
function logicSolves(W, H, rows, cols) {
  const g = new Array(W * H).fill(-1);
  for (let it = 0; it < 100; it++) {
    let ch = false;
    for (let y = 0; y < H; y++) { const cur = g.slice(y * W, y * W + W), r = lineSolve(rows[y], cur); if (!r) return false; r.forEach((v, x) => { if (v !== g[y * W + x]) { g[y * W + x] = v; ch = true; } }); }
    for (let x = 0; x < W; x++) { const cur = []; for (let y = 0; y < H; y++) cur.push(g[y * W + x]); const r = lineSolve(cols[x], cur); if (!r) return false; r.forEach((v, y) => { if (v !== g[y * W + x]) { g[y * W + x] = v; ch = true; } }); }
    if (!ch) break;
  }
  return g.every(v => v >= 0);
}
const nono = [];
{
  const R = rng(81);
  for (const N of [5, 5, 6, 6, 7, 7, 8, 8, 10, 10]) {
    for (let t = 0; ; t++) {
      let g = Array.from({ length: N * N }, () => (R() < 0.55 ? 1 : 0));
      for (let s = 0; s < 2; s++) g = g.map((v, i) => { const x = i % N, y = (i / N) | 0; let k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N) k += g[ny * N + nx]; } return k >= 5 ? 1 : k <= 3 ? 0 : v; });
      g = g.map((v, i) => { const x = i % N, y = (i / N) | 0; return x < N / 2 ? v : g[y * N + (N - 1 - x)]; }); // mirror
      const fill = g.reduce((a, b) => a + b, 0);
      if (fill < N * N * 0.35 || fill > N * N * 0.7) continue;
      const rows = [], cols = [];
      for (let y = 0; y < N; y++) rows.push(clue(g.slice(y * N, y * N + N)));
      for (let x = 0; x < N; x++) { const c = []; for (let y = 0; y < N; y++) c.push(g[y * N + x]); cols.push(clue(c)); }
      if (logicSolves(N, N, rows, cols)) { nono.push({ N, g: g.join(''), rows, cols }); break; }
    }
  }
}

// ---------- mini sudoku ----------
const sudoku = [];
{
  const R = rng(91);
  const spec = [[4, 2, 2, 7], [4, 2, 2, 8], [4, 2, 2, 9], [6, 2, 3, 16], [6, 2, 3, 18], [6, 2, 3, 20], [6, 2, 3, 21], [9, 3, 3, 40], [9, 3, 3, 44], [9, 3, 3, 47]];
  for (const [N, bh, bw, holes] of spec) {
    const ok = (g, i, v) => { const x = i % N, y = (i / N) | 0; for (let k = 0; k < N; k++) { if (g[y * N + k] === v || g[k * N + x] === v) return false; } const bx = x - (x % bw), by = y - (y % bh); for (let dy = 0; dy < bh; dy++) for (let dx = 0; dx < bw; dx++) if (g[(by + dy) * N + bx + dx] === v) return false; return true; };
    const full = new Array(N * N).fill(0);
    const fillAll = i => { if (i === N * N) return true; const vs = [...Array(N).keys()].map(v => v + 1).sort(() => R() - 0.5); for (const v of vs) if (ok(full, i, v)) { full[i] = v; if (fillAll(i + 1)) return true; full[i] = 0; } return false; };
    fillAll(0);
    const count = (g, cap) => { let n = 0; const go = () => { const i = g.indexOf(0); if (i < 0) { n++; return; } for (let v = 1; v <= N && n < cap; v++) if (ok(g, i, v)) { g[i] = v; go(); g[i] = 0; } }; go(); return n; };
    const puz = full.slice(), order = [...Array(N * N).keys()].sort(() => R() - 0.5);
    let removed = 0;
    for (const i of order) { if (removed >= holes) break; const v = puz[i]; puz[i] = 0; if (count(puz.slice(), 2) === 1) removed++; else puz[i] = v; }
    sudoku.push({ N, bh, bw, puz: puz.join(','), sol: full.join(','), holes: removed });
  }
}
writeFileSync('levels/nono.json', JSON.stringify(nono));
writeFileSync('levels/sudoku.json', JSON.stringify(sudoku));
console.log('nonogram sizes', nono.map(l => l.N).join(' '));
console.log('sudoku holes', sudoku.map(l => `${l.N}:${l.holes}`).join(' '));
