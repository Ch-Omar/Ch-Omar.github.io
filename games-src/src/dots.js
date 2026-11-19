const COLORS = ['#f0505e', '#4f8ef2', '#ffd54a', '#5acb74', '#a06ee2', '#ff9a3c', '#f8a3c6', '#8adaf8', '#c8a27a', '#ffffff', '#2f9d59', '#e6cf7a'];
const SIZES = [5, 5, 6, 6, 7, 7, 8, 8, 9, 9];
const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Build a board covered by random paths; each path's two ends become a pair of dots.
function build(N, R) {
  for (let tries = 0; tries < 500; tries++) {
    const own = new Array(N * N).fill(-1), paths = [];
    const nb = c => D.map(([dx, dy]) => [c % N + dx, ((c / N) | 0) + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < N && y < N).map(([x, y]) => y * N + x);
    const adj = (a, b) => nb(a).includes(b);
    let ok = true;
    const free = () => own.findIndex(v => v < 0);
    while (ok && free() >= 0) {
      const cand = own.map((v, i) => (v < 0 ? i : -1)).filter(i => i >= 0);
      const start = cand[(R() * cand.length) | 0], walk = [start]; own[start] = paths.length;
      const maxL = 3 + ((R() * N) | 0);
      while (walk.length < maxL) { const o = nb(walk[walk.length - 1]).filter(m => own[m] < 0); if (!o.length) break; const m = o[(R() * o.length) | 0]; own[m] = paths.length; walk.push(m); }
      if (walk.length >= 3) { paths.push(walk); continue; }
      walk.forEach(c => (own[c] = -1));
      // too short: glue it onto the end of a neighbouring path
      let glued = false;
      for (const p of paths) {
        for (const end of [0, 1]) {
          const e = end ? p[p.length - 1] : p[0];
          const seq = adj(e, walk[0]) ? walk : walk.length > 1 && adj(e, walk[walk.length - 1]) ? walk.slice().reverse() : null;
          if (!seq) continue;
          if (end) p.push(...seq); else p.unshift(...seq.slice().reverse());
          seq.forEach(c => (own[c] = paths.indexOf(p)));
          glued = true; break;
        }
        if (glued) break;
      }
      if (!glued) ok = false;
    }
    if (ok && paths.length <= COLORS.length && paths.length >= Math.max(3, N - 2)) return paths;
  }
  return null;
}

Kit.start({
  id: 'dots', title: 'Dot Link', accent: ['#5acb74', '#2f8f4a'],
  help: ['Drag from a dot to the other dot of the same colour to link them.', 'Lines cannot cross. Drawing over another line cuts it.', 'Link every pair. Filling every square gives a perfect score.'],
  tips: { 0: 'Drag from a dot to its twin' },
  level(i, api) {
    const N = SIZES[i], paths = build(N, api.rng), K = paths.length;
    const ends = paths.map(p => [p[0], p[p.length - 1]]);
    const dotAt = new Array(N * N).fill(-1); ends.forEach(([a, b], k) => { dotAt[a] = k; dotAt[b] = k; });
    const lines = paths.map(() => []); // player lines
    let cs = 40, ox = 0, oy = 0, cur = -1;
    const C = api.canvas(o => { cs = Math.floor(Math.min((o.w - 8) / N, (o.h - 8) / N, 66)); ox = (o.w - cs * N) / 2; oy = (o.h - cs * N) / 2; });
    const owner = c => lines.findIndex(l => l.includes(c));
    const linked = k => { const l = lines[k]; return l.length > 1 && dotAt[l[0]] === k && dotAt[l[l.length - 1]] === k && l[0] !== l[l.length - 1]; };
    const hud = () => { const filled = new Set(lines.flat()).size; api.info(`<span class="chip">Linked ${lines.filter((_, k) => linked(k)).length} / ${K}</span><span class="chip">${Math.round(filled / (N * N) * 100)}% filled</span>`); };
    hud();
    const cellAt = e => { const p = C.point(e), x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs); return x >= 0 && y >= 0 && x < N && y < N ? y * N + x : -1; };
    C.cv.addEventListener('pointerdown', e => {
      if (api.ended()) return;
      const c = cellAt(e); if (c < 0) return;
      if (dotAt[c] >= 0) { cur = dotAt[c]; lines[cur] = [c]; }
      else { const k = owner(c); if (k < 0) return; cur = k; lines[k] = lines[k].slice(0, lines[k].indexOf(c) + 1); }
      C.cv.setPointerCapture(e.pointerId); api.snd.tap(); hud();
    });
    C.cv.addEventListener('pointermove', e => {
      if (cur < 0 || api.ended()) return;
      const c = cellAt(e), l = lines[cur]; if (c < 0) return;
      const last = l[l.length - 1]; if (c === last) return;
      if (Math.abs(c % N - last % N) + Math.abs(((c / N) | 0) - ((last / N) | 0)) !== 1) return;
      const back = l.indexOf(c); if (back >= 0) { l.length = back + 1; hud(); return; }
      if (dotAt[c] >= 0 && dotAt[c] !== cur) return;
      if (linked(cur)) return;
      const k = owner(c); if (k >= 0 && k !== cur) lines[k] = lines[k].slice(0, lines[k].indexOf(c));
      l.push(c); api.snd.tick(); hud();
      if (dotAt[c] === cur) { api.snd.pop(lines.filter((_, j) => linked(j)).length + 2); api.vib(10); }
      if (lines.every((_, j) => linked(j))) { cur = -1; const full = new Set(lines.flat()).size === N * N; api.win(full ? 'Perfect: every square filled' : 'All linked. Fill every square for a perfect score.'); }
    });
    C.cv.addEventListener('pointerup', () => { cur = -1; });
    api.loop(() => {
      const { ctx } = C; C.clear();
      for (let c = 0; c < N * N; c++) { ctx.fillStyle = (c % N + ((c / N) | 0)) % 2 ? '#10244f' : '#132a5a'; ctx.fillRect(ox + (c % N) * cs, oy + ((c / N) | 0) * cs, cs, cs); }
      lines.forEach((l, k) => {
        if (l.length < 2) return;
        l.forEach(c => { ctx.fillStyle = COLORS[k]; ctx.globalAlpha = 0.18; ctx.fillRect(ox + (c % N) * cs, oy + ((c / N) | 0) * cs, cs, cs); ctx.globalAlpha = 1; });
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = cs * 0.3; ctx.strokeStyle = COLORS[k]; ctx.beginPath();
        l.forEach((c, j) => { const x = ox + (c % N + 0.5) * cs, y = oy + (((c / N) | 0) + 0.5) * cs; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke();
      });
      ends.forEach(([a, b], k) => [a, b].forEach(c => { ctx.beginPath(); ctx.arc(ox + (c % N + 0.5) * cs, oy + (((c / N) | 0) + 0.5) * cs, cs * 0.34, 0, 7); ctx.fillStyle = COLORS[k]; ctx.fill(); if (linked(k)) { ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke(); } }));
    });
  },
});
