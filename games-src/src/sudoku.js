const LV = /*LEVELS:sudoku*/;

Kit.start({
  id: 'sudoku', title: 'Mini Sudoku', accent: ['#4f8ef2', '#2c5fb8'],
  help: ['Tap an empty square, then a number below.', 'Each row, each column and each box must hold every number once.', 'Numbers in red break a rule. Fill the whole grid to win.'],
  tips: { 0: 'Each row, column and box: every number once' },
  level(i, api) {
    const L = LV[i], N = L.N, given = L.puz.split(',').map(Number), sol = L.sol.split(',').map(Number), g = given.slice();
    let sel = g.indexOf(0), cs = 40, ox = 0, oy = 0, padY = 0, pw = 0;
    const C = api.canvas(o => { cs = Math.floor(Math.min((o.w - 8) / N, (o.h - 80) / N, 64)); ox = (o.w - cs * N) / 2; oy = 4; padY = oy + cs * N + 16; pw = Math.min(56, (o.w - 16) / N - 6); });
    const bad = k => { const v = g[k]; if (!v) return false; const x = k % N, y = (k / N) | 0; for (let j = 0; j < N; j++) { if (j !== x && g[y * N + j] === v) return true; if (j !== y && g[j * N + x] === v) return true; } const bx = x - (x % L.bw), by = y - (y % L.bh); for (let dy = 0; dy < L.bh; dy++) for (let dx = 0; dx < L.bw; dx++) { const m = (by + dy) * N + bx + dx; if (m !== k && g[m] === v) return true; } return false; };
    const hud = () => api.info(`<span class="chip">Empty squares: ${g.filter(v => !v).length}</span>`);
    hud();
    const padX = v => (C.w - (N * pw + (N - 1) * 6)) / 2 + (v - 1) * (pw + 6);
    C.cv.addEventListener('pointerup', e => {
      if (api.ended()) return;
      const p = C.point(e);
      const x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs);
      if (x >= 0 && y >= 0 && x < N && y < N) { const k = y * N + x; if (!given[k]) { sel = k; api.snd.tick(); } return; }
      if (p.y >= padY && p.y <= padY + pw) for (let v = 1; v <= N; v++) {
        if (p.x >= padX(v) && p.x <= padX(v) + pw && sel >= 0 && !given[sel]) {
          g[sel] = g[sel] === v ? 0 : v; api.snd.tap(); api.vib(5); hud();
          if (g.every((w, k) => w === sol[k])) api.win();
          else if (g[sel] && !bad(sel)) { const nx = g.indexOf(0); if (nx >= 0) sel = nx; }
        }
      }
    });
    api.loop(() => {
      const { ctx } = C; C.clear();
      const sv = sel >= 0 ? g[sel] : 0;
      for (let k = 0; k < N * N; k++) {
        const x = ox + (k % N) * cs, y = oy + ((k / N) | 0) * cs;
        const same = sel >= 0 && (k % N === sel % N || ((k / N) | 0) === ((sel / N) | 0));
        ctx.fillStyle = k === sel ? '#ffd54a' : sv && g[k] === sv ? '#c9daff' : same ? '#e3ebff' : '#f5f7ff';
        ctx.fillRect(x, y, cs, cs);
        if (g[k]) { ctx.fillStyle = bad(k) ? '#f0505e' : given[k] ? '#1b1530' : '#2c5fb8'; ctx.font = `${given[k] ? 900 : 700} ${Math.round(cs * 0.55)}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(g[k]), x + cs / 2, y + cs / 2 + 1); }
      }
      ctx.strokeStyle = '#9aa6c8'; ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 0; k <= N; k++) { ctx.moveTo(ox + k * cs, oy); ctx.lineTo(ox + k * cs, oy + N * cs); ctx.moveTo(ox, oy + k * cs); ctx.lineTo(ox + N * cs, oy + k * cs); }
      ctx.stroke();
      ctx.strokeStyle = '#1b1530'; ctx.lineWidth = 3; ctx.beginPath();
      for (let k = 0; k <= N; k += L.bw) { ctx.moveTo(ox + k * cs, oy); ctx.lineTo(ox + k * cs, oy + N * cs); }
      for (let k = 0; k <= N; k += L.bh) { ctx.moveTo(ox, oy + k * cs); ctx.lineTo(ox + N * cs, oy + k * cs); }
      ctx.stroke();
      for (let v = 1; v <= N; v++) {
        const x = padX(v), left = N - g.filter(w => w === v).length;
        ctx.fillStyle = left ? '#1b3570' : 'rgba(27,53,112,.4)'; api.rr(ctx, x, padY, pw, pw, 12); ctx.fill();
        ctx.fillStyle = left ? '#fff' : 'rgba(255,255,255,.35)'; ctx.font = `400 ${Math.round(pw * 0.5)}px "Lilita One", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(v), x + pw / 2, padY + pw / 2 + 1);
      }
    });
  },
});
