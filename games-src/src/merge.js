const COLS = 5, ROWS = 7;
const TARGET = [32, 64, 64, 128, 128, 256, 256, 512, 512, 1024];
const TINT = { 2: '#4f8ef2', 4: '#5acb74', 8: '#ffd54a', 16: '#ff9a3c', 32: '#f0505e', 64: '#a06ee2', 128: '#f8a3c6', 256: '#8adaf8', 512: '#2f9d59', 1024: '#c26a17', 2048: '#ffc83d' };

Kit.start({
  id: 'merge', title: 'Merge Drop', accent: ['#a06ee2', '#6d40ad'],
  help: ['Tap a column to drop the next number into it.', 'Equal numbers that touch merge into one double number, and merges can chain.', 'Reach the target number before a column overflows.'],
  tips: { 0: 'Drop the number next to its twin' },
  level(i, api) {
    const R = api.rng, g = new Array(COLS * ROWS).fill(0), target = TARGET[i];
    const roll = () => { const top = Math.max(1, Math.min(5, 2 + Math.floor(i / 2))); return 2 ** (1 + ((R() * R() * top) | 0)); };
    let next = roll(), after = roll(), cs = 50, ox = 0, oy = 0, best = 0, pops = [], busy = false;
    const C = api.canvas(o => { cs = Math.floor(Math.min((o.w - 8) / COLS, (o.h - 70) / ROWS, 76)); ox = (o.w - cs * COLS) / 2; oy = 60; });
    const hud = () => api.info(`<span class="chip">Goal: ${target}</span><span class="chip">Best: ${best || '–'}</span>`);
    hud();
    const at = (x, y) => (x >= 0 && y >= 0 && x < COLS && y < ROWS ? g[y * COLS + x] : -1);
    function settle() {
      for (let x = 0; x < COLS; x++) { const col = []; for (let y = ROWS - 1; y >= 0; y--) if (g[y * COLS + x]) col.push(g[y * COLS + x]); for (let y = ROWS - 1, k = 0; y >= 0; y--, k++) g[y * COLS + x] = col[k] || 0; }
    }
    function merges() {
      // any tile with an equal neighbour absorbs it; repeat until nothing merges
      let chain = 0;
      for (;;) {
        let did = false;
        for (let y = ROWS - 1; y >= 0 && !did; y--) for (let x = 0; x < COLS && !did; x++) {
          const v = g[y * COLS + x]; if (!v) continue;
          const nb = [[0, -1], [-1, 0], [1, 0], [0, 1]].filter(([dx, dy]) => at(x + dx, y + dy) === v);
          if (!nb.length) continue;
          nb.forEach(([dx, dy]) => { g[(y + dy) * COLS + x + dx] = 0; });
          g[y * COLS + x] = v * 2 ** nb.length; best = Math.max(best, g[y * COLS + x]);
          pops.push({ c: y * COLS + x, t0: performance.now() });
          chain++; did = true; settle();
        }
        if (!did) break;
      }
      return chain;
    }
    C.cv.addEventListener('pointerup', e => {
      if (api.ended() || busy) return;
      const p = C.point(e), x = Math.floor((p.x - ox) / cs);
      if (x < 0 || x >= COLS) return;
      if (g[x]) { api.snd.bad(); api.shake(); return; }
      let y = ROWS - 1; while (g[y * COLS + x]) y--;
      g[y * COLS + x] = next; best = Math.max(best, next); next = after; after = roll();
      api.snd.tap();
      const chain = merges();
      if (chain) { api.snd.pop(chain * 2 + 2); api.vib(10 * chain); }
      hud();
      if (best >= target) { busy = true; setTimeout(() => api.win(`Made ${best}`), 400); return; }
      if ([...Array(COLS).keys()].every(c => g[c])) api.lose('No room left', `Best tile: ${best}. Keep big numbers in one corner.`);
    });
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      const tile = (x, y, v, s = 1) => {
        const w = (cs - 8) * s;
        ctx.fillStyle = TINT[v] || '#ffffff'; api.rr(ctx, x - w / 2, y - w / 2, w, w, w * 0.2); ctx.fill();
        ctx.fillStyle = '#1b1530'; ctx.font = `400 ${Math.round(cs * (v >= 1000 ? 0.3 : 0.38) * s)}px "Lilita One", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(v), x, y + 1);
      };
      for (let x = 0; x < COLS; x++) { ctx.fillStyle = x % 2 ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.07)'; ctx.fillRect(ox + x * cs, oy, cs, cs * ROWS); }
      for (let c = 0; c < COLS * ROWS; c++) {
        if (!g[c]) continue;
        const pp = pops.find(p => p.c === c && now - p.t0 < 250), s = pp ? 1 + Math.sin((now - pp.t0) / 250 * Math.PI) * 0.15 : 1;
        tile(ox + (c % COLS + 0.5) * cs, oy + (((c / COLS) | 0) + 0.5) * cs, g[c], s);
      }
      pops = pops.filter(p => now - p.t0 < 300);
      tile(C.w / 2, 30, next, 0.75);
      ctx.globalAlpha = 0.45; tile(C.w / 2 + cs * 0.8, 30, after, 0.5); ctx.globalAlpha = 1;
    });
  },
});
