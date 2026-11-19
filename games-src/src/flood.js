const LV = /*LEVELS:flood*/;
const FUR = ['#ff9a3c', '#f8a3c6', '#ffd54a', '#c8a27a', '#9ad06a'];
const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];

Kit.start({
  id: 'flood', title: 'Flood Rescue', accent: ['#5ab8f0', '#2e7fb8'],
  help: ['Tap an animal: it runs the way its arrow points, but only if nobody is in the way.', 'Every tap counts. After a few taps the water rises one row.', 'Get every animal out before the water reaches it. The lowest ones are in danger first.'],
  tips: { 0: 'Tap an animal whose way out is free', 1: 'Save the lowest animals first' },
  level(i, api) {
    const L = LV[i], W = L.W, H = L.H;
    const an = L.animals.map(a => ({ ...a, out: false }));
    const occ = new Array(W * H).fill(-1);
    an.forEach((a, k) => (occ[a.c] = k));
    let taps = 0, water = 0, waterShown = 0, running = [], bumps = [], cs = 30, ox = 0, oy = 0, scared = 0;
    const C = api.canvas(o => { cs = Math.floor(Math.min((o.w - 8) / W, (o.h - 8) / H, 62)); ox = (o.w - cs * W) / 2; oy = (o.h - cs * H) / 2; });
    const hud = () => {
      const left = L.rate - (taps % L.rate);
      api.info(`<span class="chip">Saved: ${an.filter(a => a.out).length} / ${an.length}</span><span class="chip${left === 1 ? ' warn' : ''}">Water rises in ${left} tap${left > 1 ? 's' : ''}</span>`);
    };
    hud();
    C.cv.addEventListener('pointerup', e => {
      if (api.ended()) return;
      const p = C.point(e), x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const k = occ[y * W + x];
      if (k < 0) return;
      const a = an[k], [dx, dy] = D4[a.d];
      let blocked = false;
      for (let cx = x + dx, cy = y + dy; cx >= 0 && cy >= 0 && cx < W && cy < H; cx += dx, cy += dy) if (occ[cy * W + cx] >= 0) { blocked = true; break; }
      if (blocked) { bumps.push({ a, t0: performance.now() }); api.snd.bad(); api.vib(30); }
      else {
        occ[a.c] = -1; a.out = true;
        const dist = dx ? (dx > 0 ? W - x : x + 1) : (dy > 0 ? H - y : y + 1);
        running.push({ a, x, y, dx, dy, dist: dist + 1, t0: performance.now() });
        api.snd.pop(an.filter(b => b.out).length); api.vib(10);
      }
      taps++;
      if (taps % L.rate === 0) {
        water++; api.snd.whoosh();
        const drowned = an.some(b => !b.out && ((b.c / W) | 0) >= H - water);
        if (drowned) { scared = performance.now(); setTimeout(() => api.lose('Too late!', 'The water reached an animal. Free the lowest ones first.'), 500); }
      }
      hud();
      if (an.every(b => b.out)) setTimeout(() => api.win(`${an.length} animals saved`), 450);
    });
    function animal(ctx, x, y, a, now, scale = 1) {
      const r = cs * 0.38 * scale, fur = FUR[a.k], [dx, dy] = D4[a.d];
      const lowRow = ((a.c / W) | 0) >= H - water - 1;
      const jit = lowRow && !a.out ? Math.sin(now / 45) * cs * 0.025 : 0;
      x += jit;
      ctx.beginPath(); ctx.ellipse(x, y + r * 0.95, r * 0.8, r * 0.25, 0, 0, 7); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fill();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * r * 0.62, y - r * 0.62, r * 0.32, 0, 7); ctx.fillStyle = fur; ctx.fill(); }
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = fur; ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y + r * 0.35, r * 0.5, r * 0.36, 0, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * r * 0.36 + dx * r * 0.12, y - r * 0.1 + dy * r * 0.12, r * (lowRow ? 0.16 : 0.12), 0, 7); ctx.fillStyle = '#1b1530'; ctx.fill(); }
      ctx.beginPath(); ctx.arc(x, y + r * 0.22, r * 0.09, 0, 7); ctx.fillStyle = '#5a3040'; ctx.fill();
      // direction arrow
      const ax = x + dx * r * 1.05, ay = y + dy * r * 1.05, px = -dy, py = dx;
      ctx.beginPath(); ctx.moveTo(ax + dx * r * 0.42, ay + dy * r * 0.42); ctx.lineTo(ax + px * r * 0.3, ay + py * r * 0.3); ctx.lineTo(ax - px * r * 0.3, ay - py * r * 0.3); ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#1b1530'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { ctx.fillStyle = (x + y) % 2 ? '#2f7a4a' : '#358553'; ctx.fillRect(ox + x * cs, oy + y * cs, cs, cs); }
      an.forEach(a => {
        if (a.out) return;
        const b = bumps.find(bb => bb.a === a && now - bb.t0 < 260);
        let x = ox + (a.c % W + 0.5) * cs, y = oy + (((a.c / W) | 0) + 0.5) * cs;
        if (b) { const k = Math.sin((now - b.t0) / 260 * Math.PI) * cs * 0.22, [dx, dy] = D4[a.d]; x += dx * k; y += dy * k; }
        animal(ctx, x, y, a, now);
      });
      running = running.filter(r => {
        const q = Math.min(1, (now - r.t0) / (r.dist * 55 + 80)), s = q * q * r.dist;
        animal(ctx, ox + (r.x + r.dx * s + 0.5) * cs, oy + (r.y + r.dy * s + 0.5) * cs - Math.abs(Math.sin(q * 18)) * cs * 0.12, r.a, now);
        return q < 1;
      });
      bumps = bumps.filter(b => now - b.t0 < 300);
      // water
      waterShown += (water - waterShown) * Math.min(1, dt * 5);
      if (waterShown > 0.01) {
        const top = oy + (H - waterShown) * cs;
        ctx.fillStyle = 'rgba(64,150,235,.55)';
        ctx.beginPath(); ctx.moveTo(ox, oy + H * cs);
        for (let x = 0; x <= W * cs; x += 6) ctx.lineTo(ox + x, top + Math.sin(x / 14 + now / 300) * 3);
        ctx.lineTo(ox + W * cs, oy + H * cs); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(200,235,255,.7)'; ctx.lineWidth = 2; ctx.beginPath();
        for (let x = 0; x <= W * cs; x += 6) { const yy = top + Math.sin(x / 14 + now / 300) * 3; if (x) ctx.lineTo(ox + x, yy); else ctx.moveTo(ox, yy); }
        ctx.stroke();
      }
      // next flood line preview
      const ny = oy + (H - water - 1) * cs;
      if (water < H) { ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(120,190,255,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, ny); ctx.lineTo(ox + W * cs, ny); ctx.stroke(); ctx.setLineDash([]); }
    });
  },
});
