const LV = /*LEVELS:nono*/;
const INK = ['#f0505e', '#4f8ef2', '#5acb74', '#a06ee2', '#ff9a3c', '#f0505e', '#4f8ef2', '#5acb74', '#a06ee2', '#ff9a3c'];

Kit.start({
  id: 'nono', title: 'Picture Logic', accent: ['#ff9a3c', '#c26a17'],
  help: ['The numbers say how many filled squares are in each row and column, in order, with at least one gap between groups.', 'Tap a square to fill it. Switch to ✕ to mark squares you know are empty.', 'Fill the right squares to reveal the picture. Three wrong fills and you lose.'],
  tips: { 0: 'Start with rows whose numbers are big' },
  level(i, api) {
    const L0 = LV[i], L = { ...L0, rows: L0.rows.map(r => (r.length ? r : [0])), cols: L0.cols.map(c => (c.length ? c : [0])) }, N = L.N, sol = L.g.split('').map(Number), st = new Array(N * N).fill(0); // 0 empty, 1 filled, 2 crossed
    let mode = 1, lives = 3, cs = 30, ox = 0, oy = 0, cw = 0, ch = 0, drag = null, done = false, doneAt = 0;
    const maxR = Math.max(...L.rows.map(r => r.length)), maxC = Math.max(...L.cols.map(c => c.length));
    const C = api.canvas(o => {
      cs = Math.floor(Math.min((o.w - 8) / (N + maxR * 0.6), (o.h - 70) / (N + maxC * 0.6), 56));
      cw = Math.ceil(maxR * cs * 0.6); ch = Math.ceil(maxC * cs * 0.6);
      ox = Math.round((o.w - (N * cs + cw)) / 2) + cw; oy = ch + 6;
    });
    const hud = () => api.info(`<span class="chip">${'♥'.repeat(lives)}<span style="opacity:.3">${'♥'.repeat(3 - lives)}</span></span><button class="chip" id="nmode" style="cursor:pointer;color:inherit">Mode: ${mode === 1 ? '■ fill' : '✕ mark empty'}</button>`);
    hud();
    api.stage.parentElement.querySelector('#kinfo').addEventListener('click', e => { if (e.target.closest('#nmode')) { mode = mode === 1 ? 2 : 1; api.snd.tap(); hud(); } });
    const cellAt = e => { const p = C.point(e), x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs); return x >= 0 && y >= 0 && x < N && y < N ? y * N + x : -1; };
    function act(c) {
      if (c < 0 || st[c] || api.ended() || done) return;
      if (mode === 1) {
        if (sol[c]) { st[c] = 1; api.snd.pop(st.filter(v => v === 1).length % 14); api.vib(5); }
        else { st[c] = 2; lives--; api.snd.bad(); api.vib(40); hud(); if (lives <= 0) { api.lose('Three mistakes', 'Only fill a square when the numbers prove it.'); return; } }
      } else st[c] = 2, api.snd.tick();
      if (sol.every((v, k) => !v || st[k] === 1)) { done = true; doneAt = performance.now(); setTimeout(() => api.win(), 700); }
    }
    C.cv.addEventListener('pointerdown', e => { drag = true; C.cv.setPointerCapture(e.pointerId); act(cellAt(e)); });
    C.cv.addEventListener('pointermove', e => { if (drag) act(cellAt(e)); });
    C.cv.addEventListener('pointerup', () => { drag = false; });
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      const fs = Math.max(10, cs * 0.42);
      ctx.font = `800 ${fs}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      L.rows.forEach((r, y) => { const okRow = sol.slice(y * N, y * N + N).every((v, x) => !v || st[y * N + x] === 1); ctx.fillStyle = okRow ? 'rgba(255,255,255,.35)' : '#fff'; r.forEach((v, k) => ctx.fillText(String(v), ox - (r.length - k - 0.5) * cs * 0.6 - 4, oy + (y + 0.5) * cs)); });
      L.cols.forEach((c, x) => { let ok = true; for (let y = 0; y < N; y++) if (sol[y * N + x] && st[y * N + x] !== 1) ok = false; ctx.fillStyle = ok ? 'rgba(255,255,255,.35)' : '#fff'; c.forEach((v, k) => ctx.fillText(String(v), ox + (x + 0.5) * cs, oy - (c.length - k - 0.5) * cs * 0.6 - 4)); });
      for (let c = 0; c < N * N; c++) {
        const x = ox + (c % N) * cs, y = oy + ((c / N) | 0) * cs;
        ctx.fillStyle = '#dfe5f7'; ctx.fillRect(x, y, cs, cs);
        if (st[c] === 1 || (done && sol[c])) { const q = done ? Math.min(1, (now - doneAt) / 500) : 0; ctx.fillStyle = done ? INK[i] : '#1b2a52'; ctx.globalAlpha = done ? 0.5 + q * 0.5 : 1; ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2); ctx.globalAlpha = 1; }
        if (st[c] === 2 && !done) { ctx.strokeStyle = sol[c] ? '#f0505e' : '#8a94b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + cs * 0.3, y + cs * 0.3); ctx.lineTo(x + cs * 0.7, y + cs * 0.7); ctx.moveTo(x + cs * 0.7, y + cs * 0.3); ctx.lineTo(x + cs * 0.3, y + cs * 0.7); ctx.stroke(); }
      }
      ctx.strokeStyle = 'rgba(27,42,82,.35)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 0; k <= N; k++) { ctx.moveTo(ox + k * cs, oy); ctx.lineTo(ox + k * cs, oy + N * cs); ctx.moveTo(ox, oy + k * cs); ctx.lineTo(ox + N * cs, oy + k * cs); }
      ctx.stroke();
      if (N >= 10) { ctx.strokeStyle = '#1b2a52'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox + 5 * cs, oy); ctx.lineTo(ox + 5 * cs, oy + N * cs); ctx.moveTo(ox, oy + 5 * cs); ctx.lineTo(ox + N * cs, oy + 5 * cs); ctx.stroke(); }
    });
  },
});
