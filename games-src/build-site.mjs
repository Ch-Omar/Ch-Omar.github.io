import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { ICONS } from './icons.mjs';
import { execFileSync } from 'child_process';
import { fileURLToPath as __f } from 'url';
import { dirname as __d } from 'path';
process.chdir(__d(__f(import.meta.url))); // paths below are relative to this folder

const SITE = '../public/games';
export const GAMES = [
  { id: 'noodle', title: 'Noodle Out', color: '#ffd54a', pitch: 'Tap noodles out of the bowl. Five bowls at the bottom, three of a colour clear.' },
  { id: 'tilt', title: 'Tilt Sort', color: '#8adaf8', pitch: 'One swipe rolls every marble at once. Get each one into its hole.' },
  { id: 'flood', title: 'Flood Rescue', color: '#5ab8f0', pitch: 'Free the animals one by one before the water reaches them.' },
  { id: 'rail', title: 'Switch Rail', color: '#ff9a3c', pitch: 'Flip the switches so every wagon reaches its station. It keeps speeding up.' },
  { id: 'gate', title: 'Gate Drop', color: '#a06ee2', pitch: 'Drop marbles through flippers that switch sides, into the right cups.' },
  { id: 'mix', title: 'Mix Lab', color: '#f8a3c6', pitch: 'Mix red, yellow, blue and white to match each order.' },
  { id: 'blast', title: 'Blast Cascade', color: '#5acb74', pitch: 'A block puzzle where cleared rows make everything above fall for combos.' },
  { id: 'tower', title: 'Pull Tower', color: '#ff7a59', pitch: 'Pull coloured bricks without bringing the tower down.' },
  { id: 'sand', title: 'Sand Jars', color: '#e6c15a', pitch: 'Flip the ramps so pouring sand lands in the jar of its colour.' },
  { id: 'mosaic', title: 'Mosaic', color: '#e6cf7a', pitch: 'One gold tile in every row, column and colour area. None may touch.' },
  { id: 'topple', title: 'Topple', color: '#f6efdd', pitch: 'Fill the gaps, push the first domino, and watch them reveal a picture.' },
  { id: 'pipes', title: 'Pipe Spin', color: '#5ab8f0', pitch: 'Turn the pipes so water from the tap reaches every flower.' },
  { id: 'floodit', title: 'Color Flood', color: '#ff9a3c', pitch: 'Grow your colour from the corner until it fills the whole board.' },
  { id: 'lights', title: 'Lights Off', color: '#ffd54a', pitch: 'Each tap switches a lamp and its neighbours. Turn them all off.' },
  { id: 'merge', title: 'Merge Drop', color: '#a06ee2', pitch: 'Drop numbers into columns. Twins merge and chain into bigger numbers.' },
  { id: 'tubes', title: 'Tube Sort', color: '#8adaf8', pitch: 'Move balls between tubes until every tube holds one colour.' },
  { id: 'pop', title: 'Pop Groups', color: '#f0505e', pitch: 'Pop groups of the same colour. Bigger groups clear the board faster.' },
  { id: 'stack', title: 'Stack Up', color: '#5acb74', pitch: 'Tap at the right moment to stack blocks into a tall tower.' },
  { id: 'slide', title: 'Slide Puzzle', color: '#4f8ef2', pitch: 'Slide the numbered tiles back into order.' },
  { id: 'stroke', title: 'One Stroke', color: '#c9a8ff', pitch: 'Draw one line through every square without crossing itself.' },
  { id: 'dots', title: 'Dot Link', color: '#5acb74', pitch: 'Link each pair of same-colour dots. Lines may not cross.' },
  { id: 'nono', title: 'Picture Logic', color: '#ff9a3c', pitch: 'Use the number clues to fill the right squares and reveal a picture.' },
  { id: 'mines', title: 'Safe Steps', color: '#46a865', pitch: 'Open every safe square. The numbers tell how many mines are next to you.' },
  { id: 'snake', title: 'Snake Bites', color: '#ffd54a', pitch: 'Steer the snake to eat apples without hitting walls, rocks or your tail.' },
  { id: 'echo', title: 'Echo', color: '#a06ee2', pitch: 'Watch the pads light up, then repeat the sequence. It gets longer.' },
  { id: 'sudoku', title: 'Mini Sudoku', color: '#4f8ef2', pitch: 'Small sudokus: every number once in each row, column and box.' },
  { id: 'swipe', title: 'Number Swipe', color: '#edc53f', pitch: 'Swipe tiles; equal numbers merge. Make the target tile.' },
  { id: 'brick', title: 'Brick Bash', color: '#f0505e', pitch: 'Bounce the ball with your paddle and break every brick.' },
  { id: 'gems', title: 'Gem Swap', color: '#c9a8ff', pitch: 'Swap gems to make lines of three and collect the goal before moves run out.' },
  { id: 'tap', title: 'Tap Rush', color: '#ffc83d', pitch: 'Tap the circles before they vanish, and never the bombs.' },
];

const head = (title, desc) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap">`;

for (const g of GAMES) {
  if (g.id === 'topple') continue;
  let js = readFileSync(`src/${g.id}.js`, 'utf8');
  js = js.replace(/\/\*LEVELS:(\w+)\*\//g, (_, name) => readFileSync(`levels/${name}.json`, 'utf8'));
  mkdirSync(`${SITE}/${g.id}`, { recursive: true });
  writeFileSync(`${SITE}/${g.id}/index.html`, `${head(g.title, g.pitch)}
<link rel="stylesheet" href="../kit/kit.css">
</head>
<body>
<script src="../kit/firebase-config.js"></script>
<script src="../kit/stats.js"></script>
<script src="../kit/kit.js"></script>
<script>
${js}
</script>
</body>
</html>
`);
}

// Topple: the earlier prototype, with a link back to the games list
execFileSync(process.execPath, ['topple/build.mjs'], { stdio: 'inherit' });
let topple = readFileSync('topple/topple.html', 'utf8');
topple = topple.replace('<header class="bar">', '<header class="bar">\n    <a class="icon-btn" href="../" aria-label="All games" style="color:var(--text)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></a>');
topple = topple.replace(/^<title>Topple<\/title>\n<meta name="claude:viewport-fit-sides" content="cover">\n/, '');
mkdirSync(`${SITE}/topple`, { recursive: true });
writeFileSync(`${SITE}/topple/index.html`, `${head('Topple', GAMES[10].pitch)}
<script src="../kit/firebase-config.js"></script>
<script src="../kit/stats.js"></script>
</head>
<body>
${topple}
</body>
</html>
`);

// Games list page
const cards = GAMES.map((g, n) => `
    <a class="card" href="./${g.id}/" data-id="${g.id}" style="--c:${g.color}">
      <div class="top"><span class="icon" aria-hidden="true"><svg viewBox="0 0 64 64">${ICONS[g.id] || ''}</svg></span><span class="num">${String(n + 1).padStart(2, '0')}</span></div>
      <h2>${g.title}</h2>
      <p>${g.pitch}</p>
      <span class="prog" data-prog="${g.id}">Not played yet</span>
    </a>`).join('');
writeFileSync(`${SITE}/index.html`, `${head('Games · Omar Chakroun', 'Puzzle game prototypes. Play them and say which one you would keep playing.')}
<style>
:root { --bg: #04152d; --panel: #0b2247; --panel-hi: #19376d; --primary: #576cbc; --text: #fff; --muted: #a9b7da; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: radial-gradient(120% 60% at 50% 0%, #0b2a5a, var(--bg) 60%) var(--bg); color: var(--text); font-family: "Nunito", system-ui, sans-serif; font-weight: 700; min-height: 100vh;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.wrap { max-width: 1040px; margin: 0 auto; padding-block: 28px 48px; }
nav { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
nav a { color: var(--text); text-decoration: none; font-size: 18px; }
nav a.home { font-size: 22px; font-weight: 800; }
h1 { font-family: "Lilita One", system-ui, sans-serif; font-weight: 400; font-size: clamp(40px, 8vw, 64px); margin: 36px 0 8px; letter-spacing: .01em; }
.lead { color: var(--muted); font-size: 18px; max-width: 60ch; margin: 0 0 28px; line-height: 1.45; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 16px; }
.card { display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: 22px; background: var(--panel); border: 1px solid rgba(255,255,255,.1);
  color: var(--text); text-decoration: none; position: relative; overflow: hidden; transition: transform .15s, border-color .15s; min-width: 0; }
.card::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 6px; background: var(--c); }
.card:hover, .card:focus-visible { transform: translateY(-3px); border-color: var(--c); outline: none; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.icon { width: 76px; height: 76px; border-radius: 18px; background: #071633; border: 1px solid rgba(255,255,255,.1); display: grid; place-items: center; flex: none; }
.icon svg { width: 64px; height: 64px; display: block; }
.card:hover .icon { border-color: var(--c); }
.num { font-family: "Lilita One", sans-serif; color: var(--c); font-size: 15px; letter-spacing: .1em; }
.card h2 { font-family: "Lilita One", sans-serif; font-weight: 400; font-size: 28px; margin: 0; }
.card p { margin: 0; color: var(--muted); line-height: 1.4; flex: 1; }
.prog { font-size: 14px; color: var(--muted); }
.prog.on { color: var(--c); }
footer { color: var(--muted); font-size: 14px; margin-top: 32px; }
</style>
</head>
<body>
<div class="wrap">
  <nav><a class="home" href="/">Portfolio</a><a href="/#contact">Contact</a></nav>
  <h1>Games</h1>
  <p class="lead">Puzzle prototypes I am testing for my next mobile game. Each one has up to 10 levels. Play a few on your phone, and rate each one from 0 to 10 (the ★ button in every game) so I know which one to build for real.</p>
  <div class="grid">${cards}
  </div>
  <footer>Your progress is saved on this device. To improve the games, each level you play is also counted anonymously (game, level, time, win or lose, and your 0 to 10 rating), with no name, account or contact details.</footer>
</div>
<script>
document.querySelectorAll('[data-prog]').forEach(el => {
  const id = el.dataset.prog;
  try {
    let done = 0, total = 10, stars = 0;
    if (id === 'topple') { const d = JSON.parse(localStorage.getItem('topple.proto.v1')); total = 8; if (d) { done = d.results.filter(Boolean).length; stars = d.results.filter(Boolean).reduce((a, r) => a + r.stars, 0); } }
    else { const d = JSON.parse(localStorage.getItem('games.' + id)); if (d && d.stars) { done = Object.keys(d.stars).length; stars = Object.values(d.stars).reduce((a, b) => a + b, 0); } }
    if (done) { el.textContent = done + ' / ' + total + ' levels · ' + stars + ' ★'; el.classList.add('on'); }
    else el.textContent = total + ' levels';
    const r = localStorage.getItem('games.rating.' + id);
    if (r !== null) el.textContent += ' · you rated it ' + r + '/10';
  } catch (e) {}
});
</script>
</body>
</html>
`);
console.log('built', GAMES.length, 'games');
