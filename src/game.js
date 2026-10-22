// Motor: loop, câmera, roteiro das fases (async), QTE, projéteis, perigos e corrida automática.
import * as THREE from 'three';
import { Env } from './env.js';
import { FX } from './fx.js';
import { Player, Enemy, Npc, ENEMIES } from './actors.js';
import * as M from './models.js';
import { POSES } from './anim.js';
import { Render } from './render.js';

const V = THREE.Vector3;
export const ABORT = Symbol('abort');

export class Game {
  constructor({ canvas, ui, audio, input }) {
    this.ui = ui; this.audio = audio; this.input = input;
    this.r = new Render(canvas);
    this.renderer = this.r.renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 900);
    this.r.setup(this.scene, this.camera);
    // efeitos de tela: com pós-processamento usa shader, sem ele cai para sobreposições CSS
    const g = this;
    this.screen = {
      impactFrame(t) { if (g.r.q.post) g.r.impactFrame(t); else ui.screenFx('impact', t); },
      aberration(t) { if (g.r.q.post) g.r.aberration(t); },
      whiteout(t) { if (g.r.q.post) g.r.whiteout(t); else ui.screenFx('white', t); },
    };
    this.fov = 55; this.fovAdd = 0;
    this.env = new Env(this.scene);
    this.fx = new FX(this.scene);
    this.enemies = []; this.npcs = []; this.projectiles = []; this.pickups = []; this.waves = [];
    this.timers = []; this.waiters = [];
    this.quality = 'alto';
    this.camYaw = 0; this.camDist = 8.5; this.camH = 4.0;
    this.cine = null;
    this.camPos = new V(0, 5, 10); this.camLook = new V();
    this._shake = 0; this._hitstop = 0; this.timeScale = 1; this.slowT = 0;
    this.running = false; this.paused = false;
    this.tokens = new Set(); this.maxTokens = 2;
    this.diff = 1;
    this.flags = {};
    this.time = 0;
    this.resize();
    addEventListener('resize', () => this.resize());
    // girar a câmera arrastando
    let drag = null;
    canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') drag = e.clientX; });
    addEventListener('pointerup', () => (drag = null));
    addEventListener('pointermove', e => { if (drag !== null && !this.cine) { this.camYaw -= (e.clientX - drag) * 0.006; drag = e.clientX; } });
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  setQuality(q) { this.quality = q; this.r.setQuality(q); this.resize(); }
  resize() {
    const w = innerWidth, h = innerHeight;
    this.r.resize();
    this.camera.aspect = w / h;
    this.fov = w / h < 1 ? 70 : 55;
    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();
  }
  fovKick(a) { this.fovAdd = Math.max(this.fovAdd, a); }

  // ------------------------------------------------ utilidades de roteiro
  check() { if (this.aborted) throw ABORT; }
  wait(sec) { this.check(); return new Promise((res, rej) => this.timers.push({ t: sec, res, rej })); }
  until(fn) { this.check(); return new Promise((res, rej) => this.waiters.push({ fn, res, rej })); }
  abortAll() {
    this.aborted = true;
    for (const t of this.timers) t.rej(ABORT);
    for (const w of this.waiters) w.rej(ABORT);
    this.timers = []; this.waiters = [];
    this.ui.closeDialog?.(); this.ui.qteHide(); this.ui.letterbox(false);
  }

  clearStage() {
    if (this.player && this.runStats) {
      const s = this.player.stats, R = this.runStats;
      for (const k in s) R[k] = k === 'maxCombo' ? Math.max(R[k] || 0, s[k]) : (R[k] || 0) + s[k];
      R.bestStyle = 'DCBAS'[Math.max('DCBAS'.indexOf(R.bestStyle || 'D'), 'DCBAS'.indexOf(this.player.bestStyle || 'D'))];
    }
    for (const c of this.rescues || []) this.scene.remove(c.marker);
    for (const n of this.notebooks || []) this.scene.remove(n.mesh);
    for (const m of this.mines || []) this.scene.remove(m.mesh);
    this.rescues = []; this.notebooks = []; this.mines = [];
    this.checkpoint = null; this.ringOutT = 0;
    this.ui.lockOn(null); this.ui.style('D', 0, false);
    this.fx.clear();
    for (const e of this.enemies) e.remove();
    for (const n of this.npcs) n.remove();
    for (const p of this.projectiles) this.scene.remove(p.mesh);
    for (const p of this.pickups) this.scene.remove(p.mesh);
    for (const w of this.waves) this.scene.remove(w.mesh);
    if (this.player) this.player.remove();
    if (this.beacon) { this.scene.remove(this.beacon); this.beacon = null; }
    if (this.runner) { this.runner.objs.forEach(o => this.scene.remove(o.mesh)); this.runner = null; }
    this.enemies = []; this.npcs = []; this.projectiles = []; this.pickups = []; this.waves = [];
    this.tokens.clear();
    this.player = null;
    this.curBoss = null;
    this.eriBoost = false;
    this.onSmash = null; this.onEnemyHit = null; this.bossEvent = null; this.bossDefeated = null; this.killHook = null;
    this.fx.setWeather(null, this.scene);
    this.ui.bossHide(); this.ui.timer(null); this.ui.objective(''); this.ui.score(''); this.ui.combo(0); this.ui.cowl(0);
  }

  setup(envName, { kit, music = 'hero', weather = null, yaw = 0, start, camDist = 8.5, camH = 4 } = {}) {
    this.clearStage();
    this.env.build(envName);
    M.RIM.color.value.set(this.env.rim ?? 0x9ad0ff); M.RIM.strength.value = this.env.rimStrength ?? 0.55;
    this.r.setTint(this.env.tint ?? 0xffffff);
    this.fx.floorY = this.env.baseY ?? 0;
    this.player = new Player(this, kit);
    this.player.pos.copy(start || this.env.anchors.start || new V());
    this.player.yaw = Math.PI + yaw; this.player.root.rotation.y = this.player.yaw;
    this.camYaw = yaw; this.camDist = camDist; this.camH = camH;
    this.cine = null;
    this.snapCam();
    if (weather) this.fx.setWeather(weather, this.scene);
    this.audio.playTrack(music);
    this.control = true;
    this.ui.hud(true);
    this.ui.hp(1); this.ui.cowl(this.player.cowlOn ? kit.cowl : 0);
    this.score = 0; this.kills = 0;
    if (!this.keepTime) this.stageTime = 0;
    this.checkpoint = this.player.pos.clone();
    return this.player;
  }

  allColliders() { return this.env.dynamicColliders ? this.env.colliders.concat(this.env.dynamicColliders()) : this.env.colliders; }
  groundAt(x, z, y) {
    let g = this.env.baseY ?? 0;
    for (const c of this.env.colliders) if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ && c.top <= y + 0.4 && c.top > g) g = c.top;
    return g;
  }

  npc(kind, pos, opts = {}) {
    const rig = typeof kind === 'function' ? kind() : M[kind](...(opts.args || []));
    const n = new Npc(this, rig, pos, opts);
    this.npcs.push(n);
    return n;
  }
  removeNpc(n) { n.remove(); this.npcs = this.npcs.filter(x => x !== n); }

  spawn(type, pos, over = {}) {
    const e = new Enemy(this, type, pos, over);
    e.id = (this._eid = (this._eid || 0) + 1);
    this.enemies.push(e);
    this.fx.burst(e.pos.clone(), 0x6a4a8a, 8, 4, { size: 0.15, life: 0.4 });
    return e;
  }
  alive(list) { return (list || this.enemies).filter(e => e.alive && e.state !== 'dead' && !e.def.ghost); }

  async wave(groups, { gap = 0.6, objective, keep = false } = {}) {
    if (objective) this.ui.objective(objective);
    const all = [];
    for (const g of groups) {
      const list = Array.isArray(g) ? g : [g];
      for (const s of list) {
        const pos = s.pos || this.ringPos(s.r || 9);
        all.push(this.spawn(s.type, pos, s.over));
        await this.wait(s.delay ?? gap * 0.3);
      }
      await this.until(() => this.alive(all).length <= (g.leave ?? 1));
    }
    await this.until(() => this.alive(all).length === 0);
    return all;
  }
  ringPos(r = 9) {
    const p = this.player.pos, b = this.env.bounds;
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      if (x > b.minX + 1 && x < b.maxX - 1 && z > b.minZ + 1 && z < b.maxZ - 1) return new V(x, 0, z);
    }
    return new V(Math.max(b.minX + 1, Math.min(b.maxX - 1, p.x + r)), 0, Math.max(b.minZ + 1, Math.min(b.maxZ - 1, p.z)));
  }

  async boss(def, pos) {
    const e = this.spawn(def, pos || this.env.anchors.boss || new V(0, 0, -8), { boss: true });
    this.curBoss = e;
    this.ui.bossBar(def.name, def.title);
    this.ui.bossHp(1);
    let result = null;
    this.bossDefeated = (b) => { if (b === e) result = 'finisher'; };
    const prevHook = this.killHook;
    this.killHook = (k) => { if (k === e) result = 'killed'; prevHook?.(k); };
    await this.until(() => result);
    this.killHook = prevHook;
    this.check();
    return e;
  }

  takeToken(e) {
    if (e.def.boss) return true;
    for (const t of this.tokens) if (!t.alive || t.state === 'dead' || (t.state !== 'windup' && t.state !== 'attack')) this.tokens.delete(t);
    if (this.tokens.size >= this.maxTokens) return false;
    this.tokens.add(e); return true;
  }
  releaseToken(e) { this.tokens.delete(e); }

  onEnemyKilled(e) {
    this.releaseToken(e);
    this.kills++;
    this.score += e.def.score || 0;
    if (!e.def.static && !e.def.boss && Math.random() < 0.2) this.dropPickup(e.pos.clone());
    this.killHook?.(e);
  }
  dropPickup(pos) {
    const g = new THREE.Group();
    M.part(g, M.G.cone(0.3, 0.45, 3), 0xffffff, 0, 0, 0, 0.02).rotation.x = Math.PI / 2;
    M.part(g, M.G.box(0.2, 0.25, 0.1), 0x111a11, 0, -0.08, 0.06, 0);
    const y = this.groundAt(pos.x, pos.z, pos.y + 0.5) + 0.6;
    g.position.copy(pos).setY(y);
    this.scene.add(g);
    this.pickups.push({ mesh: g, t: 0, y });
  }

  hitstop(t) { this._hitstop = Math.max(this._hitstop, t); }
  shake(a) { this._shake = Math.max(this._shake, a); }
  speedLines(t) { this.ui.speedLines(t); }
  slowmo(t, s = 0.3) { this.slowT = t; this.timeScale = s; }
  perfectDodge() {
    this.slowmo(0.7, 0.25);
    this.player.addGauge(0.35);
    this.player.inv = 0.8;
    this.ui.toast('ESQUIVA PERFEITA!', 'gold');
    this.audio.sfx('select');
    this.screen.aberration(0.5);
    this.ui.toast('J para CONTRA-ATACAR!', 'green');
  }

  // números de dano projetados na tela
  dmgNumber(pos, v, crit) {
    const p = pos.clone().project(this.camera);
    if (p.z > 1) return;
    this.ui.dmg((p.x * 0.5 + 0.5) * innerWidth, (-p.y * 0.5 + 0.5) * innerHeight, Math.round(v), crit);
  }
  toScreen(pos) {
    const p = pos.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight, on: p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1 };
  }

  // geleira/fileira de espinhos que avança em linha (Todoroki, Overhaul)
  lineSpikes(start, dir, a) {
    const len = a.len || 16, step = 1.3, w = (a.width || 2.4) / 2;
    const n = Math.floor(len / step);
    const hit = { done: false };
    for (let i = 1; i <= n; i++) {
      this.wait(i * (a.stepT || 0.035)).then(() => {
        const c = start.clone().addScaledVector(dir, i * step);
        this.spikes(c, w * 0.9, a.color || 0xb8e8ff, true);
        const p = this.player;
        if (!hit.done && Math.hypot(p.pos.x - c.x, p.pos.z - c.z) < w + 0.4 && p.pos.y - c.y < 2.4) { hit.done = true; p.hurt(a.dmg * this.diff, c, a.kb || 8, { down: true }); }
      }).catch(() => {});
    }
  }

  // ------------------------------------------------ resgates, cadernos, minas, checkpoints
  civilian(pos, { variant = Math.floor(Math.random() * 5), time = 0, label = 'Civil' } = {}) {
    const n = this.npc(() => M.civilian(variant), pos, { pose: 'sit' });
    const marker = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.45, 32), new THREE.MeshBasicMaterial({ color: 0x5ad0ff, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; marker.add(ring);
    const icon = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: 0x5ad0ff }));
    icon.position.y = 2.4; marker.add(icon);
    marker.position.copy(pos);
    this.scene.add(marker);
    const c = { n, marker, ring, icon, pos: pos.clone(), prog: 0, done: false, failed: false, time, label };
    this.rescues.push(c);
    return c;
  }
  async rescueAll(list, objective) {
    if (objective) this.ui.objective(objective);
    await this.until(() => list.every(c => c.done || c.failed));
    return list.filter(c => c.done).length;
  }
  notebook(pos, entry) {
    const mesh = M.notebook(); mesh.position.copy(pos).setY(pos.y + 1);
    this.scene.add(mesh);
    this.notebooks.push({ mesh, entry, y: pos.y + 1 });
  }
  mine(pos) {
    const mesh = M.mine(); mesh.position.copy(pos);
    this.scene.add(mesh);
    this.mines.push({ mesh, pos: pos.clone(), t: -1 });
  }
  setCheckpoint(pos) { this.checkpoint = pos.clone(); }
  fail(reason) {
    if (this.failed) return;
    this.failed = true;
    this.control = false;
    this.audio.sfx('fail');
    this.ui.toast(reason, 'red');
    this.wait(1.4).then(() => this.onGameOver?.(reason)).catch(() => {});
  }

  projectile(o) {
    let mesh;
    if (o.wind) {
      mesh = new THREE.Mesh(new THREE.TorusGeometry(o.size, o.size * 0.25, 6, 16), new THREE.MeshBasicMaterial({ color: o.color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
      mesh.lookAt(o.vel.clone());
    } else {
      mesh = new THREE.Mesh(new THREE.SphereGeometry(o.size, 10, 8), new THREE.MeshBasicMaterial({ color: o.color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      const core = new THREE.Mesh(new THREE.SphereGeometry(o.size * 0.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      mesh.add(core);
    }
    mesh.position.copy(o.pos);
    this.scene.add(mesh);
    const pr = { ...o, mesh, pos: mesh.position, hit: new Set() };
    this.projectiles.push(pr);
    return pr;
  }

  spikes(pos, r, color = 0x8a7a6a, quiet = false) {
    const g = new THREE.Group(); g.position.copy(pos).setY(this.groundAt(pos.x, pos.z, pos.y + 0.5));
    for (let i = 0; i < 7; i++) {
      const s = M.part(g, M.G.cone(0.25 * r, 2.2 * r, 5), color, (Math.random() - 0.5) * r, 0, (Math.random() - 0.5) * r, 0.03);
      s.rotation.set((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6);
    }
    this.scene.add(g);
    const y0 = g.position.y;
    this.fx.items.push({ m: g, life: 1.2, max: 1.2, upd: (it, k) => { g.position.y = y0 + (k < 0.15 ? -2 * r + (k / 0.15) * 2 * r : k > 0.75 ? -(k - 0.75) * 8 * r : 0); } });
    this.fx.burst(pos.clone(), color === 0xb8e8ff ? 0xe0f4ff : 0x9a9080, 8, 6, { size: 0.2 });
    if (!quiet) this.shake(0.2);
  }

  groundWave(pos, a) {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: a.color || 0x9a40ff, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.copy(pos).setY(0.08);
    this.scene.add(mesh);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1.2, 48, 1, true), new THREE.MeshBasicMaterial({ color: a.color || 0x9a40ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    wall.position.y = 0; mesh.add(wall); wall.rotation.x = Math.PI / 2; wall.position.z = 0.6;
    this.waves.push({ mesh, wall, pos: pos.clone(), r: 1, speed: a.speed || 11, max: a.radius || 26, dmg: a.dmg, hit: false });
  }

  async reach(pos, r = 2.5, label) {
    if (label) this.ui.objective(label);
    const g = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x7dff9a, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    beam.position.y = 15; g.add(beam);
    const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.8, r, 32), new THREE.MeshBasicMaterial({ color: 0x7dff9a, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
    g.position.copy(pos);
    this.scene.add(g); this.beacon = g;
    await this.until(() => Math.hypot(this.player.pos.x - pos.x, this.player.pos.z - pos.z) < r);
    this.scene.remove(g); this.beacon = null;
  }

  // ------------------------------------------------ cinema
  shot(pos, look, snap = false) {
    this.cine = { pos: pos.clone(), look: look.clone(), k: snap ? 1 : 3 };
    if (snap) { this.camPos.copy(pos); this.camLook.copy(look); }
  }
  shotOn(actor, { dist = 3.2, side = 1.2, h = 0.3, snap = false } = {}) {
    const a = actor.pos, f = actor.fwd(), head = (actor.rig.height || 1.7) * 0.9;
    const r = new V(f.z, 0, -f.x);
    this.shot(new V(a.x + f.x * dist + r.x * side, a.y + head + h, a.z + f.z * dist + r.z * side), new V(a.x, a.y + head - 0.1, a.z), snap);
  }
  freeCam() { this.cine = null; }
  async cinema(on) {
    this.control = !on; this.ui.letterbox(on);
    const p = this.player;
    if (!p) return;
    p.locked = on;
    if (on) { p.go('cine'); this.ui.charge(-1); }
    else { if (p.state === 'cine') p.go('idle'); p.cinePose = null; }
  }

  async say(lines) {
    const wasCine = this.ui.isLetterbox();
    if (!wasCine) await this.cinema(true);
    for (const L of lines) {
      this.check();
      if (L.cam) this.shotOn(L.cam, L.shot || {});
      if (L.pose && L.cam) L.cam.pose = L.pose;
      if (L.do) L.do();
      if (L.sfx) this.audio.sfx(L.sfx);
      this.ui.dialog(L.who, L.text, L.color);
      this.audio.sfx('blip');
      await this.until(() => this.ui.dialogDone);
    }
    this.ui.closeDialog();
    if (!wasCine) { await this.cinema(false); this.freeCam(); }
  }

  async qte(kind, o = {}) {
    const prevCtrl = this.control;
    this.control = false;
    this.player.locked = true;
    const I = this.input;
    let ok = false;
    if (kind === 'mash') {
      let v = o.start ?? 0.3, t = o.time ?? 6;
      this.ui.qteShow('mash', { label: o.label || 'J', title: o.title });
      await this.until(() => {
        const dt = this._dt;
        t -= dt;
        if (I.pressed(o.key || 'attack') || (o.alt && I.pressed(o.alt))) { v += o.gain ?? 0.06; this.audio.sfx('punch'); this.shake(0.08); o.onPress?.(v); }
        v -= (o.drain ?? 0.15) * dt;
        v = Math.max(0, Math.min(1, v));
        this.ui.qteUpdate(v, t / (o.time ?? 6));
        o.onTick?.(v, dt);
        if (v >= 1) { ok = true; return true; }
        return t <= 0;
      });
    } else if (kind === 'timing') {
      // anel que encolhe: aperte quando ele encaixar
      let k = 0, tries = o.tries ?? 2;
      const sp = o.speed ?? 0.9;
      this.ui.qteShow('timing', { label: o.label || 'K', title: o.title });
      await this.until(() => {
        k += this._dt * sp;
        if (k > 1.25) { k = 0; tries--; this.audio.sfx('warn'); if (tries <= 0) return true; }
        this.ui.qteUpdate(1 - k, 1);
        if (I.pressed(o.key || 'smash')) {
          if (Math.abs(k - 1) < 0.12) { ok = true; return true; }
          tries--; this.audio.sfx('warn'); this.ui.toast('Cedo/tarde demais!', 'red'); k = 0;
          if (tries <= 0) return true;
        }
        return false;
      });
    } else if (kind === 'hold') {
      // segure e solte na faixa dourada
      let k = 0, dirn = 1, holding = false;
      this.ui.qteShow('hold', { label: o.label || 'K', title: o.title });
      await this.until(() => {
        if (I.held(o.key || 'smash')) { holding = true; k += dirn * this._dt * (o.speed ?? 0.9); if (k > 1) { k = 1; dirn = -1; } if (k < 0) { k = 0; dirn = 1; } }
        this.ui.qteUpdate(k, 1);
        if (holding && !I.held(o.key || 'smash')) { ok = k > 0.8; if (!ok) { this.ui.toast('Mais força!', 'red'); holding = false; k = 0; dirn = 1; this.audio.sfx('warn'); return o.once; } return true; }
        return false;
      });
    }
    this.ui.qteHide(ok);
    this.audio.sfx(ok ? 'select' : 'fail');
    this.control = prevCtrl;
    this.player.locked = false;
    return ok;
  }

  timerStart(sec, onEnd) { this.countdown = { t: sec, onEnd }; }

  // ------------------------------------------------ corrida automática (Kamino)
  async autorun({ length = 380, speed = 15, obstacles = 'kamino', objective } = {}) {
    if (objective) this.ui.objective(objective);
    const p = this.player;
    const R = { objs: [], dist: 0, length, speed, next: 30, lane: 0 };
    this.runner = R;
    p.state = 'run';
    const rnd = Math.random;
    const mk = (z) => {
      const r = rnd();
      let o;
      if (r < 0.35) { // destroço baixo: pular
        const m = new THREE.Group(); M.part(m, M.G.box(5 + rnd() * 4, 1, 1.2), 0x6a6460, 0, 0.5, 0, 0.04);
        o = { mesh: m, kind: 'low', w: 4.5, h: 1.1 };
        m.position.set((rnd() - 0.5) * 6, 0, z);
      } else if (r < 0.7) { // bloco alto: desviar
        const m = new THREE.Group(); M.part(m, M.G.box(2.4, 4, 2), 0x4a4650, 0, 2, 0, 0.05);
        o = { mesh: m, kind: 'tall', w: 1.3, h: 9 };
        m.position.set((rnd() - 0.5) * 10, 0, z);
      } else if (r < 0.85) { // Nomu bloqueando: soco
        const n = M.nomu({ scale: 1.1, color: 0x3a2a3a });
        n.root.rotation.y = 0;
        o = { mesh: n.root, kind: 'nomu', w: 1.0, h: 9, rig: n };
        n.root.position.set((rnd() - 0.5) * 8, 0, z);
      } else { // escombro caindo
        const m = new THREE.Group(); M.part(m, M.G.box(1.6, 1.6, 1.6), 0x7a6a5a, 0, 0, 0, 0.04);
        const x = (rnd() - 0.5) * 10;
        m.position.set(x, 18, z);
        o = { mesh: m, kind: 'fall', w: 1.4, h: 9, tele: this.fx.telegraph(new V(x, 0, z), 1.6, 2.5) };
      }
      this.scene.add(o.mesh);
      R.objs.push(o);
    };
    await this.until(() => {
      const dt = this._dt;
      const I = this.input;
      R.dist += speed * dt;
      p.pos.z -= speed * dt;
      const tx = I.axis.x * 9;
      p.vel.x += (tx - p.vel.x) * Math.min(1, 10 * dt);
      p.pos.x = Math.max(-6, Math.min(6, p.pos.x + p.vel.x * dt));
      p.vel.y -= 34 * dt; p.pos.y += p.vel.y * dt;
      if (p.pos.y <= 0) { p.pos.y = 0; p.vel.y = 0; p.onGround = true; } else p.onGround = false;
      if (this.control && I.pressed('jump') && p.onGround) { p.vel.y = 12.5; this.audio.sfx('jump'); }
      if (this.control && I.pressed('attack')) { p.punchT = 0.25; this.audio.sfx('whoosh'); }
      p.punchT = Math.max(0, (p.punchT || 0) - dt);
      p.inv = Math.max(0, p.inv - dt);
      p.yaw = Math.PI; p.root.rotation.y = Math.PI;
      p.anim.apply(p.punchT > 0 ? POSES.jab(1 - p.punchT / 0.25, 1) : !p.onGround ? POSES.jump(0, p.vel.y) : POSES.dash(this.time), dt, 20);
      this.fx.lightning(p.pos, 0.55, 1.9, true, 0.5);
      while (R.next < R.dist + 90 && R.next < length - 20) { mk(p.pos.z - (R.next - R.dist)); R.next += 9 + rnd() * 8; }
      for (const o of R.objs) {
        if (o.dead) continue;
        if (o.kind === 'fall') { o.mesh.position.y = Math.max(0.8, o.mesh.position.y - (o.mesh.position.z > p.pos.z - 40 ? 14 * dt : 0)); }
        if (o.rig) { o.mesh.rotation.y = 0; }
        const dz = Math.abs(o.mesh.position.z - p.pos.z), dx = Math.abs(o.mesh.position.x - p.pos.x);
        if (o.kind === 'nomu' && p.punchT > 0 && dz < 2.6 && dx < 2) {
          o.dead = true; this.scene.remove(o.mesh); this.fx.hitSpark(o.mesh.position.clone().setY(1.5), true); this.audio.sfx('heavy'); this.ui.smashText('SMASH!', true); this.hitstop(0.06); this.score += 300; continue;
        }
        if (dz < 0.9 && dx < o.w && p.pos.y < o.h && p.inv <= 0 && (o.kind !== 'fall' || o.mesh.position.y < 2.5)) {
          p.hp -= 12; p.inv = 1.0; this.ui.hp(p.hp / p.kit.maxHp, true); this.audio.sfx('hurt'); this.shake(0.3);
          if (p.hp <= 0) { p.hp = 1; this.ui.toast('Aguente firme!', 'red'); }
          R.dist -= 4; p.pos.z += 4;
        }
        if (o.mesh.position.z > p.pos.z + 15) { o.dead = true; this.scene.remove(o.mesh); }
      }
      this.ui.objective(`${objective || 'Corra!'} — ${Math.max(0, Math.ceil(length - R.dist))}m`);
      return R.dist >= length;
    });
    R.objs.forEach(o => this.scene.remove(o.mesh));
    this.runner = null;
  }

  // ------------------------------------------------ loop
  snapCam() { this.updateCamera(1, true); }
  updateCamera(dt, snap = false) {
    const p = this.player;
    if (!p) return;
    let pos, look;
    if (this.cine) {
      pos = this.cine.pos; look = this.cine.look;
      const k = snap ? 1 : 1 - Math.exp(-this.cine.k * dt);
      this.camPos.lerp(pos, k); this.camLook.lerp(look, k);
    } else {
      if (this.control) this.camYaw -= this.input.cam * 2.4 * dt;
      look = p.pos.clone().add(new V(0, 1.3, 0));
      let D = this.camDist, H = this.camH;
      const b = this.player.lock || this.curBoss;
      if (b && b.alive && b.state !== 'dead') {
        const d = b.pos.distanceTo(p.pos);
        if (d < 30) { look.lerp(b.pos.clone().setY(b.pos.y + (b.rig.height || 2) * 0.5), Math.min(0.25, 3 / (d + 1))); D += Math.min(5, d * 0.2); H += Math.min(2, d * 0.07); }
      }
      if (this.runner) { D = 7; H = 3.2; look.z -= 4; }
      pos = look.clone().add(new V(Math.sin(this.camYaw) * D, H, Math.cos(this.camYaw) * D));
      const k = snap ? 1 : 1 - Math.exp(-6 * dt);
      this.camPos.lerp(pos, k); this.camLook.lerp(look, 1 - Math.exp(-10 * dt) || 1);
      if (snap) this.camLook.copy(look);
    }
    this.camera.position.copy(this.camPos);
    const cb = this.env.camBox;
    if (cb && !this.cine) {
      const c = this.camera.position;
      c.x = Math.max(cb.minX, Math.min(cb.maxX, c.x)); c.z = Math.max(cb.minZ, Math.min(cb.maxZ, c.z)); c.y = Math.min(cb.maxY, c.y);
    }
    if (this._shake > 0) {
      const s = this._shake * 0.5;
      this.camera.position.add(new V((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s));
    }
    this.camera.lookAt(this.camLook);
    this.fovAdd = Math.max(0, this.fovAdd - dt * 30);
    const f = this.fov + this.fovAdd;
    if (Math.abs(this.camera.fov - f) > 0.05) { this.camera.fov = f; this.camera.updateProjectionMatrix(); }
  }

  frame() {
    let dt = Math.min(0.05, this.clock.getDelta());
    this.input.poll();
    this.ui.tick?.(dt, this.input, this);
    if (!this.running || this.paused) { this.render(dt, true); return; }
    if (this.input.pressed('pause') && this.onPause) { this.onPause(); return; }
    if (this.slowT > 0) { this.slowT -= dt; if (this.slowT <= 0) this.timeScale = 1; }
    let gdt = dt * this.timeScale;
    if (this._hitstop > 0) { this._hitstop -= dt; gdt = 0; }
    this._dt = gdt;
    this.time += gdt;
    this.stageTime += gdt;
    // tempos de roteiro
    for (let i = this.timers.length - 1; i >= 0; i--) { const t = this.timers[i]; t.t -= gdt; if (t.t <= 0) { this.timers.splice(i, 1); t.res(); } }
    for (let i = this.waiters.length - 1; i >= 0; i--) { const w = this.waiters[i]; let r; try { r = w.fn(); } catch (e) { console.error(e); r = true; } if (r) { this.waiters.splice(i, 1); w.res(r); } }
    if (this.aborted) { this.render(dt); return; }
    const p = this.player;
    if (p && !this.runner) p.update(gdt);
    for (const e of this.enemies) e.update(gdt);
    this.enemies = this.enemies.filter(e => e.alive);
    for (const n of this.npcs) n.update(gdt);
    this.updateProjectiles(gdt);
    this.updateWaves(gdt);
    this.updatePickups(gdt);
    this.updateHazards(gdt);
    this.updateSystems(gdt);
    if (this.countdown && this.control) {
      this.countdown.t -= gdt;
      this.ui.timer(Math.max(0, this.countdown.t));
      if (this.countdown.t <= 0) { const c = this.countdown; this.countdown = null; this.ui.timer(null); c.onEnd?.(); }
    }
    if (p) this.ui.gauge(p.gauge);
    this.env.update(gdt, this.time);
    this.render(dt);
  }
  render(dt, idle = false) {
    if (this.player && !idle) {
      this.updateCamera(dt);
      const s = this.env.sun;
      if (s) { s.position.copy(this.player.pos).add(this.env.sunOffset); s.target.position.copy(this.player.pos); }
      this.fx.update(this._dt ?? dt, this.player.pos);
      this._shake = Math.max(0, this._shake - dt * 2.2);
      if (this.env.skyMesh) this.env.skyMesh.position.copy(this.camera.position);
    } else if (idle && this.titleCam) this.titleCam(dt);
    this.r.render(dt);
  }

  updateSystems(dt) {
    const p = this.player;
    if (!p) return;
    // abismo: volta ao último ponto seguro
    if (this.env.killY !== undefined && p.pos.y < this.env.killY && p.state !== 'dead') {
      p.pos.copy(this.checkpoint || this.env.anchors.start); p.vel.set(0, 0, 0);
      p.hurt(10, null, 0); if (p.state !== 'dead') { p.go('idle'); p.inv = 1.2; }
      this.ui.toast('Você caiu! De volta ao ponto de controle', 'red');
      this.snapCam();
    }
    // ring-out no Festival
    const ring = this.env.ring;
    if (ring && this.control && p.onGround && p.state !== 'cine') {
      const out = p.pos.x < ring.minX || p.pos.x > ring.maxX || p.pos.z < ring.minZ || p.pos.z > ring.maxZ;
      this.ringOutT = out ? this.ringOutT + dt : 0;
      if (out) this.ui.objective('FORA DO RINGUE! Volte já!');
      if (this.ringOutT > 0.6) { this.flags.ringOut = true; this.fail('FORA DO RINGUE! Midnight declara a derrota.'); }
    }
    // resgates: fique perto até a barra encher
    for (const c of this.rescues) {
      if (c.done || c.failed) continue;
      c.icon.rotation.y += dt * 3; c.icon.position.y = 2.4 + Math.sin(this.time * 4) * 0.15;
      if (c.time) { c.time -= dt; if (c.time <= 0) { c.failed = true; this.scene.remove(c.marker); this.ui.toast(`${c.label} não resistiu...`, 'red'); continue; } }
      const near = p.pos.distanceTo(c.n.pos) < 1.8 && this.control;
      c.prog = Math.max(0, Math.min(1, c.prog + (near ? dt / 1.1 : -dt)));
      c.ring.scale.setScalar(1 + (near ? Math.sin(this.time * 12) * 0.05 : 0));
      c.ring.material.color.set(near ? 0x7dff9a : 0x5ad0ff);
      if (c.prog >= 1) {
        c.done = true; this.scene.remove(c.marker);
        p.stats.rescued = (p.stats.rescued || 0) + 1;
        this.score += 500;
        this.audio.sfx('clear'); this.ui.toast(`${c.label} resgatado!`, 'green');
        p.addStyle('rescue', 3); p.heal(6);
        c.n.pose = 'calm';
        const away = c.n.pos.clone().add(new V((Math.random() - 0.5) * 30, 0, 30));
        c.n.walkTo(away, 6).then(() => this.removeNpc(c.n));
        this.onRescue?.(c);
      }
    }
    this.ui.rescues(this.rescues.filter(c => !c.done && !c.failed).map(c => ({ ...this.toScreen(c.n.center.clone().setY(c.n.pos.y + 2.2)), prog: c.prog, time: c.time })));
    // páginas do caderno
    for (let i = this.notebooks.length - 1; i >= 0; i--) {
      const n = this.notebooks[i];
      n.mesh.rotation.y += dt * 1.5; n.mesh.position.y = n.y + Math.sin(this.time * 2) * 0.2;
      if (p.pos.distanceTo(n.mesh.position) < 1.7) {
        this.scene.remove(n.mesh); this.notebooks.splice(i, 1);
        p.stats.notebooks = (p.stats.notebooks || 0) + 1;
        this.audio.sfx('pickup'); this.audio.sfx('select');
        this.ui.notebookCard(n.entry);
        this.onNotebook?.(n.entry);
      }
    }
    // minas do Festival: arremessam quem pisa
    for (const m of this.mines) {
      if (m.gone) continue;
      m.mesh.userData.led.material.color.set(m.t >= 0 && Math.floor(this.time * 20) % 2 ? 0xffffff : 0xff5ac8);
      if (m.t < 0 && Math.hypot(p.pos.x - m.pos.x, p.pos.z - m.pos.z) < 1.0 && p.pos.y - m.pos.y < 0.5) { m.t = 0; this.audio.sfx('warn'); }
      if (m.t >= 0) {
        m.t += dt;
        if (m.t > 0.3) {
          m.gone = true; this.scene.remove(m.mesh);
          this.fx.burst(m.pos.clone().setY(m.pos.y + 0.3), [0xff5ac8, 0xffd0f0, 0xffffff], 22, 10, { size: 0.2, add: true });
          this.fx.shockwave(m.pos.clone().setY(m.pos.y + 0.2), 0xff8ad8, 3, 0.35);
          this.audio.sfx('explode'); this.shake(0.3);
          const d = Math.hypot(p.pos.x - m.pos.x, p.pos.z - m.pos.z);
          if (d < 2.2 && p.state !== 'dead') {
            const f = p.fwd();
            p.go('air'); p.vel.set(f.x * 9, 14, f.z * 9); p.onGround = false;
            if (p.inv <= 0) { p.hp = Math.max(1, p.hp - 4); this.ui.hp(p.hp / p.kit.maxHp, true); }
            p.stats.mines = (p.stats.mines || 0) + 1;
          }
        }
      }
    }
    // retícula do alvo travado
    if (p.lock && p.lock.alive) { const s = this.toScreen(p.lock.center.clone()); this.ui.lockPos(s); }
    if (p.style.rank && 'DCBAS'.indexOf(p.style.rank) > 'DCBAS'.indexOf(p.bestStyle || 'D')) p.bestStyle = p.style.rank;
  }

  updateProjectiles(dt) {
    const p = this.player;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const q = this.projectiles[i];
      q.life -= dt;
      if (q.grav) q.vel.y -= q.grav * dt;
      q.pos.addScaledVector(q.vel, dt);
      if (q.wind) q.mesh.scale.multiplyScalar(1 + dt * 2);
      let dead = q.life <= 0;
      if (q.owner === 'player') {
        for (const e of this.enemies) {
          if (!e.alive || q.hit.has(e) || e.def.ghost) continue;
          const c = e.center;
          if (c.distanceTo(q.pos) < q.radius + e.radius + 0.5) {
            q.hit.add(e);
            const dir = q.vel.clone().setY(0).normalize();
            e.damage(q.dmg * p.power, dir, q.kb, { launch: 3, stun: 0.6, smash: !!q.smash, from: p });
            this.fx.hitSpark(c.clone(), true); this.audio.sfx('hit'); this.hitstop(0.04);
            p.addGauge(0.03); p.addStyle('proj', 1.2);
            if (!q.pierce) { dead = true; break; }
          }
        }
      } else if (p && p.state !== 'dead') {
        if (p.center.distanceTo(q.pos) < q.radius + 0.45) { const hit = p.hurt(q.dmg * this.diff, q.pos, q.kb, { ...(q.onHit || {}), attacker: q.attacker }); if (!q.pierce && hit) dead = true; }
        if (q.trail && Math.random() < 0.9) this.fx.glow(q.pos.clone(), q.color, { size: 0.6, life: 0.25 });
      }
      if (q.pos.y < this.groundAt(q.pos.x, q.pos.z, q.pos.y) + 0.05 && q.vel.y <= 0) {
        if (q.blast) {
          if (p && p.pos.distanceTo(q.pos) < q.blast + 0.4) p.hurt(q.dmg * this.diff, q.pos, 6);
          this.fx.burst(q.pos.clone(), [0xffa020, 0xffe060], 12, 6, { size: 0.18 });
          this.fx.shockwave(q.pos.clone().setY(0.1), 0xffa040, q.blast, 0.3);
          this.audio.sfx('explode');
        }
        dead = true;
      }
      if (dead) { this.scene.remove(q.mesh); this.projectiles.splice(i, 1); }
    }
  }
  updateWaves(dt) {
    const p = this.player;
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.r += w.speed * dt;
      w.mesh.scale.set(w.r, w.r, 1);
      w.mesh.material.opacity = 0.85 * (1 - w.r / w.max);
      if (p && !w.hit && p.state !== 'dead') {
        const d = Math.hypot(p.pos.x - w.pos.x, p.pos.z - w.pos.z);
        if (Math.abs(d - w.r) < 0.7 && p.pos.y < 0.9) { w.hit = true; p.hurt(w.dmg * this.diff, w.pos, 6, { down: true }); }
      }
      if (Math.random() < 0.3) { const a = Math.random() * 6.28; this.fx.particle(new V(w.pos.x + Math.cos(a) * w.r, 0.2, w.pos.z + Math.sin(a) * w.r), w.mesh.material.color.getHex(), { vel: new V(0, 3, 0), size: 0.2, life: 0.5, grav: 0 }); }
      if (w.r >= w.max) { this.scene.remove(w.mesh); this.waves.splice(i, 1); }
    }
  }
  updatePickups(dt) {
    const p = this.player;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const k = this.pickups[i];
      k.t += dt;
      k.mesh.rotation.y += dt * 2; k.mesh.position.y = (k.y ?? 0.6) + Math.sin(k.t * 3) * 0.15;
      if (p && p.pos.distanceTo(k.mesh.position) < 1.4) { p.heal(22); this.audio.sfx('pickup'); this.ui.toast('+ Onigiri do Lunch Rush!', 'green'); this.scene.remove(k.mesh); this.pickups.splice(i, 1); }
      else if (k.t > 20) { this.scene.remove(k.mesh); this.pickups.splice(i, 1); }
    }
  }
  updateHazards(dt) {
    const p = this.player;
    if (!p || !this.control) return;
    this._hz = (this._hz || 0) - dt;
    for (const h of this.env.hazards) {
      if (Math.hypot(p.pos.x - h.x, p.pos.z - h.z) < h.r && p.pos.y < 1.2 && this._hz <= 0) {
        this._hz = 0.7;
        p.hurt(h.dmg, new V(h.x, 0, h.z), 6);
        if (h.kind === 'gas') this.ui.toast('Gás do Mustard! Saia daí!', 'red');
      }
    }
  }

  onPlayerDeath() {
    this.control = false;
    this.failed = true;
    this.audio.sfx('fail');
    this.wait(1.6).then(() => this.onGameOver?.()).catch(() => {});
  }
}

export { ENEMIES };
