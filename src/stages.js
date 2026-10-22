// A jornada de Izuku Midoriya, fase a fase, seguindo os arcos do anime.
import * as THREE from 'three';
import { ABORT } from './game.js';
import * as M from './models.js';
import { POSES } from './anim.js';

const V = THREE.Vector3;
const C = {
  deku: '#2c8a52', am: '#2b56c8', kacchan: '#d8781a', ochaco: '#d86a9a', villain: '#8a2a3a', mic: '#c8a21a', tsuyu: '#3a7a4a',
  iida: '#5a6a8a', todo: '#a83a4a', stain: '#6a1a1a', kota: '#c8281e', mus: '#8a4a2a', kiri: '#c81e1e', afo: '#2a2a3a', over: '#2f4a3a', eri: '#a85a6a', shiga: '#5a6a7a', nana: '#4a7ab8', nar: '#444a58',
};

// ---------------------------------------------------- kits (o Deku cresce a cada arco)
const K = {
  quirkless: { model: 'deku', outfit: 'uniform', power: 0.55, canSmash: false, speed: 6.4, jump: 10, maxHp: 80 },
  training: { model: 'deku', outfit: 'training', power: 0.8, canSmash: true, smashName: 'SOCO COM TUDO!', speed: 6.6, jump: 10.5, charge: 0.7, gauge: 3 },
  exam: { model: 'deku', outfit: 'gym', power: 0.85, canSmash: false, speed: 7, jump: 11 },
  usj: { model: 'deku', outfit: 'hero', power: 1, recoil: 14, special: 'delaware', flickCost: 6, speed: 7.2, jump: 11.5, gauge: 1 },
  allMight: { model: 'allMight', power: 2.4, maxHp: 220, speed: 8.6, jump: 15, special: 'texas', charge: 0.55, gauge: 3, smashName: 'DETROIT SMASH!' },
  hosu: { model: 'deku', outfit: 'hero', power: 1.05, cowl: 5, speed: 7.4, jump: 12, gauge: 1 },
  forest: { model: 'deku', outfit: 'hero', power: 1.15, cowl: 8, speed: 7.4, jump: 12, gauge: 1, smashName: 'DETROIT SMASH!', recoil: 8 },
  kamino: { model: 'deku', outfit: 'hero', power: 1.2, cowl: 8, cowlAlways: true, speed: 8, jump: 12.5, maxHp: 100 },
  overhaul: { model: 'deku', outfit: 'hero', power: 1.35, cowl: 20, shootStyle: true, special: 'airforce', speed: 7.6, jump: 12.5, maxHp: 120, smashName: 'ST. LOUIS SMASH!' },
  final: { model: 'deku', outfit: 'final', power: 1.7, cowl: 45, shootStyle: true, special: 'blackwhip', float: true, speed: 8, jump: 13, maxHp: 150, gauge: 2, smashName: 'DETROIT SMASH!' },
};

// ---------------------------------------------------- chefes
const BOSS = {
  nomu: {
    name: 'NOMU', title: 'Anti-Símbolo da Paz — Absorção de Choque', model: () => M.nomu({ scale: 2.0 }), hp: 700, speed: 4.2, radius: 1.1,
    absorb: 0.5, superArmor: true, finisher: true, keep: 2.6,
    phases: [
      { at: 1, attacks: [{ kind: 'melee', range: 3, windup: 0.55, dmg: 20, cd: 1.2, kb: 10, combo: 2 }, { kind: 'leap', range: 14, min: 4, windup: 0.6, dmg: 22, cd: 3, radius: 3.5 }] },
      { at: 0.5, event: 'nomuHalf', attacks: [{ kind: 'melee', range: 3, windup: 0.45, dmg: 22, cd: 0.9, kb: 10, combo: 3 }, { kind: 'dash', range: 14, windup: 0.6, dmg: 22, cd: 2.5, speed: 24, dur: 0.5 }, { kind: 'leap', range: 16, min: 4, windup: 0.5, dmg: 22, cd: 2.5, radius: 4 }] },
    ],
  },
  stain: {
    name: 'STAIN', title: 'O Assassino de Heróis', model: () => M.stain(), hp: 480, speed: 6.2, radius: 0.5, finisher: true, superArmor: false, keep: 2,
    phases: [
      { at: 1, attacks: [{ kind: 'melee', range: 2.2, windup: 0.38, dmg: 9, cd: 1.0, slash: true, combo: 2 }, { kind: 'grab', range: 2, windup: 0.55, dmg: 5, cd: 4, paralyze: 2.4, say: 'Deixa eu provar seu sangue...' }, { kind: 'dash', range: 12, min: 3, windup: 0.5, dmg: 12, cd: 2.6, speed: 24, dur: 0.38 }] },
      { at: 0.55, event: 'todoroki', attacks: [{ kind: 'melee', range: 2.2, windup: 0.32, dmg: 10, cd: 0.8, slash: true, combo: 3 }, { kind: 'grab', range: 2, windup: 0.5, dmg: 5, cd: 3.5, paralyze: 2.6 }, { kind: 'projectile', range: 14, min: 3, windup: 0.5, dmg: 7, cd: 3, speed: 24, count: 3, spread: 0.18, color: 0xd8e0ff, size: 0.2, paralyze: 1.2, sfx: 'slash' }, { kind: 'dash', range: 14, min: 3, windup: 0.45, dmg: 13, cd: 2.2, speed: 26, dur: 0.38 }] },
    ],
  },
  muscular: {
    name: 'MUSCULAR', title: 'Esquadrão de Ação de Vanguarda', model: () => M.muscular(), hp: 600, speed: 4.6, radius: 1.0, armor: 0.85, superArmor: true, finisher: true, keep: 2.4,
    phases: [
      { at: 1, attacks: [{ kind: 'melee', range: 2.9, windup: 0.6, dmg: 16, cd: 1.3, kb: 10 }, { kind: 'dash', range: 14, min: 3, windup: 0.7, dmg: 18, cd: 3, speed: 19, dur: 0.6 }, { kind: 'projectile', range: 16, min: 5, windup: 0.8, dmg: 14, cd: 3.5, speed: 13, color: 0x8a7a6a, size: 0.8, arc: true }] },
      { at: 0.45, event: 'muscleUp', attacks: [{ kind: 'melee', range: 3.2, windup: 0.45, dmg: 18, cd: 1, kb: 11, combo: 2 }, { kind: 'leap', range: 16, min: 3, windup: 0.6, dmg: 20, cd: 2.6, radius: 4 }, { kind: 'slam', range: 4, windup: 0.8, dmg: 18, cd: 3, radius: 4.5 }, { kind: 'dash', range: 16, min: 3, windup: 0.55, dmg: 20, cd: 2.5, speed: 22, dur: 0.6 }] },
    ],
  },
  overhaul: {
    name: 'OVERHAUL', title: 'Jovem Líder da Shie Hassaikai', model: () => M.overhaul(), hp: 900, speed: 4.8, radius: 0.5, finisher: true, keep: 4,
    phases: [
      { at: 1, attacks: [{ kind: 'spikes', range: 18, windup: 0.9, dmg: 15, cd: 2.2, count: 4, radius: 1.7, color: 0x6a6a70, weight: 2 }, { kind: 'melee', range: 2, windup: 0.4, dmg: 14, cd: 1.5, say: 'Não me toque... imundo.' }, { kind: 'dash', range: 10, min: 3, windup: 0.5, dmg: 12, cd: 3, speed: 18, dur: 0.4 }] },
      { at: 0.6, event: 'eri', attacks: [{ kind: 'spikes', range: 22, windup: 0.75, dmg: 16, cd: 1.6, count: 6, radius: 1.8, color: 0x6a6a70, weight: 2 }, { kind: 'wave', range: 10, windup: 0.8, dmg: 16, cd: 4, speed: 12, radius: 18, color: 0x8a8a90, sfx: 'heavy' }, { kind: 'dash', range: 12, min: 3, windup: 0.45, dmg: 14, cd: 2.4, speed: 22, dur: 0.4 }] },
      { at: 0.3, event: 'chrono', attacks: [{ kind: 'spikes', range: 24, windup: 0.6, dmg: 18, cd: 1.2, count: 8, radius: 1.9, color: 0x7a2a2a, weight: 2 }, { kind: 'wave', range: 12, windup: 0.6, dmg: 18, cd: 3, speed: 14, radius: 20, color: 0x8a3a3a, sfx: 'heavy' }, { kind: 'leap', range: 16, min: 3, windup: 0.5, dmg: 18, cd: 3, radius: 3.5 }] },
    ],
  },
  shigaraki: {
    name: 'TOMURA SHIGARAKI', title: 'Rei Demônio — Decadência', model: () => M.shigaraki(true), hp: 1400, speed: 5.8, radius: 0.7, superArmor: true, armor: 0.5, finisher: true, keep: 3.5,
    phases: [
      { at: 1, attacks: [{ kind: 'wave', range: 30, windup: 0.9, dmg: 18, cd: 3.2, speed: 11, radius: 28, color: 0xb04050 }, { kind: 'melee', range: 2.6, windup: 0.4, dmg: 16, cd: 1.1, combo: 2, kb: 9 }, { kind: 'dash', range: 16, min: 3, windup: 0.5, dmg: 16, cd: 2.4, speed: 26, dur: 0.45 }] },
      { at: 0.66, event: 'afo', attacks: [{ kind: 'wave', range: 30, windup: 0.8, dmg: 18, cd: 2.8, speed: 12, radius: 30, color: 0xb04050 }, { kind: 'projectile', range: 22, min: 4, windup: 0.6, dmg: 12, cd: 2.4, speed: 22, count: 5, spread: 0.22, color: 0xff3a3a, size: 0.45 }, { kind: 'spikes', range: 22, windup: 0.8, dmg: 16, cd: 2.6, count: 5, radius: 1.6, color: 0x2a1a1a }, { kind: 'dash', range: 16, min: 3, windup: 0.45, dmg: 16, cd: 2.4, speed: 28, dur: 0.45 }] },
      { at: 0.33, event: 'vestiges', attacks: [{ kind: 'wave', range: 30, windup: 0.7, dmg: 20, cd: 2.2, speed: 14, radius: 32, color: 0xd03040 }, { kind: 'beam', range: 24, min: 4, windup: 0.9, dmg: 22, cd: 3.4, speed: 30, color: 0xff2020 }, { kind: 'summon', range: 40, windup: 0.8, cd: 9, type: 'nomuLow', count: 2, weight: 0.5 }, { kind: 'melee', range: 2.6, windup: 0.35, dmg: 18, cd: 1, combo: 3, kb: 10 }] },
    ],
  },
};

// ---------------------------------------------------- utilidades
const bg = (fn) => { fn().catch(e => { if (e !== ABORT) console.error(e); }); };
async function tween(g, dur, fn) {
  let t = 0;
  await g.until(() => { t += g._dt; fn(Math.min(1, t / dur)); return t >= dur; });
}
const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

async function dropRock(g, pos, r = 1.3, dmg = 12) {
  g.fx.telegraph(pos, r, 0.9);
  await g.wait(0.75);
  const m = new THREE.Group(); M.part(m, M.G.box(r * 1.2, r, r * 1.2), 0x6a6460, 0, 0, 0, 0.04);
  m.position.copy(pos).setY(14); g.scene.add(m);
  await tween(g, 0.18, k => m.position.y = 14 - 13.5 * k);
  g.fx.burst(pos.clone(), [0x8a8480, 0x5a5450], 12, 6, { size: 0.2 });
  g.audio.sfx('heavy'); g.shake(0.2);
  const p = g.player;
  if (Math.hypot(p.pos.x - pos.x, p.pos.z - pos.z) < r + 0.3) p.hurt(dmg, pos, 6);
  await g.wait(1.2);
  g.scene.remove(m);
}

// tiro de cena: câmera fixa olhando um ponto
const shot = (g, x, y, z, lx, ly, lz, snap) => g.shot(new V(x, y, z), new V(lx, ly, lz), snap);

// ---------------------------------------------------- FASES
export const STAGES = [
  // ============================================================ 0
  {
    id: 'prologo', ep: 'PRÓLOGO', name: 'Todos Nascem Iguais?', arc: 'Arco Entrando na U.A. — Ep. 1',
    sub: 'Tatooin. Um garoto sem Individualidade vê seu amigo de infância nas garras do Vilão de Lama.', par: 120,
    async script(g) {
      const p = g.setup('tatooin', { kit: K.quirkless, music: 'calm', yaw: 0 });
      g.ui.portrait('IZ');
      await g.cinema(true);
      shot(g, 0, 2.2, 9, 0, 1.6, 0, true);
      await g.say([
        { who: 'Izuku', color: C.deku, text: 'Nem todos os homens nascem iguais. Essa foi a primeira lição que a vida me ensinou... aos quatro anos.' },
        { who: 'Izuku', color: C.deku, text: 'Hoje, 80% das pessoas do mundo têm uma Individualidade. Um superpoder. Eu nasci sem nenhuma.' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Mesmo assim... eu quero ser um herói que salva todo mundo com um sorriso. Igual ao All Might!' },
      ]);
      g.audio.sfx('explode'); g.shake(0.6);
      g.audio.playTrack('tension');
      shot(g, 0, 6, -40, 0, 2, -62);
      await g.say([
        { who: 'Transeunte', color: C.nar, text: 'Um vilão de lama na rua comercial! Ele pegou um estudante!' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Aquele cheiro... aquelas explosões... É o Kacchan?!' },
      ]);
      await g.cinema(false); g.freeCam();
      // corrida pela rua em chamas com destroços caindo
      const ctl = { stop: false };
      bg(async () => {
        while (!ctl.stop) {
          await g.wait(0.75);
          if (!g.control) continue;
          const q = g.player.pos;
          bg(() => dropRock(g, new V(Math.max(-6, Math.min(6, q.x + (Math.random() - 0.5) * 6)), 0, q.z - 2 - Math.random() * 7), 1.3, 10));
        }
      });
      await g.reach(new V(0, 0, -49), 3, 'Atravesse a rua em chamas! (desvie dos destroços e do fogo)');
      ctl.stop = true;
      await g.cinema(true);
      shot(g, 5, 3, -46, 0, 2.5, -62);
      g.sludgeKacchan = g.npc('bakugo', new V(0, 1.8, -61), { pose: 'hurt', face: p.pos });
      g.sludgeKacchan.floating = true;
      await g.say([
        { who: 'Herói', color: C.nar, text: 'Não dá pra chegar perto! A Individualidade dele é explosiva, precisamos esperar alguém com o poder certo!' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Os profissionais estão só esperando... e os olhos do Kacchan... estão pedindo socorro.' },
        { who: 'Izuku', color: C.deku, cam: p, text: '(Quando eu percebi... minhas pernas já estavam correndo.)' },
      ]);
      await g.cinema(false); g.freeCam();
      await g.reach(new V(0, 0, -58), 2.2, 'CORRA ATÉ O VILÃO!');
      await g.cinema(true);
      shot(g, 4, 3, -54, 0, 2.5, -61);
      await g.say([
        { who: 'Vilão de Lama', color: C.villain, cam: p, text: 'Um moleque sem poder nenhum? Saia da frente!' },
        { who: 'Izuku', color: C.deku, text: 'Kacchan! Me dá a mão!' },
      ]);
      const ok = await g.qte('mash', { title: 'PUXE O KACCHAN!', label: 'J', gain: 0.055, drain: 0.2, time: 6, start: 0.2, onPress: () => g.fx.burst(new V(0, 2, -60), 0x3e8a2a, 4, 5, { size: 0.2 }) });
      await g.say([
        { who: 'Bakugo', color: C.kacchan, cam: g.sludgeKacchan, text: ok ? 'Deku?! Por que você...!' : 'Seu idiota! O que você pensa que tá fazendo?!' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Eu não sei! Eu só... você parecia estar pedindo ajuda!' },
        { who: 'Vilão de Lama', color: C.villain, text: 'Então morram os dois!' },
      ]);
      // All Might chega
      const am = g.npc('allMight', new V(0, 0, -50), { face: new V(0, 0, -62) });
      g.audio.playTrack('hero');
      shot(g, -4, 2.6, -46, 0, 3, -52);
      await g.say([
        { who: 'All Might', color: C.am, cam: am, text: 'Que vergonha... Que patético eu fui! Ensinei a este garoto o que é ser herói, e fiquei parado!' },
        { who: 'All Might', color: C.am, cam: am, text: 'Um profissional sempre arrisca a própria vida!' },
      ]);
      am.pose = 'smash';
      shot(g, 6, 2, -52, 0, 2.5, -60);
      g.ui.smashText('DETROIT SMASH!'); g.audio.sfx('smash'); g.shake(1); g.speedLines(0.8);
      for (let i = 1; i < 6; i++) g.fx.shockwave(new V(0, 2.5, -52 - i * 2), 0xffffff, 2 + i, 0.5 + i * 0.08, new V(0, 0, -1));
      g.fx.burst(new V(0, 3, -61), [0x3e8a2a, 0x5aa83a], 40, 18, { size: 0.35, life: 1 });
      if (g.env.sludgeObj) g.env.sludgeObj.visible = false;
      g.sludgeKacchan.floating = false;
      await g.wait(1.2);
      g.fx.setWeather('rain', g.scene);
      await g.say([
        { who: 'Transeunte', color: C.nar, text: 'Ele... mudou o clima com um soco! Está chovendo!' },
        { who: 'Izuku', color: C.deku, cam: p, text: '(Esse é... o herói número um.)' },
      ]);
      // o beco — "Você pode se tornar um herói"
      await g.ui.fade(true);
      am.pos.set(1.2, 0, -30); am.faceTo(new V(0, 0, -28)); am.pose = 'calm';
      p.pos.set(-0.6, 0, -28); p.faceTo(am.pos);
      g.fx.setWeather(null, g.scene);
      g.audio.playTrack('calm');
      await g.ui.fade(false);
      await g.say([
        { who: 'All Might', color: C.am, cam: am, text: 'Garoto. Os heróis profissionais dizem que "o corpo se move antes de pensar". Hoje o seu se moveu.' },
        { who: 'All Might', color: C.am, cam: am, text: 'Você foi o único ali, sem poder algum, que se jogou para salvar alguém.' },
        { who: 'All Might', color: C.am, cam: am, text: 'Jovem Midoriya... você pode se tornar um herói!' },
        { who: 'Izuku', color: C.deku, cam: p, text: '(Mãe... aquela vez você me abraçou e pediu desculpas. Mas o que eu queria ouvir... era isso.)' },
      ]);
    },
  },
  // ============================================================ 1
  {
    id: 'dagobah', ep: 'FASE 1', name: 'Praia Dagobah', arc: 'Arco Entrando na U.A. — Ep. 2',
    sub: 'Dez meses para transformar o corpo num receptáculo digno do One For All. Limpe a praia inteira!', par: 150,
    async script(g) {
      const p = g.setup('dagobah', { kit: K.training, music: 'calm', yaw: 0 });
      g.ui.portrait('IZ');
      const am = g.npc(() => M.allMight('skinny'), g.env.anchors.allMight, { face: p.pos });
      am.lookAt = p;
      await g.say([
        { who: 'All Might', color: C.am, cam: am, text: 'Minha Individualidade se chama One For All. Um poder passado de mão em mão, cristalizado por gerações.' },
        { who: 'All Might', color: C.am, cam: am, text: 'Mas seu corpo ainda não aguentaria. Antes de herdar, você vai limpar esta praia. Toda ela!' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Limpar o litoral... é isso que os heróis faziam antigamente, né? Servir a comunidade!' },
        { who: 'All Might', color: C.am, cam: am, text: 'Exatamente! Golpeie o lixo (J), solte golpes fortes segurando K, esquive com L. Mexa-se, jovem!' },
      ]);
      // lixo espalhado
      const piles = [];
      const spots = [[-18, 8], [-12, -6], [-6, 14], [-20, -14], [0, 2], [6, -12], [12, 10], [18, -4], [22, 14], [-2, -20], [14, -18], [-14, 18]];
      for (const [x, z] of spots) piles.push(g.spawn('trash', new V(x, 0, z)));
      const big = g.spawn('bigTrash', new V(0, 0, -14), { hp: 160, smashOnly: false });
      let left = piles.length + 1;
      g.killHook = () => { left--; g.ui.score(`LIXO: ${piles.length + 1 - left}/${piles.length + 1}`); };
      g.ui.score(`LIXO: 0/${piles.length + 1}`);
      g.ui.objective('Destrua todos os montes de lixo antes do prazo!');
      g.timerStart(170, () => { g.ui.toast('O tempo acabou!', 'red'); g.player.die(); });
      g.audio.playTrack('hero');
      // comentários do All Might durante o treino
      bg(async () => {
        const tips = ['Cada músculo é um passo, jovem!', 'Coma bem e durma! Faz parte do treino!', 'Você está acompanhando o Plano "Aim to be American Dream"!', 'Ainda falta muito!', 'Excelente! Siga em frente!'];
        let i = 0;
        while (left > 0) { await g.wait(14); if (left > 0) g.ui.bark('All Might', tips[i++ % tips.length]); }
      });
      await g.until(() => left <= 0);
      g.countdown = null; g.ui.timer(null);
      g.ui.score('');
      await g.cinema(true);
      g.audio.playTrack('title');
      await g.ui.fade(true);
      p.pos.set(0, 0, -12); p.faceTo(new V(0, 0, -30)); p.cinePose = 'cheer';
      am.pos.set(-3, 0, -4); am.faceTo(p.pos);
      shot(g, 6, 2, -4, 0, 2.2, -14, true);
      await g.ui.fade(false);
      await g.say([
        { who: '', text: 'Dez meses depois. O sol nasce sobre uma praia limpa como nunca.' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'AAAAAAHHHHH!!! Consegui... eu consegui!' },
        { who: 'All Might', color: C.am, cam: am, text: '(Ele foi além até do plano que fiz para ele... Plus Ultra, jovem.)' },
        { who: 'All Might', color: C.am, cam: am, do: () => { am.pose = 'calm'; p.cinePose = 'calm'; }, text: 'Lembre-se: há uma diferença entre receber algo por sorte e merecer algo por esforço.' },
        { who: 'All Might', color: C.am, cam: am, text: 'Isso é algo que você ganhou por mérito próprio. Agora... coma isto!' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Hã?! Um... fio de cabelo?!' },
      ]);
    },
  },
  // ============================================================ 2
  {
    id: 'exame', ep: 'FASE 2', name: 'O Exame de Admissão', arc: 'Arco Entrando na U.A. — Ep. 3–4',
    sub: 'Centro de Batalha B. Robôs valem pontos... mas o que torna alguém herói não está escrito na prova.', par: 140,
    async script(g) {
      const p = g.setup('exam', { kit: K.exam, music: 'tension', yaw: 0 });
      g.ui.portrait('IZ');
      const uraraka = g.npc('uraraka', new V(2.5, 0, 9), { face: p.pos });
      await g.say([
        { who: 'Present Mic', color: C.mic, text: 'E aí, ouvintes! Bem-vindos ao exame prático! Robôs de 1, 2 e 3 pontos. Destrua o máximo que puder!' },
        { who: 'Present Mic', color: C.mic, text: 'Ah, e tem o robô de 0 pontos. É só um obstáculo. Fujam dele! Prontos? COMEÇANDO!' },
        { who: 'Uraraka', color: C.ochaco, cam: uraraka, text: 'Ah, você é o garoto que tropeçou na entrada! Boa sorte, viu? Vamos passar juntos!' },
        { who: 'Izuku', color: C.deku, cam: p, text: '(O One For All ainda não responde direito... vou ter que usar o que treinei na praia!)' },
        { who: 'Present Mic', color: C.mic, text: 'O que tão esperando? Não existe contagem regressiva no mundo real! VAI, VAI, VAI!' },
      ]);
      uraraka.walkTo(new V(10, 0, -20), 7).then(() => g.removeNpc(uraraka));
      let pts = 0;
      g.killHook = (e) => { if (e.def.robot) { pts += e.def.score; g.ui.score(`PONTOS DE VILÃO: ${pts}`); } };
      g.ui.score('PONTOS DE VILÃO: 0');
      g.ui.objective('Destrua robôs e acumule pontos!');
      let timeUp = false;
      g.timerStart(70, () => (timeUp = true));
      bg(async () => {
        while (!timeUp) {
          if (g.alive().length < 6) {
            const r = Math.random(), type = r < 0.55 ? 'robot1' : r < 0.85 ? 'robot2' : 'robot3';
            g.spawn(type, g.ringPos(10 + Math.random() * 4));
          }
          await g.wait(1.4);
        }
      });
      await g.until(() => timeUp);
      // o robô de 0 pontos aparece
      g.control = false;
      g.audio.sfx('explode'); g.shake(1.2);
      const zp = M.zeroPointer(); zp.position.set(0, 0, -64); zp.rotation.y = 0;
      g.scene.add(zp);
      g.env.objs.push(zp);
      g.killHook = null;
      for (const e of g.alive()) e.kill();
      g.audio.playTrack('boss');
      const ur = g.npc('uraraka', g.env.anchors.uraraka, { pose: 'down' });
      await g.cinema(true);
      shot(g, 10, 4, -24, 0, 14, -64);
      await g.say([
        { who: 'Izuku', color: C.deku, text: 'O-o robô de zero pontos... é do tamanho de um prédio!' },
        { who: 'Uraraka', color: C.ochaco, cam: ur, shot: { dist: 3, h: 1 }, text: 'Ai... minha perna está presa nos escombros...!' },
        { who: 'Izuku', color: C.deku, cam: p, text: '(Todos estão fugindo. Eu tenho zero pontos. Se eu correr agora... eu reprovo.)' },
        { who: 'Izuku', color: C.deku, cam: p, text: '(...Mas e daí?)' },
      ]);
      await g.cinema(false); g.freeCam();
      // o gigante avança enquanto o Deku corre até a Uraraka
      let advance = true;
      bg(async () => {
        while (advance) {
          zp.position.z = Math.min(zp.position.z + g._dt * 2.2, -46);
          zp.userData.arms.forEach((a, i) => (a.rotation.x = Math.sin(g.time * 1.5 + i * 3) * 0.6));
          g.shake(0.08);
          await g.wait(0);
        }
      });
      bg(async () => { while (advance) { await g.wait(1.1); if (advance) bg(() => dropRock(g, g.player.pos.clone().add(new V((Math.random() - 0.5) * 5, 0, -3)), 1.4, 10)); } });
      await g.reach(g.env.anchors.uraraka.clone().add(new V(0, 0, 3)), 2.4, 'Corra até a Uraraka!');
      advance = false;
      await g.cinema(true);
      p.faceTo(zp.position);
      shot(g, -5, 1.2, -30, 0, 10, -50);
      await g.say([
        { who: 'All Might', color: C.am, text: '(Lembre-se, jovem: contraia o ânus e grite do fundo do coração!)' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'O One For All... toda a força nas pernas!' },
      ]);
      const ok1 = await g.qte('hold', { title: 'CONCENTRE O PODER NAS PERNAS!', label: 'K', speed: 1.1 });
      // super salto
      g.audio.sfx('smash'); g.fx.shockwave(p.pos.clone().setY(0.2), 0x9affb0, 5, 0.5); g.shake(0.6);
      p.cinePose = 'jump';
      const from = p.pos.clone(), to = new V(0, 15, -44);
      bg(async () => { for (let i = 0; i < 40; i++) { g.fx.particle(p.pos.clone(), 0x9affb0, { vel: new V(0, -3, 0), size: 0.15, life: 0.4, grav: 0, add: true }); await g.wait(0.02); } });
      await tween(g, 1.0, k => { const e = ease(k); p.pos.lerpVectors(from, to, e); p.pos.y = from.y + (to.y - from.y) * Math.sin(e * Math.PI / 2); g.shot(p.pos.clone().add(new V(5, -1.5, 8)), p.pos.clone().add(new V(0, 0, -2))); });
      p.cinePose = 'charge';
      g.slowmo(5, 0.15);
      shot(g, 6, 15, -38, 0, 14, -46);
      const ok2 = await g.qte('timing', { title: 'SMASH!', label: 'K', speed: 0.8, tries: 3 });
      g.timeScale = 1; g.slowT = 0;
      p.cinePose = 'smash';
      g.ui.smashText('SMASH!!!'); g.audio.sfx('smash'); g.audio.sfx('explode'); g.shake(1.4); g.speedLines(1);
      g.fx.flash(new V(0, 15, -47), 7, 0xffffff, 0.5);
      for (let i = 0; i < 5; i++) g.fx.shockwave(new V(0, 15, -46 - i), 0xffffff, 4 + i * 2, 0.6, new V(0, 0, -1));
      g.fx.burst(new V(0, 14, -48), [0xff8a2a, 0xffd23a, 0x4a5a6a], 60, 20, { size: 0.5, life: 1.4 });
      zp.userData.head.visible = false;
      await tween(g, 1.4, k => { zp.rotation.x = -ease(k) * 0.9; });
      g.audio.sfx('explode'); g.shake(1.0);
      // queda
      p.cinePose = 'hurt';
      await g.say([{ who: 'Izuku', color: C.deku, cam: p, text: '(Meu braço... minhas pernas... estão quebrados. Eu vou cair!)' }]);
      const fallFrom = p.pos.clone();
      await tween(g, 0.9, k => { p.pos.y = fallFrom.y * (1 - k * 0.92); g.shot(p.pos.clone().add(new V(4, 2, 6)), p.pos); });
      g.removeNpc(ur);
      const ur2 = g.npc('uraraka', p.pos.clone().add(new V(1.2, -p.pos.y, 1.2)), { face: p.pos, pose: 'jab' });
      g.audio.sfx('punch');
      g.ui.smashText('ZERO GRAVITY!', true);
      await g.say([
        { who: 'Uraraka', color: C.ochaco, cam: ur2, text: 'Te peguei! ...Desculpa o tapa! Liberar!' },
        { who: 'Present Mic', color: C.mic, text: 'TEMPO ESGOTADO!' },
      ]);
      await tween(g, 0.3, k => { p.pos.y = p.pos.y * (1 - k); });
      p.cinePose = 'down';
      await g.ui.fade(true);
      g.audio.playTrack('hero');
      await g.ui.fade(false);
      const am = g.npc('allMight', new V(0, 0, 0), { face: new V(0, 0, 1) });
      shot(g, 0, 2.8, 5, 0, 2.6, 0, true);
      await g.say([
        { who: 'All Might', color: C.am, cam: am, text: 'Eu sou aqui... na tela! Jovem Midoriya, você fez zero pontos de vilão.' },
        { who: 'All Might', color: C.am, cam: am, text: 'Mas o exame tinha outra nota: PONTOS DE RESGATE! E quem se arrisca para salvar alguém... ' },
        { who: 'All Might', color: C.am, cam: am, text: 'Sessenta pontos de resgate! Venha, jovem Midoriya. Esta é a sua Academia de Heróis!' },
        { who: 'Izuku', color: C.deku, text: ok1 && ok2 ? '(Eu passei... Eu vou para a U.A.!)' : '(Mesmo sem controle nenhum... eu consegui. Eu vou para a U.A.!)' },
      ]);
    },
  },
  // ============================================================ 3
  {
    id: 'usj', ep: 'FASE 3', name: 'Ataque à U.S.J.', arc: 'Arco U.S.J. — Ep. 9–13',
    sub: 'A Liga dos Vilões invade o Centro de Simulação. Zona de Naufrágio... e então o Símbolo da Paz.', par: 260,
    async script(g) {
      let p = g.setup('usjShip', { kit: K.usj, music: 'tension', yaw: 0 });
      g.ui.portrait('DK');
      const tsu = g.npc('tsuyu', g.env.anchors.tsuyu, { face: p.pos });
      const mineta = g.npc(() => M.humanoid({ colors: { skin: 0xf0c49a, top: 0x5a3a8a, bottom: 0x5a3a8a, sleeve: 0x5a3a8a, forearm: 0x5a3a8a, shoe: 0xe8d23a }, scale: 0.6, head: 1.3, extra(r) { for (let i = 0; i < 6; i++) M.part(r.head, M.G.sph(0.09, 8), 0x6a2a8a, Math.cos(i) * 0.15, 0.2 + (i % 2) * 0.05, Math.sin(i) * 0.15 - 0.05, 0.015); } }), g.env.anchors.mineta, { face: p.pos });
      await g.say([
        { who: 'Tsuyu', color: C.tsuyu, cam: tsu, text: 'Kero. Fomos jogados no navio da Zona de Naufrágio. Os vilões estão cercando a água.' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Eles sabiam dos nossos poderes? Não... eles nos jogaram aqui sem saber que a Tsuyu é anfíbia!' },
        { who: 'Mineta', color: '#6a3a8a', cam: mineta, text: 'A gente vai morrer! Eu nem tive minha primeira namorada!' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Calma! Eu ainda não controlo o One For All... mas um DELAWARE SMASH com o dedo pode afastá-los! (E)' },
        { who: 'Izuku', color: C.deku, text: 'Cada disparo quebra um dedo (custa vida). O Smash total (segure K) quebra o braço. Vou ter que lutar com a cabeça!' },
      ]);
      const edge = () => { const s = Math.random() < 0.5 ? -1 : 1; return new V(s * 6.2, 0, (Math.random() - 0.5) * 24); };
      await g.wave([
        [{ type: 'water', pos: edge() }, { type: 'water', pos: edge() }, { type: 'water', pos: edge() }],
        [{ type: 'water', pos: edge() }, { type: 'water', pos: edge() }, { type: 'thug', pos: edge() }, { type: 'water', pos: edge() }],
        [{ type: 'brute', pos: new V(0, 0, -12), over: { model: () => M.waterThug(), scale: 1.4 } }, { type: 'water', pos: edge() }, { type: 'water', pos: edge() }],
      ], { objective: 'Defenda o convés dos vilões aquáticos!' });
      await g.say([
        { who: 'Izuku', color: C.deku, cam: p, text: 'Lá embaixo tem dezenas deles! Tsu, quando eu acertar a água, pegue o Mineta e pule!' },
        { who: 'Tsuyu', color: C.tsuyu, cam: tsu, text: 'Kero. Pode deixar.' },
      ]);
      g.shot(new V(0, 9, 18), new V(0, 0, -6));
      const ok = await g.qte('timing', { title: 'DELAWARE SMASH NA ÁGUA!', label: 'K', speed: 0.9, tries: 3 });
      g.ui.smashText('DELAWARE SMASH!'); g.audio.sfx('smash'); g.audio.sfx('water'); g.shake(0.9);
      for (let i = 0; i < 6; i++) g.fx.shockwave(new V(0, 0.2, -4), 0xa8e0ff, 4 + i * 3, 0.8 + i * 0.1);
      g.fx.burst(new V(0, 0.5, -4), [0xa8e0ff, 0xffffff, 0x3a8ac8], 70, 18, { size: 0.3, life: 1.3 });
      p.hp = Math.max(20, p.hp - (ok ? 6 : 14)); g.ui.hp(p.hp / p.kit.maxHp, true);
      await g.say([
        { who: 'Tsuyu', color: C.tsuyu, cam: tsu, text: 'O redemoinho prendeu todos eles! Midoriya-chan, você é incrível. Mas seu dedo está roxo, kero.' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Não importa! Temos que avisar o Aizawa-sensei na Praça Central!' },
      ]);
      // ---- Praça Central: All Might vs Nomu
      await g.ui.fade(true);
      const hpLeft = p.hp;
      p = g.setup('usjPlaza', { kit: K.allMight, music: 'boss', yaw: 0, camDist: 11, camH: 5 });
      g.ui.portrait('AM', 'radial-gradient(circle at 40% 35%,#4a7af0,#1a2a6a)');
      const shiga = g.npc('shigaraki', g.env.anchors.shigaraki, { face: p.pos });
      const dk = g.npc('deku', new V(9, 0, 21), { face: new V(0, 0, -10), args: ['hero'] });
      shot(g, 0, 3.5, 20, 0, 3, 10, true);
      await g.ui.fade(false);
      await g.say([
        { who: 'Shigaraki', color: C.shiga, cam: shiga, text: 'Game over... para o Eraserhead. E o chefão final ainda nem apareceu.' },
        { who: '', text: 'BLAM! As portas da U.S.J. voam pelos ares.' },
        { who: 'All Might', color: C.am, cam: p, shot: { dist: 4, h: 0.6 }, text: 'Está tudo bem agora. Por quê?' },
        { who: 'All Might', color: C.am, cam: p, shot: { dist: 4, h: 0.6 }, text: 'PORQUE EU ESTOU AQUI!' },
        { who: 'Shigaraki', color: C.shiga, cam: shiga, text: 'Até que enfim, o continue... Nomu. Mate o Símbolo da Paz.' },
        { who: 'All Might', color: C.am, cam: p, text: '(Absorção de Choque... golpes comuns não bastam. Preciso de SMASHES! Segure K com a barra Plus Ultra cheia!)' },
      ]);
      g.audio.playTrack('boss');
      g.bossEvent = async (b, ev) => {
        if (ev === 'nomuHalf') { g.ui.bark('Shigaraki', 'Ele aguenta 100% dos seus golpes, All Might!'); p.addGauge(1.5); g.ui.toast('PLUS ULTRA recarregado!', 'gold'); }
      };
      const nomu = await g.boss(BOSS.nomu, new V(0, 0, -6));
      // finalização: 300 Smashes
      await g.cinema(true);
      shot(g, 7, 3, 4, 0, 3, -3);
      await g.say([
        { who: 'All Might', color: C.am, cam: p, text: 'Se ele absorve 100%... então eu vou com MAIS de 100%!' },
        { who: 'All Might', color: C.am, cam: p, text: 'Um herói sempre vai além dos limites! Você conhece estas palavras, vilão?!' },
      ]);
      const ok2 = await g.qte('mash', { title: 'PLUS ULTRA!!! (soco sem parar)', label: 'J/K', key: 'attack', alt: 'smash', gain: 0.035, drain: 0.12, time: 8, start: 0.2,
        onPress: () => { const f = new V(0, 0, -1); g.fx.hitSpark(nomu.center.clone().add(new V((Math.random() - 0.5) * 2, Math.random() * 2, 1)), true); p.cinePose = Math.random() < 0.5 ? 'smash' : 'jab'; nomu.pos.z -= 0.05; } });
      g.ui.smashText('PLUS ULTRA SMASH!'); g.audio.sfx('smash'); g.shake(1.5); g.speedLines(1.2);
      g.fx.flash(nomu.center.clone(), 6, 0xffffff, 0.4);
      const nf = nomu.pos.clone();
      shot(g, 10, 4, 6, 0, 30, -40);
      nomu.def.passive = true;
      await tween(g, 1.4, k => { nomu.pos.set(nf.x, nf.y + k * 70, nf.z - k * 50); nomu.vel.set(0, 0, 0); });
      g.fx.burst(new V(0, 60, -50), [0xffffff, 0xa8d0f0], 40, 20, { size: 0.5, life: 1.5 });
      nomu.remove();
      g.ui.bossHide();
      await g.say([
        { who: 'All Might', color: C.am, cam: p, text: '(Hgh... passei do meu limite de hoje. Mas não posso deixar que percebam.)' },
        { who: 'Shigaraki', color: C.shiga, cam: shiga, text: 'Ele está mentindo... está fraco. Vamos acabar com ele agora!' },
        { who: 'Izuku', color: C.deku, cam: dk, text: hpLeft < 40 ? 'Não toquem... NO ALL MIGHT!' : 'Afastem-se do All Might!', do: () => { dk.pose = 'smash'; } },
        { who: 'All Might', color: C.am, cam: p, text: '(Jovem Midoriya... você pulou sem pensar de novo. Os reforços da U.A. chegaram graças a você e ao jovem Iida.)' },
      ]);
    },
  },
  // ============================================================ 4
  {
    id: 'hosu', ep: 'FASE 4', name: 'Hosu — O Assassino de Heróis', arc: 'Arco Assassino de Heróis — Ep. 26–33',
    sub: 'Durante o estágio com Gran Torino, Hosu queima. Iida foi atrás de vingança — e encontrou Stain.', par: 230,
    async script(g) {
      let p = g.setup('hosuStreet', { kit: K.hosu, music: 'night', weather: 'ember', yaw: 0 });
      g.ui.portrait('DK');
      await g.say([
        { who: 'Izuku', color: C.deku, cam: p, text: 'Gran Torino me ensinou: não é para "usar" o One For All como algo especial. É deixar ele correr pelo corpo inteiro.' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Como um ovo no micro-ondas... sem explodir. FULL COWL — 5%! (Q para ativar)' },
        { who: 'Civil', color: C.nar, text: 'Monstros voadores! Eles tão atacando todo mundo!' },
      ]);
      g.ui.toast('Aperte Q para ativar o FULL COWL', 'green');
      await g.wave([
        [{ type: 'nomuFly' }, { type: 'thug' }, { type: 'thug' }],
        [{ type: 'nomuFly' }, { type: 'nomuLow' }, { type: 'thug' }],
      ], { objective: 'Proteja os civis dos Nomus!' });
      await g.say([
        { who: 'Izuku', color: C.deku, cam: p, text: 'O Iida sumiu do grupo do Manual... Será que ele foi atrás do Stain?! Aquele beco!' },
      ]);
      await g.reach(new V(0, 0, -40), 2.5, 'Encontre o Iida no beco!');
      // ---- beco
      await g.ui.fade(true);
      p = g.setup('hosuAlley', { kit: K.hosu, music: 'boss', yaw: 0, camDist: 7.5, camH: 3.4 });
      p.setCowl(true);
      const iida = g.npc('iida', g.env.anchors.iida, { pose: 'down' });
      shot(g, 2, 2.2, -10, 0, 1.4, -18, true);
      await g.ui.fade(false);
      const stain = g.npc('stain', new V(0, 0, -19), { face: p.pos });
      await g.say([
        { who: 'Stain', color: C.stain, cam: stain, text: 'Um herói que só pensa em vingança é um herói falso. Por isso, eu o expurgo.' },
        { who: 'Iida', color: C.iida, cam: iida, shot: { dist: 2.5, h: 1 }, text: 'Midoriya?! Vá embora! Isso não tem nada a ver com você!' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Um herói se mete onde não é chamado! É isso que faz um herói!' },
        { who: 'Stain', color: C.stain, cam: stain, text: '...Esses olhos. Muito bem. Mostre-me se você é digno.' },
        { who: 'Izuku', color: C.deku, text: '(Se ele lamber meu sangue, eu fico paralisado. Não posso deixar a lâmina me acertar! Esquive com L!)' },
      ]);
      g.removeNpc(stain);
      let todo = null;
      g.bossEvent = (b, ev) => bg(async () => {
        if (ev === 'todoroki') {
          await g.cinema(true);
          todo = g.npc('todoroki', new V(-1.5, 0, 2), { face: b.pos });
          await g.say([
            { who: 'Todoroki', color: C.todo, cam: todo, text: 'Midoriya. Você mandou sua localização sem dizer nada. Achei que era um pedido de ajuda.' },
            { who: 'Todoroki', color: C.todo, cam: todo, text: 'Vou cobrir com gelo e fogo. Não deixe ele chegar perto de você.' },
          ]);
          await g.cinema(false); g.freeCam();
          // apoio do Todoroki: gelo periódico no Stain
          bg(async () => {
            while (b.alive && !b.invuln) {
              await g.wait(5.5);
              if (!b.alive || b.invuln || !g.control) continue;
              const at = b.pos.clone();
              g.fx.telegraph(at, 1.8, 0.7, 0x7ad0ff);
              await g.wait(0.7);
              g.spikes(at, 1.6, 0xb8e8ff); g.audio.sfx('ice');
              if (b.pos.distanceTo(at) < 2.2) b.damage(25, new V(0, 0, -1), 6, { smash: true, stun: 0.8 });
              todo.pose = 'jab';
              await g.wait(0.4); todo.pose = 'calm';
            }
          });
        }
      });
      const boss = await g.boss(BOSS.stain, g.env.anchors.boss);
      await g.cinema(true);
      iida.pose = 'calm';
      iida.pos.set(2, 0, -11);
      if (!todo) todo = g.npc('todoroki', new V(-1.5, 0, -8), { face: boss.pos });
      shot(g, 4, 2.2, -8, 0, 1.8, -15);
      await g.say([
        { who: 'Iida', color: C.iida, cam: iida, text: 'A paralisia passou! Midoriya, Todoroki... desculpem. Desta vez eu luto como herói, não como vingador!' },
        { who: 'Iida', color: C.iida, cam: iida, text: 'RECIPRO BURST!' },
      ]);
      const ok = await g.qte('timing', { title: 'ATAQUE COMBINADO!', label: 'K', speed: 1.1, tries: 3 });
      g.ui.smashText('SMASH + RECIPRO!'); g.audio.sfx('smash'); g.shake(1); g.speedLines(0.6);
      g.fx.burst(boss.center.clone(), [0xffffff, 0x7dff9a, 0xff8a3a], 40, 14, { size: 0.3 });
      g.spikes(boss.pos.clone(), 2, 0xb8e8ff); g.audio.sfx('fire');
      boss.go('down'); boss.def.passive = true; boss.invuln = true;
      g.ui.bossHide();
      await g.wait(1);
      boss.go('chase');
      boss.def = { ...boss.def, passive: true };
      shot(g, 0, 1.6, -11, 0, 1.6, -16);
      await g.say([
        { who: '', text: 'Mesmo inconsciente... Stain se levanta. Seus olhos fazem até os heróis profissionais congelarem.' },
        { who: 'Stain', color: C.stain, cam: boss, text: 'Falso... Retome o título de herói! Só há UM que pode me matar...' },
        { who: 'Stain', color: C.stain, cam: boss, text: 'ALL MIGHT! Só ele merece ser chamado de herói!' },
        { who: 'Izuku', color: C.deku, cam: p, text: '(Ele desmaiou... de pé. A vontade dele era tão forte quanto a de um herói. Isso é o que mais me assusta.)' },
      ]);
    },
  },
  // ============================================================ 5
  {
    id: 'floresta', ep: 'FASE 5', name: 'Acampamento na Floresta', arc: 'Arco Acampamento de Treinamento — Ep. 39–45',
    sub: 'A Liga ataca o acampamento. Fogo azul, gás venenoso — e o pequeno Kota sozinho no esconderijo.', par: 260,
    async script(g) {
      let p = g.setup('forest', { kit: K.forest, music: 'night', weather: 'ember', yaw: 0 });
      g.ui.portrait('DK');
      await g.say([
        { who: 'Mandalay (telepatia)', color: '#4a7a3a', text: 'Atenção, todos! Vilões invadiram o acampamento! Voltem para o centro! Não lutem!' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'O Kota... ele não estava no acampamento. Ele sempre vai para aquele penhasco escondido!' },
        { who: 'Izuku', color: C.deku, text: '(Chamas azuis e gás roxo por toda parte. Preciso atravessar a floresta sem respirar isso!)' },
      ]);
      await g.wave([
        [{ type: 'thug' }, { type: 'thug' }, { type: 'thug' }],
        [{ type: 'nomuLow' }, { type: 'thug' }],
      ], { objective: 'Abra caminho pela floresta!' });
      await g.reach(new V(0, 0, -45), 2.5, 'Chegue ao penhasco do Kota!');
      // ---- penhasco
      await g.ui.fade(true);
      p = g.setup('forestCliff', { kit: K.forest, music: 'boss', yaw: 0, camDist: 9.5, camH: 4.5 });
      const kota = g.npc('kota', g.env.anchors.kota, { face: new V(0, 0, -8) });
      const mus = g.npc('muscular', new V(0, 0, -10), { face: kota.pos });
      shot(g, 6, 2.5, -6, -2, 1.5, -12, true);
      await g.ui.fade(false);
      await g.say([
        { who: 'Muscular', color: C.mus, cam: mus, text: 'Você é o filho dos Water Hose, né? Fui eu quem deu aquele jeitinho no rosto deles. Hehe!' },
        { who: 'Kota', color: C.kota, cam: kota, shot: { dist: 2, h: 0.3 }, text: 'Você... você matou o papai e a mamãe!' },
        { who: 'Izuku', color: C.deku, do: () => { p.pos.set(-2, 0, -12.5); p.faceTo(mus.pos); }, cam: p, text: 'Kota! Está tudo bem! Eu vou te proteger!' },
        { who: 'Muscular', color: C.mus, cam: mus, text: 'Quem é você? Ah... um dos alvos! O garoto do cabelo verde. Que sorte a minha!' },
        { who: 'Muscular', color: C.mus, cam: mus, do: () => { mus.pose = 'cheer'; }, text: 'Minha Individualidade é Aumento Muscular! Pele de fibra, força BRUTA! Seus socos não vão me arranhar!' },
        { who: 'Izuku', color: C.deku, cam: p, text: '(Golpes comuns quase não atravessam os músculos dele. Só os SMASHES carregados! Vamos, Full Cowl!)' },
      ]);
      g.removeNpc(mus);
      p.setCowl(true);
      kota.pose = 'sit';
      g.bossEvent = (b, ev) => {
        if (ev === 'muscleUp') { g.ui.bark('Muscular', 'Agora eu vou a SÉRIO! Tudo, tudo, TUDO!'); b.def.speed = 6; b.root.scale.multiplyScalar(1.15); p.addGauge(1); }
      };
      const boss = await g.boss(BOSS.muscular, g.env.anchors.boss);
      await g.cinema(true);
      shot(g, 4, 2.2, -2, -1, 2, -9);
      await g.say([
        { who: 'Muscular', color: C.mus, cam: boss, text: 'Hahaha! Você quebrou o braço e ainda tá de pé?! Isso é DIVERTIDO!' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Eu não vou deixar você tocar no Kota! Mesmo que meus braços se despedacem...' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'UM MILHÃO POR CENTO...' },
      ]);
      const ok = await g.qte('mash', {
        title: '1.000.000% DELAWARE DETROIT SMASH!', label: 'J/K', key: 'attack', alt: 'smash', gain: 0.045, drain: 0.28, time: 9, start: 0.45,
        onTick: (v) => { boss.pos.z = -4 - v * 6; p.pos.z = -2 - v * 6; },
        onPress: () => g.fx.burst(p.center.clone().add(new V(0, 0, -1)), [0x7dff9a, 0xff4040], 3, 8, { add: true, size: 0.12, grav: 0 }),
      });
      g.ui.smashText('DELAWARE DETROIT SMASH!!'); g.audio.sfx('smash'); g.audio.sfx('explode'); g.shake(1.6); g.speedLines(1);
      g.fx.flash(boss.center.clone(), 6, 0xffffff, 0.4);
      for (let i = 0; i < 5; i++) g.fx.shockwave(boss.center.clone().add(new V(0, 0, -i)), 0xffffff, 3 + i * 2, 0.6, new V(0, 0, -1));
      const bf = boss.pos.clone();
      await tween(g, 0.7, k => boss.pos.set(bf.x, bf.y + Math.sin(k * Math.PI) * 3, bf.z - k * 8));
      boss.go('down'); boss.def = { ...boss.def, passive: true };
      g.ui.bossHide();
      kota.pose = 'calm';
      p.cinePose = 'hurt';
      await g.say([
        { who: 'Kota', color: C.kota, cam: kota, text: 'Por quê...? Por que você foi tão longe por mim? A gente nem se conhece!' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Seus pais... também teriam feito isso. Salvar alguém, mesmo sem conhecer. Isso é ser herói, Kota.' },
        { who: 'Kota', color: C.kota, cam: kota, text: '(Ele é igualzinho ao papai e à mamãe...) Obrigado... OBRIGADO!' },
        { who: 'Izuku', color: C.deku, text: '...Agora o Kacchan. Eles disseram que o alvo era o Kacchan!' },
      ]);
    },
  },
  // ============================================================ 6
  {
    id: 'kamino', ep: 'FASE 6', name: 'Kamino — O Fim de uma Era', arc: 'Arco Ataque ao Esconderijo — Ep. 46–49',
    sub: 'All Might enfrenta All For One. O plano de Kirishima: pular, agarrar o Kacchan e fugir. Sem lutar.', par: 120,
    async script(g) {
      const p = g.setup('kamino', { kit: K.kamino, music: 'final', weather: 'ash', yaw: 0, camDist: 7 });
      g.ui.portrait('DK');
      p.setCowl(true);
      await g.say([
        { who: 'Kirishima', color: C.kiri, text: 'O plano é simples: o Iida corre, o Midoriya pula, eu endureço e o Bakugo agarra a minha mão!' },
        { who: 'Iida', color: C.iida, text: 'Não vamos lutar. Só vamos tirar o Bakugo de lá e correr. Se ele vir a nossa mão... ele vai pegar.' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Kamino está destruída... All For One... ele apagou um bairro inteiro com um golpe. Vamos!' },
        { who: 'Izuku', color: C.deku, text: '(Mova para os lados, PULE os destroços baixos, SOQUE (J) os Nomus que bloquearem o caminho!)' },
      ]);
      await g.autorun({ length: 360, speed: 17, objective: 'Atravesse Kamino!' });
      // agarrar o Kacchan
      await g.cinema(true);
      const kc = g.npc('bakugo', p.pos.clone().add(new V(1.5, 0, -10)), { face: p.pos, args: ['hero'] });
      shot(g, p.pos.x + 6, 3, p.pos.z - 3, p.pos.x, 3, p.pos.z - 8);
      await g.say([
        { who: 'Izuku', color: C.deku, cam: p, text: 'Agora! Iida, Kirishima — PULEM!' },
        { who: 'Kirishima', color: C.kiri, text: 'BAKUGO! VEM!!!' },
      ]);
      p.cinePose = 'jump';
      const from = p.pos.clone();
      await tween(g, 0.8, k => { p.pos.set(from.x, Math.sin(k * Math.PI / 2) * 12, from.z - k * 8); g.shot(p.pos.clone().add(new V(5, -1, 6)), p.pos); });
      const ok = await g.qte('timing', { title: 'ESTENDA A MÃO PARA O KACCHAN!', label: 'K', speed: 1.0, tries: 3 });
      kc.pos.copy(p.pos).add(new V(0.8, -0.5, 0.3)); kc.floating = true; kc.pose = 'cheer';
      g.audio.sfx('explode'); g.fx.burst(kc.pos.clone(), [0xffa020, 0xffe060], 20, 10, { size: 0.2 });
      await g.say([
        { who: 'Bakugo', color: C.kacchan, cam: kc, text: ok ? '...Idiotas. Não fiquem achando que eu tô agradecendo!' : 'Tch! Peguei a mão do cabelo de porco-espinho. Agora VOA, seus idiotas!' },
      ]);
      kc.floating = false;
      // a batalha final do Símbolo da Paz
      await g.ui.fade(true);
      g.removeNpc(kc);
      p.pos.set(0, 0, -150); p.vel.set(0, 0, 0); p.cinePose = 'calm';
      p.root.visible = false;
      const am = g.npc('allMight', new V(0, 0, -400), { face: new V(0, 0, -410) });
      const afo = g.npc('allForOne', new V(0, 0, -410), { face: am.pos });
      g.player.pos.set(0, 0, -395);
      shot(g, 8, 3, -398, 0, 3, -405, true);
      g.audio.playTrack('sad');
      await g.ui.fade(false);
      await g.say([
        { who: 'All For One', color: C.afo, cam: afo, text: 'Lembra-se de Nana Shimura, All Might? Sua mestra. O neto dela... é Tomura Shigaraki.' },
        { who: 'All Might', color: C.am, cam: am, text: '(...Não. Não posso desmoronar. Há pessoas olhando. Ainda há pessoas olhando!)' },
        { who: 'Civil', color: C.nar, text: 'Vença... VENÇA, ALL MIGHT!!!' },
        { who: 'Izuku (pela TV)', color: C.deku, text: '(Vença...!)' },
        { who: 'All Might', color: C.am, cam: am, text: 'Mesmo que esta seja minha última chama... é a chama que ilumina o caminho para quem vem depois!' },
      ]);
      g.audio.playTrack('final');
      g.ui.portrait('AM', 'radial-gradient(circle at 40% 35%,#4a7af0,#1a2a6a)');
      am.pose = 'charge';
      shot(g, 5, 2, -397, 0, 2.5, -403);
      const a = await g.qte('hold', { title: 'REÚNA TUDO O QUE RESTA!', label: 'K', speed: 1.2 });
      am.pose = 'smash';
      const b = await g.qte('mash', { title: 'UNITED STATES OF SMASH!!!', label: 'J/K', key: 'attack', alt: 'smash', gain: 0.05, drain: 0.18, time: 7, start: 0.35, onPress: () => g.fx.hitSpark(afo.center.clone(), true) });
      g.ui.smashText('UNITED STATES OF SMASH!'); g.audio.sfx('smash'); g.audio.sfx('explode'); g.shake(2); g.speedLines(1.5);
      g.fx.flash(afo.center.clone(), 12, 0xffffff, 0.8);
      for (let i = 0; i < 7; i++) g.fx.shockwave(new V(0, 0.2, -410), 0xffffff, 6 + i * 4, 0.8 + i * 0.1);
      g.fx.burst(new V(0, 1, -410), [0xffffff, 0xffe060, 0x6a6460], 80, 22, { size: 0.5, life: 1.6 });
      afo.pose = 'down';
      await g.wait(1.5);
      // a forma verdadeira
      const amPos = am.pos.clone();
      g.removeNpc(am);
      const skinny = g.npc(() => M.allMight('skinny'), amPos, { face: new V(8, 0, -397) });
      skinny.pose = 'raise';
      g.audio.playTrack('sad');
      shot(g, 2.5, 2.4, -397, 0, 2.6, -400);
      await g.say([
        { who: '', text: 'A poeira baixa. Diante de todas as câmeras do Japão, o Símbolo da Paz revela sua forma esquelética. E aponta.' },
        { who: 'All Might', color: C.am, cam: skinny, text: 'Agora...' },
        { who: 'All Might', color: C.am, cam: skinny, text: '...é a sua vez.' },
        { who: 'Izuku', color: C.deku, text: '(Isso não foi para o mundo. Foi uma mensagem... para mim.)' },
      ]);
      p.root.visible = true;
      void a; void b;
    },
  },
  // ============================================================ 7
  {
    id: 'hassaikai', ep: 'FASE 7', name: 'Resgate da Eri', arc: 'Arco Shie Hassaikai — Ep. 64–77',
    sub: 'O esconderijo subterrâneo muda de forma. No fundo dele, uma menina que acha que é amaldiçoada.', par: 300,
    async script(g) {
      let p = g.setup('hideout', { kit: K.overhaul, music: 'tension', yaw: 0, camDist: 7.5, camH: 3.6 });
      g.ui.portrait('DK');
      await g.say([
        { who: 'Izuku', color: C.deku, cam: p, text: 'As paredes se mexem sozinhas... é a Individualidade "Remodelar" de um deles. Cuidado com o labirinto!' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Agora eu tenho o Shoot Style — chutes no ar (J no ar) — e o Air Force com os dedos (E). Full Cowl 20%!' },
        { who: 'Izuku', color: C.deku, text: '(Da outra vez eu soltei a mão da Eri. Desta vez... eu não vou soltar!)' },
      ]);
      p.setCowl(true);
      await g.wave([
        [{ type: 'hassai' }, { type: 'hassai' }, { type: 'thug' }],
        [{ type: 'hassai' }, { type: 'brute', over: { model: () => M.hassaikai(), scale: 1.4 } }, { type: 'hassai' }],
      ], { objective: 'Derrote os capangas da Shie Hassaikai!' });
      await g.reach(new V(0, 0, -37), 2.5, 'Avance pelo labirinto móvel!');
      // ---- sala do Overhaul
      await g.ui.fade(true);
      p = g.setup('hideoutBoss', { kit: K.overhaul, music: 'boss', yaw: 0, camDist: 9, camH: 4.4 });
      p.setCowl(true);
      const eri = g.npc('eri', g.env.anchors.eri, { face: new V(0, 0, -8), pose: 'sit' });
      const ov = g.npc('overhaul', new V(0, 0, -9), { face: p.pos });
      shot(g, 0, 2.4, 2, 0, 1.6, -9, true);
      await g.ui.fade(false);
      await g.say([
        { who: 'Overhaul', color: C.over, cam: ov, text: 'Heróis... uma doença. Individualidades são uma doença. E a Eri é a cura.' },
        { who: 'Overhaul', color: C.over, cam: ov, text: 'Eu desmonto e remonto tudo o que toco. Inclusive você.' },
        { who: 'Eri', color: C.eri, cam: eri, shot: { dist: 2, h: 0 }, text: 'Pare... todos se machucam por minha causa... eu sou amaldiçoada...' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Eri! Você não é amaldiçoada! Eu vim te buscar. Desta vez eu SEGURO a sua mão!' },
        { who: 'Izuku', color: C.deku, text: '(O chão vai virar espinhos onde ele tocar. Fique de olho nos círculos vermelhos!)' },
      ]);
      g.removeNpc(ov);
      g.bossEvent = (b, ev) => bg(async () => {
        if (ev === 'eri') {
          await g.cinema(true);
          eri.pose = 'calm';
          eri.pos.set(p.pos.x - 1, 0, p.pos.z + 1.2);
          await g.say([
            { who: 'Eri', color: C.eri, cam: eri, text: 'Eu... quero ajudar. Eu quero que você fique bem!' },
            { who: 'Izuku', color: C.deku, cam: p, text: 'A Individualidade dela... "Rebobinar". Ela me faz voltar antes de cada ferimento. Com isso...' },
            { who: 'Izuku', color: C.deku, cam: p, text: 'Eu posso usar 100% sem me destruir! FULL COWL — 100%!!!' },
          ]);
          g.eriBoost = true;
          p.setCowl(true);
          p.gauge = 3;
          g.removeNpc(eri);
          await g.cinema(false); g.freeCam();
          // o rebobinar cura e recarrega
          bg(async () => { while (g.eriBoost) { await g.wait(0.5); p.heal(2); p.addGauge(0.25); } });
        } else if (ev === 'chrono') {
          g.ui.bark('Overhaul', 'Chronostasis... me empreste seu corpo! FUSÃO!');
          g.ui.bossBar('OVERHAUL — FUSÃO', 'Remodelação do próprio corpo');
          b.root.scale.multiplyScalar(1.35);
          b.def.speed = 6.2;
        }
      });
      const boss = await g.boss(BOSS.overhaul, g.env.anchors.boss);
      await g.cinema(true);
      shot(g, 6, 3, -2, 0, 3, -8);
      await g.say([
        { who: 'Overhaul', color: C.over, cam: boss, text: 'Você... não entende nada! Eu ia devolver à Yakuza o lugar dela no mundo!' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Uma menina chorando não é um "lugar no mundo"! Isso acaba AGORA!' },
      ]);
      const ok = await g.qte('timing', { title: '100% — SMASH!', label: 'K', speed: 1.2, tries: 3 });
      g.ui.smashText('100% DETROIT SMASH!'); g.audio.sfx('smash'); g.audio.sfx('explode'); g.shake(1.6); g.speedLines(1);
      g.fx.flash(boss.center.clone(), 6, 0xffffff, 0.4);
      for (let i = 0; i < 4; i++) g.fx.shockwave(boss.center.clone(), 0x9affb0, 4 + i * 3, 0.6 + i * 0.1);
      const bf = boss.pos.clone();
      await tween(g, 0.8, k => boss.pos.set(bf.x, bf.y + Math.sin(k * Math.PI) * 5, bf.z - k * 6));
      boss.go('down'); boss.def = { ...boss.def, passive: true };
      g.ui.bossHide();
      g.eriBoost = false; p.setCowl(true);
      const eri2 = g.npc('eri', p.pos.clone().add(new V(1, 0, 1)), { face: p.pos });
      await g.say([
        { who: 'Eri', color: C.eri, cam: eri2, text: 'Você... ainda está segurando a minha mão.' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Está tudo bem agora, Eri. Por quê? Porque eu estou aqui.' },
        { who: 'Eri', color: C.eri, cam: eri2, text: '...Eu posso... sorrir? Eu não lembro como faz.' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'A gente vai te ensinar. Prometo. No Festival da U.A., você vai sorrir de verdade!' },
      ]);
      void ok;
    },
  },
  // ============================================================ 8
  {
    id: 'guerra', ep: 'ATO FINAL', name: 'Deku vs. Shigaraki', arc: 'Arco da Guerra Final',
    sub: 'Jaku em ruínas. O nono portador do One For All contra o herdeiro de All For One. A última batalha.', par: 360,
    async script(g) {
      const p = g.setup('jaku', { kit: K.final, music: 'final', weather: 'ash', yaw: 0, camDist: 10, camH: 5 });
      g.ui.portrait('DK');
      p.setCowl(true);
      const sh = g.npc(() => M.shigaraki(true), new V(0, 0, -10), { face: p.pos });
      shot(g, 0, 3, 4, 0, 2.5, -10, true);
      await g.say([
        { who: 'Shigaraki', color: C.shiga, cam: sh, text: 'Você de novo. O garotinho que quer salvar todo mundo. Eu vou destruir tudo... até não sobrar nada.' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Eu não vim só para te vencer, Shigaraki. Eu vim... para te salvar.' },
        { who: 'Izuku', color: C.deku, text: '(Os vestígios dos portadores estão comigo. Blackwhip (E) para puxar, Flutuar (segure PULO no ar), e o Sentido de Perigo me avisa dos ataques.)' },
        { who: 'Izuku', color: C.deku, text: '(As ondas de Decadência se espalham pelo chão — PULE quando o anel vermelho passar!)' },
      ]);
      g.removeNpc(sh);
      g.bossEvent = (b, ev) => bg(async () => {
        if (ev === 'afo') {
          await g.cinema(true);
          g.shotOn(b, { dist: 3.5 });
          await g.say([
            { who: 'All For One', color: C.afo, cam: b, text: 'Tomura... deixe-me assumir. O corpo é meu tanto quanto seu.' },
            { who: 'Izuku', color: C.deku, cam: p, text: 'Não! Tem alguém aí dentro chorando! Eu ouço... uma criança!' },
          ]);
          await g.cinema(false); g.freeCam();
        } else if (ev === 'vestiges') {
          await g.cinema(true);
          const cols = [0x9ad8ff, 0xffd8a0, 0xd8a0ff, 0xa0ffd8, 0xffa0a0, 0xffffa0, 0xa0a0ff];
          const vs = [];
          for (let i = 0; i < 7; i++) { const r = M.vestige(cols[i]); const n = g.npc(() => r, p.pos.clone().add(new V(Math.cos(i * 0.9 + 2) * 2.5, 0, Math.sin(i * 0.9 + 2) * 2.5 + 1.5)), { face: b.pos }); vs.push(n); }
          shot(g, p.pos.x, 2.5, p.pos.z + 6, p.pos.x, 1.8, p.pos.z);
          await g.say([
            { who: 'Nana Shimura', color: C.nana, text: 'Izuku. Nós não somos só poder. Somos a vontade de quem veio antes. Vá — com todos nós.' },
            { who: 'Yoichi', color: C.nana, text: 'Meu irmão... Por favor, termine o que eu não consegui.' },
            { who: 'Izuku', color: C.deku, cam: p, text: 'ONE FOR ALL... 100%... COM TODOS VOCÊS!' },
          ]);
          vs.forEach(n => g.removeNpc(n));
          p.gauge = 3; p.heal(60);
          p.kit.power *= 1.25;
          g.ui.toast('OS VESTÍGIOS ESTÃO COM VOCÊ!', 'gold');
          await g.cinema(false); g.freeCam();
          bg(async () => { while (b.alive && !b.invuln) { await g.wait(1); p.addGauge(0.12); } });
        }
      });
      const boss = await g.boss(BOSS.shigaraki, g.env.anchors.boss);
      await g.cinema(true);
      g.audio.playTrack('sad');
      shot(g, 0, 2.2, -4, 0, 2.2, -10);
      const tenko = g.npc(() => M.humanoid({ colors: { skin: 0xf2d8c8, top: 0xe8e0d0, bottom: 0x3a3a5a, sleeve: 0xe8e0d0, forearm: 0xf2d8c8, shoe: 0x6a3a2a }, scale: 0.6, head: 1.25, extra(r) { M.part(r.head, M.G.sph(0.265, 12), 0x3a4a6a, 0, 0.03, -0.04, 0.02); } }), boss.pos.clone().add(new V(1.2, 0, 1)), { face: p.pos, pose: 'sit' });
      await g.say([
        { who: '', text: 'Por um instante, no meio da poeira, Izuku vê um menino pequeno, sentado sozinho numa rua, esperando que alguém pare.' },
        { who: 'Tenko', color: C.shiga, cam: tenko, text: '...Ninguém parou. Ninguém nunca parou pra mim.' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Eu parei. Eu estou aqui, Tenko. Desta vez... alguém estendeu a mão.' },
        { who: 'All For One', color: C.afo, text: 'Sentimentalismo! O corpo é MEU!' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Então este é o último golpe. Para salvar quem está aí dentro... e para encerrar o que você começou, All For One!' },
      ]);
      g.audio.playTrack('final');
      const a = await g.qte('hold', { title: 'TODOS OS VESTÍGIOS... JUNTOS!', label: 'K', speed: 1.3 });
      const b = await g.qte('mash', { title: 'SMASH!!!', label: 'J/K', key: 'attack', alt: 'smash', gain: 0.04, drain: 0.2, time: 9, start: 0.3, onPress: () => g.fx.hitSpark(boss.center.clone().add(new V((Math.random() - 0.5) * 2, Math.random() * 2, 0.5)), true) });
      g.ui.smashText('SMASH!!!'); g.audio.sfx('smash'); g.audio.sfx('explode'); g.shake(2.2); g.speedLines(2);
      g.fx.flash(boss.center.clone(), 14, 0xffffff, 1.0);
      for (let i = 0; i < 8; i++) g.fx.shockwave(new V(0, 0.3, -10), i % 2 ? 0x9affb0 : 0xffffff, 6 + i * 4, 0.9 + i * 0.1);
      g.fx.burst(boss.center.clone(), [0xffffff, 0x9affb0, 0xffe060], 100, 24, { size: 0.5, life: 2 });
      boss.go('down'); boss.def = { ...boss.def, passive: true };
      g.ui.bossHide();
      g.removeNpc(tenko);
      await g.wait(1.5);
      g.fx.setWeather('petal', g.scene);
      g.audio.playTrack('sad');
      p.cinePose = 'calm';
      shot(g, 3, 2, p.pos.z + 3, 0, 1.6, p.pos.z - 2);
      await g.say([
        { who: '', text: 'O céu se abre sobre Jaku. A última brasa do One For All se apaga nos punhos de Izuku — entregue por inteiro.' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Obrigado... All Might. Obrigado a todos vocês.' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'Eu não tenho mais Individualidade. Mas eu tenho uma coisa que ninguém me deu por sorte...' },
        { who: 'Izuku', color: C.deku, cam: p, text: 'A vontade de estender a mão. Essa é a história de como eu me tornei o maior herói de todos.' },
      ]);
      void a; void b;
    },
  },
];

export { K, BOSS };
