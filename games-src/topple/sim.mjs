// Topple rules + level checker. The same sim code is copied into the game page.
// Mask: '.' plain, '_' gap, 'S' start, 'H' heavy (needs 2 fallen neighbours), 'T' timer (values in reading order).

export function parse(L) {
  const H = L.pic.length, W = L.pic[0].length;
  const cells = [];
  let ti = 0, start = -1;
  for (let y = 0; y < H; y++) {
    if (L.pic[y].length !== W || L.mask[y].length !== W) throw new Error(`${L.name}: row ${y} width`);
    for (let x = 0; x < W; x++) {
      const p = L.pic[y][x], m = L.mask[y][x];
      let kind = p === '.' ? 'none' : 'dom';
      let timer = 0;
      if (m === '_') kind = 'gap';
      else if (m === 'S') { kind = 'dom'; start = y * W + x; }
      else if (m === 'H') kind = 'heavy';
      else if (m === 'T') { kind = 'timer'; timer = L.timers[ti++]; }
      if (kind !== 'none' && kind !== 'gap' && p === '.') throw new Error(`${L.name}: domino on blank at ${x},${y}`);
      cells.push({ x, y, kind, color: p, timer });
    }
  }
  if (start < 0) throw new Error(`${L.name}: no start`);
  return { W, H, cells, start, k: L.k, name: L.name };
}

// placed: Set of cell indexes (gaps filled). Returns events in order.
export function simulate(lv, placed) {
  const { W, H, cells } = lv;
  const n = cells.length;
  const standing = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    const c = cells[i];
    if (c.kind === 'dom' || c.kind === 'heavy' || c.kind === 'timer') standing[i] = true;
    if (c.kind === 'gap' && placed.has(i)) standing[i] = true;
  }
  const total = standing.filter(Boolean).length;
  const fallT = new Array(n).fill(-1), from = new Array(n).fill(-1), hits = new Array(n).fill(0);
  const crumbled = new Array(n).fill(false);
  const events = []; // {i, t, from}
  const crumbles = []; // {i, t}
  let front = [lv.start];
  fallT[lv.start] = 0; standing[lv.start] = false; events.push({ i: lv.start, t: 0, from: -1 });
  let t = 0;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (front.length) {
    t++;
    const next = [];
    for (const i of front) {
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (!standing[j]) continue;
        if (cells[j].kind === 'heavy') {
          hits[j]++;
          if (hits[j] < 2) continue;
        }
        standing[j] = false; fallT[j] = t; from[j] = i; next.push(j);
        events.push({ i: j, t, from: i });
      }
    }
    // timers that run out this tick crumble
    for (let j = 0; j < n; j++) {
      if (standing[j] && cells[j].kind === 'timer' && cells[j].timer <= t) {
        standing[j] = false; crumbled[j] = true; crumbles.push({ i: j, t });
      }
    }
    front = next;
  }
  const fallen = events.length;
  return { win: fallen === total, fallen, total, events, crumbles, ticks: t, hits };
}

function* subsets(arr, k, startAt = 0, cur = []) {
  yield cur.slice();
  if (cur.length === k) return;
  for (let i = startAt; i < arr.length; i++) {
    cur.push(arr[i]);
    yield* subsets(arr, k, i + 1, cur);
    cur.pop();
  }
}

export function analyse(L) {
  const lv = parse(L);
  const gaps = lv.cells.map((c, i) => (c.kind === 'gap' ? i : -1)).filter(i => i >= 0);
  const wins = [];
  let bestFail = 0, bestFailSet = null, fails = 0;
  let minWin = Infinity;
  for (const s of subsets(gaps, lv.k)) {
    const r = simulate(lv, new Set(s));
    if (r.win) { wins.push(s); minWin = Math.min(minWin, s.length); }
    else if (s.length === lv.k) {
      fails++;
      const pct = r.fallen / r.total;
      if (pct > bestFail) { bestFail = pct; bestFailSet = s; }
    }
  }
  // islands (4-connected dominoes, any kind incl. heavy/timer, not gaps)
  const isl = new Array(lv.cells.length).fill(-1);
  let ni = 0;
  for (let i = 0; i < lv.cells.length; i++) {
    const c = lv.cells[i];
    if (c.kind === 'none' || c.kind === 'gap' || isl[i] >= 0) continue;
    const st = [i]; isl[i] = ni;
    while (st.length) {
      const a = st.pop(), x = a % lv.W, y = (a / lv.W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= lv.W || ny >= lv.H) continue;
        const b = ny * lv.W + nx, cb = lv.cells[b];
        if (cb.kind === 'none' || cb.kind === 'gap' || isl[b] >= 0) continue;
        isl[b] = ni; st.push(b);
      }
    }
    ni++;
  }
  const rows = [];
  for (let y = 0; y < lv.H; y++) {
    let s = '';
    for (let x = 0; x < lv.W; x++) {
      const i = y * lv.W + x, c = lv.cells[i];
      if (i === lv.start) s += 'S';
      else if (c.kind === 'none') s += ' ';
      else if (c.kind === 'gap') s += '_';
      else if (c.kind === 'heavy') s += 'H';
      else if (c.kind === 'timer') s += 'T';
      else s += String.fromCharCode(97 + isl[i]);
    }
    rows.push(s);
  }
  const fmt = s => s.map(i => `${i % lv.W},${(i / lv.W) | 0}`).join(' ');
  const exactWins = wins.filter(s => s.length <= lv.k);
  return {
    name: L.name, size: `${lv.W}x${lv.H}`, islands: ni, gaps: gaps.length, k: lv.k,
    minWin, winsWithinK: exactWins.length, fullKCombos: exactWins.filter(s => s.length === lv.k).length + fails,
    winSets: exactWins.slice(0, 6).map(fmt), bestFail: Math.round(bestFail * 100) + '%', bestFailSet: bestFailSet && fmt(bestFailSet),
    map: rows,
    ticks: exactWins.length ? simulate(lv, new Set(exactWins[0])).ticks : 0,
  };
}
