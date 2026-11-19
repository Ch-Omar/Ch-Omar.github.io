// columns, rows, mines
const SPEC = [[6, 8, 6], [6, 8, 8], [7, 9, 10], [7, 9, 12], [8, 10, 14], [8, 10, 16], [8, 11, 18], [9, 12, 20], [9, 12, 23], [9, 13, 26]];
const NUM = ['', '#4f8ef2', '#2f9d59', '#f0505e', '#6d40ad', '#c26a17', '#2e7fb8', '#1b1530', '#5b6a8f'];

Kit.start({
  id: 'mines', title: 'Safe Steps', accent: ['#5acb74', '#2f8f4a'],
  help: ['Tap a square to open it. Your first tap is always safe.', 'A number tells how many mines touch that square, corners included.', 'Switch to 🚩 to mark mines. Open every safe square to win.'],
  tips: { 0: 'Tap anywhere to start: the first tap is safe' },
  level(i, api) {
    const [W, H, M] = SPEC[i], R = api.rng, n = W * H;
    const mine = new Array(n).fill(false), open = new Array(n).fill(false), flag = new Array(n).fill(false);
    let placed = false, mode = 'open', cs = 40, ox = 0, oy = 0, boom = -1, openedAt = new Array(n).fill(0);
    const C = api.canvas(o => { cs = Math.floor(Math.min((o.w - 8) / W, (o.h - 8) / H, 60)); ox = (o.w - cs * W) / 2; oy = (o.h - cs * H) / 2; });
    const nb = c => { const x = c % W, y = (c / W) | 0, out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) out.push(ny * W + nx); } return out; };
    const count = c => nb(c).filter(m => mine[m]).length;
    const hud = () => api.info(`<span class="chip">🚩 ${flag.filter(Boolean).length} / ${M}</span><button class="chip" id="mmode" style="cursor:pointer;color:inherit">Mode: ${mode === 'open' ? '⛏ open' : '🚩 flag'}</button>`);
    hud();
    api.stage.parentElement.querySelector('#kinfo').addEventListener('click', e => { if (e.target.closest('#mmode')) { mode = mode === 'open' ? 'flag' : 'open'; api.snd.tap(); hud(); } });
    function reveal(c, now) {
      const st = [c];
      while (st.length) { const k = st.pop(); if (open[k] || flag[k]) continue; open[k] = true; openedAt[k] = now + Math.hypot(k % W - c % W, ((k / W) | 0) - ((c / W) | 0)) * 25; if (!count(k) && !mine[k]) nb(k).forEach(m => st.push(m)); }
    }
    C.cv.addEventListener('pointerup', e => {
      if (api.ended()) return;
      const p = C.point(e), x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const c = y * W + x;
      if (open[c]) return;
      if (mode === 'flag') { flag[c] = !flag[c]; api.snd.tick(); hud(); return; }
      if (flag[c]) return;
      if (!placed) {
        const safe = new Set([c, ...nb(c)]), spots = [...Array(n).keys()].filter(k => !safe.has(k));
        for (let k = 0; k < M; k++) mine[spots.splice((R() * spots.length) | 0, 1)[0]] = true;
        placed = true;
      }
      if (mine[c]) { boom = c; open[c] = true; api.snd.thud(); api.vib([60, 40, 90]); api.lose('Boom!', 'Use the numbers: if they leave no choice, a square is safe.'); return; }
      reveal(c, performance.now()); api.snd.pop(open.filter(Boolean).length % 14); api.vib(5);
      if (open.filter(Boolean).length === n - M) api.win();
    });
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      for (let c = 0; c < n; c++) {
        const x = ox + (c % W) * cs, y = oy + ((c / W) | 0) * cs, shown = open[c] && now >= openedAt[c];
        if (!shown) {
          ctx.fillStyle = (c % W + ((c / W) | 0)) % 2 ? '#3f9a5c' : '#46a865'; ctx.fillRect(x, y, cs, cs);
          if (flag[c]) { ctx.font = `${cs * 0.55}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚩', x + cs / 2, y + cs / 2); }
          if (api.ended() && mine[c] && boom >= 0) { ctx.beginPath(); ctx.arc(x + cs / 2, y + cs / 2, cs * 0.22, 0, 7); ctx.fillStyle = '#1b1530'; ctx.fill(); }
        } else {
          ctx.fillStyle = (c % W + ((c / W) | 0)) % 2 ? '#e7d3b0' : '#efdcbb'; ctx.fillRect(x, y, cs, cs);
          if (mine[c]) { ctx.fillStyle = '#f0505e'; ctx.fillRect(x, y, cs, cs); ctx.beginPath(); ctx.arc(x + cs / 2, y + cs / 2, cs * 0.24, 0, 7); ctx.fillStyle = '#1b1530'; ctx.fill(); }
          else { const k = count(c); if (k) { ctx.fillStyle = NUM[k]; ctx.font = `400 ${Math.round(cs * 0.55)}px "Lilita One", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(k), x + cs / 2, y + cs / 2 + 1); } }
        }
      }
    });
  },
});
