// board size, random slides used to shuffle (always solvable: it is built from the solved board)
const SPEC = [[3, 12], [3, 30], [3, 80], [4, 30], [4, 60], [4, 120], [4, 200], [5, 60], [5, 150], [5, 300]];

Kit.start({
  id: 'slide', title: 'Slide Puzzle', accent: ['#8adaf8', '#3b8db3'],
  help: ['Tap a tile in the same row or column as the empty space to slide it there.', 'Put the numbers back in order: 1 at the top left, the empty space at the bottom right.', 'The colours help: each row has its own colour.'],
  tips: { 0: 'Tap a tile next to the empty space' },
  level(i, api) {
    const [N, mix] = SPEC[i], R = api.rng, b = [...Array(N * N).keys()].map(k => (k + 1) % (N * N));
    let hole = N * N - 1, last = -1;
    for (let s = 0; s < mix; s++) {
      const x = hole % N, y = (hole / N) | 0;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, c]) => a >= 0 && c >= 0 && a < N && c < N).map(([a, c]) => c * N + a).filter(m => m !== last);
      const m = nb[(R() * nb.length) | 0]; b[hole] = b[m]; b[m] = 0; last = hole; hole = m;
    }
    if (b.every((v, k) => v === (k + 1) % (N * N))) { b[hole] = b[hole - 1]; b[hole - 1] = 0; hole--; }
    let moves = 0, cs = 50, ox = 0, oy = 0;
    const anim = new Map();
    const C = api.canvas(o => { cs = Math.floor(Math.min((o.w - 8) / N, (o.h - 8) / N, 100)); ox = (o.w - cs * N) / 2; oy = (o.h - cs * N) / 2; });
    const hud = () => api.info(`<span class="chip">Moves: ${moves}</span>`);
    hud();
    const hue = v => `hsl(${(((v - 1) / N) | 0) * (300 / N) + 10}, 70%, ${55 + ((v - 1) % N) * 4}%)`;
    C.cv.addEventListener('pointerup', e => {
      if (api.ended()) return;
      const p = C.point(e), x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs);
      if (x < 0 || y < 0 || x >= N || y >= N) return;
      const hx = hole % N, hy = (hole / N) | 0;
      if (x !== hx && y !== hy) { api.snd.bad(); return; }
      if (x === hx && y === hy) return;
      const dx = Math.sign(x - hx), dy = Math.sign(y - hy), now = performance.now();
      let cx = hx, cy = hy;
      while (cx !== x || cy !== y) { const nx = cx + dx, ny = cy + dy, from = ny * N + nx, to = cy * N + cx; b[to] = b[from]; b[from] = 0; anim.set(b[to], { fx: nx, fy: ny, t0: now }); cx = nx; cy = ny; }
      hole = y * N + x; moves++; api.snd.tap(); api.vib(5); hud();
      if (b.every((v, k) => v === (k + 1) % (N * N))) api.win(`${moves} moves`);
    });
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      ctx.fillStyle = 'rgba(0,0,0,.25)'; api.rr(ctx, ox - 6, oy - 6, cs * N + 12, cs * N + 12, 14); ctx.fill();
      b.forEach((v, k) => {
        if (!v) return;
        let x = k % N, y = (k / N) | 0;
        const a = anim.get(v);
        if (a) { const q = Math.min(1, (now - a.t0) / 110); x = a.fx + (x - a.fx) * q; y = a.fy + (y - a.fy) * q; if (q >= 1) anim.delete(v); }
        const px = ox + x * cs, py = oy + y * cs, home = v === (k + 1) % (N * N);
        ctx.fillStyle = hue(v); api.rr(ctx, px + 3, py + 3, cs - 6, cs - 6, cs * 0.16); ctx.fill();
        if (home) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; api.rr(ctx, px + 3, py + 3, cs - 6, cs - 6, cs * 0.16); ctx.stroke(); }
        ctx.fillStyle = '#1b1530'; ctx.font = `400 ${Math.round(cs * 0.42)}px "Lilita One", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(v), px + cs / 2, py + cs / 2 + 1);
      });
    });
  },
});
