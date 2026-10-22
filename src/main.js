import * as THREE from 'three';
import { Game, ABORT } from './game.js';
import { UI } from './ui.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { STAGES } from './stages.js';
import * as M from './models.js';

const V = THREE.Vector3;
const audio = new Audio();
const ui = new UI(audio);
const input = new Input();
window.__ui = ui;
const game = new Game({ canvas: document.getElementById('c'), ui, audio, input });
window.__game = game;

// ---------------------------------------------------- salvamento (opcional)
const SAVE_KEY = 'plusultra-save-v1';
const save = (() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; } })();
save.unlocked ??= 1; save.best ??= {}; save.opts ??= { quality: 'hd', volume: 0.7, music: true, diff: 1 };
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* sem armazenamento */ } };
game.setQuality(save.opts.quality); audio.setVolume(save.opts.volume); audio.musicOn = save.opts.music; game.diff = save.opts.diff;

const isTouch = matchMedia('(pointer: coarse)').matches;
if (isTouch) input.bindTouch(document.getElementById('touch'));
const touchUI = on => document.getElementById('touch').classList.toggle('hidden', !(on && isTouch));

// ---------------------------------------------------- título
function titleScene() {
  game.running = false;
  game.clearStage();
  game.env.build('dagobah');
  const d = M.deku('hero'); d.root.position.set(0, 0, -6); d.root.rotation.y = Math.PI * 0.85; game.scene.add(d.root); game.env.objs.push(d.root);
  const am = M.allMight(); am.root.position.set(-2.4, 0, -7.5); am.root.rotation.y = Math.PI * 0.9; game.scene.add(am.root); game.env.objs.push(am.root);
  // pose heroica estática
  d.shR.rotation.set(-2.8, 0, -0.2); d.shL.rotation.set(0.3, 0, 0.4); d.elL.rotation.x = -1.2; d.hipL.rotation.x = -0.4; d.knL.rotation.x = 0.5;
  am.shR.rotation.set(-1.0, 0, -0.9); am.elR.rotation.x = -1.6; am.shL.rotation.set(-1.0, 0, 0.9); am.elL.rotation.x = -1.6;
  game.fx.setWeather('spark', game.scene);
  let t = 0;
  game.titleCam = (dt) => {
    t += dt;
    const a = Math.sin(t * 0.15) * 0.5 + 0.3;
    game.camera.position.set(Math.sin(a) * 7, 2.2 + Math.sin(t * 0.3) * 0.3, -6 + Math.cos(a) * 7);
    game.camera.lookAt(innerWidth > 700 ? -4.2 : -1, 1.9, -6.5);
    game.env.update(dt, t);
    game.fx.update(dt, new V(0, 0, -6));
    if (game.env.skyMesh) game.env.skyMesh.position.copy(game.camera.position);
    d.body.position.y = Math.sin(t * 2) * 0.02;
    game.fx.lightning(d.root.position, 0.55, 1.9, true, 0.5);
  };
}

function title() {
  touchUI(false);
  ui.hud(false); ui.letterbox(false);
  titleScene();
  audio.playTrack('title');
  const s = ui.show(`
    <div id="logo"><div class="t1 comic">PLUS ULTRA</div><div class="t2 comic">A ORIGEM DE DEKU</div><div class="t3">fan game inspirado em My Hero Academia</div></div>
    <div class="menu" id="m"></div>
    <div id="hint">Teclado • Controle • Toque — ENTER / J para confirmar</div>`, 'title');
  const items = [];
  if (save.unlocked > 1 && save.unlocked <= STAGES.length) items.push({ label: 'CONTINUAR', sub: `${STAGES[save.unlocked - 1].ep} — ${STAGES[save.unlocked - 1].name}`, action: () => story(save.unlocked - 1) });
  items.push({ label: 'NOVA HISTÓRIA', sub: 'Do garoto sem Individualidade ao maior herói', action: () => story(0) });
  items.push({ label: 'SELEÇÃO DE FASES', sub: `${Math.min(save.unlocked, STAGES.length)}/${STAGES.length} liberadas`, action: stageSelect });
  items.push({ label: 'COMO JOGAR', action: () => controls(title) });
  items.push({ label: 'OPÇÕES', action: options });
  ui.menu(s.querySelector('#m'), items);
}

function stageSelect() {
  const s = ui.show(`<div class="panel"><h2>SELEÇÃO DE FASES</h2><div class="menu" id="m"></div></div>`, 'select');
  ui.menu(s.querySelector('#m'), [
    ...STAGES.map((st, i) => ({ label: `${st.ep} — ${st.name}${save.best[st.id] ? ' [' + save.best[st.id] + ']' : ''}`, sub: st.arc, disabled: i >= save.unlocked, action: () => story(i, true) })),
    { label: 'VOLTAR', action: title },
  ], title);
}

function controls(back) {
  const s = ui.show(`<div class="panel"><h2>COMO JOGAR</h2><div class="keys">
    <b>WASD / Setas / Analógico</b><span>Mover (relativo à câmera)</span>
    <b>U / O • arrastar mouse • analógico dir.</b><span>Girar a câmera</span>
    <b>J / Z • (X no controle)</b><span>Combo de socos e chutes — no ar: chute (Shoot Style quando liberado)</span>
    <b>K / X (segurar) • (Y)</b><span>Carregar SMASH. Barra cheia + 1 segmento Plus Ultra = SMASH total</span>
    <b>L / Shift / C • (B)</b><span>Esquiva com invencibilidade. No momento exato: ESQUIVA PERFEITA (câmera lenta)</span>
    <b>Espaço • (A)</b><span>Pular — com Full Cowl, pulo duplo. Fase final: segure para flutuar</span>
    <b>Q • (LB)</b><span>Ligar/desligar FULL COWL (quando o Deku já domina)</span>
    <b>E / V • (RB)</b><span>Especial: Delaware Smash, Air Force, Blackwhip, Texas Smash…</span>
    <b>Esc / P • (Start)</b><span>Pausa</span>
  </div><p style="font-size:13px;color:var(--muted)">Círculos vermelhos no chão avisam golpes. Anéis que se espalham pelo chão: pule! Onigiris recuperam vida.<br>O Plus Ultra enche ao bater e ao apanhar. Chefes têm fases e golpes finais com QTE.</p>
  <div class="menu" id="m"></div></div>`, 'ctrl');
  ui.menu(s.querySelector('#m'), [{ label: 'VOLTAR', action: back }], back);
}

function options() {
  const o = save.opts;
  const s = ui.show(`<div class="panel"><h2>OPÇÕES</h2><div class="menu" id="m"></div></div>`, 'opts');
  const render = () => ui.menu(s.querySelector('#m'), [
    { label: `GRÁFICOS: ${o.quality === 'hd' ? 'ALTA RESOLUÇÃO' : 'PS2 (448 linhas)'}`, sub: 'Alterna entre nitidez máxima e o visual pixelado de época', action: () => { o.quality = o.quality === 'hd' ? 'ps2' : 'hd'; game.setQuality(o.quality); persist(); render(); } },
    { label: `VOLUME: ${Math.round(o.volume * 100)}%`, action: () => { o.volume = o.volume >= 1 ? 0 : Math.round((o.volume + 0.1) * 10) / 10; audio.setVolume(o.volume); persist(); render(); } },
    { label: `MÚSICA: ${o.music ? 'LIGADA' : 'DESLIGADA'}`, action: () => { o.music = audio.toggleMusic(); persist(); render(); } },
    { label: `DIFICULDADE: ${o.diff > 1 ? 'HERÓI PRO' : o.diff < 1 ? 'APRENDIZ' : 'NORMAL'}`, sub: 'Muda o dano que os vilões causam', action: () => { o.diff = o.diff === 1 ? 1.5 : o.diff > 1 ? 0.6 : 1; game.diff = o.diff; persist(); render(); } },
    { label: 'VOLTAR', action: title },
  ], title);
  render();
}

// ---------------------------------------------------- fluxo de fases
let current = -1, storyMode = false;

async function card(st) {
  const s = ui.show(`<div class="ep comic">${st.ep}</div><div class="stripe"></div><div class="name comic">${st.name}</div><div class="sub">${st.arc}<br><br>${st.sub}</div><div class="stripe"></div><div id="hint">pressione para começar</div>`, 'card');
  audio.sfx('clear');
  let t = 0;
  await new Promise(res => {
    const iv = setInterval(() => { t += 0.05; if (t > 0.6 && (input.anyPressed || t > 6)) { clearInterval(iv); res(); } }, 50);
    input.anyPressed = false;
    s.addEventListener('pointerdown', () => (t = 99));
  });
  ui.hideScreen();
}

async function story(i, single = false) {
  storyMode = !single;
  current = i;
  audio.init();
  await play(i);
}

async function play(i) {
  const st = STAGES[i];
  game.titleCam = null;
  game.running = false;
  game.abortAll();
  await new Promise(r => setTimeout(r, 30));
  game.aborted = false;
  ui.hideScreen();
  await card(st);
  game.runStats = { dealt: 0, taken: 0, maxCombo: 0 };
  game.running = true; game.paused = false;
  touchUI(true);
  game.onPause = pause;
  game.onGameOver = gameOver;
  const t0 = performance.now();
  try {
    await st.script(game);
  } catch (e) {
    if (e === ABORT) return;
    console.error(e);
    ui.toast('Erro na fase: ' + e.message, 'red');
    setTimeout(title, 1500);
    return;
  }
  results(st, (performance.now() - t0) / 1000);
}

function rank(st, time) {
  const r = game.runStats, p = game.player?.stats || { taken: 0, maxCombo: 0 };
  const taken = r.taken + p.taken, combo = Math.max(r.maxCombo, p.maxCombo);
  let pts = 100 - taken * 0.25 + Math.min(20, combo) - Math.max(0, game.stageTime - st.par) * 0.15;
  return { letter: pts >= 92 ? 'S' : pts >= 75 ? 'A' : pts >= 55 ? 'B' : 'C', taken: Math.round(taken), combo, time: game.stageTime };
}

function results(st, real) {
  game.running = false;
  touchUI(false);
  game.control = false;
  const R = rank(st, real);
  const order = { S: 4, A: 3, B: 2, C: 1 };
  if (!save.best[st.id] || order[R.letter] > order[save.best[st.id]]) save.best[st.id] = R.letter;
  save.unlocked = Math.max(save.unlocked, Math.min(STAGES.length, current + 2));
  if (current === STAGES.length - 1) save.unlocked = STAGES.length + 1;
  persist();
  audio.playTrack('hero');
  audio.sfx('clear');
  const m = Math.floor(R.time / 60), s = Math.floor(R.time % 60).toString().padStart(2, '0');
  const sc = ui.show(`<div class="panel" style="text-align:center"><h2>FASE CONCLUÍDA!</h2><div class="comic" style="font-size:22px">${st.name}</div>
    <div class="rank comic">${R.letter}</div>
    <table><tr><td>Tempo</td><td>${m}:${s}</td></tr><tr><td>Maior combo</td><td>${R.combo} hits</td></tr><tr><td>Dano recebido</td><td>${R.taken}</td></tr><tr><td>Vilões derrotados</td><td>${game.kills}</td></tr></table>
    <div class="menu" id="m"></div></div>`, 'results');
  const next = current + 1;
  const items = [];
  if (storyMode && next < STAGES.length) items.push({ label: 'PRÓXIMA FASE', sub: `${STAGES[next].ep} — ${STAGES[next].name}`, action: () => { current = next; play(next); } });
  if (storyMode && next >= STAGES.length) items.push({ label: 'EPÍLOGO', action: credits });
  items.push({ label: 'JOGAR DE NOVO', action: () => play(current) });
  items.push({ label: 'TÍTULO', action: () => { game.abortAll(); title(); } });
  ui.menu(sc.querySelector('#m'), items);
}

function pause() {
  game.paused = true;
  audio.sfx('blip');
  const s = ui.show(`<div class="panel"><h2>PAUSA</h2><div class="menu" id="m"></div></div>`, 'pause');
  const resume = () => { ui.hideScreen(); game.paused = false; input.prev = { ...input.now }; };
  ui.menu(s.querySelector('#m'), [
    { label: 'CONTINUAR', action: resume },
    { label: 'REINICIAR FASE', action: () => { game.paused = false; play(current); } },
    { label: 'COMO JOGAR', action: () => controls(pause) },
    { label: 'SAIR PARA O TÍTULO', action: () => { game.paused = false; game.abortAll(); title(); } },
  ], resume);
}

function gameOver() {
  game.running = false;
  touchUI(false);
  audio.playTrack('sad');
  const s = ui.show(`<div class="panel" style="text-align:center"><h2>VOCÊ CAIU...</h2><p>"Se você vai ser herói, tem que se levantar quantas vezes for preciso."</p><div class="menu" id="m"></div></div>`, 'over');
  ui.menu(s.querySelector('#m'), [
    { label: 'LEVANTAR E TENTAR DE NOVO', action: () => play(current) },
    { label: 'TÍTULO', action: () => { game.abortAll(); title(); } },
  ]);
}

function credits() {
  game.abortAll();
  titleScene();
  audio.playTrack('title');
  const s = ui.show(`<div class="panel" style="text-align:center;max-width:640px">
    <h2>EPÍLOGO</h2>
    <p>Oito anos depois. Izuku Midoriya ensina na U.A. — a mesma escola que um dia lhe disse "você pode".</p>
    <p>Sem Individualidade outra vez, ele observa os alunos do Classe 1-A com o caderno de anotações de sempre.</p>
    <p>Então chega uma caixa. Dentro, um traje de alta tecnologia, pago em segredo por todos os seus antigos colegas.</p>
    <p class="comic" style="font-size:26px;color:var(--gold)">"Deku. Você ainda é o nosso herói."</p>
    <p style="font-size:12px;color:var(--muted);margin-top:22px">PLUS ULTRA — A Origem de Deku<br>Fan game sem fins lucrativos, inspirado em My Hero Academia (Boku no Hero Academia), de Kohei Horikoshi.<br>Todos os modelos, cenários, músicas e efeitos sonoros foram gerados por código.</p>
    <div class="menu" id="m"></div></div>`, 'credits');
  ui.menu(s.querySelector('#m'), [{ label: 'TÍTULO', action: title }]);
}

// primeira interação libera o áudio
addEventListener('pointerdown', () => audio.init(), { once: true });
addEventListener('keydown', () => audio.init(), { once: true });

window.__stageStart = (i) => story(i, true); // atalho de depuração
title();
