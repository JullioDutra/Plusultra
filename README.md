# PLUS ULTRA — A Origem de Deku

Jogo de fases em 3D com a estrutura dos jogos de anime do PlayStation 2 e visual atual, inspirado em **My Hero Academia**. Você joga a história do Izuku Midoriya, do garoto sem Individualidade até a batalha final contra o Shigaraki.

São 15 fases, cada uma baseada num arco do anime, com combate corpo a corpo fluido, chefes com várias fases, resgates, plataformas, missões e cenas de história com câmera de cinema e retratos dos personagens. Todos os modelos, cenários, músicas e efeitos sonoros são gerados por código: o jogo não usa nenhum arquivo de imagem ou áudio.

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
| Combo de 4 golpes (no ar: combo aéreo de 3) | J | X / □ |
| Lançador (toque rápido) / SMASH carregado (segurar) | K | Y / △ |
| Esquiva; no tempo certo vira esquiva perfeita | L / Shift | B / ○ |
| Contra-ataque (logo após a esquiva perfeita) | J | X / □ |
| Pular (pulo duplo com Full Cowl; segurar para flutuar no final) | Espaço | A / ✕ |
| Full Cowl | Q | LB |
| Especial (Delaware, Air Force, Blackwhip, Texas Smash) | E | RB |
| Travar alvo | Tab / R | R3 |
| Pausa | Esc / P | Start |

Depois de acertar um golpe dá para cancelar em esquiva, pulo, especial ou SMASH, e um botão apertado um pouco antes da hora ainda vale. Atacar logo após esquivar sai uma voadora. O **medidor de estilo** (D → S) sobe com golpes variados e cai quando você apanha.

## As 15 fases

| # | Fase | Arco do anime | Desafio |
|---|---|---|---|
| 0 | Todos Nascem Iguais? | Ep. 1 | Atravessar a rua em chamas sem poder |
| 1 | Praia Dagobah | Ep. 2 | Limpar a praia contra o relógio |
| 2 | O Exame de Admissão | Ep. 3–4 | Robôs, resgate de candidatos e o robô de 0 pontos |
| 3 | Deku vs. Kacchan | Ep. 6–7 | Chefe Bakugo, granada de luz, disparo da manopla |
| 4 | Ataque à U.S.J. | Ep. 9–13 | Navio, Delaware Smash e All Might contra o Nomu |
| 5 | Corrida de Obstáculos | Ep. 16 | Plataformas sobre o abismo, campo minado e rivais |
| 6 | Deku vs. Todoroki | Ep. 22–23 | Sair do ringue é derrota; geleiras e fogo |
| 7 | Hosu | Ep. 26–33 | Resgates no incêndio e o Stain |
| 8 | Acampamento na Floresta | Ep. 39–45 | Colegas no gás e o Muscular |
| 9 | Kamino | Ep. 46–49 | Corrida automática e o último Smash do All Might |
| 10 | Licença Provisória | Ep. 52–60 | Alunos rivais, zona de desastre e o Gang Orca |
| 11 | Deku vs. Kacchan II | Ep. 61 | A luta de coração aberto em Ground Beta |
| 12 | Resgate da Eri | Ep. 64–77 | Inimigos com escudo e o Overhaul |
| 13 | Deku Sombrio: Lady Nagant | Temporada 6 | Telhados na chuva sob tiros de sniper |
| Final | Deku vs. Shigaraki | Guerra Final | Ondas de Decadência e os vestígios |

Cada fase tem **3 missões** (estrelas), uma **página do Caderno do Deku** escondida e nota final de S a C. O progresso fica salvo no navegador.

O plano desta versão está em [`docs/PLANO_V2.md`](docs/PLANO_V2.md) e a pesquisa do anime em [`docs/PESQUISA.md`](docs/PESQUISA.md).

## Estrutura do código

| Arquivo | Conteúdo |
|---|---|
| `src/main.js` | Título, capítulos, Caderno do Deku, opções, fluxo da história, resultados com missões e salvamento |
| `src/game.js` | Motor: loop, câmera, roteiros assíncronos, QTE, projéteis, resgates, minas, abismo, ring-out e corrida automática |
| `src/render.js` | Pós-processamento: bloom, tone mapping ACES, gradação de cor, impact frame |
| `src/stages/` | As 15 fases (`ch1.js` a `ch4.js`), kits do Deku, chefes e páginas do caderno (`common.js`) |
| `src/actors.js` | Jogador (buffer, cancelamentos, lançador, combo aéreo, contra-ataque, lock-on, estilo), inimigos e chefes |
| `src/models.js` | Personagens e objetos low-poly com toon shading, contorno e luz de recorte |
| `src/portraits.js` | Retratos 3D dos personagens para os diálogos |
| `src/anim.js` | Animação procedural por poses |
| `src/env.js` | 19 cenários procedurais |
| `src/fx.js` | Partículas, brilhos, rastros de golpe, ondas de choque, avisos no chão, clima |
| `src/audio.js` | Música e efeitos sintetizados com WebAudio |
| `src/ui.js`, `index.html` | HUD, diálogos, QTE e telas |

Nas Opções há quatro qualidades de imagem: **Ultra**, **Alto**, **Leve** (celular) e **Retrô PS2**, que imita a resolução da época.
