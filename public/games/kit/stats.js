// Anonymous play stats for the game prototypes, saved to Firebase Firestore (free plan).
// Each finished attempt becomes one document in "plays": which game and level, win / lose / quit, active seconds, tries.
// Does nothing until firebase-config.js holds a project config.
(() => {
'use strict';
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const cfg = window.GAMES_FIREBASE;
let ready = null;
function db() {
  if (!cfg || !cfg.apiKey) return null;
  if (!ready) {
    ready = Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-firestore.js')])
      .then(([a, f]) => ({ f, db: f.getFirestore(a.initializeApp(cfg)) }))
      .catch(() => null);
  }
  return ready;
}
let pid = '';
try {
  pid = localStorage.getItem('games.pid') || '';
  if (!pid) { pid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); localStorage.setItem('games.pid', pid); }
} catch (e) { pid = 'anon'; }
const device = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'phone' : 'desktop';

function record(ev) {
  const p = db();
  if (!p) return;
  const doc = {
    pid, device,
    game: String(ev.game).slice(0, 19),
    level: Math.max(0, Math.min(19, ev.level | 0)),
    result: ev.result,
    secs: Math.max(0, Math.min(7199, Math.round(ev.secs || 0))),
    tries: Math.max(1, Math.min(999, ev.tries | 0 || 1)),
    stars: Math.max(0, Math.min(3, ev.stars | 0)),
  };
  p.then(x => { if (x) x.f.addDoc(x.f.collection(x.db, 'plays'), { ...doc, ts: x.f.serverTimestamp() }).catch(() => {}); });
}

// Active time of one attempt: only counts while the page is visible.
function timer() {
  let total = 0, since = document.hidden ? 0 : performance.now();
  const onVis = () => {
    if (document.hidden) { if (since) total += performance.now() - since; since = 0; }
    else since = performance.now();
  };
  document.addEventListener('visibilitychange', onVis);
  return {
    secs() { return (total + (since ? performance.now() - since : 0)) / 1000; },
    stop() { document.removeEventListener('visibilitychange', onVis); },
  };
}

// Rating 0-10, one per player and game (saving again replaces it). Kept on the device too, to show it back.
const RKEY = g => 'games.rating.' + g;
function myRating(game) { try { const v = localStorage.getItem(RKEY(game)); return v === null ? null : +v; } catch (e) { return null; } }
function rate(game, score) {
  score = Math.max(0, Math.min(10, score | 0));
  try { localStorage.setItem(RKEY(game), String(score)); } catch (e) {}
  const p = db();
  if (!p) return;
  const g = String(game).slice(0, 19);
  p.then(x => { if (x) x.f.setDoc(x.f.doc(x.db, 'ratings', pid + '_' + g), { pid, game: g, score, ts: x.f.serverTimestamp() }).catch(() => {}); });
}
// A row of 11 buttons (0 to 10) with its own styles, usable on any page.
function ratePanel(game, onDone) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:center;width:100%;';
  const cur = myRating(game);
  wrap.innerHTML = `<div style="font-weight:800;font-size:16px">How much do you like this game?</div>
    <div class="grate" style="display:grid;grid-template-columns:repeat(11,1fr);gap:4px;width:100%;max-width:440px"></div>
    <div style="display:flex;justify-content:space-between;width:100%;max-width:440px;font-size:12px;opacity:.7"><span>0 = not at all</span><span>10 = I'd play it every day</span></div>`;
  const row = wrap.querySelector('.grate');
  for (let s = 0; s <= 10; s++) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = s; b.setAttribute('aria-label', `Rate ${s} out of 10`);
    const hue = Math.round(s * 12);
    b.style.cssText = `min-height:40px;border-radius:10px;border:2px solid ${cur === s ? '#fff' : 'transparent'};background:hsl(${hue},70%,52%);color:#1b1530;font:inherit;font-weight:900;font-size:15px;padding:0;cursor:pointer;`;
    b.addEventListener('click', () => {
      rate(game, s);
      row.querySelectorAll('button').forEach(o => (o.style.borderColor = 'transparent'));
      b.style.borderColor = '#fff';
      wrap.firstElementChild.textContent = `Thanks! You gave it ${s}/10`;
      if (onDone) onDone(s);
    });
    row.appendChild(b);
  }
  return wrap;
}

window.GameStats = { record, timer, pid, rate, myRating, ratePanel, enabled: () => !!(cfg && cfg.apiKey) };
})();
