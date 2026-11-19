// Level generators for the game prototypes. Every level is checked solvable here (by construction or by a solver).
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath as __f } from 'url';
import { dirname as __d } from 'path';
process.chdir(__d(__f(import.meta.url))); // paths below are relative to this folder

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // up right down left
const out = {};

// ---------------- Tilt Sort ----------------
function tiltMove(L, st, d) {
  const { W, H, g } = L, [dx, dy] = D4[d];
  const pos = st.slice(), k = pos.length;
  // the marble farthest along the swipe moves first
  const proj = i => (pos[i] % W) * dx + ((pos[i] / W) | 0) * dy;
  const order = [...Array(k).keys()].filter(i => pos[i] >= 0).sort((a, b) => proj(b) - proj(a));
  for (const i of order) {
    let x = pos[i] % W, y = (pos[i] / W) | 0;
    for (;;) {
      const nx = x + dx, ny = y + dy, n = ny * W + nx;
      if (g[n] === '#') break;
      if (pos.some((p, j) => j !== i && p === n)) break;
      x = nx; y = ny;
      if (g[n] === String(i)) { pos[i] = -1 - n; break; }
      pos[i] = n;
    }
    if (pos[i] >= 0) pos[i] = y * W + x;
  }
  return pos;
}
function tiltSolve(L, maxD) {
  const start = L.m.slice(), key = s => s.join(',');
  const seen = new Set([key(start)]); let fr = [start];
  for (let d = 1; d <= maxD; d++) {
    const nx = [];
    for (const s of fr) for (let k = 0; k < 4; k++) {
      const t = tiltMove(L, s, k), kk = key(t);
      if (seen.has(kk)) continue; seen.add(kk);
      if (t.every(p => p < 0)) return d;
      nx.push(t);
    }
    fr = nx;
  }
  return -1;
}
{
  const R = rng(11), levels = [];
  const spec = [[5, 1, 2, 3], [5, 2, 2, 3], [5, 2, 3, 4], [6, 2, 4, 5], [6, 3, 4, 5], [6, 3, 5, 6], [7, 3, 5, 7], [7, 3, 6, 7], [7, 4, 6, 8], [7, 4, 7, 9]];
  for (const [N, k, lo, hi] of spec) {
    for (let tries = 0; ; tries++) {
      const W = N + 2, H = N + 2, g = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.push(x === 0 || y === 0 || x === W - 1 || y === H - 1 || R() < 0.14 ? '#' : '.');
      const free = g.map((c, i) => (c === '.' ? i : -1)).filter(i => i >= 0);
      if (free.length < 2 * k + 6) continue;
      const pick = () => free.splice((R() * free.length) | 0, 1)[0];
      const m = [];
      for (let i = 0; i < k; i++) { g[pick()] = String(i); m.push(pick()); }
      const L = { W, H, g, m };
      const opt = tiltSolve(L, hi);
      if (opt >= lo && opt <= hi) { levels.push({ W, H, g: g.join(''), m, opt, moves: opt + (levels.length < 3 ? 2 : 1) }); break; }
    }
  }
  out.tilt = levels;
}

// ---------------- Noodle Out / Flood Rescue (exit-ray puzzles built backwards) ----------------
function rayClear(occ, W, H, x, y, d) {
  const [dx, dy] = D4[d];
  for (x += dx, y += dy; x >= 0 && y >= 0 && x < W && y < H; x += dx, y += dy) if (occ[y * W + x] >= 0) return false;
  return true;
}
{
  const R = rng(21), levels = [];
  const spec = [[5, 6, 3, 2, 3], [5, 6, 6, 2, 3], [6, 7, 6, 2, 4], [6, 7, 9, 2, 4], [6, 8, 9, 2, 4], [7, 8, 12, 2, 4], [7, 9, 12, 2, 5], [7, 9, 15, 2, 5], [8, 9, 15, 2, 5], [8, 10, 18, 2, 5]];
  for (const [W, H, n, lmin, lmax] of spec) {
    let best = null;
    for (let attempt = 0; attempt < 400; attempt++) {
      const occ = new Array(W * H).fill(-1), nd = [];
      let ok = true;
      for (let k = 0; k < n && ok; k++) {
        let placed = false;
        for (let t = 0; t < 300 && !placed; t++) {
          const hx = (R() * W) | 0, hy = (R() * H) | 0, d = (R() * 4) | 0, h = hy * W + hx;
          if (occ[h] >= 0 || !rayClear(occ, W, H, hx, hy, d)) continue;
          const len = lmin + ((R() * (lmax - lmin + 1)) | 0);
          const [dx, dy] = D4[d];
          const body = [[hx, hy]];
          let bx = hx - dx, by = hy - dy;
          const okc = (x, y) => x >= 0 && y >= 0 && x < W && y < H && occ[y * W + x] < 0 && !body.some(([a, b]) => a === x && b === y)
            && !(x === hx + 0 * dx && false);
          // body must not sit on own ray
          const onRay = (x, y) => (dx ? y === hy && Math.sign(x - hx) === dx : x === hx && Math.sign(y - hy) === dy);
          if (!okc(bx, by)) continue;
          body.push([bx, by]);
          while (body.length < len) {
            const [lx, ly] = body[body.length - 1];
            const c = D4.map(([a, b]) => [lx + a, ly + b]).filter(([x, y]) => okc(x, y) && !onRay(x, y));
            if (!c.length) break;
            body.push(c[(R() * c.length) | 0]);
          }
          if (body.length < 2) continue;
          body.forEach(([x, y]) => (occ[y * W + x] = k));
          nd.push({ d, body: body.map(([x, y]) => y * W + x) });
          placed = true;
        }
        if (!placed) ok = false;
      }
      if (!ok) continue;
      // removal order = reverse of placement
      const order = nd.slice().reverse();
      // how many can leave at the start?
      let freeStart = 0;
      for (const s of order) { const hx = s.body[0] % W, hy = (s.body[0] / W) | 0; const o2 = occ.map(v => (s.body.includes(occ.indexOf(v)) ? v : v)); if (rayClear(occ.map((v, i) => (s.body.includes(i) ? -1 : v)), W, H, hx, hy, s.d)) freeStart++; }
      const score = freeStart;
      if (!best || score < best.score) best = { score, order };
      if (score <= Math.max(2, Math.ceil(n / 5))) break;
    }
    const noodles = best.order.map((s, i) => ({ d: s.d, body: s.body, c: Math.floor(i / 3) % 6 }));
    // shuffle listing order so array position gives nothing away
    for (let i = noodles.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [noodles[i], noodles[j]] = [noodles[j], noodles[i]]; }
    levels.push({ W, H, noodles, freeStart: best.score });
  }
  out.noodle = levels;
}
{
  const R = rng(31), levels = [];
  const spec = [[5, 6, 4], [5, 6, 6], [5, 7, 8], [6, 7, 10], [6, 8, 12], [6, 8, 14], [7, 9, 16], [7, 9, 18], [7, 10, 21], [8, 10, 24]];
  for (const [W, H, n] of spec) {
    for (let attempt = 0; ; attempt++) {
      const cells = [];
      const all = [...Array(W * H).keys()];
      for (let i = 0; i < n; i++) cells.push(all.splice((R() * all.length) | 0, 1)[0]);
      // removal order: lower rows first, with a little noise
      const rem = cells.map(c => ({ c, k: ((c / W) | 0) + R() * 2.2 })).sort((a, b) => b.k - a.k).map(o => o.c);
      const occ = new Array(W * H).fill(-1), animals = [];
      let ok = true;
      for (let i = rem.length - 1; i >= 0 && ok; i--) {
        const c = rem[i], x = c % W, y = (c / W) | 0;
        const ds = [0, 1, 2, 3].filter(d => rayClear(occ, W, H, x, y, d));
        if (!ds.length) { ok = false; break; }
        const d = ds[(R() * ds.length) | 0];
        occ[c] = i; animals[i] = { c, d };
      }
      if (!ok) continue;
      // water rises one row every `rate` taps; find the smallest rate that the built order survives
      let rate = 1;
      const fits = r => animals.every((a, t) => ((a.c / W) | 0) < H - Math.floor(t / r));
      while (!fits(rate)) rate++;
      // count animals that can leave at the start
      let free = 0;
      for (const a of animals) if (rayClear(occ.map((v, i) => (i === a.c ? -1 : v)), W, H, a.c % W, (a.c / W) | 0, a.d)) free++;
      if (free > Math.max(2, n / 3) && attempt < 300) continue;
      const slack = levels.length < 3 ? 1 : 0;
      const list = animals.map(a => ({ c: a.c, d: a.d, k: (R() * 5) | 0 }));
      for (let i = list.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [list[i], list[j]] = [list[j], list[i]]; }
      levels.push({ W, H, animals: list, rate: rate + slack, free });
      break;
    }
  }
  out.flood = levels;
}

// ---------------- Gate Drop ----------------
function gateDrop(C, R0, gates, col) {
  const g = gates.slice(), path = [col];
  let c = col;
  for (let r = 0; r < R0; r++) {
    const i = r * C + c;
    if (g[i] === 'L' || g[i] === 'R') {
      let nc = c + (g[i] === 'L' ? -1 : 1);
      if (nc < 0 || nc >= C) nc = c;
      g[i] = g[i] === 'L' ? 'R' : 'L';
      c = nc;
    }
    path.push(c);
  }
  return { g, c, path };
}
{
  const R = rng(41), levels = [];
  const spec = [[3, 3, 3], [3, 4, 4], [3, 4, 5], [4, 4, 5], [4, 5, 6], [4, 5, 7], [4, 6, 7], [5, 6, 8], [5, 7, 9], [5, 7, 10]];
  for (const [C, Rw, n] of spec) {
    let best = null;
    for (let attempt = 0; attempt < 600; attempt++) {
      const gates = [];
      for (let i = 0; i < C * Rw; i++) gates.push(R() < 0.5 ? (R() < 0.5 ? 'L' : 'R') : '.');
      let g = gates.slice();
      const queue = [];
      for (let k = 0; k < n; k++) { const col = (R() * C) | 0; const r = gateDrop(C, Rw, g, col); g = r.g; queue.push(r.c); }
      if (new Set(queue).size < Math.min(C, 3)) continue;
      // count solutions (cap) and how many first moves are right
      let sols = 0;
      const dfs = (gg, k) => {
        if (sols > 400) return;
        if (k === n) { sols++; return; }
        for (let col = 0; col < C; col++) { const r = gateDrop(C, Rw, gg, col); if (r.c === queue[k]) dfs(r.g, k + 1); }
      };
      dfs(gates, 0);
      const score = sols;
      if (!best || score < best.score) best = { score, gates: gates.join(''), queue };
      if (score <= (levels.length < 3 ? 40 : 6)) break;
    }
    levels.push({ C, R: Rw, gates: best.gates, queue: best.queue, sols: best.score });
  }
  out.gate = levels;
}

// ---------------- Pull Tower ----------------
{
  const R = rng(51), levels = [];
  const spec = [[4, 4, 2], [4, 5, 2], [4, 5, 3], [5, 5, 3], [5, 6, 3], [5, 6, 4], [5, 7, 4], [5, 7, 4], [6, 7, 5], [6, 8, 5]];
  for (const [N, rows, m] of spec) {
    let best = null;
    for (let attempt = 0; attempt < 500; attempt++) {
      const bricks = [];
      for (let r = 0; r < rows; r++) { const odd = r % 2; for (let i = 0; i < N - odd; i++) bricks.push({ r, x: odd + i * 2 }); }
      const B = bricks.length;
      const below = bricks.map(b => bricks.map((a, j) => (a.r === b.r - 1 && Math.abs(a.x - b.x) <= 1 ? j : -1)).filter(j => j >= 0));
      const ids = [...Array(B).keys()];
      const S = [];
      while (S.length < 3 * m) { const i = ids.splice((R() * ids.length) | 0, 1)[0]; S.push(i); }
      // mask is over positions in S (only those bricks are ever removed)
      const gone = mask => { const g = new Array(B).fill(false); S.forEach((i, k) => { if ((mask >> k) & 1) g[i] = true; }); return g; };
      const stable = mask => { const g = gone(mask); return bricks.every((b, i) => g[i] || b.r === 0 || below[i].some(j => !g[j])); };
      // DFS for an order removing all of S without collapse
      const memo = new Set(); let order = null;
      const dfs = (mask, seq) => {
        if (order) return;
        if (seq.length === S.length) { order = seq.map(k => S[k]); return; }
        if (memo.has(mask)) return; memo.add(mask);
        const cand = S.map((_, k) => k).filter(k => !((mask >> k) & 1));
        for (let t = cand.length - 1; t > 0; t--) { const j = (R() * (t + 1)) | 0; [cand[t], cand[j]] = [cand[j], cand[t]]; }
        for (const k of cand) { const nm = mask | (1 << k); if (stable(nm)) { seq.push(k); dfs(nm, seq); seq.pop(); } }
      };
      dfs(0, []);
      if (!order) continue;
      const danger = S.filter((_, k) => !stable(1 << k)).length;
      if (!best || danger > best.danger) best = { danger, bricks, order };
      if (danger >= Math.min(3 * m - 2, 1 + Math.floor(levels.length / 2))) break;
    }
    const color = {};
    best.order.forEach((i, k) => { color[i] = Math.floor(k / 3) % 5; });
    levels.push({ N, rows, bricks: best.bricks.map((b, i) => ({ r: b.r, x: b.x, c: i in color ? color[i] : -1 })), danger: best.danger });
  }
  out.tower = levels;
}

// ---------------- Mosaic (one tile per row, column and region, none touching) ----------------
{
  const R = rng(61), levels = [];
  for (const N of [5, 5, 6, 6, 7, 7, 8, 8, 9, 9]) {
    for (let attempt = 0; ; attempt++) {
      const p = [];
      const place = r => {
        if (r === N) return true;
        const cols = [...Array(N).keys()].sort(() => R() - 0.5);
        for (const c of cols) if (!p.includes(c) && (r === 0 || Math.abs(p[r - 1] - c) > 1)) { p[r] = c; if (place(r + 1)) return true; }
        p.length = r; return false;
      };
      if (!place(0)) continue;
      const reg = new Array(N * N).fill(-1);
      const fr = [];
      p.forEach((c, r) => { reg[r * N + c] = r; fr.push(r * N + c); });
      while (fr.length) {
        const k = (R() * fr.length) | 0, i = fr[k];
        const x = i % N, y = (i / N) | 0;
        const nb = D4.map(([a, b]) => [x + a, y + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && reg[b * N + a] < 0);
        if (!nb.length) { fr.splice(k, 1); continue; }
        const [a, b] = nb[(R() * nb.length) | 0];
        reg[b * N + a] = reg[i]; fr.push(b * N + a);
      }
      let sols = 0;
      const q = [];
      const solve = r => {
        if (sols > 1) return;
        if (r === N) { sols++; return; }
        for (let c = 0; c < N; c++) {
          if (q.includes(c) || (r > 0 && Math.abs(q[r - 1] - c) <= 1)) continue;
          const rg = reg[r * N + c];
          if (q.some((cc, rr) => reg[rr * N + cc] === rg)) continue;
          q[r] = c; solve(r + 1); q.length = r;
        }
      };
      solve(0);
      if (sols === 1) { levels.push({ N, reg, sol: p }); break; }
    }
  }
  out.mosaic = levels;
}

mkdirSync('levels', { recursive: true });
for (const [k, v] of Object.entries(out)) writeFileSync(`levels/${k}.json`, JSON.stringify(v));
console.log('tilt opt', out.tilt.map(l => l.opt).join(' '));
console.log('noodle free at start', out.noodle.map(l => `${l.noodles.length}:${l.freeStart}`).join(' '));
console.log('flood rate/free', out.flood.map(l => `${l.animals.length}:${l.rate}/${l.free}`).join(' '));
console.log('gate sols', out.gate.map(l => l.sols).join(' '));
console.log('tower danger', out.tower.map(l => l.danger).join(' '));
console.log('mosaic', out.mosaic.map(l => l.N).join(' '));
