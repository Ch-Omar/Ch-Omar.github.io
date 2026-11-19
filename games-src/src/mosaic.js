const LV = /*LEVELS:mosaic*/;
const REG = ['#e9a46b', '#7fb7a6', '#d97a7a', '#8fa6d8', '#e6cf7a', '#b392c9', '#9cc47a', '#e58fb0', '#7ec3d9'];

Kit.start({
  id: 'mosaic', title: 'Mosaic', accent: ['#e6cf7a', '#a88b33'],
  help: ['Place one gold tile in every row, every column and every colour area.', 'Two gold tiles can never touch, not even at a corner.', 'Tap once to mark a square with a dot (no tile here), twice for a gold tile, a third time to clear it.'],
  tips: { 0: 'One gold tile per row, column and colour' },
  level(i, api) {
    const L = LV[i], N = L.N, st = new Array(N * N).fill(0); // 0 empty, 1 dot, 2 tile
    let cs = 30, ox = 0, oy = 0, t0 = performance.now(), done = false, doneAt = 0;
    const C = api.canvas(o => { cs = Math.floor(Math.min((o.w - 8) / N, (o.h - 8) / N, 64)); ox = (o.w - cs * N) / 2; oy = (o.h - cs * N) / 2; });
    const tiles = () => st.map((v, k) => (v === 2 ? k : -1)).filter(k => k >= 0);
    function conflicts() {
      const bad = new Set(), t = tiles();
      for (let a = 0; a < t.length; a++) for (let b = a + 1; b < t.length; b++) {
        const ax = t[a] % N, ay = (t[a] / N) | 0, bx = t[b] % N, by = (t[b] / N) | 0;
        if (ax === bx || ay === by || L.reg[t[a]] === L.reg[t[b]] || (Math.abs(ax - bx) <= 1 && Math.abs(ay - by) <= 1)) { bad.add(t[a]); bad.add(t[b]); }
      }
      return bad;
    }
    const secs = () => Math.floor(((done ? doneAt : performance.now()) - t0) / 1000);
    let lastSec = -1;
    C.cv.addEventListener('pointerup', e => {
      if (api.ended() || done) return;
      const p = C.point(e), x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs);
      if (x < 0 || y < 0 || x >= N || y >= N) return;
      const k = y * N + x; st[k] = (st[k] + 1) % 3;
      if (st[k] === 2) api.snd.pop(tiles().length); else api.snd.tap();
      api.vib(6);
      if (tiles().length === N && !conflicts().size) { done = true; doneAt = performance.now(); setTimeout(() => api.win(`Solved in ${secs()} s`), 900); }
    });
    function star(ctx, x, y, r, rot) {
      ctx.beginPath();
      for (let k = 0; k < 16; k++) { const a = rot + k * Math.PI / 8, rr2 = k % 2 ? r * 0.55 : r; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
      ctx.closePath();
    }
    api.loop((dt, now) => {
      const s = secs(); if (s !== lastSec) { lastSec = s; api.info(`<span class="chip">⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</span><span class="chip">Tiles ${tiles().length} / ${N}</span>`); }
      const { ctx } = C; C.clear();
      const bad = conflicts(), q = done ? Math.min(1, (now - doneAt) / 800) : 0;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const k = y * N + x, px = ox + x * cs, py = oy + y * cs;
        ctx.fillStyle = REG[L.reg[k] % REG.length]; ctx.fillRect(px, py, cs, cs);
        if (done) {
          // the finished board turns into a tiled mosaic
          const d = Math.hypot(x - N / 2, y - N / 2) / N, a = Math.max(0, Math.min(1, q * 2 - d));
          ctx.globalAlpha = a * 0.55; ctx.fillStyle = '#fff'; star(ctx, px + cs / 2, py + cs / 2, cs * 0.36, Math.PI / 8); ctx.fill();
          ctx.globalAlpha = a * 0.4; ctx.fillStyle = REG[(L.reg[k] + 3) % REG.length]; ctx.fillRect(px + cs * 0.42, py + cs * 0.42, cs * 0.16, cs * 0.16); ctx.globalAlpha = 1;
        }
        if (st[k] === 1) { ctx.beginPath(); ctx.arc(px + cs / 2, py + cs / 2, cs * 0.08, 0, 7); ctx.fillStyle = 'rgba(30,20,40,.55)'; ctx.fill(); }
        if (st[k] === 2) {
          ctx.fillStyle = 'rgba(0,0,0,.25)'; star(ctx, px + cs / 2, py + cs / 2 + 2, cs * 0.38, now / 3000); ctx.fill();
          ctx.fillStyle = bad.has(k) ? '#ff5468' : '#ffd54a'; star(ctx, px + cs / 2, py + cs / 2, cs * 0.38, now / 3000); ctx.fill();
          ctx.strokeStyle = bad.has(k) ? '#8a1020' : '#a07a10'; ctx.lineWidth = 2; ctx.stroke();
        }
      }
      // region borders
      ctx.strokeStyle = '#1b1530'; ctx.lineWidth = 3; ctx.beginPath();
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const k = y * N + x, px = ox + x * cs, py = oy + y * cs;
        if (x < N - 1 && L.reg[k] !== L.reg[k + 1]) { ctx.moveTo(px + cs, py); ctx.lineTo(px + cs, py + cs); }
        if (y < N - 1 && L.reg[k] !== L.reg[k + N]) { ctx.moveTo(px, py + cs); ctx.lineTo(px + cs, py + cs); }
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(27,21,48,.35)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 1; k < N; k++) { ctx.moveTo(ox + k * cs, oy); ctx.lineTo(ox + k * cs, oy + N * cs); ctx.moveTo(ox, oy + k * cs); ctx.lineTo(ox + N * cs, oy + k * cs); }
      ctx.stroke();
      ctx.strokeStyle = '#1b1530'; ctx.lineWidth = 4; ctx.strokeRect(ox, oy, N * cs, N * cs);
    });
  },
});
