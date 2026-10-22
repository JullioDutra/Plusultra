# PLUS ULTRA — A Origem de Deku

Jogo de fases em 3D no estilo dos jogos de anime do PlayStation 2, inspirado em **My Hero Academia**. Você joga a história do Izuku Midoriya, do garoto sem Individualidade até a batalha final contra o Shigaraki.

São 9 fases, cada uma baseada num arco do anime, com combate corpo a corpo, chefes com várias fases, cenas de história com câmera de cinema e golpes finais em QTE. Todos os modelos, cenários, músicas e efeitos sonoros são gerados por código: o jogo não usa nenhum arquivo de imagem ou áudio.

> Fan game sem fins lucrativos. My Hero Academia (Boku no Hero Academia) pertence a Kohei Horikoshi / Shueisha.

## Como jogar

```bash
npm install
npm run dev        # abre em http://localhost:5173
npm run build      # gera dist/index.html, um arquivo único que abre direto no navegador
```

Funciona com teclado, controle (Gamepad API) e toque no celular.

| Ação | Teclado | Controle |
|---|---|---|
| Mover | WASD / setas | Analógico esquerdo |
| Girar câmera | U / O ou arrastar o mouse | Analógico direito |
| Combo (no ar: chute) | J | X / □ |
| SMASH (segurar e soltar) | K | Y / △ |
| Esquiva (esquiva perfeita no tempo certo) | L / Shift | B / ○ |
| Pular (pulo duplo com Full Cowl; segurar para flutuar no final) | Espaço | A / ✕ |
| Full Cowl | Q | LB |
| Especial (Delaware, Air Force, Blackwhip, Texas Smash) | E | RB |
| Pausa | Esc / P | Start |

O **Plus Ultra** (barra amarela em 3 partes) enche quando você bate e quando apanha. Segure o SMASH até a barra de carga ficar cheia para gastar um segmento num golpe devastador. Círculos vermelhos no chão avisam golpes. Anéis que se espalham pelo chão pedem um pulo. Onigiris recuperam vida.

## As fases

| # | Fase | Arco do anime |
|---|---|---|
| 0 | Todos Nascem Iguais? | Ep. 1: o Vilão de Lama em Tatooin |
| 1 | Praia Dagobah | Ep. 2: o treino de 10 meses |
| 2 | O Exame de Admissão | Ep. 3–4: robôs e o robô de 0 pontos |
| 3 | Ataque à U.S.J. | Zona de Naufrágio e All Might contra o Nomu (você joga com o All Might) |
| 4 | Hosu — O Assassino de Heróis | Stain, Iida e Todoroki |
| 5 | Acampamento na Floresta | Muscular e o Kota |
| 6 | Kamino — O Fim de uma Era | Resgate do Bakugo e o último Smash do All Might |
| 7 | Resgate da Eri | Overhaul e a Shie Hassaikai |
| Final | Deku vs. Shigaraki | A Guerra Final em Jaku |

O detalhamento da pesquisa (arcos, cenários e mecânicas de referência) está em [`docs/PESQUISA.md`](docs/PESQUISA.md).

## Estrutura do código

| Arquivo | Conteúdo |
|---|---|
| `src/main.js` | Título, menus, fluxo da história, pausa, resultados e salvamento |
| `src/game.js` | Motor: loop, câmera, roteiros assíncronos das fases, QTE, projéteis, perigos e corrida automática |
| `src/stages.js` | As 9 fases: roteiro, diálogos, ondas de inimigos e chefes |
| `src/actors.js` | Jogador (combos, SMASH, esquiva, Full Cowl, especiais), inimigos e chefes com ataques definidos por dados, NPCs |
| `src/models.js` | Personagens low-poly com toon shading e contorno de anime |
| `src/anim.js` | Animação procedural por poses |
| `src/env.js` | Cenários procedurais (Tatooin, Dagobah, U.A., U.S.J., Hosu, floresta, Kamino, esconderijo, Jaku) |
| `src/fx.js` | Partículas, ondas de choque, avisos no chão, raios do Full Cowl, chuva e brasas |
| `src/audio.js` | Música e efeitos sintetizados com WebAudio |
| `src/ui.js`, `index.html` | HUD, diálogos, QTE e telas |

Nas Opções dá para trocar entre **Alta Resolução** e **PS2 (448 linhas)**, que imita a resolução e o serrilhado da época.
