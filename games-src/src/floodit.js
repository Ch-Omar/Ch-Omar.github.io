const COLORS = ['#f0505e', '#4f8ef2', '#ffd54a', '#5acb74', '#a06ee2', '#ff9a3c'];
const SPEC = [[6, 3], [7, 4], [8, 4], [9, 5], [10, 5], [10, 5], [11, 6], [12, 6], [12, 6], [13, 6]];

function fill(g, N, col) {
  // repaint the region that touches the top-left corner
  const old = g[0], out = g.slice();
  if (old === col) return out;
  const st = [0], seen = new Uint8Array(N * N); seen[0] = 1;
  while (st.length) {
    const c = st.pop(); out[c] = col;
    const x = c % N, y = (c / N) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const m = ny * N + nx; if (!seen[m] && g[m] === old) { seen[m] = 1; st.push(m); } }
  }
  return out;
}
function region(g, N) {
  const st = [0], seen = new Uint8Array(N * N); seen[0] = 1; let k = 0;
  while (st.length) { const c = st.pop(); k++; const x = c % N, y = (c / N) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const m = ny * N + nx; if (!seen[m] && g[m] === g[0]) { seen[m] = 1; st.push(m); } } }
  return k;
}

Kit.start({
  id: 'floodit', title: 'Color Flood', accent: ['#ff9a3c', '#c26a17'],
  help: ['Your area starts in the top-left corner.', 'Tap a colour: your whole area turns that colour and swallows the touching squares of the same colour.', 'Fill the whole board before your moves run out.'],
  tips: { 0: 'Pick the colour that grabs the most squares' },
  level(i, api) {
    const [N, K] = SPEC[i], R = api.rng;
    let g = Array.from({ length: N * N }, () => (R() * K) | 0);
    // move limit: a greedy player's moves, plus a little slack on the first levels
    let sim = g, greedy = 0;
    while (region(sim, N) < N * N) { let best = -1, bc = 0; for (let c = 0; c < K; c++) { if (c === sim[0]) continue; const r = region(fill(sim, N, c), N); if (r > best) { best = r; bc = c; } } sim = fill(sim, N, bc); greedy++; }
    let left = greedy + (i < 3 ? 2 : i < 6 ? 1 : 0), cs = 30, ox = 0, oy = 0, by = 0, wave = 0;
    const C = api.canvas(o => { cs = Math.floor(Math.min((o.w - 8) / N, (o.h - 90) / N)); ox = (o.w - cs * N) / 2; oy = 4; by = oy + cs * N + 22; });
    const hud = () => api.info(`<span class="chip${left <= 2 ? ' warn' : ''}">Moves left: ${left}</span><span class="chip">${Math.round(region(g, N) / (N * N) * 100)}% filled</span>`);
    hud();
    const btn = c => { const s = Math.min(58, (C.w - 20) / K - 10); const x0 = (C.w - (K * s + (K - 1) * 10)) / 2; return [x0 + c * (s + 10), by, s]; };
    C.cv.addEventListener('pointerup', e => {
      if (api.ended()) return;
      const p = C.point(e);
      for (let c = 0; c < K; c++) {
        const [x, y, s] = btn(c);
        if (p.x >= x && p.x <= x + s && p.y >= y && p.y <= y + s) {
          if (c === g[0]) { api.snd.bad(); return; }
          g = fill(g, N, c); left--; wave = performance.now(); api.snd.pop(K - left); api.vib(6); hud();
          if (region(g, N) === N * N) api.win(left ? `${left} move${left > 1 ? 's' : ''} to spare` : '');
          else if (left <= 0) api.lose('Out of moves', 'Grab the colours that touch the most of the board.');
          return;
        }
      }
    });
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      for (let c = 0; c < N * N; c++) {
        const x = c % N, y = (c / N) | 0, d = (x + y) * 18, q = Math.max(0, Math.min(1, (now - wave - d) / 160));
        ctx.fillStyle = COLORS[g[c]]; const s = cs * (q < 1 ? 0.85 + 0.15 * q : 1);
        ctx.fillRect(ox + x * cs + (cs - s) / 2, oy + y * cs + (cs - s) / 2, s, s);
      }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(ox + 1.5, oy + 1.5, cs * 1.3, cs * 1.3);
      for (let c = 0; c < K; c++) {
        const [x, y, s] = btn(c);
        ctx.fillStyle = 'rgba(0,0,0,.35)'; api.rr(ctx, x, y + 4, s, s, 14); ctx.fill();
        ctx.fillStyle = COLORS[c]; api.rr(ctx, x, y, s, s, 14); ctx.fill();
        if (c === g[0]) { ctx.fillStyle = 'rgba(7,22,51,.55)'; api.rr(ctx, x, y, s, s, 14); ctx.fill(); }
      }
    });
  },
});
