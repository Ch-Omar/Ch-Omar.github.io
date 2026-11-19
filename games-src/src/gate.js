const LV = /*LEVELS:gate*/;
const COLORS = ['#f0505e', '#4f8ef2', '#ffd54a', '#5acb74', '#a06ee2'];

// A marble falls down its column. A flipper sends it one column left or right, then flips the other way.
function drop(C, R, g, col) {
  const gg = g.slice(), path = [[col, -1]];
  let c = col;
  for (let r = 0; r < R; r++) {
    const i = r * C + c;
    if (gg[i] === 'L' || gg[i] === 'R') {
      let nc = c + (gg[i] === 'L' ? -1 : 1);
      if (nc < 0 || nc >= C) nc = c;
      gg[i] = gg[i] === 'L' ? 'R' : 'L';
      path.push([c, r, i]); c = nc;
    }
    path.push([c, r + 0.5]);
  }
  path.push([c, R + 0.4]);
  return { g: gg, c, path };
}

Kit.start({
  id: 'gate', title: 'Gate Drop', accent: ['#a06ee2', '#6d40ad'],
  help: ['Tap a column to drop the next marble into it.', 'Each flipper sends the marble one column over, then flips the other way for the next marble.', 'Every marble must land in the cup of its own colour.'],
  tips: { 0: 'Tap a column to drop the marble', 1: 'Each flipper switches sides after a marble passes' },
  level(i, api) {
    const L = LV[i], Cn = L.C, Rn = L.R;
    let g = L.gates.split(''), k = 0, anim = null, cw = 60, rh = 60, ox = 0, oy = 0, flips = {};
    const C = api.canvas(o => {
      cw = Math.min(90, (o.w - 8) / Cn); rh = Math.min(80, (o.h - 130) / (Rn + 1)); ox = (o.w - cw * Cn) / 2; oy = 70;
    });
    const hud = () => {
      const q = L.queue.slice(k, k + 8).map(c => `<span class="sw" style="background:${COLORS[c]};width:16px;height:16px;border-radius:50%"></span>`).join('');
      api.info(`<span class="chip">Next: ${q || '–'}</span><span class="chip">${L.queue.length - k} left</span>`);
    };
    hud();
    C.cv.addEventListener('pointerup', e => {
      if (anim || api.ended() || k >= L.queue.length) return;
      const p = C.point(e), col = Math.floor((p.x - ox) / cw);
      if (col < 0 || col >= Cn) return;
      const r = drop(Cn, Rn, g, col);
      anim = { path: r.path, c: L.queue[k], land: r.c, t0: performance.now(), passed: 0 };
      g = r.g.map((v, j) => (r.path.some(pp => pp[2] === j) ? g[j] : v)); // flip shown when the marble passes
      anim.newG = r.g;
      api.snd.tap();
    });
    const X = c => ox + (c + 0.5) * cw, Y = r => oy + (r + 0.5) * rh;
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      // columns
      for (let c = 0; c < Cn; c++) {
        ctx.fillStyle = c % 2 ? 'rgba(255,255,255,.035)' : 'rgba(255,255,255,.06)';
        ctx.fillRect(ox + c * cw, oy - 50, cw, rh * (Rn + 0.5) + 50);
        ctx.fillStyle = 'rgba(255,255,255,.22)';
        ctx.beginPath(); ctx.moveTo(X(c) - 9, oy - 40); ctx.lineTo(X(c) + 9, oy - 40); ctx.lineTo(X(c), oy - 28); ctx.closePath(); ctx.fill();
      }
      // flippers
      for (let r = 0; r < Rn; r++) for (let c = 0; c < Cn; c++) {
        const v = g[r * Cn + c]; if (v !== 'L' && v !== 'R') continue;
        const x = X(c), y = Y(r), s = Math.min(cw, rh) * 0.34, f = flips[r * Cn + c], q = f ? Math.min(1, (now - f) / 160) : 1;
        const dir = v === 'L' ? -1 : 1, a = dir * 0.6 * (2 * q - 1);
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = '#c9d6ff'; api.rr(ctx, -s, -5, s * 2, 10, 5); ctx.fill();
        ctx.restore();
        ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fillStyle = '#ffc83d'; ctx.fill();
        ctx.fillStyle = 'rgba(201,214,255,.5)'; ctx.beginPath(); ctx.moveTo(x + dir * s * 1.15, y + s * 0.75); ctx.lineTo(x + dir * s * 0.7, y + s * 0.5); ctx.lineTo(x + dir * s * 0.7, y + s * 1.0); ctx.closePath(); ctx.fill();
      }
      // cups
      for (let c = 0; c < Cn; c++) {
        const x = ox + c * cw + 6, y = oy + rh * (Rn + 0.15), w = cw - 12, h = Math.min(54, C.h - y - 6);
        ctx.fillStyle = COLORS[c]; api.rr(ctx, x, y, w, h, 12); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.25)'; api.rr(ctx, x + 6, y + 6, w - 12, h * 0.45, 8); ctx.fill();
      }
      // next marble waiting at the top
      if (!anim && k < L.queue.length && !api.ended()) {
        const bob = Math.sin(now / 250) * 3;
        ctx.beginPath(); ctx.arc(ox + cw * Cn / 2, oy - 58 + bob, 11, 0, 7); ctx.fillStyle = COLORS[L.queue[k]]; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      }
      if (anim) {
        const seg = 120, total = (anim.path.length - 1) * seg, t = Math.min(total, now - anim.t0), si = Math.min(anim.path.length - 2, Math.floor(t / seg)), f = (t - si * seg) / seg;
        const a = anim.path[si], b = anim.path[si + 1];
        for (let j = 1; j <= si + 1 && j < anim.path.length; j++) {
          const pp = anim.path[j]; if (pp[2] !== undefined && j <= si && anim.passed < j) { anim.passed = j; g[pp[2]] = anim.newG[pp[2]]; flips[pp[2]] = now; api.snd.tick(); }
        }
        const x = X(a[0] + (b[0] - a[0]) * f), y = Y(a[1] + (b[1] - a[1]) * f);
        ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fillStyle = COLORS[anim.c]; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        if (t >= total) {
          anim.path.forEach(pp => { if (pp[2] !== undefined) g[pp[2]] = anim.newG[pp[2]]; });
          const ok = anim.land === anim.c; anim = null; k++; hud();
          if (!ok) api.lose('Wrong cup', 'Follow the flippers: each one flips after a marble passes.');
          else { api.snd.good(); api.vib(10); if (k >= L.queue.length) api.win(); }
        }
      }
    });
  },
});
