const COLORS = ['#f0505e', '#4f8ef2', '#ffd54a', '#5acb74', '#a06ee2', '#ff9a3c'];
const N = 7;
// colours in play, moves, goal per colour (first two colours)
const SPEC = [[4, 15, 10], [4, 15, 14], [5, 18, 14], [5, 18, 18], [5, 20, 20], [6, 20, 16], [6, 22, 20], [6, 22, 24], [6, 24, 26], [6, 24, 30]];

Kit.start({
  id: 'gems', title: 'Gem Swap', accent: ['#a06ee2', '#6d40ad'],
  help: ['Swap two gems side by side (drag one onto its neighbour, or tap one then the other).', 'Three or more in a row clear, and new gems fall in.', 'Collect the gems shown at the top before your moves run out.'],
  tips: { 0: 'Swap two gems to make a line of three' },
  level(i, api) {
    const [K, maxMoves, need] = SPEC[i], R = api.rng, goal = [need, i >= 3 ? need : 0];
    const got = [0, 0];
    let g = [], moves = maxMoves, sel = -1, cs = 40, ox = 0, oy = 0, busy = false, fall = new Array(N * N).fill(0), pops = [];
    const rnd = () => (R() * K) | 0;
    for (let k = 0; k < N * N; k++) { let c; do c = rnd(); while ((k % N >= 2 && g[k - 1] === c && g[k - 2] === c) || (k >= 2 * N && g[k - N] === c && g[k - 2 * N] === c)); g.push(c); }
    const C = api.canvas(o => { cs = Math.floor(Math.min((o.w - 8) / N, (o.h - 8) / N, 64)); ox = (o.w - cs * N) / 2; oy = (o.h - cs * N) / 2; });
    const hud = () => api.info(`<span class="chip${moves <= 3 ? ' warn' : ''}">Moves: ${moves}</span>` + goal.map((n, c) => (n ? `<span class="chip"><span class="sw" style="background:${COLORS[c]};border-radius:50%"></span>${Math.min(got[c], n)} / ${n}</span>` : '')).join(''));
    hud();
    const matches = () => {
      const m = new Set();
      for (let y = 0; y < N; y++) for (let x = 0; x < N - 2; x++) { const k = y * N + x; if (g[k] >= 0 && g[k] === g[k + 1] && g[k] === g[k + 2]) { m.add(k); m.add(k + 1); m.add(k + 2); } }
      for (let x = 0; x < N; x++) for (let y = 0; y < N - 2; y++) { const k = y * N + x; if (g[k] >= 0 && g[k] === g[k + N] && g[k] === g[k + 2 * N]) { m.add(k); m.add(k + N); m.add(k + 2 * N); } }
      return m;
    };
    const anyMove = () => { for (let k = 0; k < N * N; k++) for (const d of [1, N]) { if (d === 1 && k % N === N - 1) continue; if (k + d >= N * N) continue; [g[k], g[k + d]] = [g[k + d], g[k]]; const ok = matches().size > 0; [g[k], g[k + d]] = [g[k + d], g[k]]; if (ok) return true; } return false; };
    function resolve(chain) {
      const m = matches();
      if (!m.size) {
        busy = false;
        if (goal.every((n, c) => got[c] >= n)) api.win(moves ? `${moves} moves to spare` : '');
        else if (moves <= 0) api.lose('Out of moves', 'Look for swaps that clear gems of the goal colours.');
        else if (!anyMove()) { for (let k = 0; k < N * N; k++) g[k] = rnd(); resolve(0); }
        return;
      }
      const now = performance.now();
      m.forEach(k => { if (g[k] < 2) got[g[k]]++; pops.push({ k, c: g[k], t0: now }); g[k] = -1; });
      api.snd.pop(chain * 2 + 3); api.vib(8 + chain * 4); hud();
      setTimeout(() => {
        if (!api.alive()) return;
        for (let x = 0; x < N; x++) {
          const col = []; for (let y = N - 1; y >= 0; y--) if (g[y * N + x] >= 0) col.push(g[y * N + x]);
          for (let y = N - 1, k = 0; y >= 0; y--, k++) { const was = g[y * N + x]; g[y * N + x] = k < col.length ? col[k] : rnd(); if (was !== g[y * N + x]) fall[y * N + x] = performance.now(); }
        }
        setTimeout(() => api.alive() && resolve(chain + 1), 200);
      }, 220);
    }
    function trySwap(a, b) {
      const ax = a % N, ay = (a / N) | 0, bx = b % N, by = (b / N) | 0;
      if (Math.abs(ax - bx) + Math.abs(ay - by) !== 1) return false;
      [g[a], g[b]] = [g[b], g[a]];
      if (!matches().size) { [g[a], g[b]] = [g[b], g[a]]; api.snd.bad(); return true; }
      moves--; busy = true; hud(); api.snd.tap(); resolve(0); return true;
    }
    let down = -1, sx = 0, sy = 0;
    const cellAt = p => { const x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs); return x >= 0 && y >= 0 && x < N && y < N ? y * N + x : -1; };
    C.cv.addEventListener('pointerdown', e => { if (busy || api.ended()) return; const p = C.point(e); down = cellAt(p); sx = p.x; sy = p.y; });
    C.cv.addEventListener('pointerup', e => {
      if (busy || api.ended() || down < 0) return;
      const p = C.point(e), dx = p.x - sx, dy = p.y - sy;
      if (Math.hypot(dx, dy) > cs * 0.4) { const t = Math.abs(dx) > Math.abs(dy) ? down + Math.sign(dx) : down + Math.sign(dy) * N; if ((Math.abs(dx) > Math.abs(dy) && ((down % N) + Math.sign(dx) < 0 || (down % N) + Math.sign(dx) >= N)) || t < 0 || t >= N * N) return; trySwap(down, t); sel = -1; }
      else if (sel >= 0 && sel !== down) { if (!trySwap(sel, down)) sel = down; else sel = -1; }
      else sel = sel === down ? -1 : down;
      down = -1;
    });
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      ctx.fillStyle = 'rgba(255,255,255,.05)'; api.rr(ctx, ox - 6, oy - 6, cs * N + 12, cs * N + 12, 14); ctx.fill();
      for (let k = 0; k < N * N; k++) {
        if (g[k] < 0) continue;
        const q = Math.min(1, (now - fall[k]) / 200), x = ox + (k % N + 0.5) * cs, y = oy + (((k / N) | 0) + 0.5) * cs - (1 - q) * cs * 0.6, r = cs * 0.38;
        ctx.save(); ctx.translate(x, y); if (k === sel) ctx.scale(1.12, 1.12);
        ctx.fillStyle = COLORS[g[k]];
        ctx.beginPath(); const sides = 4 + (g[k] % 3); for (let s = 0; s < sides; s++) { const a = -Math.PI / 2 + s * Math.PI * 2 / sides; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.3, r * 0.22, 0, 7); ctx.fill();
        if (k === sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); }
        ctx.restore();
      }
      pops = pops.filter(p => { const q = (now - p.t0) / 250; if (q > 1) return false; ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.arc(ox + (p.k % N + 0.5) * cs, oy + (((p.k / N) | 0) + 0.5) * cs, cs * 0.38 * (1 + q), 0, 7); ctx.fillStyle = COLORS[p.c]; ctx.fill(); ctx.globalAlpha = 1; return true; });
    });
  },
});
