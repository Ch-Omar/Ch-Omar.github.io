const LV = /*LEVELS:tubes*/;
const COLORS = ['#f0505e', '#4f8ef2', '#ffd54a', '#5acb74', '#a06ee2', '#ff9a3c', '#f8a3c6', '#8adaf8'];
const CAP = 4;

Kit.start({
  id: 'tubes', title: 'Tube Sort', accent: ['#8adaf8', '#3b8db3'],
  help: ['Tap a tube to pick up its top ball, then tap another tube to drop it.', 'A ball can go into an empty tube or on top of a ball of the same colour.', 'Sort every colour into its own tube.'],
  tips: { 0: 'Tap a tube, then the tube to drop the ball in' },
  level(i, api) {
    const t = LV[i].tubes.map(x => x.slice());
    let sel = -1, moves = 0, cs = 40, pos = [], fly = null;
    const C = api.canvas(o => {
      const n = t.length, perRow = n > 6 ? Math.ceil(n / 2) : n, rows = Math.ceil(n / perRow);
      cs = Math.min(52, (o.w - 16) / perRow - 12, (o.h - 20) / rows / (CAP + 1.6));
      const tw = cs + 12; pos = t.map((_, k) => { const r = Math.floor(k / perRow), inRow = Math.min(perRow, n - r * perRow), c = k - r * perRow; return [(o.w - inRow * tw) / 2 + c * tw + 6, (o.h - rows * cs * (CAP + 1.6)) / 2 + r * cs * (CAP + 1.6) + cs * 0.9]; });
    });
    const done = () => t.every(x => !x.length || (x.length === CAP && x.every(c => c === x[0])));
    const canMove = (a, b) => a !== b && t[a].length && t[b].length < CAP && (!t[b].length || t[b][t[b].length - 1] === t[a][t[a].length - 1]);
    const anyMove = () => t.some((_, a) => t.some((__, b) => canMove(a, b) && !(t[a].every(c => c === t[a][0]) && !t[b].length)));
    const hud = () => api.info(`<span class="chip">Moves: ${moves}</span><span class="chip">Solver: ${LV[i].moves}</span>`);
    hud();
    C.cv.addEventListener('pointerup', e => {
      if (api.ended() || fly) return;
      const p = C.point(e);
      const k = pos.findIndex(([x, y]) => p.x >= x - 6 && p.x <= x + cs + 6 && p.y >= y - cs * 1.2 && p.y <= y + cs * CAP + 10);
      if (k < 0) { sel = -1; return; }
      if (sel < 0) { if (t[k].length) { sel = k; api.snd.tap(); } return; }
      if (k === sel) { sel = -1; return; }
      if (!canMove(sel, k)) { api.snd.bad(); sel = t[k].length ? k : -1; return; }
      const c = t[sel].pop(); fly = { c, a: sel, b: k, t0: performance.now() }; sel = -1; moves++; hud(); api.snd.whoosh();
    });
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      const ballAt = (k, j) => [pos[k][0] + cs / 2, pos[k][1] + cs * (CAP - j - 0.5) + 4];
      t.forEach((x, k) => {
        const [tx, ty] = pos[k];
        ctx.fillStyle = 'rgba(255,255,255,.06)'; api.rr(ctx, tx - 2, ty - 4, cs + 4, cs * CAP + 12, cs * 0.5); ctx.fill();
        ctx.strokeStyle = sel === k ? '#ffc83d' : 'rgba(255,255,255,.45)'; ctx.lineWidth = 3; api.rr(ctx, tx - 2, ty - 4, cs + 4, cs * CAP + 12, cs * 0.5); ctx.stroke();
        x.forEach((c, j) => {
          let [bx, by] = ballAt(k, j);
          if (sel === k && j === x.length - 1) by = ty - cs * 0.7 + Math.sin(now / 150) * 3;
          ctx.beginPath(); ctx.arc(bx, by, cs * 0.42, 0, 7); ctx.fillStyle = COLORS[c]; ctx.fill();
          ctx.beginPath(); ctx.arc(bx - cs * 0.13, by - cs * 0.14, cs * 0.12, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill();
        });
      });
      if (fly) {
        const q = Math.min(1, (now - fly.t0) / 220), [ax, ay] = [pos[fly.a][0] + cs / 2, pos[fly.a][1] - cs * 0.7], [bx, by] = ballAt(fly.b, t[fly.b].length);
        const x = ax + (bx - ax) * q, y = ay + (by - ay) * q - Math.sin(q * Math.PI) * 30;
        ctx.beginPath(); ctx.arc(x, y, cs * 0.42, 0, 7); ctx.fillStyle = COLORS[fly.c]; ctx.fill();
        if (q >= 1) {
          t[fly.b].push(fly.c); fly = null; api.snd.tap(); api.vib(5);
          if (done()) api.win(`${moves} moves`);
          else if (!anyMove()) api.lose('Stuck', 'Keep an empty tube free as long as you can.');
        }
      }
    });
  },
});
