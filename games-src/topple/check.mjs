import { LEVELS } from './levels.mjs';
import { analyse, parse, simulate } from './sim.mjs';
import { fileURLToPath as __f } from 'url';
import { dirname as __d } from 'path';
process.chdir(__d(__f(import.meta.url))); // paths below are relative to this folder

const only = process.argv[2];
LEVELS.forEach((L, idx) => {
  if (only && L.name !== only) return;
  const a = analyse(L);
  console.log(`\n=== ${idx + 1}. ${a.name} ${a.size}  islands=${a.islands} gaps=${a.gaps} k=${a.k}  minWin=${a.minWin} wins<=k=${a.winsWithinK} ticks=${a.ticks}`);
  console.log(`   win sets: ${a.winSets.join(' | ')}`);
  console.log(`   best fail with k: ${a.bestFail} [${a.bestFailSet}]`);
  a.map.forEach(r => console.log('   |' + r + '|'));
  // timer arrival for each single/pair placement
  const lv = parse(L);
  const timers = lv.cells.map((c, i) => (c.kind === 'timer' ? i : -1)).filter(i => i >= 0);
  if (timers.length) {
    for (const c of lv.cells) if (c.kind === 'timer') c.timer = 999;
    const gaps = lv.cells.map((c, i) => (c.kind === 'gap' ? i : -1)).filter(i => i >= 0);
    const tryset = s => {
      const r = simulate(lv, new Set(s));
      const at = timers.map(ti => { const e = r.events.find(e => e.i === ti); return e ? e.t : '-'; });
      console.log(`   timers reached at ${at.join(',')} with ${s.map(i => `${i % lv.W},${(i / lv.W) | 0}`).join(' ')}  (fallen ${r.fallen}/${r.total})`);
    };
    if (lv.k === 1) gaps.forEach(g => tryset([g]));
    else for (let i = 0; i < gaps.length; i++) for (let j = i + 1; j < gaps.length; j++) if (lv.k >= 2) tryset([gaps[i], gaps[j]]);
  }
});
