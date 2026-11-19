const COLORS = ['#f0505e', '#4f8ef2', '#ffd54a', '#5acb74', '#a06ee2'];
const SPEC = [[6, 8, 3], [6, 8, 3], [7, 9, 3], [7, 9, 4], [8, 10, 4], [8, 10, 4], [8, 11, 4], [9, 11, 5], [9, 12, 5], [9, 12, 5]];

function group(g, W, H, c0) {
  const v = g[c0]; if (v < 0) return [];
  const out = [c0], seen = new Set(out);
  for (let k = 0; k < out.length; k++) {
    const c = out[k], x = c % W, y = (c / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const m = ny * W + nx; if (!seen.has(m) && g[m] === v) { seen.add(m); out.push(m); } }
  }
  return out;
}
function collapse(g, W, H) {
  const cols = [];
  for (let x = 0; x < W; x++) { const col = []; for (let y = H - 1; y >= 0; y--) if (g[y * W + x] >= 0) col.push(g[y * W + x]); if (col.length) cols.push(col); }
  const out = new Array(W * H).fill(-1);
  cols.forEach((col, x) => col.forEach((v, k) => { out[(H - 1 - k) * W + x] = v; }));
  return out;
}
const groups = (g, W, H) => { const seen = new Set(), res = []; for (let c = 0; c < W * H; c++) if (g[c] >= 0 && !seen.has(c)) { const gr = group(g, W, H, c); gr.forEach(m => seen.add(m)); if (gr.length > 1) res.push(gr); } return res; };

Kit.start({
  id: 'pop', title: 'Pop Groups', accent: ['#f0505e', '#b02d3a'],
  help: ['Tap two or more touching balls of the same colour to pop them.', 'Balls above fall down, and empty columns close up.', 'Leave no more balls than the goal when no group is left. Let colours join into big groups first.'],
  tips: { 0: 'Let colours join up, then pop big groups' },
  level(i, api) {
    const [W, H, K] = SPEC[i], R = api.rng;
    let g = Array.from({ length: W * H }, () => (R() * K) | 0);
    // goal: most of what a simple "always pop the biggest group" player would clear
    let sim = g.slice(), simLeft = W * H;
    for (;;) { const gs = groups(sim, W, H); if (!gs.length) break; const big = gs.sort((a, b) => b.length - a.length)[0]; big.forEach(c => (sim[c] = -1)); simLeft -= big.length; sim = collapse(sim, W, H); }
    const goal = Math.max(0, Math.floor(simLeft * 1.15) + (i < 3 ? 4 : 1));
    let cs = 40, ox = 0, oy = 0, pops = [], left = W * H;
    const C = api.canvas(o => { cs = Math.floor(Math.min((o.w - 8) / W, (o.h - 8) / H, 60)); ox = (o.w - cs * W) / 2; oy = (o.h - cs * H) / 2; });
    const hud = () => api.info(`<span class="chip">Balls left: ${left}</span><span class="chip">Goal: ${goal} or fewer</span>`);
    hud();
    C.cv.addEventListener('pointerup', e => {
      if (api.ended()) return;
      const p = C.point(e), x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const gr = group(g, W, H, y * W + x);
      if (gr.length < 2) { if (gr.length) api.snd.bad(); return; }
      const now = performance.now();
      gr.forEach(c => { pops.push({ x: c % W, y: (c / W) | 0, col: g[c], t0: now }); g[c] = -1; });
      left -= gr.length; g = collapse(g, W, H);
      api.snd.pop(Math.min(14, gr.length)); api.vib(Math.min(40, gr.length * 3)); hud();
      if (!groups(g, W, H).length) {
        if (left <= goal) api.win(left ? `${left} balls left` : 'Board cleared!');
        else api.lose('No more groups', `${left} balls left, the goal was ${goal}. Let colours join up before you pop them.`);
      }
    });
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      for (let c = 0; c < W * H; c++) {
        if (g[c] < 0) continue;
        const cx = ox + (c % W + 0.5) * cs, cy = oy + (((c / W) | 0) + 0.5) * cs;
        ctx.beginPath(); ctx.arc(cx, cy, cs * 0.44, 0, 7); ctx.fillStyle = COLORS[g[c]]; ctx.fill();
        ctx.beginPath(); ctx.arc(cx - cs * 0.13, cy - cs * 0.14, cs * 0.12, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill();
      }
      pops = pops.filter(p => {
        const q = (now - p.t0) / 280; if (q > 1) return false;
        ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.arc(ox + (p.x + 0.5) * cs, oy + (p.y + 0.5) * cs, cs * 0.44 * (1 + q * 0.6), 0, 7); ctx.fillStyle = COLORS[p.col]; ctx.fill(); ctx.globalAlpha = 1;
        return true;
      });
    });
  },
});
