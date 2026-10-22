# Graph Report - Plusultra  (2026-10-22)

## Corpus Check
- 15 files · ~35,499 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 335 nodes · 697 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Game
- Player
- models.js
- game.js
- Env
- UI
- main.js
- package.json
- Audio
- Pesquisa: My Hero Academia → fases do jogo

## God Nodes (most connected - your core abstractions)
1. `Game` - 52 edges
2. `Env` - 35 edges
3. `UI` - 33 edges
4. `Player` - 22 edges
5. `humanoid()` - 22 edges
6. `FX` - 17 edges
7. `Enemy` - 16 edges
8. `rnd()` - 15 edges
9. `part()` - 13 edges
10. `title()` - 12 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (10 total, 1 thin omitted)

### Community 0 - "Game"
Cohesion: 0.06
Nodes (4): basicHas(), FX, mat(), Game

### Community 1 - "Player"
Cohesion: 0.11
Nodes (4): Actor, Enemy, Npc, Player

### Community 2 - "models.js"
Cohesion: 0.10
Nodes (37): canvasTex(), groundTex(), texCache, windowsTex(), allForOne(), allMight(), bakugo(), CHARS (+29 more)

### Community 3 - "game.js"
Cohesion: 0.09
Nodes (21): three, angLerp(), COMBO, ENEMIES, tmp, Animator, base(), J (+13 more)

### Community 4 - "Env"
Cohesion: 0.25
Nodes (3): Env, pick(), rnd()

### Community 6 - "main.js"
Cohesion: 0.12
Nodes (23): Input, KEYMAP, PAD, audio, card(), controls(), credits(), game (+15 more)

### Community 7 - "package.json"
Cohesion: 0.08
Nodes (24): author, bugs, url, dependencies, three, description, devDependencies, vite (+16 more)

### Community 8 - "Audio"
Cohesion: 0.20
Nodes (5): Audio, HMIN, MAJ, MIN, TRACKS

### Community 9 - "Pesquisa: My Hero Academia → fases do jogo"
Cohesion: 0.18
Nodes (9): A espinha dorsal da história, Arcos e cenários usados, Mecânicas de jogos de referência, reimplementadas do zero, Pesquisa: My Hero Academia → fases do jogo, Sobre as referências em vídeo, As fases, Como jogar, Estrutura do código (+1 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Game` connect `Game` to `Player`, `game.js`, `main.js`?**
  _High betweenness centrality (0.252) - this node is a cross-community bridge._
- **Should `Game` be split into smaller, more focused modules?**
  _Cohesion score 0.05541346973572037 - nodes in this community are weakly interconnected._
- **Why does `UI` connect `UI` to `main.js`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **Should `Player` be split into smaller, more focused modules?**
  _Cohesion score 0.113107822410148 - nodes in this community are weakly interconnected._
- **Why does `three` connect `game.js` to `models.js`, `main.js`, `package.json`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Should `models.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09986504723346828 - nodes in this community are weakly interconnected._
- **Should `game.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08522727272727272 - nodes in this community are weakly interconnected._