// Small 64x64 pictures of each game's mechanic, for the cards on the Games page.
const R = '#f0505e', B = '#4f8ef2', Y = '#ffd54a', G = '#5acb74', P = '#a06ee2', O = '#ff9a3c', K = '#f8a3c6', C = '#8adaf8', W = '#ffffff', D = '#1b2a52', L = '#c9d6ff';
const rect = (x, y, w, h, f, r = 3, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}" ${extra}/>`;
const circ = (x, y, r, f, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${extra}/>`;
const line = (d, s, w, extra = '') => `<path d="${d}" fill="none" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const text = (x, y, t, f, size = 13) => `<text x="${x}" y="${y}" fill="${f}" font-family="Lilita One, Arial Rounded MT Bold, sans-serif" font-size="${size}" text-anchor="middle" dominant-baseline="central">${t}</text>`;
const grid = (n, x0, y0, s, fill, gap = 2) => { let o = ''; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) o += rect(x0 + x * s, y0 + y * s, s - gap, s - gap, typeof fill === 'function' ? fill(x, y) : fill, 2); return o; };
const eyes = (x, y) => circ(x - 2.5, y, 1.6, W) + circ(x + 2.5, y, 1.6, W);

export const ICONS = {
  noodle: line('M10 14 C 22 14, 22 30, 34 30 S 46 18, 54 18', Y, 8) + eyes(54, 18) + line('M12 40 L 12 22', R, 8) + eyes(12, 21) +
    `<path d="M8 46 Q 32 64 56 46 Z" fill="${L}" opacity=".35"/>` + line('M8 46 Q 32 64 56 46', L, 3),
  tilt: rect(6, 6, 52, 52, '#2b4b8c', 8) + rect(12, 12, 40, 40, '#0d1e45', 4) + rect(30, 24, 8, 8, '#3a5fa8', 2) +
    circ(20, 44, 6, '#030a1c', `stroke="${R}" stroke-width="2.5"`) + circ(44, 18, 6, R) + line('M44 28 L 44 40', W, 2, 'stroke-dasharray="3 3"'),
  flood: grid(3, 8, 8, 16, (x, y) => ((x + y) % 2 ? '#2f7a4a' : '#358553'), 0) + circ(24, 22, 6, O) + eyes(24, 21) + circ(40, 38, 6, K) + eyes(40, 37) +
    `<path d="M8 46 Q 16 42 24 46 T 40 46 T 56 46 L 56 56 L 8 56 Z" fill="#4096eb" opacity=".8"/>`,
  rail: line('M32 6 L 32 26 L 14 54', L, 4) + line('M32 26 L 50 54', L, 4, 'opacity=".3"') + circ(32, 26, 7, Y) +
    rect(8, 52, 14, 6, R, 2) + rect(44, 52, 14, 6, B, 2) + rect(27, 8, 10, 14, R, 3),
  gate: rect(8, 6, 14, 44, 'rgba(255,255,255,.08)', 2) + rect(25, 6, 14, 44, 'rgba(255,255,255,.14)', 2) + rect(42, 6, 14, 44, 'rgba(255,255,255,.08)', 2) +
    line('M10 22 L 20 16', L, 3) + line('M27 34 L 37 40', L, 3) + circ(32, 14, 5, P) + rect(8, 50, 14, 8, R, 3) + rect(25, 50, 14, 8, P, 3) + rect(42, 50, 14, 8, Y, 3),
  mix: circ(22, 24, 12, R, 'opacity=".85"') + circ(42, 24, 12, Y, 'opacity=".85"') + circ(32, 42, 12, B, 'opacity=".85"') + circ(32, 30, 5, O) ,
  blast: grid(4, 10, 10, 11, (x, y) => (y >= 2 ? [R, B, G, Y][(x + y) % 4] : x === 1 && y === 1 ? O : 'rgba(255,255,255,.1)')) + line('M50 14 L 50 30 M45 25 L 50 30 L 55 25', W, 2.5),
  tower: [0, 1, 2, 3].map(r => [0, 1, 2].map(i => (r % 2 && i === 2 ? '' : rect(8 + (r % 2) * 8 + i * 16, 48 - r * 11, 15, 10, r === 2 && i === 1 ? 'rgba(255,255,255,.1)' : [R, '#5b6a8f', B, '#5b6a8f'][(r + i) % 4], 2))).join('')).join('') +
    rect(34, 14, 15, 10, Y, 2, 'transform="rotate(-12 41 19)"'),
  sand: line('M18 6 L 46 6 L 36 18 L 28 18 Z', L, 2.5) + line('M32 18 L 32 34', Y, 3) + line('M22 26 L 42 38', L, 3.5) +
    line('M14 40 L 14 58 L 28 58 L 28 40', L, 2.5) + line('M36 40 L 36 58 L 50 58 L 50 40', L, 2.5) + rect(16, 48, 10, 9, Y, 1) + rect(38, 52, 10, 5, B, 1),
  mosaic: rect(8, 8, 48, 48, '#e9a46b', 4) + rect(8, 8, 24, 24, '#7fb7a6', 4) + rect(32, 32, 24, 24, '#8fa6d8', 4) + rect(32, 8, 24, 24, '#d97a7a', 4) +
    `<path d="M20 14 L22.5 18.5 L27 20 L22.5 21.5 L20 26 L17.5 21.5 L13 20 L17.5 18.5 Z" fill="${Y}"/>` + `<path d="M44 38 L46.5 42.5 L51 44 L46.5 45.5 L44 50 L41.5 45.5 L37 44 L41.5 42.5 Z" fill="${Y}"/>`,
  topple: rect(10, 22, 8, 26, '#f6efdd', 2) + rect(24, 22, 8, 26, '#f6efdd', 2, 'transform="rotate(25 28 48)"') +
    rect(36, 40, 26, 10, R, 2) + rect(36, 30, 8, 8, K, 2) + circ(14, 30, 1.5, '#3a3550') + circ(14, 40, 1.5, '#3a3550'),
  pipes: rect(6, 6, 52, 52, '#132a5a', 6) + line('M12 32 L 32 32 L 32 52', '#5ab8f0', 7) + line('M32 32 L 32 14 L 50 14', '#6c7aa3', 7) + circ(12, 32, 6, Y) +
    [0, 1, 2, 3, 4].map(k => circ(50 + Math.cos(k * 1.26) * 4, 14 + Math.sin(k * 1.26) * 4, 3, K)).join(''),
  floodit: grid(4, 8, 8, 12, (x, y) => (x + y < 3 ? O : [B, Y, G][(x * 3 + y) % 3]), 0) + rect(8, 8, 12, 12, 'none', 0, `stroke="${W}" stroke-width="2"`),
  lights: grid(3, 10, 10, 15, D, 3) + circ(32, 17, 5, '#ffe17a') + circ(17, 32, 5, '#ffe17a') + circ(47, 47, 5, '#ffe17a') + circ(32, 32, 5, '#2a3a66'),
  merge: rect(10, 34, 20, 20, B, 4) + text(20, 44, '2', W) + rect(34, 34, 20, 20, B, 4) + text(44, 44, '2', W) + line('M24 28 L 32 18 L 40 28', W, 2.5) + rect(24, 4, 16, 14, G, 4) + text(32, 11, '4', W, 11),
  tubes: [0, 1, 2].map(t => line(`M${12 + t * 18} 8 L ${12 + t * 18} 52 Q ${16 + t * 18} 58 ${20 + t * 18} 52 L ${20 + t * 18} 8`, L, 2.5) + [0, 1, 2].map(b => circ(16 + t * 18, 48 - b * 10, 4, [[R, B, R], [B, R, B], [Y, Y, Y]][t][b])).join('')).join(''),
  pop: [[16, 20, R], [28, 20, R], [40, 20, B], [16, 32, B], [28, 32, R], [40, 32, Y], [52, 32, B], [16, 44, Y], [28, 44, B], [40, 44, B], [52, 44, R]].map(([x, y, f]) => circ(x, y, 5.5, f)).join('') +
    `<circle cx="22" cy="20" r="11" fill="none" stroke="${W}" stroke-width="2" stroke-dasharray="3 3"/>`,
  stack: rect(14, 46, 36, 9, R, 2) + rect(16, 36, 34, 9, O, 2) + rect(18, 26, 32, 9, Y, 2) + rect(26, 14, 32, 9, G, 2) + line('M10 18 L 20 18', W, 2, 'opacity=".6"'),
  slide: grid(3, 10, 10, 15, (x, y) => (x === 2 && y === 2 ? 'rgba(255,255,255,.08)' : `hsl(${y * 90 + 10},70%,${55 + x * 6}%)`), 2) +
    [1, 2, 3, 4, 5, 6, 7, 8].map((n, k) => text(16.5 + (k % 3) * 15, 16.5 + Math.floor(k / 3) * 15, n, D, 10)).join(''),
  stroke: grid(3, 10, 10, 15, '#13295a', 3) + line('M16 16 L 46 16 L 46 31 L 16 31 L 16 46 L 46 46', '#c9a8ff', 5) + circ(16, 16, 5, '#ffc83d'),
  dots: rect(6, 6, 52, 52, '#132a5a', 6) + line('M16 16 L 16 44 L 30 44', G, 5) + line('M48 16 L 32 16 L 32 30 L 48 30', B, 5) +
    circ(16, 16, 5, G) + circ(30, 44, 5, G) + circ(48, 16, 5, B) + circ(48, 30, 5, B) + circ(48, 48, 5, R),
  nono: text(10, 30, '2', W, 10) + text(10, 42, '1', W, 10) + text(26, 12, '3', W, 10) + text(38, 12, '1', W, 10) + rect(18, 20, 40, 36, '#dfe5f7', 2) +
    rect(20, 24, 10, 10, D, 1) + rect(31, 24, 10, 10, D, 1) + rect(20, 36, 10, 10, D, 1) + rect(31, 48, 0, 0, D) + rect(42, 36, 10, 10, D, 1),
  mines: grid(3, 10, 10, 15, (x, y) => (x + y > 2 ? '#46a865' : '#efdcbb'), 1) + text(17, 17, '1', B, 11) + text(32, 17, '2', G, 11) + text(17, 32, '1', B, 11) +
    line('M48 40 L 48 54', '#1b1530', 2) + `<path d="M48 40 L 56 44 L 48 48 Z" fill="${R}"/>`,
  snake: rect(6, 6, 52, 52, '#2f7a4a', 6) + line('M14 46 L 14 30 L 34 30 L 34 18 L 44 18', Y, 8) + circ(44, 18, 5, O) + eyes(45, 17) + circ(48, 44, 5, R) + rect(47, 36, 2, 4, G, 1),
  echo: `<path d="M32 32 L 32 8 A 24 24 0 0 1 56 32 Z" fill="${R}"/><path d="M32 32 L 56 32 A 24 24 0 0 1 32 56 Z" fill="${B}" opacity=".45"/>` +
    `<path d="M32 32 L 32 56 A 24 24 0 0 1 8 32 Z" fill="${Y}" opacity=".45"/><path d="M32 32 L 8 32 A 24 24 0 0 1 32 8 Z" fill="${G}" opacity=".45"/>` + circ(32, 32, 8, '#102350'),
  sudoku: rect(8, 8, 48, 48, '#f5f7ff', 3) + line('M32 8 L 32 56 M8 32 L 56 32', D, 2.5) + line('M20 8 L 20 56 M44 8 L 44 56 M8 20 L 56 20 M8 44 L 56 44', '#9aa6c8', 1) +
    text(14, 14, '1', D, 10) + text(38, 26, '3', D, 10) + text(26, 38, '2', '#2c5fb8', 10) + text(50, 50, '4', D, 10) + rect(8, 44, 12, 12, '#ffd54a', 0, 'opacity=".7"'),
  swipe: rect(6, 6, 52, 52, '#bbada0', 6) + rect(10, 10, 21, 21, '#eee4da', 3) + text(20.5, 20.5, '2', '#776e65') + rect(33, 10, 21, 21, '#f2b179', 3) + text(43.5, 20.5, '8', W) +
    rect(10, 33, 21, 21, '#f65e3b', 3) + text(20.5, 43.5, '64', W, 11) + rect(33, 33, 21, 21, '#edc53f', 3) + text(43.5, 43.5, '512', W, 9),
  brick: [0, 1, 2].map(r => [0, 1, 2, 3].map(i => rect(8 + i * 12.5, 8 + r * 7, 11, 5.5, [R, O, Y][r], 1.5)).join('')).join('') + circ(36, 40, 3.5, W) + rect(22, 52, 22, 5, L, 2.5) + line('M36 40 L 46 30', W, 1.5, 'stroke-dasharray="2 3"'),
  gems: [[16, 18, R, 4], [32, 18, B, 5], [48, 18, R, 4], [16, 34, G, 6], [32, 34, R, 4], [48, 34, Y, 5], [16, 50, B, 5], [32, 50, G, 6], [48, 50, P, 4]].map(([x, y, f, n]) => {
    let pts = ''; for (let s = 0; s < n; s++) { const a = -Math.PI / 2 + s * Math.PI * 2 / n; pts += `${(x + Math.cos(a) * 6.5).toFixed(1)},${(y + Math.sin(a) * 6.5).toFixed(1)} `; }
    return `<polygon points="${pts}" fill="${f}"/>`;
  }).join('') + line('M32 34 L 32 18', W, 2, 'opacity=".7"'),
  tap: circ(22, 22, 10, G) + circ(22, 22, 13, 'none', `stroke="${W}" stroke-width="2"`) + circ(44, 40, 8, B) + circ(18, 46, 7, '#1b1530', `stroke="${R}" stroke-width="2"`) + line('M22 40 L 26 34', Y, 2),
};
