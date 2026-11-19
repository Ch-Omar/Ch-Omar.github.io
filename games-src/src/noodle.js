const LV = /*LEVELS:noodle*/;
const COLORS = ['#f0505e', '#4f8ef2', '#ffd54a', '#5acb74', '#a06ee2', '#ff9a3c'];
const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const SLOTS = 5;

Kit.start({
  id: 'noodle', title: 'Noodle Out', accent: ['#ffd54a', '#c99b17'],
  help: ['Tap a noodle. It slides out the way its head points, but only if nothing is in the way.', 'Every noodle that gets out lands in a bowl at the bottom. Three of the same colour clear.', 'Five bowls only: if they fill up with mixed colours, you lose. A blocked noodle costs a heart.'],
  tips: { 0: 'Tap a noodle whose path is clear', 1: 'Three of a colour in the bowls clear them' },
  level(i, api) {
    const L = LV[i], W = L.W, H = L.H;
    const nd = L.noodles.map(n => ({ ...n, out: false }));
    const occ = new Array(W * H).fill(-1);
    nd.forEach((n, k) => n.body.forEach(c => (occ[c] = k)));
    let hearts = 3, tray = [], moving = [], bumps = [], cs = 30, ox = 0, oy = 0, trayY = 0, clearing = [];
    const C = api.canvas(o => {
      const trayH = 78;
      cs = Math.floor(Math.min((o.w - 8) / W, (o.h - trayH - 12) / H, 60));
      ox = (o.w - cs * W) / 2; oy = Math.max(4, (o.h - trayH - cs * H) / 2); trayY = o.h - trayH + 8;
    });
    const hud = () => api.info(`<span class="chip">${'♥'.repeat(hearts)}<span style="opacity:.3">${'♥'.repeat(3 - hearts)}</span></span><span class="chip">Noodles left: ${nd.filter(n => !n.out).length}</span>`);
    hud();
    const rayClear = n => {
      const h = n.body[0], [dx, dy] = D4[n.d];
      for (let x = h % W + dx, y = ((h / W) | 0) + dy; x >= 0 && y >= 0 && x < W && y < H; x += dx, y += dy) {
        const o = occ[y * W + x]; if (o >= 0 && nd[o] !== n) return { x, y };
      }
      return null;
    };
    C.cv.addEventListener('pointerup', e => {
      if (api.ended()) return;
      const p = C.point(e), x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const k = occ[y * W + x];
      if (k < 0) return;
      const n = nd[k], block = rayClear(n);
      if (block) {
        hearts--; hud(); api.snd.bad(); api.vib(40);
        bumps.push({ n, t0: performance.now() });
        if (hearts <= 0) setTimeout(() => api.lose('Out of hearts', 'Look where each head points before you tap.'), 400);
        return;
      }
      n.body.forEach(c => (occ[c] = -1));
      n.out = true;
      // path from tail to head, then straight out past the edge
      const pts = n.body.slice().reverse().map(c => [c % W, (c / W) | 0]);
      const [dx, dy] = D4[n.d];
      let [hx, hy] = pts[pts.length - 1];
      for (let s = 0; s < W + H + n.body.length + 2; s++) { hx += dx; hy += dy; pts.push([hx, hy]); if (hx < -n.body.length - 1 || hy < -n.body.length - 1 || hx > W + n.body.length || hy > H + n.body.length) break; }
      moving.push({ n, pts, t0: performance.now(), dur: 120 + pts.length * 38 });
      api.snd.whoosh(); api.vib(10); hud();
    });
    function land(n) {
      tray.push({ c: n.c, t0: performance.now() });
      api.snd.tap();
      const same = tray.filter(t => t.c === n.c);
      if (same.length >= 3) {
        setTimeout(() => {
          if (!api.alive()) return;
          let removed = 0;
          tray = tray.filter(t => (t.c === n.c && removed < 3 ? (removed++, clearing.push({ ...t, t1: performance.now() }), false) : true));
          api.snd.pop(5); api.vib(20); checkEnd();
        }, 260);
      } else checkEnd();
    }
    function checkEnd() {
      if (tray.length >= SLOTS && !COLORS.some((_, c) => tray.filter(t => t.c === c).length >= 3)) { api.lose('Bowls full', 'Send out noodles of the same colour close together.'); return; }
      if (nd.every(n => n.out) && !moving.length && tray.length === 0) api.win();
    }
    function strand(ctx, pts, s, len, color, d) {
      // draw a thick line along pts from index s (fractional) for len cells
      const at = t => { const i = Math.max(0, Math.min(pts.length - 1.001, t)), a = Math.floor(i), f = i - a; const p = pts[a], q = pts[Math.min(a + 1, pts.length - 1)]; return [ox + (p[0] + (q[0] - p[0]) * f + 0.5) * cs, oy + (p[1] + (q[1] - p[1]) * f + 0.5) * cs]; };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      const step = 0.25;
      for (let t = s; t <= s + len - 1 + 1e-6; t += step) { const [x, y] = at(t); if (t === s) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.lineWidth = cs * 0.62; ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.save(); ctx.translate(0, cs * 0.06); ctx.stroke(); ctx.restore();
      ctx.lineWidth = cs * 0.56; ctx.strokeStyle = color; ctx.stroke();
      ctx.lineWidth = cs * 0.14; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
      const [hx, hy] = at(s + len - 1), [dx, dy] = D4[d];
      const px = -dy, py = dx;
      for (const sgn of [-1, 1]) {
        ctx.beginPath(); ctx.arc(hx + px * cs * 0.13 * sgn + dx * cs * 0.08, hy + py * cs * 0.13 * sgn + dy * cs * 0.08, cs * 0.09, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.beginPath(); ctx.arc(hx + px * cs * 0.13 * sgn + dx * cs * 0.12, hy + py * cs * 0.13 * sgn + dy * cs * 0.12, cs * 0.045, 0, 7); ctx.fillStyle = '#1b1530'; ctx.fill();
      }
    }
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      ctx.fillStyle = 'rgba(255,255,255,.04)'; api.rr(ctx, ox - 6, oy - 6, W * cs + 12, H * cs + 12, 16); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.07)';
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { ctx.beginPath(); ctx.arc(ox + (x + 0.5) * cs, oy + (y + 0.5) * cs, cs * 0.06, 0, 7); ctx.fill(); }
      nd.forEach(n => {
        if (n.out) return;
        const b = bumps.find(bb => bb.n === n && now - bb.t0 < 280);
        ctx.save();
        if (b) { const q = (now - b.t0) / 280, [dx, dy] = D4[n.d], k = Math.sin(q * Math.PI) * cs * 0.25; ctx.translate(dx * k, dy * k); }
        strand(ctx, n.body.slice().reverse().map(c => [c % W, (c / W) | 0]), 0, n.body.length, COLORS[n.c], n.d);
        ctx.restore();
      });
      moving = moving.filter(m => {
        const q = Math.min(1, (now - m.t0) / m.dur);
        const s = q * q * (m.pts.length - m.n.body.length);
        strand(ctx, m.pts, s, m.n.body.length, COLORS[m.n.c], m.n.d);
        if (q >= 1) { land(m.n); return false; }
        return true;
      });
      bumps = bumps.filter(b => now - b.t0 < 300);
      // bowls
      const bw = Math.min(64, (C.w - 24) / SLOTS - 10), gap = 10, total = SLOTS * bw + (SLOTS - 1) * gap, bx0 = (C.w - total) / 2;
      for (let s = 0; s < SLOTS; s++) {
        const x = bx0 + s * (bw + gap), y = trayY;
        ctx.fillStyle = s === SLOTS - 1 && tray.length >= SLOTS - 1 ? 'rgba(255,84,104,.25)' : 'rgba(255,255,255,.08)';
        ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.quadraticCurveTo(x + bw / 2, y + 66, x + bw, y + 14); ctx.closePath(); ctx.fill();
        const t = tray[s];
        if (t) {
          const q = Math.min(1, (now - t.t0) / 220);
          ctx.fillStyle = COLORS[t.c];
          ctx.beginPath(); ctx.ellipse(x + bw / 2, y + 26 - (1 - q) * 30, bw * 0.33, 11, 0, 0, 7); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.quadraticCurveTo(x + bw / 2, y + 66, x + bw, y + 14); ctx.stroke();
      }
      clearing = clearing.filter(c => now - c.t1 < 300);
    });
  },
});
