import * as THREE from 'three';
import { Game, ABORT } from './game.js';
import { UI } from './ui.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { STAGES, NOTES } from './stages/index.js';
import { QUALITY } from './render.js';
import * as M from './models.js';

const V = THREE.Vector3;
const audio = new Audio();
const ui = new UI(audio);
const input = new Input();
window.__ui = ui;
const game = new Game({ canvas: document.getElementById('c'), ui, audio, input });
window.__game = game;

// ---------------------------------------------------- salvamento (opcional)
const SAVE_KEY = 'plusultra-save-v2';
const isTouch = matchMedia('(pointer: coarse)').matches;
const save = (() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; } })();
save.unlocked ??= 1; save.best ??= {}; save.stars ??= {}; save.notes ??= [];
save.opts ??= { quality: isTouch ? 'leve' : 'alto', volume: 0.7, music: true, diff: 1 };
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* sem armazenamento */ } };
game.setQuality(save.opts.quality); audio.setVolume(save.opts.volume); audio.musicOn = save.opts.music; game.diff = save.opts.diff;
game.onNotebook = (n) => { if (!save.notes.includes(n.id)) { save.notes.push(n.id); persist(); } };

if (isTouch) input.bindTouch(document.getElementById('touch'));
const touchUI = on => document.getElementById('touch').classList.toggle('hidden', !(on && isTouch));
const starsOf = id => (save.stars[id] || [false, false, false]);
const totalStars = () => STAGES.reduce((n, s) => n + starsOf(s.id).filter(Boolean).length, 0);

// ---------------------------------------------------- título com cena 3D
function titleScene() {
  game.running = false;
  game.clearStage();
  game.env.build('groundBeta');
  M.RIM.color.value.set(0x9ab8ff); M.RIM.strength.value = 0.9;
  const d = M.deku('hero'); d.root.position.set(0, 0, -6); d.root.rotation.y = Math.PI * 0.82; game.scene.add(d.root); game.env.objs.push(d.root);
  const am = M.allMight(); am.root.position.set(-2.6, 0, -8); am.root.rotation.y = Math.PI * 0.9; game.scene.add(am.root); game.env.objs.push(am.root);
  const kc = M.bakugo('hero'); kc.root.position.set(2.4, 0, -7.6); kc.root.rotation.y = Math.PI * 0.7; game.scene.add(kc.root); game.env.objs.push(kc.root);
  d.shR.rotation.set(-2.8, 0, -0.2); d.shL.rotation.set(0.3, 0, 0.4); d.elL.rotation.x = -1.2; d.hipL.rotation.x = -0.4; d.knL.rotation.x = 0.5;
  am.shR.rotation.set(-1.0, 0, -0.9); am.elR.rotation.x = -1.6; am.shL.rotation.set(-1.0, 0, 0.9); am.elL.rotation.x = -1.6;
  kc.shR.rotation.set(-1.4, 0, -0.6); kc.elR.rotation.x = -1.2; kc.shL.rotation.set(0.2, 0, 0.5);
  game.fx.setWeather('spark', game.scene);
  let t = 0;
  game.titleCam = (dt) => {
    t += dt;
    const a = Math.sin(t * 0.12) * 0.35 + 0.15;
    const wide = innerWidth > 700;
    game.camera.position.set(Math.sin(a) * 6.5 + (wide ? -2.6 : 0), 1.6 + Math.sin(t * 0.3) * 0.2, -6 + Math.cos(a) * 6.5);
    game.camera.lookAt(wide ? -2.4 : 0, 1.9, -6.8);
    game.env.update(dt, t);
    game.fx.update(dt, new V(0, 0, -6));
    if (game.env.skyMesh) game.env.skyMesh.position.copy(game.camera.position);
    d.body.position.y = Math.sin(t * 2) * 0.02;
    game.fx.lightning(d.root.position, 0.55, 1.9, true, 0.6);
  };
}

function title() {
  touchUI(false);
  ui.hud(false); ui.letterbox(false);
  titleScene();
  audio.playTrack('title');
  const s = ui.show(`
    <div id="logo"><div class="t0">UM FAN GAME DE MY HERO ACADEMIA</div><div class="t1">PLUS<br><em>ULTRA</em></div><div class="t2">A ORIGEM DE DEKU</div></div>
    <div class="menu" id="m"></div>
    <div id="hint">Teclado · Controle · Toque — Enter ou J para confirmar</div>`, 'title');
  const items = [];
  if (save.unlocked > 1 && save.unlocked <= STAGES.length) items.push({ label: 'CONTINUAR', sub: `${STAGES[save.unlocked - 1].ep} — ${STAGES[save.unlocked - 1].name}`, action: () => story(save.unlocked - 1) });
  items.push({ label: 'NOVA HISTÓRIA', sub: '15 capítulos: do garoto sem Individualidade ao maior herói', action: () => story(0) });
  items.push({ label: 'CAPÍTULOS', sub: `${Math.min(save.unlocked, STAGES.length)}/${STAGES.length} liberados · ★ ${totalStars()}/${STAGES.length * 3}`, action: chapters });
  items.push({ label: 'CADERNO DO DEKU', sub: `${save.notes.length}/${Object.keys(NOTES).length} páginas`, action: notebook });
  items.push({ label: 'COMO JOGAR', action: () => controls(title) });
  items.push({ label: 'OPÇÕES', action: options });
  ui.menu(s.querySelector('#m'), items);
}

function chapters() {
  const s = ui.show(`<div class="panel" style="max-width:min(1100px,96vw)"><h2>CAPÍTULOS <span>★ ${totalStars()}/${STAGES.length * 3}</span></h2><div id="chap"></div><div class="menu" id="m"></div></div>`, 'select');
  const grid = s.querySelector('#chap');
  const items = STAGES.map((st, i) => {
    const locked = i >= save.unlocked;
    const b = document.createElement('button');
    b.className = 'cc'; b.style.setProperty('--c', st.color);
    if (locked) b.setAttribute('disabled', '');
    const st3 = starsOf(st.id);
    b.innerHTML = `<span class="n">${st.ep}</span><span class="t">${locked ? '???' : st.name}</span><span class="a">${st.arc}</span>
      <span class="m">${st3.map(x => x ? '★' : '☆').join('')}${save.notes.includes(st.id) ? ' · 📓' : ''}</span>${save.best[st.id] ? `<span class="r">${save.best[st.id]}</span>` : ''}`;
    grid.appendChild(b);
    return { label: st.name, disabled: locked, action: () => story(i, true) };
  });
  ui.menu(grid, items, title, { grid: true });
  const back = s.querySelector('#m');
  const bb = document.createElement('button'); bb.textContent = 'VOLTAR'; bb.onclick = title; back.appendChild(bb);
}

function notebook() {
  const list = Object.values(NOTES).map(n => save.notes.includes(n.id)
    ? `<div class="nt"><small>Nº ${n.n} · ${STAGES.find(s => s.id === n.id)?.name || ''}</small><h4>${n.title}</h4><p>${n.text}</p></div>`
    : `<div class="nt lock"><small>PÁGINA PERDIDA</small><h4>???</h4><p>Escondida em: ${STAGES.find(s => s.id === n.id)?.name || '?'}</p></div>`).join('');
  const s = ui.show(`<div class="panel"><h2>CADERNO DO <span>DEKU</span></h2><p class="tip">"Análise de Heróis para o Futuro". As páginas estão escondidas pelas fases: procure o caderno brilhando.</p><div class="notes">${list}</div><br><div class="menu" id="m"></div></div>`, 'notes');
  ui.menu(s.querySelector('#m'), [{ label: 'VOLTAR', action: title }], title);
}

function controls(back) {
  const s = ui.show(`<div class="panel"><h2>COMO <span>JOGAR</span></h2><div class="keys">
    <b>WASD / setas / analógico</b><span>Mover (relativo à câmera)</span>
    <b>U / O · arrastar o mouse · analógico dir.</b><span>Girar a câmera</span>
    <b>J (X no controle)</b><span>Combo de 4 golpes. No ar: combo aéreo de 3 (o último crava o inimigo no chão)</span>
    <b>K tocar (Y)</b><span>LANÇADOR: joga o inimigo para cima. Aperte Pulo ou J logo depois para ir atrás dele</span>
    <b>K segurar (Y)</b><span>SMASH carregado. Barra cheia + 1 carga de Plus Ultra = golpe devastador. No ar: golpe descendente</span>
    <b>L / Shift (B)</b><span>Esquiva (também no ar). No momento exato: ESQUIVA PERFEITA. Aí aperte J para o CONTRA-ATAQUE</span>
    <b>Espaço (A)</b><span>Pulo. Com Full Cowl: pulo duplo. No final, segurar = flutuar</span>
    <b>Q (LB)</b><span>Liga o FULL COWL</span>
    <b>E (RB)</b><span>Especial: Delaware, Air Force, Blackwhip, Texas Smash</span>
    <b>Tab / R (R3)</b><span>Travar alvo</span>
    <b>Esc / P (Start)</b><span>Pausa</span>
  </div><p class="tip">Quase tudo pode ser cancelado: depois de acertar, esquive, pule ou use o especial na hora. Atacar logo após esquivar dá uma voadora.<br>
  O medidor de estilo (D → S) sobe com golpes variados e cai se você apanhar. Círculos e linhas vermelhas no chão avisam golpes; anéis que se espalham pedem pulo.<br>
  Civis com o marcador azul: fique perto até a barra encher. Inimigos com escudo só caem com lançador, SMASH, golpes aéreos ou pelas costas.</p>
  <div class="menu" id="m"></div></div>`, 'ctrl');
  ui.menu(s.querySelector('#m'), [{ label: 'VOLTAR', action: back }], back);
}

function options() {
  const o = save.opts;
  const qs = Object.keys(QUALITY);
  const s = ui.show(`<div class="panel"><h2>OPÇÕES</h2><div class="menu" id="m"></div></div>`, 'opts');
  const render = () => ui.menu(s.querySelector('#m'), [
    { label: `GRÁFICOS: ${QUALITY[o.quality].label}`, sub: 'Ultra e Alto têm brilho (bloom) e cor de cinema. Leve é para celular. Retrô PS2 imita a resolução de época.', action: () => { o.quality = qs[(qs.indexOf(o.quality) + 1) % qs.length]; game.setQuality(o.quality); persist(); render(); } },
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
  const ms = st.missions.map((m, i) => `<span>${starsOf(st.id)[i] ? '★' : '☆'} ${m.text}</span>`).join('');
  const s = ui.show(`<div class="ep">${st.ep}</div><div class="name">${st.name}</div><div class="arc">${st.arc}</div><div class="bar"></div><div class="sub">${st.sub}</div><div class="ms"><b>MISSÕES</b>${ms}</div><div id="hint">pressione para começar</div>`, 'card');
  audio.sfx('clear');
  let t = 0;
  await new Promise(res => {
    input.anyPressed = false;
    const iv = setInterval(() => { t += 0.05; if (t > 0.7 && (input.anyPressed || t > 8)) { clearInterval(iv); res(); } }, 50);
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
  game.failed = false;
  game.keepTime = false;
  game.flags = {};
  game.stageTime = 0;
  ui.hideScreen();
  await card(st);
  game.runStats = { dealt: 0, taken: 0, maxCombo: 0 };
  game.running = true; game.paused = false;
  touchUI(true);
  game.onPause = pause;
  game.onGameOver = gameOver;
  try {
    await st.script(game);
  } catch (e) {
    if (e === ABORT) return;
    console.error(e);
    ui.toast('Erro na fase: ' + e.message, 'red');
    setTimeout(title, 1500);
    return;
  }
  results(st);
}

function finalStats() {
  const r = { ...game.runStats }, p = game.player?.stats || {};
  for (const k in p) r[k] = k === 'maxCombo' ? Math.max(r[k] || 0, p[k]) : (r[k] || 0) + p[k];
  const best = [game.runStats.bestStyle || 'D', game.player?.bestStyle || 'D'].sort((a, b) => 'DCBAS'.indexOf(b) - 'DCBAS'.indexOf(a))[0];
  return { dealt: 0, taken: 0, maxCombo: 0, perfect: 0, smashes: 0, counters: 0, airHits: 0, paralyzed: 0, rescued: 0, notebooks: 0, mines: 0, ...r, bestStyle: best, time: game.stageTime, flags: game.flags };
}

function results(st) {
  game.running = false;
  touchUI(false);
  game.control = false;
  const S = finalStats();
  const got = st.missions.map(m => { try { return !!m.check(S); } catch { return false; } });
  const prev = starsOf(st.id);
  save.stars[st.id] = got.map((g, i) => g || prev[i]);
  let pts = 100 - S.taken * 0.2 + Math.min(20, S.maxCombo * 0.5) - Math.max(0, S.time - st.par) * 0.12 + got.filter(Boolean).length * 6 + 'DCBAS'.indexOf(S.bestStyle) * 3;
  const letter = pts >= 100 ? 'S' : pts >= 82 ? 'A' : pts >= 60 ? 'B' : 'C';
  const order = { S: 4, A: 3, B: 2, C: 1 };
  if (!save.best[st.id] || order[letter] > order[save.best[st.id]]) save.best[st.id] = letter;
  save.unlocked = Math.max(save.unlocked, Math.min(STAGES.length, current + 2));
  if (current === STAGES.length - 1) save.unlocked = STAGES.length + 1;
  persist();
  audio.playTrack('hero');
  audio.sfx('clear');
  const m = Math.floor(S.time / 60), s = Math.floor(S.time % 60).toString().padStart(2, '0');
  const sc = ui.show(`<div class="panel">
    <div class="rank" data-r="${letter}">${letter}</div>
    <div><h2>CAPÍTULO <span>CONCLUÍDO</span></h2><div class="disp" style="font-size:22px;color:var(--muted)">${st.name}</div></div>
    <div class="stats"><span>Tempo</span><span>${m}:${s}</span><span>Maior combo</span><span>${S.maxCombo}</span><span>Melhor estilo</span><span>${S.bestStyle}</span><span>Esquivas perfeitas</span><span>${S.perfect}</span><span>Resgates</span><span>${S.rescued}</span><span>Dano recebido</span><span>${Math.round(S.taken)}</span></div>
    <div class="missions">${st.missions.map((mi, i) => `<div class="mi ${got[i] ? 'ok' : ''}"><i>${got[i] ? '★' : '☆'}</i>${mi.text}</div>`).join('')}</div>
    <div class="menu" id="m"></div></div>`, 'results');
  const next = current + 1;
  const items = [];
  if (storyMode && next < STAGES.length) items.push({ label: 'PRÓXIMO CAPÍTULO', sub: `${STAGES[next].ep} — ${STAGES[next].name}`, action: () => { current = next; play(next); } });
  if (storyMode && next >= STAGES.length) items.push({ label: 'EPÍLOGO', action: credits });
  items.push({ label: 'JOGAR DE NOVO', action: () => play(current) });
  items.push({ label: 'TÍTULO', action: () => { game.abortAll(); title(); } });
  ui.menu(sc.querySelector('#m'), items);
}

function pause() {
  game.paused = true;
  audio.sfx('blip');
  const st = STAGES[current];
  const s = ui.show(`<div class="panel"><h2>PAUSA</h2><div class="missions">${st.missions.map((mi, i) => `<div class="mi ${starsOf(st.id)[i] ? 'ok' : ''}"><i>${starsOf(st.id)[i] ? '★' : '☆'}</i>${mi.text}</div>`).join('')}</div><div class="menu" id="m"></div></div>`, 'pause');
  const resume = () => { ui.hideScreen(); game.paused = false; input.prev = { ...input.now }; };
  ui.menu(s.querySelector('#m'), [
    { label: 'CONTINUAR', action: resume },
    { label: 'REINICIAR CAPÍTULO', action: () => { game.paused = false; play(current); } },
    { label: 'COMO JOGAR', action: () => controls(pause) },
    { label: 'SAIR PARA O TÍTULO', action: () => { game.paused = false; game.abortAll(); title(); } },
  ], resume);
}

function gameOver(reason) {
  game.running = false;
  touchUI(false);
  audio.playTrack('sad');
  const s = ui.show(`<div class="panel" style="text-align:center"><h2>VOCÊ <span>CAIU</span></h2><p class="tip">${reason || 'Seus ferimentos foram demais.'}</p><p>"Se você vai ser herói, tem que se levantar quantas vezes for preciso."</p><div class="menu" id="m" style="margin:0 auto"></div></div>`, 'over');
  ui.menu(s.querySelector('#m'), [
    { label: 'LEVANTAR E TENTAR DE NOVO', action: () => play(current) },
    { label: 'TÍTULO', action: () => { game.abortAll(); title(); } },
  ]);
}

function credits() {
  game.abortAll();
  titleScene();
  audio.playTrack('title');
  const s = ui.show(`<div class="panel" style="max-width:640px">
    <h2>EPÍLOGO</h2>
    <p>Oito anos depois. Izuku Midoriya ensina na U.A., a mesma escola que um dia lhe disse "você pode".</p>
    <p>Sem Individualidade outra vez, ele observa os alunos da Classe 1-A com o caderno de anotações de sempre. O 1.000º caderno.</p>
    <p>Então chega uma caixa. Dentro, um traje de alta tecnologia, pago em segredo por todos os seus antigos colegas. Um bilhete com a letra do Kacchan: "Tá esperando o quê?"</p>
    <p class="disp" style="font-size:26px;color:var(--ofa)">"Deku. Você ainda é o nosso herói."</p>
    <p class="tip">PLUS ULTRA — A Origem de Deku. Fan game sem fins lucrativos, inspirado em My Hero Academia, de Kohei Horikoshi. Modelos, cenários, música e efeitos gerados por código.</p>
    <div class="menu" id="m"></div></div>`, 'credits');
  ui.menu(s.querySelector('#m'), [{ label: 'TÍTULO', action: title }]);
}

addEventListener('pointerdown', () => audio.init(), { once: true });
addEventListener('keydown', () => audio.init(), { once: true });

window.__stageStart = (i) => story(i, true); // atalho de depuração
title();
