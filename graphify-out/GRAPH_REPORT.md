# Graph Report - Plusultra  (2026-10-22)

## Corpus Check
- 23 files · ~53,558 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 456 nodes · 1074 edges · 18 communities (12 shown, 6 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8bf223f7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Game
- Player
- models.js
- actors.js
- Env
- UI
- main.js
- package.json
- Audio
- Plano da versão 2
- common.js
- FX
- Enemy
- fx.js

## God Nodes (most connected - your core abstractions)
1. `Game` - 63 edges
2. `Env` - 44 edges
3. `UI` - 41 edges
4. `Player` - 33 edges
5. `humanoid()` - 30 edges
6. `part()` - 23 edges
7. `rnd()` - 21 edges
8. `Enemy` - 19 edges
9. `FX` - 19 edges
10. `title()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `script()` --calls--> `bg()`  [EXTRACTED]
  src/stages/ch1.js → src/stages/common.js
- `script()` --calls--> `bigFinish()`  [EXTRACTED]
  src/stages/ch1.js → src/stages/common.js
- `script()` --calls--> `dropRock()`  [EXTRACTED]
  src/stages/ch1.js → src/stages/common.js
- `script()` --calls--> `ease()`  [EXTRACTED]
  src/stages/ch1.js → src/stages/common.js
- `script()` --calls--> `shot()`  [EXTRACTED]
  src/stages/ch1.js → src/stages/common.js

## Import Cycles
- None detected.

## Communities (18 total, 6 thin omitted)

### Community 1 - "Player"
Cohesion: 0.12
Nodes (4): Actor, Npc, Player, Trail

### Community 2 - "models.js"
Cohesion: 0.07
Nodes (51): texCache, addRim(), aizawa(), allForOne(), allMight(), bakugo(), barrier(), car() (+43 more)

### Community 3 - "actors.js"
Cohesion: 0.07
Nodes (16): three, AIR, angLerp(), BUF_ACTIONS, COMBO, ENEMIES, STYLE_RANKS, tmp (+8 more)

### Community 4 - "Env"
Cohesion: 0.22
Nodes (6): canvasTex(), Env, groundTex(), pick(), rnd(), windowsTex()

### Community 5 - "UI"
Cohesion: 0.05
Nodes (7): accentOf(), cache, init(), portrait(), SPEAKERS, STYLE_WORDS, UI

### Community 6 - "main.js"
Cohesion: 0.11
Nodes (27): Input, KEYMAP, PAD, audio, card(), chapters(), controls(), credits() (+19 more)

### Community 7 - "package.json"
Cohesion: 0.08
Nodes (24): author, bugs, url, dependencies, three, description, devDependencies, vite (+16 more)

### Community 8 - "Audio"
Cohesion: 0.20
Nodes (5): Audio, HMIN, MAJ, MIN, TRACKS

### Community 9 - "Plano da versão 2"
Cohesion: 0.10
Nodes (17): A espinha dorsal da história, Arcos adicionados na versão 2, Arcos e cenários usados, Mecânicas de jogos de referência, reimplementadas do zero, Pesquisa: My Hero Academia → fases do jogo, Sobre as referências em vídeo, 1. Visual atual, 2. Interface atual (+9 more)

### Community 10 - "common.js"
Cohesion: 0.38
Nodes (16): script(), script(), script(), script(), bg(), bigFinish(), BOSS, C (+8 more)

### Community 11 - "FX"
Cohesion: 0.17
Nodes (3): FX, mat(), spriteMat()

### Community 14 - "fx.js"
Cohesion: 0.20
Nodes (8): basic, basicHas(), boxGeo, discGeo, glowTex, planeGeo, ringGeo, spriteMats

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Game` connect `Game` to `actors.js`, `main.js`, `FX`, `.until`, `.updateSystems`, `.frame`, `.setup`?**
  _High betweenness centrality (0.227) - this node is a cross-community bridge._
- **Should `Game` be split into smaller, more focused modules?**
  _Cohesion score 0.09846153846153846 - nodes in this community are weakly interconnected._
- **Why does `UI` connect `UI` to `main.js`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Should `Player` be split into smaller, more focused modules?**
  _Cohesion score 0.11616161616161616 - nodes in this community are weakly interconnected._
- **Why does `three` connect `actors.js` to `models.js`, `UI`, `main.js`, `package.json`, `common.js`, `fx.js`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Should `models.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07402031930333818 - nodes in this community are weakly interconnected._
- **Should `actors.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07112375533428165 - nodes in this community are weakly interconnected._