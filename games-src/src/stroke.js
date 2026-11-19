const SIZES = [[4, 4], [4, 5], [5, 5], [5, 6], [6, 6], [6, 7], [7, 7], [7, 8], [8, 8], [8, 9]];
const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];

Kit.start({
  id: 'stroke', title: 'One Stroke', accent: ['#a06ee2', '#6d40ad'],
  help: ['Start on the glowing square and drag through the squares next to each other.', 'Visit every square exactly once, in one line.', 'Drag back over your line to undo.'],
  tips: { 0: 'Drag from the glowing square' },
  level(i, api) {
    const [W, H] = SIZES[i], R = api.rng, n = W * H;
    // a long random path (Warnsdorff: prefer squares with fewest free neighbours); squares it misses become holes
    let path = null;
    for (let tries = 0; tries < 400; tries++) {
      const used = new Array(n).fill(false), s = (R() * n) | 0, p = [s]; used[s] = true;
      const free = c => D.map(([dx, dy]) => [c % W + dx, ((c / W) | 0) + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < W && y < H && !used[y * W + x]).map(([x, y]) => y * W + x);
      for (;;) {
        const opts = free(p[p.length - 1]); if (!opts.length) break;
        opts.sort((a, b) => free(a).length - free(b).length + (R() - 0.5) * 0.9);
        const nx = opts[0]; used[nx] = true; p.push(nx);
      }
      const holes = n - p.length;
      if (holes >= Math.max(1, Math.floor(n * 0.05)) && holes <= Math.max(2, Math.floor(n * 0.16))) { path = p; break; }
      if (!path || p.length > path.length) path = p;
    }
    const open = new Array(n).fill(false); path.forEach(c => (open[c] = true));
    const total = path.length, start = path[0];
    let line = [start], cs = 50, ox = 0, oy = 0, drag = false;
    const C = api.canvas(o => { cs = Math.floor(Math.min((o.w - 8) / W, (o.h - 8) / H, 70)); ox = (o.w - cs * W) / 2; oy = (o.h - cs * H) / 2; });
    const hud = () => api.info(`<span class="chip">${line.length} / ${total}</span>`);
    hud();
    const cellAt = e => { const p = C.point(e), x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs); return x >= 0 && y >= 0 && x < W && y < H ? y * W + x : -1; };
    const visit = c => {
      if (c < 0 || !open[c]) return;
      const last = line[line.length - 1];
      if (c === last) return;
      if (line.length > 1 && c === line[line.length - 2]) { line.pop(); api.snd.tick(); hud(); return; }
      const k = line.indexOf(c);
      if (k >= 0) { line.length = k + 1; api.snd.tick(); hud(); return; }
      if (Math.abs(c % W - last % W) + Math.abs(((c / W) | 0) - ((last / W) | 0)) !== 1) return;
      line.push(c); api.snd.pop(Math.min(14, line.length % 15)); api.vib(4); hud();
      if (line.length === total) { drag = false; api.win(); }
    };
    C.cv.addEventListener('pointerdown', e => { if (api.ended()) return; const c = cellAt(e); if (line.includes(c)) { drag = true; C.cv.setPointerCapture(e.pointerId); visit(c); } });
    C.cv.addEventListener('pointermove', e => { if (drag && !api.ended()) visit(cellAt(e)); });
    C.cv.addEventListener('pointerup', () => { drag = false; });
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      for (let c = 0; c < n; c++) {
        if (!open[c]) continue;
        const x = ox + (c % W) * cs, y = oy + ((c / W) | 0) * cs, on = line.includes(c);
        ctx.fillStyle = on ? 'rgba(160,110,226,.35)' : '#13295a'; api.rr(ctx, x + 3, y + 3, cs - 6, cs - 6, cs * 0.18); ctx.fill();
      }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = cs * 0.32; ctx.strokeStyle = '#c9a8ff'; ctx.beginPath();
      line.forEach((c, k) => { const x = ox + (c % W + 0.5) * cs, y = oy + (((c / W) | 0) + 0.5) * cs; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.stroke();
      const sx = ox + (start % W + 0.5) * cs, sy = oy + (((start / W) | 0) + 0.5) * cs;
      ctx.beginPath(); ctx.arc(sx, sy, cs * (0.28 + (line.length === 1 ? 0.05 * Math.sin(now / 200) : 0)), 0, 7); ctx.fillStyle = '#ffc83d'; ctx.fill();
      const e = line[line.length - 1]; ctx.beginPath(); ctx.arc(ox + (e % W + 0.5) * cs, oy + (((e / W) | 0) + 0.5) * cs, cs * 0.2, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
    });
  },
});
