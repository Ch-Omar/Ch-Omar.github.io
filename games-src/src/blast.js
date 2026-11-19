const N = 8;
const COLORS = ['#f0505e', '#4f8ef2', '#ffd54a', '#5acb74', '#a06ee2', '#ff9a3c'];
const SHAPES = [
  [[0, 0]], [[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]], [[0, 0], [0, 1], [1, 1]], [[1, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0], [1, 0], [1, 1], [2, 1]],
];
const TARGET = [250, 350, 450, 550, 650, 800, 950, 1100, 1250, 1450];

Kit.start({
  id: 'blast', title: 'Blast Cascade', accent: ['#5acb74', '#2f8f4a'],
  help: ['Drag the blocks onto the board.', 'A full row or column clears. Then everything above <b>falls down</b>, and new full rows clear again for a bigger combo.', 'Reach the target score before you run out of space.'],
  tips: { 0: 'Drag a block onto the board', 1: 'Cleared rows let the blocks above fall: chain combos!' },
  level(i, api) {
    const R = api.rng, grid = new Array(N * N).fill(-1), target = TARGET[i];
    let score = 0, tray = [], drag = null, pops = [], combo = null, cs = 30, ox = 0, oy = 0, ty = 0;
    const newPiece = () => ({ s: SHAPES[(R() * SHAPES.length) | 0], c: (R() * COLORS.length) | 0 });
    const refill = () => { tray = [newPiece(), newPiece(), newPiece()]; };
    refill();
    const C = api.canvas(o => { cs = Math.floor(Math.min((o.w - 8) / N, (o.h - 140) / N, 52)); ox = (o.w - cs * N) / 2; oy = 4; ty = oy + cs * N + 24; });
    const hud = () => api.info(`<span class="chip">Score ${score} / ${target}</span>`);
    hud();
    const fits = (s, gx, gy) => s.every(([x, y]) => gx + x >= 0 && gy + y >= 0 && gx + x < N && gy + y < N && grid[(gy + y) * N + gx + x] < 0);
    const anyFit = p => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (fits(p.s, x, y)) return true; return false; };
    const slotX = j => C.w * (j + 0.5) / 3;
    const sc = 0.55;
    const pieceSize = s => [Math.max(...s.map(p => p[0])) + 1, Math.max(...s.map(p => p[1])) + 1];
    function gridPos(px, py, s) { const [w, h] = pieceSize(s); return [Math.round((px - ox) / cs - w / 2), Math.round((py - oy) / cs - h / 2)]; }
    C.cv.addEventListener('pointerdown', e => {
      if (api.ended()) return;
      const p = C.point(e);
      if (p.y < ty - 10) return;
      const j = Math.floor(p.x / (C.w / 3)); if (!tray[j]) return;
      drag = { j, x: p.x, y: p.y };
      C.cv.setPointerCapture(e.pointerId); api.snd.tap();
    });
    C.cv.addEventListener('pointermove', e => { if (drag) { const p = C.point(e); drag.x = p.x; drag.y = p.y; } });
    C.cv.addEventListener('pointerup', () => {
      if (!drag) return;
      const pc = tray[drag.j], [gx, gy] = gridPos(drag.x, drag.y - cs * 2, pc.s);
      if (fits(pc.s, gx, gy)) {
        pc.s.forEach(([x, y]) => (grid[(gy + y) * N + gx + x] = pc.c));
        score += pc.s.length; tray[drag.j] = null; api.snd.tap(); api.vib(6);
        resolve();
        if (tray.every(t => !t)) refill();
        hud();
        if (score >= target) setTimeout(() => api.win(`${score} points`), 300);
        else if (!tray.some(t => t && anyFit(t))) setTimeout(() => api.lose('No room left', `${score} of ${target} points. Leave space for the big blocks.`), 400);
      } else api.snd.bad();
      drag = null;
    });
    function resolve() {
      let mult = 1, any = false;
      for (;;) {
        const rows = [], cols = [];
        for (let y = 0; y < N; y++) if ([...Array(N).keys()].every(x => grid[y * N + x] >= 0)) rows.push(y);
        for (let x = 0; x < N; x++) if ([...Array(N).keys()].every(y => grid[y * N + x] >= 0)) cols.push(x);
        if (!rows.length && !cols.length) break;
        any = true;
        const cells = new Set();
        rows.forEach(y => { for (let x = 0; x < N; x++) cells.add(y * N + x); });
        cols.forEach(x => { for (let y = 0; y < N; y++) cells.add(y * N + x); });
        const now = performance.now();
        cells.forEach(c => { pops.push({ c, col: grid[c], t0: now + (mult - 1) * 160 }); grid[c] = -1; });
        score += cells.size * 10 * mult;
        api.snd.pop(mult * 3); api.vib(15 * mult);
        // gravity: every column settles down
        for (let x = 0; x < N; x++) {
          const stack = [];
          for (let y = N - 1; y >= 0; y--) if (grid[y * N + x] >= 0) stack.push(grid[y * N + x]);
          for (let y = N - 1, s = 0; y >= 0; y--, s++) grid[y * N + x] = s < stack.length ? stack[s] : -1;
        }
        if (mult > 1) combo = { n: mult, t0: performance.now() };
        mult++;
      }
      return any;
    }
    const block = (ctx, x, y, s, col, a = 1) => {
      ctx.globalAlpha = a;
      ctx.fillStyle = COLORS[col]; api.rr(ctx, x + 1, y + 1, s - 2, s - 2, s * 0.2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.3)'; api.rr(ctx, x + s * 0.15, y + s * 0.12, s * 0.7, s * 0.2, s * 0.1); ctx.fill();
      ctx.globalAlpha = 1;
    };
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      ctx.fillStyle = 'rgba(0,0,0,.25)'; api.rr(ctx, ox - 6, oy - 6 + 6, cs * N + 12, cs * N + 12, 14); ctx.fill();
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const v = grid[y * N + x];
        if (v >= 0) block(ctx, ox + x * cs, oy + y * cs, cs, v);
        else { ctx.fillStyle = 'rgba(255,255,255,.06)'; api.rr(ctx, ox + x * cs + 2, oy + y * cs + 2, cs - 4, cs - 4, 5); ctx.fill(); }
      }
      if (drag) {
        const pc = tray[drag.j], [gx, gy] = gridPos(drag.x, drag.y - cs * 2, pc.s);
        if (fits(pc.s, gx, gy)) pc.s.forEach(([x, y]) => block(ctx, ox + (gx + x) * cs, oy + (gy + y) * cs, cs, pc.c, 0.35));
      }
      pops = pops.filter(p => {
        const q = (now - p.t0) / 300; if (q < 0) return true; if (q > 1) return false;
        const s = cs * (1 + q * 0.5), x = ox + (p.c % N) * cs - (s - cs) / 2, y = oy + ((p.c / N) | 0) * cs - (s - cs) / 2;
        block(ctx, x, y, s, p.col, 1 - q); return true;
      });
      tray.forEach((pc, j) => {
        if (!pc) return;
        const [w, h] = pieceSize(pc.s);
        let s = cs * sc, x0 = slotX(j) - w * s / 2, y0 = ty + 10;
        if (drag && drag.j === j) { s = cs; x0 = drag.x - w * s / 2; y0 = drag.y - cs * 2 - h * s / 2; }
        const ok = anyFit(pc);
        pc.s.forEach(([x, y]) => block(ctx, x0 + x * s, y0 + y * s, s, pc.c, ok ? 1 : 0.35));
      });
      if (combo && now - combo.t0 < 900) {
        const q = (now - combo.t0) / 900;
        ctx.font = `400 ${Math.round(cs * 1.1)}px "Lilita One", sans-serif`; ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(255,213,74,${1 - q})`; ctx.fillText(`Cascade ×${combo.n}!`, C.w / 2, oy + cs * N / 2 - q * 30);
      }
    });
  },
});
