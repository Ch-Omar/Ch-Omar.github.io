# Games sources

Sources for the browser game prototypes served at `/games/`. The built pages live in `public/games/` (and are copied to `docs/games/` by `npm run build`); this folder is what produces them.

## Layout

- `src/<game>.js` – one file per game. It calls `Kit.start(...)` from the shared frame in `public/games/kit/` (header, levels, win/lose sheets, sound, stats, rating). A `/*LEVELS:<name>*/` placeholder is replaced by `levels/<name>.json` at build time.
- `levels/*.json` – generated levels, each checked solvable (or with a single answer) by its generator.
- `gen.mjs` – levels for Tilt Sort, Noodle Out, Flood Rescue, Gate Drop, Pull Tower and Mosaic (about a minute).
- `gen2.mjs` – Tube Sort levels (solver-checked).
- `gen3.mjs` – Picture Logic and Mini Sudoku levels (unique solutions).
- `icons.mjs` – the 64×64 SVG pictures on the Games page cards.
- `build-site.mjs` – the list of games (`GAMES`), writes every `public/games/<game>/index.html` and the Games page `public/games/index.html`. It also builds Topple.
- `topple/` – Topple, the domino prototype: `topple.src.html` (the page), `levels.mjs` (its 8 levels), `sim.mjs` + `check.mjs` (rules and a level checker), `build.mjs` (injects the levels).

The other games (Switch Rail, Mix Lab, Blast Cascade, Sand Jars, Pipe Spin, Color Flood, Lights Off, Merge Drop, Pop Groups, Stack Up, Slide Puzzle, One Stroke, Dot Link, Safe Steps, Snake Bites, Echo, Number Swipe, Brick Bash, Gem Swap, Tap Rush) make their levels in the page from a seed, so they need no generator.

## Commands

Run from the repository root (each script works from any folder):

```
node games-src/gen.mjs        # only when changing those levels
node games-src/gen2.mjs
node games-src/gen3.mjs
node games-src/topple/check.mjs   # Topple level report
node games-src/build-site.mjs     # write public/games/*
npm run build                     # copy everything into docs/ for GitHub Pages
```

Adding a game: write `src/<id>.js`, add it to `GAMES` in `build-site.mjs`, draw its icon in `icons.mjs`, add its name to `NAMES` in `public/games/admin/index.html`, then run the last two commands.

Play stats and ratings go to Firebase (config in `public/games/kit/firebase-config.js`, rules in `firebase/firestore.rules`).
