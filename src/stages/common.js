// Peças compartilhadas pelos roteiros: kits do Deku, chefes, cores das falas, páginas do caderno e utilidades.
import * as THREE from 'three';
import { ABORT } from '../game.js';
import * as M from '../models.js';

export const V = THREE.Vector3;
export { M };

export const C = {
  deku: '#36e38c', am: '#4c7cf0', kacchan: '#ff8a2a', ochaco: '#ff7ab0', villain: '#d84a5a', mic: '#ffd23a', tsuyu: '#5ac87a',
  iida: '#8aa4d8', todo: '#ff5a6a', stain: '#d83a3a', kota: '#ff4a3a', mus: '#d86a3a', kiri: '#ff4040', afo: '#8a8aa8', over: '#6ab08a',
  eri: '#ff8aa8', shiga: '#9aa8b8', nana: '#9ad8ff', nar: '#9aa3b8', aizawa: '#c8c8d8', orca: '#5ab0e8', nagant: '#d85ab0', inasa: '#d8b06a', midnight: '#d84a8a',
};

// ---------------------------------------------------- kits: o Deku cresce a cada arco
export const K = {
  quirkless: { model: 'deku', outfit: 'uniform', power: 0.55, canSmash: false, speed: 6.6, jump: 10, maxHp: 80 },
  training: { model: 'deku', outfit: 'training', power: 0.8, canSmash: true, smashName: 'SOCO COM TUDO!', speed: 6.8, jump: 10.5, charge: 0.7, gauge: 3 },
  exam: { model: 'deku', outfit: 'gym', power: 0.85, canSmash: false, speed: 7.2, jump: 11 },
  trial: { model: 'deku', outfit: 'hero', power: 0.95, recoil: 22, speed: 7.2, jump: 11, gauge: 1, smashName: 'SMASH!' },
  usj: { model: 'deku', outfit: 'hero', power: 1, recoil: 14, special: 'delaware', flickCost: 6, speed: 7.3, jump: 11.5, gauge: 1 },
  allMight: { model: 'allMight', power: 2.4, maxHp: 220, speed: 8.6, jump: 15, special: 'texas', charge: 0.55, gauge: 3, smashName: 'DETROIT SMASH!' },
  race: { model: 'deku', outfit: 'gym', power: 0.9, canSmash: true, recoil: 0, speed: 7.6, jump: 12, maxHp: 100, smashName: 'SMASH!' },
  festival: { model: 'deku', outfit: 'gym', power: 1.05, recoil: 16, special: 'delaware', flickCost: 5, speed: 7.4, jump: 11.5, gauge: 1, maxHp: 110 },
  hosu: { model: 'deku', outfit: 'hero', power: 1.05, cowl: 5, speed: 7.4, jump: 12, gauge: 1 },
  forest: { model: 'deku', outfit: 'hero', power: 1.15, cowl: 8, speed: 7.4, jump: 12, gauge: 1, smashName: 'DETROIT SMASH!', recoil: 8 },
  kamino: { model: 'deku', outfit: 'hero', power: 1.2, cowl: 8, cowlAlways: true, speed: 8, jump: 12.5, maxHp: 100 },
  license: { model: 'deku', outfit: 'hero', power: 1.25, cowl: 8, shootStyle: true, speed: 7.6, jump: 12.5, maxHp: 115, smashName: 'ST. LOUIS SMASH!' },
  overhaul: { model: 'deku', outfit: 'hero', power: 1.35, cowl: 20, shootStyle: true, special: 'airforce', speed: 7.8, jump: 12.5, maxHp: 120, smashName: 'ST. LOUIS SMASH!' },
  dark: { model: 'deku', outfit: 'final', power: 1.55, cowl: 45, cowlAlways: true, shootStyle: true, special: 'blackwhip', float: true, speed: 8.2, jump: 13, maxHp: 140, gauge: 1, smashName: 'DETROIT SMASH!' },
  final: { model: 'deku', outfit: 'final', power: 1.7, cowl: 45, shootStyle: true, special: 'blackwhip', float: true, speed: 8.2, jump: 13, maxHp: 150, gauge: 2, smashName: 'DETROIT SMASH!' },
};

// ---------------------------------------------------- chefes
export const BOSS = {
  bakugo1: {
    name: 'KATSUKI BAKUGO', title: 'Treino de Batalha — o vilão é ele', model: () => M.bakugo('hero'), hp: 480, speed: 5.6, radius: 0.5, finisher: true, keep: 2.2,
    phases: [
      { at: 1, attacks: [{ kind: 'melee', range: 2.3, windup: 0.42, dmg: 10, cd: 1.2, boom: true, kb: 7, say: 'MORRE, DEKU!' }, { kind: 'dash', range: 12, min: 3, windup: 0.5, dmg: 11, cd: 2.4, speed: 21, dur: 0.4, boom: true }, { kind: 'flash', range: 8, windup: 0.9, dmg: 4, cd: 6 }] },
      { at: 0.5, event: 'gauntlet', attacks: [{ kind: 'beam', range: 20, min: 4, windup: 1.5, dmg: 26, cd: 6, speed: 30, size: 1.7, color: 0xffa020, weight: 0.7 }, { kind: 'melee', range: 2.3, windup: 0.36, dmg: 11, cd: 1, boom: true, combo: 2, kb: 8 }, { kind: 'dash', range: 14, min: 3, windup: 0.45, dmg: 12, cd: 2.2, speed: 23, dur: 0.4, boom: true }, { kind: 'flash', range: 8, windup: 0.8, dmg: 4, cd: 6 }] },
    ],
  },
  nomu: {
    name: 'NOMU', title: 'Anti-Símbolo da Paz — Absorção de Choque', model: () => M.nomu({ scale: 2.0 }), hp: 700, speed: 4.2, radius: 1.1,
    absorb: 0.5, superArmor: true, finisher: true, keep: 2.6,
    phases: [
      { at: 1, attacks: [{ kind: 'melee', range: 3, windup: 0.55, dmg: 20, cd: 1.2, kb: 10, combo: 2 }, { kind: 'leap', range: 14, min: 4, windup: 0.6, dmg: 22, cd: 3, radius: 3.5 }] },
      { at: 0.5, event: 'nomuHalf', attacks: [{ kind: 'melee', range: 3, windup: 0.45, dmg: 22, cd: 0.9, kb: 10, combo: 3 }, { kind: 'dash', range: 14, windup: 0.6, dmg: 22, cd: 2.5, speed: 24, dur: 0.5 }, { kind: 'leap', range: 16, min: 4, windup: 0.5, dmg: 22, cd: 2.5, radius: 4 }] },
    ],
  },
  todoroki: {
    name: 'SHOTO TODOROKI', title: 'Festival Esportivo — Semifinal da primeira rodada', model: () => M.todoroki(), hp: 620, speed: 4.4, radius: 0.5, finisher: true, keep: 7, roam: 5, superArmor: true,
    phases: [
      { at: 1, attacks: [{ kind: 'line', range: 22, windup: 0.85, dmg: 14, cd: 2.2, len: 20, width: 3, color: 0xb8e8ff, kb: 11, weight: 2 }, { kind: 'spikes', range: 18, windup: 0.8, dmg: 12, cd: 3, count: 3, radius: 1.6, color: 0xb8e8ff, sfx: 'ice' }, { kind: 'melee', range: 2.2, windup: 0.45, dmg: 10, cd: 1.4, kb: 8 }] },
      { at: 0.45, event: 'fire', attacks: [{ kind: 'wave', range: 20, windup: 0.9, dmg: 15, cd: 3.2, speed: 13, radius: 18, color: 0xff7a2a, sfx: 'fire' }, { kind: 'line', range: 24, windup: 0.7, dmg: 15, cd: 2.4, len: 22, width: 3.4, color: 0xb8e8ff, kb: 12, weight: 1.5 }, { kind: 'projectile', range: 18, min: 3, windup: 0.6, dmg: 9, cd: 2.4, speed: 18, count: 3, spread: 0.25, color: 0xff6a20, size: 0.5, sfx: 'fire' }, { kind: 'melee', range: 2.4, windup: 0.4, dmg: 12, cd: 1.2, kb: 9, boom: true }] },
    ],
  },
  stain: {
    name: 'STAIN', title: 'O Assassino de Heróis', model: () => M.stain(), hp: 480, speed: 6.2, radius: 0.5, finisher: true, keep: 2,
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
  gangOrca: {
    name: 'GANG ORCA', title: 'Herói nº 10 — o "vilão" do exame', model: () => M.gangOrca(), hp: 700, speed: 4.4, radius: 0.9, armor: 0.6, superArmor: true, finisher: true, keep: 3,
    phases: [
      { at: 1, attacks: [{ kind: 'cone', range: 10, windup: 0.8, dmg: 6, cd: 3, paralyze: 1.3, weight: 1.5 }, { kind: 'melee', range: 2.8, windup: 0.55, dmg: 15, cd: 1.4, kb: 10 }, { kind: 'dash', range: 14, min: 3, windup: 0.6, dmg: 15, cd: 3, speed: 20, dur: 0.5 }] },
      { at: 0.5, event: 'orcaHalf', attacks: [{ kind: 'cone', range: 12, windup: 0.65, dmg: 7, cd: 2.4, paralyze: 1.4, weight: 1.5 }, { kind: 'summon', range: 40, windup: 0.8, cd: 12, type: 'orcaKick', count: 2, weight: 0.4 }, { kind: 'melee', range: 2.8, windup: 0.45, dmg: 16, cd: 1.1, kb: 10, combo: 2 }, { kind: 'leap', range: 14, min: 3, windup: 0.6, dmg: 16, cd: 3, radius: 3.5, color: 0x9ae0ff }] },
    ],
  },
  bakugo2: {
    name: 'KATSUKI BAKUGO', title: 'Ground Beta — Deku vs. Kacchan II', model: () => M.bakugo('hero'), hp: 760, speed: 6.4, radius: 0.5, finisher: true, keep: 2.4, superArmor: true,
    phases: [
      { at: 1, attacks: [{ kind: 'melee', range: 2.3, windup: 0.36, dmg: 11, cd: 1, boom: true, combo: 2, kb: 7 }, { kind: 'dash', range: 14, min: 3, windup: 0.42, dmg: 12, cd: 2, speed: 24, dur: 0.4, boom: true }, { kind: 'beam', range: 18, min: 4, windup: 0.9, dmg: 13, cd: 3.4, speed: 34, size: 0.6, color: 0xffa020 }, { kind: 'flash', range: 9, windup: 0.75, dmg: 4, cd: 6 }] },
      { at: 0.5, event: 'kacchanCry', attacks: [{ kind: 'leap', range: 16, min: 3, windup: 0.7, dmg: 20, cd: 3, radius: 4.5, color: 0xffa040, boom: true, say: 'HOWITZER IMPACT!' }, { kind: 'melee', range: 2.4, windup: 0.32, dmg: 12, cd: 0.9, boom: true, combo: 3, kb: 8 }, { kind: 'beam', range: 20, min: 4, windup: 0.8, dmg: 14, cd: 3, speed: 36, size: 0.7, color: 0xffa020, say: 'AP SHOT!' }, { kind: 'dash', range: 16, min: 3, windup: 0.38, dmg: 13, cd: 2, speed: 26, dur: 0.4, boom: true }] },
    ],
  },
  overhaul: {
    name: 'OVERHAUL', title: 'Jovem Líder da Shie Hassaikai', model: () => M.overhaul(), hp: 900, speed: 4.8, radius: 0.5, finisher: true, keep: 4,
    phases: [
      { at: 1, attacks: [{ kind: 'spikes', range: 18, windup: 0.9, dmg: 15, cd: 2.2, count: 4, radius: 1.7, color: 0x6a6a70, weight: 2 }, { kind: 'melee', range: 2, windup: 0.4, dmg: 14, cd: 1.5, say: 'Não me toque... imundo.' }, { kind: 'line', range: 20, windup: 0.8, dmg: 14, cd: 3.4, len: 18, width: 2.2, color: 0x7a7a80, sfx: 'heavy' }] },
      { at: 0.6, event: 'eri', attacks: [{ kind: 'spikes', range: 22, windup: 0.75, dmg: 16, cd: 1.6, count: 6, radius: 1.8, color: 0x6a6a70, weight: 2 }, { kind: 'wave', range: 10, windup: 0.8, dmg: 16, cd: 4, speed: 12, radius: 18, color: 0x8a8a90, sfx: 'heavy' }, { kind: 'dash', range: 12, min: 3, windup: 0.45, dmg: 14, cd: 2.4, speed: 22, dur: 0.4 }] },
      { at: 0.3, event: 'chrono', attacks: [{ kind: 'spikes', range: 24, windup: 0.6, dmg: 18, cd: 1.2, count: 8, radius: 1.9, color: 0x7a2a2a, weight: 2 }, { kind: 'line', range: 24, windup: 0.6, dmg: 18, cd: 2.4, len: 22, width: 2.8, color: 0x8a3a3a, sfx: 'heavy' }, { kind: 'wave', range: 12, windup: 0.6, dmg: 18, cd: 3, speed: 14, radius: 20, color: 0x8a3a3a, sfx: 'heavy' }, { kind: 'leap', range: 16, min: 3, windup: 0.5, dmg: 18, cd: 3, radius: 3.5 }] },
    ],
  },
  nagant: {
    name: 'LADY NAGANT', title: 'Ex-heroína — Rifle', model: () => M.ladyNagant(), hp: 560, speed: 3.6, radius: 0.5, finisher: true, keep: 9, roam: 9, superArmor: true,
    phases: [
      { at: 1, attacks: [{ kind: 'snipe', range: 90, windup: 1.3, dmg: 15, cd: 1.8, speed: 80, weight: 2 }, { kind: 'projectile', range: 30, min: 4, windup: 0.8, dmg: 7, cd: 2.6, speed: 36, count: 5, spread: 0.12, color: 0xff5ac8, size: 0.25 }, { kind: 'melee', range: 2.2, windup: 0.4, dmg: 11, cd: 1.6, kb: 9 }] },
      { at: 0.5, event: 'nagantHalf', attacks: [{ kind: 'snipe', range: 90, windup: 0.95, dmg: 16, cd: 1.3, speed: 90, weight: 2 }, { kind: 'projectile', range: 30, min: 3, windup: 0.6, dmg: 8, cd: 2, speed: 40, count: 7, spread: 0.1, color: 0xff5ac8, size: 0.25 }, { kind: 'melee', range: 2.2, windup: 0.35, dmg: 12, cd: 1.2, kb: 9, combo: 2 }] },
    ],
  },
  shigaraki: {
    name: 'TOMURA SHIGARAKI', title: 'Rei Demônio — Decadência', model: () => M.shigaraki(true), hp: 1400, speed: 5.8, radius: 0.7, superArmor: true, armor: 0.5, finisher: true, keep: 3.5,
    phases: [
      { at: 1, attacks: [{ kind: 'wave', range: 30, windup: 0.9, dmg: 18, cd: 3.2, speed: 11, radius: 28, color: 0xb04050 }, { kind: 'melee', range: 2.6, windup: 0.4, dmg: 16, cd: 1.1, combo: 2, kb: 9 }, { kind: 'dash', range: 16, min: 3, windup: 0.5, dmg: 16, cd: 2.4, speed: 26, dur: 0.45 }] },
      { at: 0.66, event: 'afo', attacks: [{ kind: 'wave', range: 30, windup: 0.8, dmg: 18, cd: 2.8, speed: 12, radius: 30, color: 0xb04050 }, { kind: 'projectile', range: 22, min: 4, windup: 0.6, dmg: 12, cd: 2.4, speed: 22, count: 5, spread: 0.22, color: 0xff3a3a, size: 0.45 }, { kind: 'spikes', range: 22, windup: 0.8, dmg: 16, cd: 2.6, count: 5, radius: 1.6, color: 0x2a1a1a }, { kind: 'line', range: 24, windup: 0.7, dmg: 16, cd: 3, len: 22, width: 2.6, color: 0x5a1a2a, sfx: 'decay' }] },
      { at: 0.33, event: 'vestiges', attacks: [{ kind: 'wave', range: 30, windup: 0.7, dmg: 20, cd: 2.2, speed: 14, radius: 32, color: 0xd03040 }, { kind: 'beam', range: 24, min: 4, windup: 0.9, dmg: 22, cd: 3.4, speed: 30, color: 0xff2020 }, { kind: 'summon', range: 40, windup: 0.8, cd: 9, type: 'nomuLow', count: 2, weight: 0.5 }, { kind: 'melee', range: 2.6, windup: 0.35, dmg: 18, cd: 1, combo: 3, kb: 10 }] },
    ],
  },
};

// ---------------------------------------------------- Caderno do Deku: "Análise de Heróis para o Futuro"
export const NOTES = {
  prologo: { id: 'prologo', n: 13, title: 'All Might', text: 'Força, velocidade, regeneração? Ninguém sabe qual é a Individualidade dele. Ele sempre chega sorrindo. Um dia quero sorrir assim pra alguém que estiver com medo.' },
  dagobah: { id: 'dagobah', n: 14, title: 'Plano Aim to be American Dream', text: 'Dormir 8h. Arroz, frango, brócolis. Correr carregando a geladeira. O All Might escreveu cada minuto do meu dia. Ninguém nunca tinha feito um plano pra mim.' },
  exame: { id: 'exame', n: 15, title: 'Ochaco Uraraka', text: 'Zero Gravity: os cinco dedos encostam e o alvo flutua. O limite é peso total — passou disso, ela fica enjoada. Ela me salvou no ar. Preciso agradecer direito.' },
  treino: { id: 'treino', n: 15, title: 'Kacchan', text: 'Explosão: o suor dele é nitroglicerina. Ele sempre abre com um gancho de direita. Sei disso porque passei a vida inteira olhando pra ele... e anotando.' },
  usj: { id: 'usj', n: 15, title: 'Tsuyu Asui', text: 'Sapo: língua de 20m, salto alto, camuflagem leve, gruda em paredes. Ela fala tudo o que pensa. "Me chama de Tsu." Ainda não consegui.' },
  corrida: { id: 'corrida', n: 16, title: 'Shoto Todoroki', text: 'Meio-Frio Meio-Quente. Ele só usa o lado esquerdo do gelo. O fogo... ele se recusa. Isso não é força: é uma prisão. Será que ele sabe?' },
  festival: { id: 'festival', n: 16, title: 'Endeavor', text: 'Herói nº 2. Chama infernal. Assistindo da arquibancada, ele não torcia pelo filho. Torcia pelo próprio projeto. Isso me deu muita raiva.' },
  hosu: { id: 'hosu', n: 17, title: 'Stain', text: 'Coagular: lamber sangue paralisa por até 8 min, depende do tipo sanguíneo. Ele odeia heróis falsos. Mas, na hora, ele salvou um civil. Como pode?' },
  floresta: { id: 'floresta', n: 18, title: 'Kota Izumi', text: 'Água, como os pais (Water Hose). Ele diz que odeia heróis. Mas quem odeia heróis não guarda o boné que parece com o do pai.' },
  kamino: { id: 'kamino', n: 18, title: 'All For One', text: 'Rouba e dá Individualidades. Viveu séculos. Foi ele quem feriu o All Might há 6 anos. O One For All nasceu para enfrentar ele.' },
  licenca: { id: 'licenca', n: 19, title: 'Shoot Style', text: 'Meus braços não aguentam mais. Ideia do Iida: chutes! As pernas são mais fortes. 8% nas pernas, sem quebrar nada. Isso é MEU estilo.' },
  kacchan2: { id: 'kacchan2', n: 20, title: 'Kacchan (de novo)', text: 'Ele acha que o All Might se aposentou por culpa dele. Ele vinha guardando isso sozinho. Somos rivais. E, talvez, a gente esteja começando a ser amigos.' },
  hassaikai: { id: 'hassaikai', n: 22, title: 'Eri', text: 'Rebobinar: devolve o corpo a um estado anterior. Pode apagar uma pessoa inteira. Ela tem medo do próprio poder. A gente vai ensinar ela a sorrir.' },
  nagant: { id: 'nagant', n: 26, title: 'Lady Nagant', text: 'Rifle: o cabelo vira munição, o braço vira cano. Ela foi heroína que eliminava gente nas sombras pela Comissão. Ela não é má. Está cansada.' },
  guerra: { id: 'guerra', n: 30, title: 'Tomura Shigaraki', text: 'Decadência. Ele destruiu a própria família sem querer. Ninguém estendeu a mão. Se eu for um herói de verdade, não posso salvar só quem é fácil de salvar.' },
};

// ---------------------------------------------------- utilidades
export const bg = (fn) => { fn().catch(e => { if (e !== ABORT) console.error(e); }); };
export async function tween(g, dur, fn) {
  let t = 0;
  await g.until(() => { t += g._dt; fn(Math.min(1, t / dur)); return t >= dur; });
}
export const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
export const shot = (g, x, y, z, lx, ly, lz, snap) => g.shot(new V(x, y, z), new V(lx, ly, lz), snap);

export async function dropRock(g, pos, r = 1.3, dmg = 12) {
  g.fx.telegraph(pos, r, 0.9);
  await g.wait(0.75);
  const m = new THREE.Group(); M.part(m, M.G.box(r * 1.2, r, r * 1.2), 0x6a6460, 0, 0, 0, 0.04);
  m.position.copy(pos).setY(14); g.scene.add(m);
  await tween(g, 0.18, k => (m.position.y = 14 - 13.5 * k));
  g.fx.burst(pos.clone(), [0x8a8480, 0x5a5450], 12, 6, { size: 0.2 });
  g.audio.sfx('heavy'); g.shake(0.2);
  const p = g.player;
  if (Math.hypot(p.pos.x - pos.x, p.pos.z - pos.z) < r + 0.3) p.hurt(dmg, pos, 6);
  await g.wait(1.2);
  g.scene.remove(m);
}

// golpe final genérico com impacto de anime
export function bigFinish(g, at, text, color = 0x9affb0) {
  g.ui.smashText(text); g.audio.sfx('smash'); g.audio.sfx('explode'); g.shake(1.4); g.speedLines(1);
  g.screen.impactFrame(0.1); g.screen.aberration(0.8); g.fovKick(12);
  g.fx.glow(at.clone(), 0xffffff, { size: 14, life: 0.4 });
  for (let i = 0; i < 5; i++) g.fx.shockwave(at.clone(), i % 2 ? color : 0xffffff, 4 + i * 2.5, 0.6 + i * 0.1);
  g.fx.burst(at.clone(), [0xffffff, color, 0xffe060], 50, 18, { size: 0.3, life: 1.2, add: true });
}

// missão: texto + verificação sobre as estatísticas finais
export const mis = (text, check) => ({ text, check });
