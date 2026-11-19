// Pipes: bits up 1, right 2, down 4, left 8. The level is a random tree of pipes, then every tile is turned at random.
const SIZES = [[4, 4], [4, 5], [5, 5], [5, 6], [5, 7], [6, 7], [6, 8], [7, 8], [7, 9], [8, 10]];
const DIR = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
const rot = m => ((m << 1) | (m >> 3)) & 15;

Kit.start({
  id: 'pipes', title: 'Pipe Spin', accent: ['#5ab8f0', '#2e7fb8'],
  help: ['Tap a pipe to turn it a quarter turn.', 'Water flows from the tap through every pipe that connects.', 'Water every flower and leave no open pipe end.'],
  tips: { 0: 'Tap pipes to turn them' },
  level(i, api) {
    const [W, H] = SIZES[i], R = api.rng, n = W * H, sol = new Array(n).fill(0);
    const src = ((H / 2) | 0) * W + ((W / 2) | 0), seen = new Array(n).fill(false), stack = [src];
    seen[src] = true;
    while (stack.length) {
      const c = stack[stack.length - 1], x = c % W, y = (c / W) | 0;
      const opts = DIR.filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < W && ny < H && !seen[ny * W + nx]; });
      if (!opts.length) { stack.pop(); continue; }
      // sometimes branch from an earlier pipe, so the tree has more forks and flowers
      if (stack.length > 2 && R() < 0.3) { const j = (R() * stack.length) | 0; [stack[j], stack[stack.length - 1]] = [stack[stack.length - 1], stack[j]]; continue; }
      const [dx, dy, b, back] = opts[(R() * opts.length) | 0], m = (y + dy) * W + x + dx;
      sol[c] |= b; sol[m] |= back; seen[m] = true; stack.push(m);
    }
    const t = sol.map(m => { let v = m; const k = (R() * 4) | 0; for (let s = 0; s < k; s++) v = rot(v); return v; });
    const turn = new Array(n).fill(0);
    let cs = 40, ox = 0, oy = 0, taps = 0, lit = [];
    const C = api.canvas(o => { cs = Math.floor(Math.min((o.w - 8) / W, (o.h - 8) / H, 70)); ox = (o.w - cs * W) / 2; oy = (o.h - cs * H) / 2; });
    function flow() {
      const on = new Array(n).fill(false), q = [src]; on[src] = true; let leak = false;
      while (q.length) {
        const c = q.shift(), x = c % W, y = (c / W) | 0;
        for (const [dx, dy, b, back] of DIR) {
          if (!(t[c] & b)) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) { leak = true; continue; }
          const m = ny * W + nx;
          if (!(t[m] & back)) { leak = true; continue; }
          if (!on[m]) { on[m] = true; q.push(m); }
        }
      }
      return { on, leak };
    }
    const hud = () => { const f = flow(); lit = f.on; const flowers = sol.map((m, k) => (k !== src && [1, 2, 4, 8].includes(m) ? k : -1)).filter(k => k >= 0);
      api.info(`<span class="chip">Flowers: ${flowers.filter(k => lit[k]).length} / ${flowers.length}</span><span class="chip">Turns: ${taps}</span>`); return f; };
    hud();
    C.cv.addEventListener('pointerup', e => {
      if (api.ended()) return;
      const p = C.point(e), x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const c = y * W + x; t[c] = rot(t[c]); turn[c] = performance.now(); taps++;
      api.snd.tap(); api.vib(5);
      const f = hud();
      if (f.on.every(Boolean) && !f.leak) { api.snd.good(); setTimeout(() => api.win(`${taps} turns`), 300); }
    });
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      for (let c = 0; c < n; c++) {
        const x = ox + (c % W) * cs, y = oy + ((c / W) | 0) * cs, cx = x + cs / 2, cy = y + cs / 2;
        ctx.fillStyle = (c % W + ((c / W) | 0)) % 2 ? '#10244f' : '#132a5a'; ctx.fillRect(x, y, cs, cs);
        const q = Math.min(1, (now - turn[c]) / 140);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(-(1 - q) * Math.PI / 2);
        ctx.lineCap = 'round';
        for (const [lw, col] of [[cs * 0.34, '#0a1736'], [cs * 0.24, lit[c] ? '#5ab8f0' : '#6c7aa3']]) {
          ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.beginPath();
          DIR.forEach(([dx, dy, b]) => { if (t[c] & b) { ctx.moveTo(0, 0); ctx.lineTo(dx * cs / 2, dy * cs / 2); } });
          ctx.stroke();
        }
        ctx.restore();
        const deg = [1, 2, 4, 8].includes(t[c]);
        if (c === src) { ctx.beginPath(); ctx.arc(cx, cy, cs * 0.26, 0, 7); ctx.fillStyle = '#ffc83d'; ctx.fill(); ctx.strokeStyle = '#c98e17'; ctx.lineWidth = 3; ctx.stroke(); }
        else if (deg) {
          const open = lit[c];
          for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + now / 2000; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * cs * 0.13, cy + Math.sin(a) * cs * 0.13, cs * (open ? 0.12 : 0.07), 0, 7); ctx.fillStyle = open ? '#f8a3c6' : '#8a6a7c'; ctx.fill(); }
          ctx.beginPath(); ctx.arc(cx, cy, cs * 0.08, 0, 7); ctx.fillStyle = '#ffd54a'; ctx.fill();
        }
      }
    });
  },
});
