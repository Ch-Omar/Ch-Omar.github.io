const COLORS = ['#f0505e', '#4f8ef2', '#ffd54a', '#5acb74'];
const RGB = COLORS.map(h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16)));
const GW = 72, GH = 112;
// jars, batches, grains per frame
const SPEC = [[2, 4, 2], [2, 6, 2], [3, 5, 2], [3, 7, 2.5], [3, 9, 3], [4, 6, 2.5], [4, 8, 3], [4, 10, 3], [4, 11, 3.5], [4, 13, 4]];

function layout(S) {
  // paddles (cx, cy, half-length) and where their streams land; jars are centred under the streams
  const root = { cx: 36, cy: 22, h: 10 };
  if (S === 2) return { pads: [root], jars: [25, 47] };
  const kidR = { cx: 47, cy: 50, h: 5 };
  if (S === 3) return { pads: [root, kidR], jars: [25, 41, 53] };
  return { pads: [root, { cx: 25, cy: 50, h: 5 }, kidR], jars: [19, 31, 41, 53] };
}

Kit.start({
  id: 'sand', title: 'Sand Jars', accent: ['#ffd54a', '#c99b17'],
  help: ['Coloured sand pours from the top, one colour after another.', 'Tap a ramp to flip it and send the sand left or right.', 'Fill each jar with its own colour only. Too much of the wrong colour in a jar, or too much spilled, and you lose.'],
  tips: { 0: 'Tap the ramp to send the sand to the right jar', 2: 'The next colour is shown at the top' },
  level(i, api) {
    const [S, nb, rate] = SPEC[i], R = api.rng, { pads, jars } = layout(S);
    const cell = new Int8Array(GW * GH).fill(-1); // -1 empty, -2 wall, 0..3 sand colour
    const wall = (x, y) => { if (x >= 0 && y >= 0 && x < GW && y < GH) cell[y * GW + x] = -2; };
    const JW = 10, JY = 84;
    jars.forEach(cx => { for (let y = JY; y < GH; y++) { wall(cx - JW / 2, y); wall(cx + JW / 2, y); } for (let x = cx - JW / 2; x <= cx + JW / 2; x++) wall(x, GH - 1); });
    const jarCol = jars.map((_, j) => j);
    pads.forEach(p => (p.s = 0));
    const padCells = p => { const out = []; for (let k = -p.h; k <= p.h; k++) { const x = p.cx + k, y = p.cy + (p.s ? -k : k); out.push([x, y], [x, y + 1]); } return out; };
    const drawPad = (p, v) => padCells(p).forEach(([x, y]) => { const i2 = y * GW + x; if (x >= 0 && x < GW && y >= 0 && y < GH) cell[i2] = v; });
    pads.forEach(p => drawPad(p, -2));
    // colours spread evenly over the jars, sized so no jar overflows
    const cols = Array.from({ length: nb }, (_, k) => k % S);
    for (let k = cols.length - 1; k > 0; k--) { const j = (R() * (k + 1)) | 0; [cols[k], cols[j]] = [cols[j], cols[k]]; }
    const per = Math.min(100, Math.floor(170 / Math.ceil(nb / S)));
    const batches = cols.map(c => ({ c, n: per - ((R() * 15) | 0) }));
    let bi = 0, left = batches[0].n, wait = 1.6, acc = 0, still = 0, scale = 4, ox = 0, oy = 0;
    const C = api.canvas(o => { scale = Math.max(2, Math.min((o.w - 8) / GW, (o.h - 4) / GH)); ox = (o.w - GW * scale) / 2; oy = (o.h - GH * scale) / 2; });
    const img = new ImageData(GW, GH), off = document.createElement('canvas'); off.width = GW; off.height = GH; const octx = off.getContext('2d');
    const hud = () => {
      const q = batches.slice(bi, bi + 4).map(b => `<span class="sw" style="background:${COLORS[b.c]}"></span>`).join('');
      api.info(`<span class="chip">Next: ${q || '–'}</span><span class="chip">${Math.max(0, nb - bi)} colours left</span>`);
    };
    hud();
    C.cv.addEventListener('pointerdown', e => {
      if (api.ended()) return;
      const p = C.point(e), gx = (p.x - ox) / scale, gy = (p.y - oy) / scale;
      let best = null, bd = 1e9;
      for (const pd of pads) { const d = Math.hypot(gx - pd.cx, gy - pd.cy); if (d < bd) { bd = d; best = pd; } }
      if (best && bd < best.h + 8) { drawPad(best, -1); best.s ^= 1; drawPad(best, -2); api.snd.tap(); api.vib(8); }
    });
    let frame = 0;
    function step() {
      let moved = 0;
      for (let y = GH - 2; y >= 0; y--) {
        const dir = (frame + y) & 1 ? 1 : -1;
        for (let k = 0; k < GW; k++) {
          const x = dir > 0 ? k : GW - 1 - k, i2 = y * GW + x, v = cell[i2];
          if (v < 0) continue;
          const dn = i2 + GW;
          if (cell[dn] === -1) { cell[dn] = v; cell[i2] = -1; moved++; continue; }
          const s = R() < 0.5 ? -1 : 1;
          for (const t of [s, -s]) { const nx = x + t; if (nx < 0 || nx >= GW) continue; if (cell[dn + t] === -1 && cell[i2 + t] === -1) { cell[dn + t] = v; cell[i2] = -1; moved++; break; } }
        }
      }
      // grains that reach the floor outside a jar are spilled
      for (let x = 0; x < GW; x++) { const i2 = (GH - 1) * GW + x; if (cell[i2] >= 0) cell[i2] = -1, spilled++; }
      frame++;
      return moved;
    }
    let spilled = 0;
    function count() {
      const res = jars.map(() => ({ ok: 0, bad: 0 }));
      jars.forEach((cx, j) => { for (let y = JY - 6; y < GH - 1; y++) for (let x = cx - JW / 2 + 1; x < cx + JW / 2; x++) { const v = cell[y * GW + x]; if (v >= 0) (v === jarCol[j] ? res[j].ok++ : res[j].bad++); } });
      return res;
    }
    api.loop((dt, now) => {
      if (!api.ended()) {
        if (wait > 0) wait -= dt;
        else if (bi < nb) {
          acc += rate * dt * 60;
          while (acc >= 1 && left > 0) { acc--; const x = 35 + ((R() * 3) | 0); if (cell[2 * GW + x] === -1) { cell[2 * GW + x] = batches[bi].c; left--; } }
          if (left <= 0) { bi++; hud(); if (bi < nb) { left = batches[bi].n; wait = 0.55; api.snd.tick(); } }
        }
        const moved = step(); step();
        if (frame % 10 === 0) {
          const res = count();
          const mixed = res.findIndex(r => r.bad > 14);
          if (mixed >= 0) api.lose('Mixed colours', 'Flip the ramps as soon as the colour changes.');
          else if (spilled > 40) api.lose('Too much spilled', 'Every stream has to end in a jar.');
          else if (bi >= nb) { still = moved ? 0 : still + 1; if (still > 3) api.win(spilled ? `${spilled} grains spilled` : 'Not a grain spilled'); }
        }
      }
      for (let k = 0; k < GW * GH; k++) {
        const v = cell[k], o = k * 4;
        if (v >= 0) { const c = RGB[v]; img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255; }
        else if (v === -2) { img.data[o] = 201; img.data[o + 1] = 214; img.data[o + 2] = 255; img.data[o + 3] = 255; }
        else img.data[o + 3] = 0;
      }
      octx.putImageData(img, 0, 0);
      const { ctx } = C; C.clear();
      ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(ox, oy, GW * scale, GH * scale);
      jars.forEach((cx, j) => { ctx.fillStyle = COLORS[jarCol[j]]; ctx.globalAlpha = 0.28; ctx.fillRect(ox + (cx - JW / 2 + 1) * scale, oy + JY * scale, (JW - 1) * scale, (GH - 1 - JY) * scale); ctx.globalAlpha = 1; });
      ctx.imageSmoothingEnabled = false; ctx.drawImage(off, ox, oy, GW * scale, GH * scale);
      // spout and the colour pouring now
      ctx.fillStyle = '#c9d6ff'; api.rr(ctx, ox + 31 * scale, oy - 2, 10 * scale, 4 * scale, 4); ctx.fill();
      if (bi < nb) { ctx.beginPath(); ctx.arc(ox + 36 * scale, oy + 1 * scale, 2.2 * scale, 0, 7); ctx.fillStyle = COLORS[batches[bi].c]; ctx.fill(); }
      pads.forEach(p => { ctx.beginPath(); ctx.arc(ox + p.cx * scale, oy + (p.cy + 0.5) * scale, 3 * scale, 0, 7); ctx.fillStyle = '#ffc83d'; ctx.fill(); });
    });
  },
});
