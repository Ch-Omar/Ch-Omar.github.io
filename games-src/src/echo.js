// sequence length to reach, number of pads, ms per note
const SPEC = [[3, 4, 650], [4, 4, 600], [5, 4, 560], [6, 4, 520], [7, 5, 500], [8, 5, 470], [9, 5, 440], [10, 6, 420], [11, 6, 400], [12, 6, 380]];
const PADS = [['#f0505e', 262], ['#4f8ef2', 330], ['#ffd54a', 392], ['#5acb74', 523], ['#a06ee2', 440], ['#ff9a3c', 587]];

Kit.start({
  id: 'echo', title: 'Echo', accent: ['#a06ee2', '#6d40ad'],
  help: ['Watch the pads light up and listen.', 'Then tap the same pads in the same order.', 'Each round adds one more note. Reach the target length to win.'],
  tips: { 0: 'Watch, then repeat the pads' },
  level(i, api) {
    const [goal, P, ms] = SPEC[i], R = api.rng, seq = [];
    let step = 0, playing = false, lit = -1, litAt = 0, cs = 0, cx = 0, cy = 0;
    const C = api.canvas(o => { cs = Math.min(o.w, o.h) * 0.42; cx = o.w / 2; cy = o.h / 2; });
    const hud = () => api.info(`<span class="chip">Length ${seq.length} / ${goal}</span><span class="chip">${playing ? 'Watch…' : 'Your turn'}</span>`);
    const flash = k => { lit = k; litAt = performance.now(); api.snd.tone(PADS[k][1], 'triangle', 0.25, ms / 1000 * 0.7); };
    function round() {
      seq.push((R() * P) | 0); step = 0; playing = true; hud();
      seq.forEach((k, j) => setTimeout(() => { if (api.alive()) flash(k); }, 700 + j * ms));
      setTimeout(() => { if (api.alive()) { playing = false; hud(); } }, 700 + seq.length * ms);
    }
    setTimeout(round, 600);
    const padAt = (x, y) => { const a = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy); if (d < cs * 0.32 || d > cs) return -1; return Math.floor(((a + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2 / P)); };
    C.cv.addEventListener('pointerdown', e => {
      if (playing || api.ended() || !seq.length) return;
      const p = C.point(e), k = padAt(p.x, p.y); if (k < 0) return;
      flash(k); api.vib(8);
      if (k !== seq[step]) { api.lose('Wrong pad', `You reached length ${seq.length - 1}.`); return; }
      step++;
      if (step === seq.length) { if (seq.length >= goal) { api.win(); return; } api.snd.good(); playing = true; hud(); setTimeout(() => { if (api.alive()) round(); }, 650); }
    });
    api.loop((dt, now) => {
      const { ctx } = C; C.clear();
      const seg = Math.PI * 2 / P;
      for (let k = 0; k < P; k++) {
        const a0 = -Math.PI / 2 + k * seg + 0.04, a1 = a0 + seg - 0.08, on = lit === k && now - litAt < ms * 0.7;
        ctx.beginPath(); ctx.arc(cx, cy, cs, a0, a1); ctx.arc(cx, cy, cs * 0.34, a1, a0, true); ctx.closePath();
        ctx.fillStyle = PADS[k][0]; ctx.globalAlpha = on ? 1 : 0.35; ctx.fill(); ctx.globalAlpha = 1;
        if (on) { ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke(); }
      }
      ctx.beginPath(); ctx.arc(cx, cy, cs * 0.28, 0, 7); ctx.fillStyle = '#102350'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(cs * 0.22)}px "Lilita One", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(playing ? '👀' : String(seq.length - step), cx, cy);
    });
  },
});
