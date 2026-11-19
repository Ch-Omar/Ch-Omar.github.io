// Shared frame for the game prototypes: header, 10 levels, win / lose sheets, help card, sound, saved stars.
(() => {
'use strict';
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
let soundOn = true;

const Snd = {
  ctx: null, out: null, noise: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC(); this.out = this.ctx.createGain(); this.out.gain.value = 0.5; this.out.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.6), b = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = b;
    } catch (e) { this.ctx = null; }
  },
  ok() { return this.ctx && soundOn; },
  env(g, t, a, p, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(p, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
  tone(f, type = 'sine', p = 0.2, d = 0.15, when = 0, slide = 0) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    this.env(g, t, 0.005, p, d); o.connect(g).connect(this.out); o.start(t); o.stop(t + d + 0.06);
  },
  noiseHit(f = 1500, q = 1.5, p = 0.3, d = 0.06, when = 0, type = 'bandpass') {
    if (!this.ok() || !this.noise) return;
    const c = this.ctx, t = c.currentTime + when, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    this.env(g, t, 0.002, p, d); s.connect(fl).connect(g).connect(this.out); s.start(t, Math.random() * 0.3); s.stop(t + d + 0.06);
  },
  tap() { this.noiseHit(1800, 2, 0.35, 0.04); this.tone(520, 'triangle', 0.12, 0.07); },
  pop(step = 0) { const sc = [0, 2, 4, 7, 9], s = Math.min(step, 14); this.tone(330 * Math.pow(2, (Math.floor(s / 5) * 12 + sc[s % 5]) / 12), 'triangle', 0.17, 0.14); this.noiseHit(2400, 1.2, 0.2, 0.03); },
  good() { this.tone(660, 'triangle', 0.18, 0.12); this.tone(990, 'triangle', 0.14, 0.18, 0.07); },
  bad() { this.tone(200, 'square', 0.06, 0.12); this.tone(150, 'square', 0.06, 0.14, 0.09); },
  whoosh() { this.noiseHit(900, 0.6, 0.25, 0.18, 0, 'lowpass'); },
  thud() { this.tone(120, 'sine', 0.45, 0.2, 0, 60); this.noiseHit(400, 1, 0.3, 0.1); },
  tick() { this.tone(1900, 'square', 0.04, 0.02); },
  win() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { this.tone(f, 'triangle', 0.2, 0.5, i * 0.085); this.tone(f * 2, 'sine', 0.04, 0.3, i * 0.085 + 0.02); }); },
  fail() { this.tone(392, 'triangle', 0.2, 0.25); this.tone(330, 'triangle', 0.2, 0.3, 0.17); this.tone(262, 'triangle', 0.2, 0.5, 0.34); },
  star(n) { this.tone(784 * Math.pow(2, n * 4 / 12), 'sine', 0.16, 0.3); },
};
function vib(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function hash(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

const ICON = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.2 9a3 3 0 1 1 4.3 2.7c-.9.5-1.5 1.1-1.5 2.1v.4"/><circle cx="12" cy="18.2" r=".6" fill="currentColor"/></svg>',
  soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
  retry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  star: on => `<svg viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="${on ? '#ffc83d' : 'rgba(255,255,255,.12)'}" stroke="${on ? '#c98e17' : 'none'}" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
};

function start(def) {
  const KEY = 'games.' + def.id, LEVELS = def.levels || 10;
  let save;
  try { save = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { save = {}; }
  save.stars = save.stars || {}; soundOn = save.sound !== false;
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} };
  if (def.accent) { document.documentElement.style.setProperty('--accent', def.accent[0]); document.documentElement.style.setProperty('--accent-deep', def.accent[1]); }

  document.body.insertAdjacentHTML('afterbegin', `
    <div id="kapp">
      <header class="kbar">
        <a class="kicon" href="../" aria-label="All games">${ICON.back}</a>
        <div class="ktitle"><b>${def.title}</b><span id="klvl"></span></div>
        <button class="kicon" id="khelpBtn" aria-label="How to play">${ICON.help}</button>
        <button class="kicon" id="ksoundBtn" aria-label="Sound on or off"></button>
        <button class="kicon" id="kretryBtn" aria-label="Start this level again">${ICON.retry}</button>
      </header>
      <nav class="kdots" id="kdots" aria-label="Levels"></nav>
      <div class="kinfo" id="kinfo" aria-live="polite"></div>
      <main id="kstage"></main>
    </div>
    <div class="ktoast" id="ktoast" hidden></div>
    <div class="ksheet" id="ksheet"><div class="ksheet-in" id="ksheetIn"></div></div>
    <div class="khelp" id="khelp" hidden><div class="khelp-card">
      <h2>${def.title}</h2><ol>${def.help.map(s => `<li>${s}</li>`).join('')}</ol>
      <button class="kbtn primary" id="khelpOk" style="max-width:none">Play</button></div></div>
    <canvas id="kfx" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:25"></canvas>`);
  const $ = id => document.getElementById(id);
  const stage = $('kstage'), info = $('kinfo'), sheet = $('ksheet'), sheetIn = $('ksheetIn');

  // confetti layer
  const fx = $('kfx'), fctx = fx.getContext('2d');
  let parts = [], fxOn = false;
  function confetti() {
    if (reduceMotion) return;
    const cols = ['#f0505e', '#ffd54a', '#5acb74', '#4f8ef2', '#f8a3c6', '#ff9a3c', '#8adaf8'];
    for (let k = 0; k < 90; k++) parts.push({ x: innerWidth * (0.1 + Math.random() * 0.8), y: -20 - Math.random() * 60, vx: (Math.random() - 0.5) * 140, vy: 90 + Math.random() * 170, r: Math.random() * 6, vr: (Math.random() - 0.5) * 10, s: 5 + Math.random() * 6, c: cols[k % cols.length], life: 2.6 });
    if (!fxOn) { fxOn = true; let last = performance.now(); const step = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const dpr = Math.min(2, devicePixelRatio || 1);
      if (fx.width !== Math.round(innerWidth * dpr)) { fx.width = Math.round(innerWidth * dpr); fx.height = Math.round(innerHeight * dpr); }
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter(p => (p.life -= dt) > 0);
      for (const p of parts) { p.vy += 170 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; fctx.save(); fctx.globalAlpha = Math.min(1, p.life); fctx.translate(p.x, p.y); fctx.rotate(p.r); fctx.fillStyle = p.c; fctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); fctx.restore(); }
      if (parts.length) requestAnimationFrame(step); else { fxOn = false; fctx.clearRect(0, 0, innerWidth, innerHeight); }
    }; requestAnimationFrame(step); }
  }

  let li = 0, game = null, token = 0, tries = 1, ended = false;
  const unlocked = () => { let u = 0; while (u < LEVELS && save.stars[u]) u++; return Math.min(LEVELS - 1, u); };

  function renderHead() {
    $('klvl').textContent = `Level ${li + 1} / ${LEVELS}`;
    const u = unlocked();
    $('kdots').innerHTML = Array.from({ length: LEVELS }, (_, i) =>
      `<button data-i="${i}" class="${i === li ? 'now' : save.stars[i] ? 'done' : ''}" ${i > u ? 'disabled' : ''} aria-label="Level ${i + 1}"><i></i></button>`).join('');
    $('ksoundBtn').innerHTML = soundOn ? ICON.soundOn : ICON.soundOff;
  }
  $('kdots').addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b && !b.disabled) { Snd.init(); load(+b.dataset.i, true); } });
  $('ksoundBtn').addEventListener('click', () => { soundOn = !soundOn; save.sound = soundOn; store(); Snd.init(); renderHead(); });
  $('kretryBtn').addEventListener('click', () => { Snd.init(); if (!ended) tries++; load(li, false); });
  $('khelpBtn').addEventListener('click', () => { $('khelp').hidden = false; });
  $('khelpOk').addEventListener('click', () => { $('khelp').hidden = true; Snd.init(); save.seenHelp = true; store(); });
  document.addEventListener('pointerdown', () => Snd.init(), { passive: true });

  let toastT = 0;
  function toast(text, ms = 2600) {
    const t = $('ktoast'); t.textContent = text; t.hidden = false; t.style.opacity = '1';
    clearTimeout(toastT); toastT = setTimeout(() => { t.style.opacity = '0'; toastT = setTimeout(() => (t.hidden = true), 320); }, ms);
  }
  function hideSheet() { sheet.classList.remove('open'); }
  function openSheet(html) { sheetIn.innerHTML = html; requestAnimationFrame(() => sheet.classList.add('open')); }

  // play stats: one record per attempt (win, lose, or quit when the player leaves it after a few seconds)
  const Stats = window.GameStats;
  let attempt = null;
  function endAttempt(result, stars) {
    if (!attempt || attempt.done) return;
    attempt.done = true; attempt.t.stop();
    const secs = attempt.t.secs();
    if (Stats && (result !== 'quit' || secs >= 3)) Stats.record({ game: def.id, level: attempt.level, result, secs, tries, stars });
  }
  addEventListener('pagehide', () => endAttempt('quit'));

  function load(i, fresh) {
    if (attempt && !attempt.done) endAttempt('quit');
    token++;
    if (game && game.destroy) try { game.destroy(); } catch (e) {}
    stage.innerHTML = ''; info.innerHTML = ''; hideSheet();
    if (fresh) tries = 1;
    li = i; ended = false; save.last = i; store(); renderHead();
    attempt = Stats ? { level: i, t: Stats.timer(), done: false } : null;
    game = def.level(i, makeApi(token)) || {};
    if (def.tips && def.tips[i] && fresh) setTimeout(() => toast(def.tips[i], 3400), 350);
  }

  function makeApi(tk) {
    const alive = () => tk === token;
    const api = {
      level: i => li, index: li, stage, rng: rng(hash(def.id + ':' + li)), snd: Snd, vib, rr, toast,
      info(html) { if (alive()) info.innerHTML = html; },
      alive,
      ended: () => ended || !alive(),
      shake(el = stage) { el.classList.remove('kshake'); void el.offsetWidth; el.classList.add('kshake'); },
      canvas(onResize) {
        const cv = document.createElement('canvas'); stage.appendChild(cv);
        const ctx = cv.getContext('2d'), o = { cv, ctx, w: 0, h: 0, dpr: 1 };
        const fit = () => {
          const r = stage.getBoundingClientRect(); o.dpr = Math.min(2.5, devicePixelRatio || 1); o.w = r.width; o.h = r.height;
          cv.width = Math.max(1, Math.round(o.w * o.dpr)); cv.height = Math.max(1, Math.round(o.h * o.dpr));
          ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0); if (onResize) onResize(o);
        };
        const ro = new ResizeObserver(() => { if (alive()) fit(); }); ro.observe(stage); fit();
        o.point = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
        o.clear = () => { ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0); ctx.clearRect(0, 0, o.w, o.h); };
        return o;
      },
      loop(fn) {
        let last = performance.now();
        const step = now => {
          if (!alive()) return;
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          try { fn(dt, now); } catch (e) { console.error(e); }
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      win(note) {
        if (ended || !alive()) return; ended = true;
        const stars = tries === 1 ? 3 : tries === 2 ? 2 : 1;
        save.stars[li] = Math.max(save.stars[li] || 0, stars); store(); renderHead();
        endAttempt('win', stars);
        Snd.win(); vib([18, 40, 18]); confetti();
        const last = li === LEVELS - 1;
        setTimeout(() => {
          if (!alive()) return;
          openSheet(`<div class="kbig">${last ? 'All 10 done!' : 'Level ' + (li + 1) + ' done'}</div>
            <div class="kstars">${[0, 1, 2].map(k => ICON.star(k < stars)).join('')}</div>
            ${note ? `<div class="ksub">${note}</div>` : ''}
            <div class="kbtns">${last ? `<a class="kbtn primary" href="../">More games ${ICON.next}</a>` : `<button class="kbtn primary" id="knext">Next ${ICON.next}</button>`}</div>`);
          sheetIn.querySelectorAll('.kstars svg').forEach((s, k) => setTimeout(() => { s.classList.add('in'); if (k < stars) Snd.star(k); }, 250 + k * 170));
          const nb = $('knext'); if (nb) { nb.addEventListener('click', () => load(li + 1, true)); nb.focus({ preventScroll: true }); }
        }, 700);
      },
      lose(title, note) {
        if (ended || !alive()) return; ended = true;
        endAttempt('lose', 0); tries++;
        Snd.fail(); vib(70);
        setTimeout(() => {
          if (!alive()) return;
          openSheet(`<div class="kbig">${title || 'So close!'}</div>${note ? `<div class="ksub">${note}</div>` : ''}
            <div class="kbtns"><button class="kbtn primary" id="kagain">${ICON.retry} Try again</button></div>`);
          $('kagain').addEventListener('click', () => load(li, false)); $('kagain').focus({ preventScroll: true });
        }, 650);
      },
    };
    return api;
  }

  const first = Math.min(save.last ?? unlocked(), unlocked());
  load(first, true);
  if (!save.seenHelp) $('khelp').hidden = false;
}

window.Kit = { start, Snd, vib, rng, rr, reduceMotion };
})();
