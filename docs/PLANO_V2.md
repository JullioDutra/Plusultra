# Plano da versão 2

Pedido: manter o jogo de fases no estilo PS2 (câmera em terceira pessoa, cenas entre as lutas, chefes marcantes), mas com visual e interface atuais. As fases precisam de mais história, mais desafios dinâmicos e mais conteúdo, e o combate tem que ficar mais fluido.

## 1. Visual atual

| Item | Antes | Depois |
|---|---|---|
| Imagem final | Render direto, sem tratamento | Pós-processamento: bloom (brilho), tone mapping ACES, gradação de cor, vinheta, aberração cromática nos impactos |
| Personagens | Toon com contorno | Toon com **luz de recorte** (rim light) colorida por cenário, que destaca a silhueta como nos jogos de anime atuais |
| Sombras | Duras | Suaves (PCF Soft) |
| Efeitos | Cubos | Faíscas brilhantes em sprite, **rastro dos golpes**, *impact frame* (a tela inverte por 2 quadros no SMASH, como no anime), números de dano |
| Cenários | Texturas com ruído forte | Texturas estilizadas limpas, janelas que **acendem à noite** e brilham, nuvens, mais objetos (carros, máquinas de bebida, barreiras, placas, postes) |
| Qualidade | HD / PS2 | Ultra / Alto / Leve / Retrô PS2 (o modo antigo continua como opção) |

## 2. Interface atual

- HUD com painéis angulares e retrato do Deku, barra de vida com "lasca" de dano, Plus Ultra em 3 cargas e % do One For All.
- **Medidor de estilo** (D, C, B, A, S) que sobe com combos variados e cai se você ficar parado ou apanhar.
- Marcador de alvo travado (lock-on), números de dano, avisos de esquiva perfeita.
- Diálogos com **retrato 3D** do personagem que fala, gerado pelo próprio jogo.
- Menu de capítulos em cartões, tela de resultados com medalhas das missões, galeria **Caderno do Deku** com as páginas coletadas.

## 3. Jogabilidade mais fluida

- **Buffer de comandos**: um botão apertado um pouco antes da hora ainda vale.
- **Cancelamentos**: qualquer golpe pode ser cancelado em esquiva ou pulo depois de acertar.
- **Lançador**: um toque rápido em K joga o inimigo para cima. Pule atrás e continue o **combo aéreo** (3 golpes, e o último crava o inimigo no chão).
- **Ataque em investida**: atacar logo depois de esquivar dá uma voadora.
- **Contra-ataque**: depois da esquiva perfeita, J teleporta o Deku até o inimigo com um golpe forte.
- **Travar alvo** (Tab / R / R3), com câmera que enquadra os dois.
- Tempo de tolerância para pular (coyote time) e pulo guardado no buffer.
- Inimigos novos: com **escudo** (só cai com SMASH, lançador ou golpe pelas costas), **atiradores** que mantêm distância e **homens-bomba** que explodem.

## 4. Desafios dinâmicos

- **3 missões por fase** (ex.: "combo de 30", "resgate todos os civis", "nunca saia da arena"), com medalhas.
- **Resgate de civis**: fique perto de um civil em perigo até a barra encher.
- **Páginas do Caderno** escondidas em cada fase, com análises de heróis e vilões no estilo do Deku.
- **Plataformas e abismos** com pontos de controle (a queda custa vida).
- **Campo minado** em que as explosões arremessam o Deku para frente, como no anime.
- **Ring-out**: na arena do Festival, sair do ringue é derrota.
- Chefes com golpes novos: geleira em linha (Todoroki), granada de luz que cega (Bakugo), tiro de sniper com mira laser (Lady Nagant), onda sônica que paralisa (Gang Orca).

## 5. Mais fases e mais história (de 9 para 15)

| # | Fase | Arco | Novidade |
|---|---|---|---|
| 0 | Todos Nascem Iguais? | Ep. 1 | História ampliada (infância, o caderno, o Kacchan) |
| 1 | Praia Dagobah | Ep. 2 | Lixo pesado que precisa de SMASH, páginas do treino |
| 2 | O Exame de Admissão | Ep. 3–4 | **Pontos de resgate de verdade**: salvar candidatos dá pontos |
| 3 | **Treino de Batalha: Deku vs. Kacchan** | Ep. 6–7 | Nova. Prédio, o gancho de direita previsível, o gauntlet, o soco para cima |
| 4 | Ataque à U.S.J. | Ep. 9–13 | Mais cenas (Kurogiri, Aizawa), All Might jogável |
| 5 | **Festival: Corrida de Obstáculos** | Ep. 16 | Nova. Robôs, The Fall (cordas sobre o abismo) e campo minado com rivais correndo |
| 6 | **Festival: Deku vs. Todoroki** | Ep. 22–23 | Nova. Ring-out, geleiras, "É o SEU poder!", fase de fogo |
| 7 | Hosu — O Assassino de Heróis | Ep. 26–33 | Resgate de civis no meio do incêndio |
| 8 | Acampamento na Floresta | Ep. 39–45 | Resgate dos colegas desmaiados pelo gás |
| 9 | Kamino — O Fim de uma Era | Ep. 46–49 | Corrida mais longa |
| 10 | **Exame da Licença Provisória** | Ep. 52–60 | Nova. Alvos nos alunos rivais, resgate na zona de desastre, Gang Orca |
| 11 | **Deku vs. Kacchan II** | Ep. 61 | Nova. Ground Beta à noite, a luta de coração aberto, All Might intervém |
| 12 | Resgate da Eri | Ep. 64–77 | Inimigos com escudo |
| 13 | **Deku Sombrio: Lady Nagant** | Temporada 6 | Nova. Telhados na chuva, tiros de sniper, Blackwhip e o resgate da Nagant |
| 14 | Deku vs. Shigaraki | Guerra Final | Mais fases do chefe e um final estendido |

## 6. Ordem de execução

1. Pipeline de render, materiais e texturas.
2. Efeitos (sprites, rastro, impact frame, números de dano).
3. Jogador v2 (buffer, cancelamentos, lançador, combo aéreo, contra-ataque, lock-on) e inimigos novos.
4. Sistemas de fase: missões, resgate, páginas, checkpoints, minas, ring-out.
5. Modelos e cenários novos.
6. Roteiro das 15 fases.
7. Nova interface e menus.
8. Testes automáticos em todas as fases, ajustes, documentação, publicação.
