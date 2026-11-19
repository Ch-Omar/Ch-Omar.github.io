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

window.GameStats = { record, timer, pid, enabled: () => !!(cfg && cfg.apiKey) };
})();
