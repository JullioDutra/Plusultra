// Personagens em cena: jogador, inimigos/chefes (padrões de ataque data-driven), NPCs e projéteis.
import * as THREE from 'three';
import { Animator, POSES } from './anim.js';
import * as M from './models.js';

const V = THREE.Vector3;
const tmp = new V();
const angLerp = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * k; };

export class Actor {
  constructor(world, rig, { radius = 0.45, scale = 1 } = {}) {
    this.w = world;
    this.rig = rig;
    this.root = rig.root;
    this.anim = rig.body ? new Animator(rig) : null;
    this.pos = this.root.position;
    this.vel = new V();
    this.yaw = 0;
    this.onGround = true;
    this.radius = radius;
    this.t = Math.random() * 10;
    this.alive = true;
    this.grav = 1;
    world.scene.add(this.root);
  }
  get center() { return tmp.set(this.pos.x, this.pos.y + (this.rig.height || 1.6) * 0.55, this.pos.z); }
  face(x, z, k = 1) { if (Math.abs(x) + Math.abs(z) < 1e-4) return; this.yaw = angLerp(this.yaw, Math.atan2(x, z), k); this.root.rotation.y = this.yaw; }
  faceTo(p, k = 1) { this.face(p.x - this.pos.x, p.z - this.pos.z, k); }
  fwd() { return new V(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  physics(dt) {
    const w = this.w;
    this.vel.y -= 34 * this.grav * dt;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    const cols = w.allColliders();
    for (const c of cols) {
      if (c.top <= this.pos.y + 0.4) continue;
      const cx = Math.max(c.minX, Math.min(this.pos.x, c.maxX)), cz = Math.max(c.minZ, Math.min(this.pos.z, c.maxZ));
      const dx = this.pos.x - cx, dz = this.pos.z - cz, d2 = dx * dx + dz * dz;
      if (d2 < this.radius * this.radius) {
        if (d2 > 1e-6) { const d = Math.sqrt(d2), p = (this.radius - d) / d; this.pos.x += dx * p; this.pos.z += dz * p; }
        else { // dentro: empurra pela menor saída
          const o = [this.pos.x - c.minX, c.maxX - this.pos.x, this.pos.z - c.minZ, c.maxZ - this.pos.z];
          const m = Math.min(...o), i = o.indexOf(m);
          if (i === 0) this.pos.x = c.minX - this.radius; else if (i === 1) this.pos.x = c.maxX + this.radius; else if (i === 2) this.pos.z = c.minZ - this.radius; else this.pos.z = c.maxZ + this.radius;
        }
      }
    }
    const b = w.env.bounds;
    if (!this.noBounds) {
      this.pos.x = Math.max(b.minX, Math.min(b.maxX, this.pos.x));
      this.pos.z = Math.max(b.minZ, Math.min(b.maxZ, this.pos.z));
    }
    this.pos.y += this.vel.y * dt;
    const g = w.groundAt(this.pos.x, this.pos.z, this.pos.y);
    const was = this.onGround;
    if (this.pos.y <= g) {
      this.pos.y = g;
      this.landed = !was && this.vel.y < -2;
      if (this.vel.y < 0) this.vel.y = 0;
      this.onGround = true;
    } else { this.onGround = this.pos.y - g < 0.02; this.landed = false; }
  }
  remove() { this.alive = false; this.w.scene.remove(this.root); }
}

// ---------------------------------------------------------------- Jogador
const COMBO = [
  { pose: 'jab', side: 1, dur: 0.26, hit: 0.08, dmg: 7, range: 1.8, kb: 2.5 },
  { pose: 'jab', side: -1, dur: 0.26, hit: 0.08, dmg: 7, range: 1.8, kb: 2.5 },
  { pose: 'hook', dur: 0.32, hit: 0.11, dmg: 9, range: 1.9, kb: 3 },
  { pose: 'kick', dur: 0.46, hit: 0.15, dmg: 15, range: 2.2, kb: 10, launch: 5, sfx: 'heavy', fin: true },
];

export class Player extends Actor {
  constructor(world, kit) {
    const rig = kit.model === 'allMight' ? M.allMight() : M.deku(kit.outfit || 'hero');
    super(world, rig, { radius: kit.model === 'allMight' ? 0.7 : 0.45 });
    this.kit = Object.assign({ power: 1, maxHp: 100, cowl: 0, special: null, smashName: 'DETROIT SMASH!', recoil: 0, flickCost: 0, shootStyle: false, float: false, speed: 7, jump: 12, canSmash: true, charge: 0.9 }, kit);
    this.hp = this.kit.maxHp;
    this.gauge = kit.gauge ?? 1;
    this.state = 'idle';
    this.st = 0; // tempo no estado
    this.combo = 0; this.queued = false;
    this.inv = 0;
    this.cowlOn = false;
    this.cd = { special: 0 };
    this.airJumps = 0;
    this.locked = false; // controlado por cena
    this.hitSet = new Set();
    this.para = 0;
    this.stats = { dealt: 0, taken: 0, maxCombo: 0 };
    this.chain = 0; this.chainT = 0;
    if (this.kit.cowlAlways) this.setCowl(true);
  }
  get power() { return this.kit.power * (this.cowlOn ? 1 + this.kit.cowl / 55 : 1) * (this.w.eriBoost ? 2.2 : 1); }
  get speed() { return this.kit.speed * (this.cowlOn ? 1.35 + this.kit.cowl / 200 : 1); }

  setCowl(on) {
    if (on && !this.kit.cowl) return;
    this.cowlOn = on;
    if (on) { this.w.audio.sfx('cowl'); this.w.ui.toast(`FULL COWL ${this.w.eriBoost ? 100 : this.kit.cowl}%`, 'green'); }
    this.w.ui.cowl(on ? (this.w.eriBoost ? 100 : this.kit.cowl) : 0);
  }
  addGauge(v) { this.gauge = Math.min(3, this.gauge + v); }

  nearestEnemy(range = 5, cone = -1) {
    let best = null, bd = range;
    const f = this.fwd();
    for (const e of this.w.enemies) {
      if (!e.alive || e.def.ghost) continue;
      const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z, d = Math.hypot(dx, dz) - e.radius;
      if (d < bd && (cone < -0.99 || (dx * f.x + dz * f.z) / (Math.hypot(dx, dz) || 1) > cone)) { bd = d; best = e; }
    }
    return best;
  }
  autoAim(range = 4.5) {
    const e = this.nearestEnemy(range);
    if (e) this.faceTo(e.pos, 1);
    return e;
  }
  inputDir() {
    const I = this.w.input, cy = this.w.camYaw;
    const x = I.axis.x, y = I.axis.y;
    if (!x && !y) return null;
    // câmera olha para -Z quando camYaw = 0
    const fx = -Math.sin(cy), fz = -Math.cos(cy), rx = Math.cos(cy), rz = -Math.sin(cy);
    return new V(rx * x - fx * y, 0, rz * x - fz * y);
  }

  hitCheck(range, dmg, kb, { cone = 0.2, launch = 0, smash = false, radiusAll = false, stun = 0.4 } = {}) {
    const f = this.fwd();
    let hits = 0;
    for (const e of this.w.enemies) {
      if (!e.alive || this.hitSet.has(e) || e.def.ghost) continue;
      const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z, dy = Math.abs(e.pos.y - this.pos.y), d = Math.hypot(dx, dz);
      if (d - e.radius > range || dy > 2.5 + (e.rig.height || 2) * 0.5) continue;
      if (!radiusAll && d > 0.6 && (dx * f.x + dz * f.z) / d < cone) continue;
      this.hitSet.add(e);
      const dir = d > 0.01 ? new V(dx / d, 0, dz / d) : f.clone();
      const dealt = e.damage(dmg * this.power, dir, kb, { launch, smash, stun, from: this });
      if (dealt > 0) {
        hits++;
        this.stats.dealt += dealt;
        this.chain++; this.chainT = 1.6;
        this.stats.maxCombo = Math.max(this.stats.maxCombo, this.chain);
        this.addGauge(this.cowlOn ? 0.07 : 0.045);
      }
    }
    if (hits) this.w.ui.combo(this.chain);
    return hits;
  }

  hurt(dmg, from, kb = 4, opts = {}) {
    if (this.inv > 0 || this.state === 'dead' || this.locked) return false;
    if (this.state === 'dodge') { if (this.st < 0.16 && !this.perfect) { this.perfect = true; this.w.perfectDodge(); } return false; }
    this.hp -= dmg;
    this.stats.taken += dmg;
    this.addGauge(0.08);
    this.chain = 0;
    this.w.audio.sfx('hurt');
    this.w.shake(0.25);
    this.w.fx.burst(this.center, 0xff3030, 8, 5, { size: 0.12, life: 0.35 });
    this.w.ui.hp(this.hp / this.kit.maxHp, true);
    const dir = from ? new V(this.pos.x - from.x, 0, this.pos.z - from.z).normalize() : this.fwd().multiplyScalar(-1);
    if (this.hp <= 0) { this.hp = 0; this.die(); return true; }
    if (opts.paralyze) { this.state = 'para'; this.st = 0; this.para = opts.paralyze; this.vel.set(0, 0, 0); this.w.ui.toast('PARALISADO! Aperte qualquer botão!', 'red'); return true; }
    if (kb > 7 || opts.down) { this.state = 'down'; this.st = 0; this.vel.set(dir.x * kb, 6, dir.z * kb); this.onGround = false; }
    else { this.state = 'hurt'; this.st = 0; this.vel.set(dir.x * kb, 0, dir.z * kb); }
    this.inv = 0.8;
    return true;
  }
  heal(v) { this.hp = Math.min(this.kit.maxHp, this.hp + v); this.w.ui.hp(this.hp / this.kit.maxHp); }
  die() { this.state = 'dead'; this.st = 0; this.vel.set(0, 4, 0); this.w.onPlayerDeath(); }

  go(state) { this.state = state; this.st = 0; this.hitSet.clear(); }

  update(dt) {
    const I = this.w.input;
    this.t += dt; this.st += dt;
    this.inv = Math.max(0, this.inv - dt);
    this.cd.special = Math.max(0, this.cd.special - dt);
    if ((this.chainT -= dt) <= 0 && this.chain) { this.chain = 0; this.w.ui.combo(0); }
    const ctrl = !this.locked && this.w.control;
    const dir = ctrl ? this.inputDir() : null;
    let pose;

    if (ctrl && I.pressed('cowl') && this.kit.cowl && !this.kit.cowlAlways) this.setCowl(!this.cowlOn);

    switch (this.state) {
      case 'idle': case 'run': case 'air': {
        const sp = this.speed;
        const ax = this.onGround ? 1 - Math.exp(-14 * dt) : 1 - Math.exp(-5 * dt);
        const tx = dir ? dir.x * sp : 0, tz = dir ? dir.z * sp : 0;
        this.vel.x += (tx - this.vel.x) * ax; this.vel.z += (tz - this.vel.z) * ax;
        if (dir) this.face(dir.x, dir.z, 1 - Math.exp(-14 * dt));
        if (this.onGround) this.airJumps = 0;
        if (ctrl && I.pressed('jump')) {
          if (this.onGround) { this.vel.y = this.kit.jump * (this.cowlOn ? 1.2 : 1); this.onGround = false; this.w.audio.sfx('jump'); }
          else if ((this.cowlOn || this.kit.float) && this.airJumps < 1) { this.airJumps++; this.vel.y = this.kit.jump; this.w.fx.shockwave(this.pos.clone(), 0x9affb0, 2, 0.3); this.w.audio.sfx('whoosh'); }
        }
        this.grav = (this.kit.float && !this.onGround && I.held('jump') && this.vel.y < 0) ? 0.12 : 1;
        if (ctrl && I.pressed('attack')) {
          if (!this.onGround) { this.go(this.kit.shootStyle ? 'axe' : 'airkick'); if (this.kit.shootStyle) this.vel.y = 6; this.autoAim(5); break; }
          this.combo = 0; this.startAttack(); break;
        }
        if (ctrl && I.pressed('smash') && this.kit.canSmash) { this.go('charge'); this.w.audio.sfx('charge'); break; }
        if (ctrl && I.pressed('dodge')) { this.startDodge(dir); break; }
        if (ctrl && I.pressed('special') && this.kit.special) { this.doSpecial(); break; }
        this.state = !this.onGround ? 'air' : (Math.hypot(this.vel.x, this.vel.z) > 0.8 ? 'run' : 'idle');
        if (this.state === 'air') pose = this.kit.float && this.grav < 1 ? POSES.float(this.t) : POSES.jump(this.t, this.vel.y);
        else if (this.state === 'run') pose = this.cowlOn ? POSES.dash(this.t) : POSES.run(this.t, Math.hypot(this.vel.x, this.vel.z) / 7);
        else pose = POSES.idle(this.t);
        if (this.landed) { this.w.audio.sfx('land'); this.w.fx.burst(this.pos.clone(), 0xb8b0a0, 5, 2, { size: 0.1, life: 0.3 }); }
        break;
      }
      case 'attack': {
        const a = COMBO[this.combo];
        const k = this.st / a.dur;
        pose = POSES[a.pose](k, a.side);
        const f = this.fwd();
        const lunge = this.st < a.hit ? 5 : 0;
        this.vel.x = f.x * lunge; this.vel.z = f.z * lunge;
        if (this.st >= a.hit && !this.didHit) {
          this.didHit = true;
          const n = this.hitCheck(a.range * (this.kit.model === 'allMight' ? 1.3 : 1), a.dmg, a.kb, { launch: a.launch || 0, stun: a.fin ? 0.7 : 0.4 });
          this.w.audio.sfx(n ? (a.sfx || 'hit') : 'whoosh');
          if (n) { this.w.hitstop(a.fin ? 0.09 : 0.05); this.w.fx.hitSpark(this.center.clone().addScaledVector(f, 1.2), a.fin); if (a.fin) this.w.shake(0.2); }
          if (this.cowlOn) this.w.fx.burst(this.center.clone().addScaledVector(f, 1), 0x7dff9a, 4, 4, { add: true, size: 0.08, life: 0.2, grav: 0 });
        }
        if (ctrl && I.pressed('attack') && this.st > a.dur * 0.3) this.queued = true;
        if (ctrl && I.pressed('dodge')) { this.startDodge(dir); break; }
        if (ctrl && I.pressed('smash') && this.st > a.hit) { this.go('charge'); break; }
        if (this.st >= a.dur) {
          if (this.queued && this.combo < COMBO.length - 1) { this.combo++; this.startAttack(true); }
          else { this.go('idle'); this.combo = 0; }
        }
        break;
      }
      case 'airkick': {
        pose = POSES.kick(Math.min(1, this.st / 0.35));
        if (this.st > 0.1 && this.st < 0.3) this.hitCheck(2, 9, 4, { launch: 2 });
        if (this.onGround || this.st > 0.5) this.go('idle');
        break;
      }
      case 'axe': { // Shoot Style: chute machado descendente
        pose = POSES.axeKick(Math.min(1, this.st / 0.25));
        if (this.st > 0.2) { this.vel.y = -26; const f = this.fwd(); this.vel.x = f.x * 6; this.vel.z = f.z * 6; }
        if (this.st > 0.2) this.hitCheck(1.8, 12, 3, { radiusAll: true });
        if (this.onGround && this.st > 0.2) {
          this.hitSet.clear();
          this.hitCheck(3.2, 18, 9, { radiusAll: true, launch: 6 });
          this.w.fx.shockwave(this.pos.clone().setY(this.pos.y + 0.1), 0x9affb0, 4, 0.4);
          this.w.fx.burst(this.pos.clone(), [0xb8b0a0, 0x7dff9a], 14, 7, { size: 0.15 });
          this.w.audio.sfx('heavy'); this.w.shake(0.35); this.w.hitstop(0.06);
          this.vel.set(0, 0, 0);
          this.go('recover');
        }
        break;
      }
      case 'recover': pose = POSES.idle(this.t); this.vel.x *= 0.8; this.vel.z *= 0.8; if (this.st > 0.22) this.go('idle'); break;
      case 'charge': {
        const maxT = this.kit.charge;
        const k = Math.min(1, this.st / maxT);
        pose = POSES.charge(this.t);
        this.vel.x *= 0.85; this.vel.z *= 0.85;
        this.autoAim(7);
        if (dir) this.face(dir.x, dir.z, 0.15);
        this.w.ui.charge(k, this.gauge >= 1);
        if (k >= 1 && this.gauge >= 1 && Math.random() < 0.5) this.w.fx.burst(this.center, this.kit.model === 'allMight' ? 0xfff0a0 : 0x7dff9a, 1, 3, { add: true, grav: 0, size: 0.1, life: 0.3 });
        if (!I.held('smash') || !ctrl) { this.w.ui.charge(-1); this.releaseSmash(k); }
        break;
      }
      case 'smash': {
        pose = this.smashUp ? POSES.uppercut(this.st) : POSES.smash(this.st);
        this.vel.x *= 0.8; this.vel.z *= 0.8;
        if (this.st > this.smashDur) this.go('idle');
        break;
      }
      case 'special': {
        pose = this.kit.special === 'blackwhip' ? POSES.whip(this.st * 3) : POSES.flick(this.st);
        this.vel.x *= 0.7; this.vel.z *= 0.7;
        if (this.st > 0.3) this.go('idle');
        break;
      }
      case 'dodge': {
        const k = this.st / 0.4;
        pose = POSES.roll(k);
        const sp = 13 * (1 - k * 0.6) * (this.cowlOn ? 1.25 : 1);
        this.vel.x = this.dodgeDir.x * sp; this.vel.z = this.dodgeDir.z * sp;
        this.root.rotation.x = 0;
        if (this.st > 0.4) { this.go('idle'); this.inv = 0.05; }
        break;
      }
      case 'hurt': pose = POSES.hurt(this.st); this.vel.x *= 0.88; this.vel.z *= 0.88; if (this.st > 0.35) this.go('idle'); break;
      case 'down': {
        pose = POSES.down();
        if (this.onGround) { this.vel.x *= 0.85; this.vel.z *= 0.85; }
        if (this.st > 1.0) { this.go('idle'); this.inv = 0.9; }
        break;
      }
      case 'para': {
        pose = POSES.paralyzed(this.t);
        this.vel.x = this.vel.z = 0;
        if (I.pressed('attack') || I.pressed('smash') || I.pressed('jump') || I.pressed('dodge')) this.para -= 0.18;
        this.para -= dt;
        if (this.para <= 0) { this.go('idle'); this.inv = 0.6; this.w.ui.toast('Livre!', 'green'); }
        break;
      }
      case 'dead': pose = POSES.down(); this.vel.x *= 0.9; this.vel.z *= 0.9; break;
      case 'cine': pose = this.cinePose ? POSES[this.cinePose](this.t) : POSES.calm(this.t); this.vel.set(0, 0, 0); break;
    }
    if (this.locked && this.state !== 'cine' && this.state !== 'dead' && ['idle', 'run'].includes(this.state)) { this.vel.x *= 0.8; this.vel.z *= 0.8; }
    if (this.state !== 'cine') this.physics(dt);
    if (pose && this.anim) this.anim.apply(pose, dt, this.state === 'attack' || this.state === 'smash' ? 30 : 16);
    // aura do Full Cowl
    const fc = this.cowlOn || this.w.eriBoost;
    this.w.fx.lightning(this.pos, 0.55 * (this.kit.model === 'allMight' ? 1.4 : 1), 1.9, fc, this.w.eriBoost ? 1 : this.kit.cowl / 50);
    if (fc && Math.random() < 0.08) this.w.audio.sfx('zap');
    // piscar durante invencibilidade
    this.rig.body.visible = !(this.inv > 0 && this.state !== 'dodge' && Math.floor(this.t * 20) % 2 === 0);
  }

  startAttack(chain = false) {
    this.go('attack');
    this.didHit = false;
    this.queued = false;
    this.autoAim(4.5);
    if (!chain) this.combo = 0;
  }
  startDodge(dir) {
    this.go('dodge');
    this.perfect = false;
    this.dodgeDir = dir ? dir.clone().normalize() : this.fwd().multiplyScalar(-1);
    if (dir) this.face(dir.x, dir.z, 1);
    this.inv = 0.32;
    this.w.audio.sfx('whoosh');
  }

  releaseSmash(k) {
    const full = k >= 0.98 && this.gauge >= 1;
    this.go('smash');
    this.smashUp = false;
    const f = this.fwd();
    const isAM = this.kit.model === 'allMight';
    if (full) {
      this.gauge -= 1;
      this.smashDur = 0.55;
      const range = isAM ? 6 : 4.5;
      this.w.hitstop(0.12);
      this.hitCheck(range, 48, 18, { cone: -0.2, launch: 9, smash: true, stun: 1 });
      // onda de choque em linha
      for (let i = 1; i <= 4; i++) this.w.fx.shockwave(this.center.clone().addScaledVector(f, i * 1.4), isAM ? 0xfff6c0 : 0xb8ffc8, 1.2 + i * 0.6, 0.35 + i * 0.05, f);
      this.w.fx.burst(this.center.clone().addScaledVector(f, 1.5), [0xffffff, isAM ? 0xffe060 : 0x7dff9a], 30, 16, { size: 0.18, life: 0.5, grav: -2, add: true });
      this.w.fx.flash(this.center.clone().addScaledVector(f, 1.2), 4, 0xffffff, 0.25);
      this.w.audio.sfx('smash');
      this.w.shake(0.7);
      this.w.ui.smashText(this.w.eriBoost ? 'MANCHESTER SMASH!' : this.kit.smashName);
      this.w.speedLines(0.5);
      if (this.kit.recoil && !this.w.eriBoost) { this.hp = Math.max(1, this.hp - this.kit.recoil); this.w.ui.hp(this.hp / this.kit.maxHp, true); this.w.ui.toast('Seu braço não aguenta o poder!', 'red'); }
      this.w.onSmash?.(this);
    } else {
      this.smashDur = 0.35;
      const dmg = 12 + 22 * k;
      const n = this.hitCheck(2.4, dmg, 6 + 8 * k, { launch: k > 0.5 ? 4 : 0, stun: 0.6 });
      this.w.audio.sfx(n ? 'heavy' : 'whoosh');
      if (n) { this.w.hitstop(0.07); this.w.shake(0.25); this.w.fx.hitSpark(this.center.clone().addScaledVector(f, 1.3), true); }
      this.w.fx.shockwave(this.center.clone().addScaledVector(f, 1.2), 0xffffff, 1 + k, 0.25, f);
    }
  }

  doSpecial() {
    const s = this.kit.special;
    if (this.cd.special > 0) return;
    const f = this.fwd();
    const tgt = this.autoAim(s === 'blackwhip' ? 14 : 12);
    const f2 = this.fwd();
    this.go('special');
    if (s === 'delaware' || s === 'airforce') {
      if (s === 'delaware') {
        if (this.hp <= this.kit.flickCost + 1) { this.w.ui.toast('Seus dedos não aguentam mais!', 'red'); this.go('idle'); return; }
        this.hp -= this.kit.flickCost; this.w.ui.hp(this.hp / this.kit.maxHp, true);
      }
      this.cd.special = s === 'delaware' ? 0.9 : 0.45;
      const start = this.center.clone().addScaledVector(f2, 0.8);
      this.w.projectile({ pos: start, vel: f2.clone().multiplyScalar(30), dmg: s === 'delaware' ? 26 : 14, owner: 'player', radius: 0.7, life: 0.6, pierce: true, kb: s === 'delaware' ? 14 : 7, color: 0xe0fff0, size: 0.5, wind: true });
      this.w.fx.shockwave(start, 0xffffff, 1.4, 0.25, f2);
      this.w.audio.sfx('heavy');
      this.w.ui.smashText(s === 'delaware' ? 'DELAWARE SMASH!' : 'SMASH AIR FORCE!', true);
    } else if (s === 'blackwhip') {
      this.cd.special = 0.9;
      if (tgt) {
        const e = tgt;
        this.w.fx.tendrils(this.center.clone(), e.center.clone(), 5);
        this.w.audio.sfx('slash');
        if (e.def.boss || e.def.static) {
          // puxa o Deku até o chefe
          const d = new V(e.pos.x - this.pos.x, 0, e.pos.z - this.pos.z);
          const L = d.length(); d.normalize();
          this.vel.set(d.x * Math.min(30, L * 3), 4, d.z * Math.min(30, L * 3));
          this.state = 'air'; this.st = 0; this.onGround = false;
          e.damage(6 * this.power, d, 0, { stun: 0.3, from: this });
        } else {
          e.pull(this);
        }
        this.w.ui.smashText('BLACKWHIP!', true);
      } else {
        this.w.fx.tendrils(this.center.clone(), this.center.clone().addScaledVector(f, 8), 4);
      }
    } else if (s === 'texas') {
      this.cd.special = 1.6;
      this.hitCheck(7, 30, 16, { cone: 0.4, launch: 3 });
      for (let i = 1; i <= 3; i++) this.w.fx.shockwave(this.center.clone().addScaledVector(f2, i * 2), 0xfff6c0, 2 + i, 0.4, f2);
      this.w.audio.sfx('smash'); this.w.shake(0.5);
      this.w.ui.smashText('TEXAS SMASH!', true);
    }
  }
}

// ---------------------------------------------------------------- Inimigos
export const ENEMIES = {
  thug: { model: () => M.thug(Math.floor(Math.random() * 4)), hp: 40, speed: 3.4, radius: 0.45, attacks: [{ kind: 'melee', range: 1.7, windup: 0.55, dmg: 6, cd: 1.6 }], score: 100 },
  brute: { model: () => M.thug(2), scale: 1.25, hp: 90, speed: 2.6, radius: 0.6, attacks: [{ kind: 'melee', range: 2, windup: 0.7, dmg: 14, cd: 2, kb: 8 }, { kind: 'dash', range: 8, windup: 0.7, dmg: 12, cd: 4, speed: 14, dur: 0.5 }], score: 250, armor: 0.8 },
  water: { model: () => M.waterThug(), hp: 38, speed: 3.6, radius: 0.45, attacks: [{ kind: 'melee', range: 1.7, windup: 0.45, dmg: 8, cd: 1.3 }, { kind: 'projectile', range: 9, windup: 0.6, dmg: 7, cd: 3, speed: 13, color: 0x5ab0ff }], score: 120 },
  robot1: { model: () => M.robot(1), hp: 26, speed: 4.6, radius: 0.55, robot: true, attacks: [{ kind: 'dash', range: 6, windup: 0.6, dmg: 9, cd: 2.2, speed: 13, dur: 0.4 }], score: 1, explode: true },
  robot2: { model: () => M.robot(2), hp: 48, speed: 3.2, radius: 0.85, robot: true, attacks: [{ kind: 'slam', range: 2.3, windup: 0.8, dmg: 12, cd: 2.4, radius: 2.4 }], score: 2, explode: true },
  robot3: { model: () => M.robot(3), hp: 80, speed: 2.2, radius: 1.1, robot: true, attacks: [{ kind: 'projectile', range: 14, windup: 0.9, dmg: 9, cd: 2.8, speed: 11, count: 3, spread: 0.3, color: 0xffa020, arc: true }], score: 3, explode: true, armor: 0.9 },
  nomuFly: { model: () => M.nomu({ wings: true, scale: 1.2, color: 0x2a2a30 }), hp: 80, speed: 4.5, radius: 0.7, fly: 2.5, attacks: [{ kind: 'dive', range: 12, windup: 0.9, dmg: 10, cd: 3.4, radius: 2 }], score: 400 },
  nomuLow: { model: () => M.nomu({ scale: 1.25, color: 0x3a2a3a }), hp: 110, speed: 3.2, radius: 0.75, attacks: [{ kind: 'melee', range: 2.2, windup: 0.6, dmg: 13, cd: 1.8, kb: 7 }, { kind: 'leap', range: 10, windup: 0.8, dmg: 14, cd: 4, radius: 2.5 }], score: 500, armor: 0.7 },
  hassai: { model: () => M.hassaikai(), hp: 52, speed: 3.6, radius: 0.45, attacks: [{ kind: 'melee', range: 1.8, windup: 0.45, dmg: 9, cd: 1.3 }, { kind: 'dash', range: 7, windup: 0.6, dmg: 10, cd: 3.5, speed: 13, dur: 0.4 }], score: 200 },
  trash: { model: () => trashPile(), hp: 30, static: true, radius: 1.0, attacks: [], score: 50 },
  bigTrash: { model: () => trashPile(true), hp: 140, static: true, radius: 2.2, attacks: [], score: 500 },
};

function trashPile(big = false) {
  const g = new THREE.Group();
  const s = big ? 2.2 : 1;
  const cols = [0xd8d8d0, 0x5a5a5a, 0x8a6a4a, 0x3a5a8a, 0x9a3a2a, 0x2a2a2a];
  for (let i = 0; i < (big ? 14 : 5); i++) {
    const kind = i % 4;
    const geo = kind === 0 ? M.G.box(0.7, 1.1, 0.6) : kind === 1 ? M.G.cyl(0.35, 0.35, 0.25, 10) : kind === 2 ? M.G.box(0.8, 0.5, 0.5) : M.G.tor(0.3, 0.12);
    const m = M.part(g, geo, cols[i % cols.length], (Math.random() - 0.5) * 1.2 * s, 0.3 + Math.random() * 0.8 * s, (Math.random() - 0.5) * 1.2 * s, 0.03);
    m.rotation.set(Math.random() * 2, Math.random() * 3, Math.random() * 2);
  }
  return { root: g, height: 1.2 * s };
}

export class Enemy extends Actor {
  constructor(world, type, pos, over = {}) {
    const def = Object.assign({}, typeof type === 'string' ? ENEMIES[type] : type, over);
    let rig = def.model();
    if (rig.isObject3D) rig = { root: rig, height: def.height || 2, userData: rig.userData };
    super(world, rig, { radius: def.radius || 0.5 });
    if (def.scale) rig.root.scale.setScalar(def.scale);
    this.def = def;
    this.type = typeof type === 'string' ? type : def.id;
    this.pos.copy(pos);
    this.maxHp = this.hp = def.hp;
    this.state = def.static ? 'static' : 'spawn';
    this.st = 0;
    this.cd = 0.8 + Math.random() * 1.2;
    this.atk = null;
    this.phase = 0;
    this.stun = 0;
    this.faceTo(world.player ? world.player.pos : new V(), 1);
    if (def.fly) this.pos.y = def.fly;
    if (def.fly) this.grav = 0;
    this.noBounds = !!def.noBounds;
    this.phaseFired = new Set();
    if (!def.static) { this.root.scale.multiplyScalar(0.01); this.spawnScale = def.scale || 1; }
  }

  get attacks() {
    if (!this.def.phases) return this.def.attacks;
    const r = this.hp / this.maxHp;
    let p = this.def.phases[0];
    for (const ph of this.def.phases) if (r <= ph.at) p = ph;
    return p.attacks;
  }

  damage(dmg, dir, kb, { launch = 0, smash = false, stun = 0.4, from, pure = false } = {}) {
    if (!this.alive || this.state === 'dead' || this.invuln) return 0;
    let mult = 1;
    if (this.def.armor && !smash) mult = 1 - this.def.armor * 0.6;
    if (this.def.absorb && !smash) mult = this.def.absorb; // Nomu: absorção de choque
    if (this.def.smashOnly && !smash) mult = 0.12;
    const d = dmg * mult;
    this.hp -= d;
    this.w.onEnemyHit?.(this, d);
    if (this.def.boss) this.w.ui.bossHp(Math.max(0, this.hp) / this.maxHp);
    const heavy = !this.def.superArmor || smash;
    if (!this.def.static && heavy) {
      const k = kb * (this.def.boss ? 0.35 : 1) * (this.def.static ? 0 : 1);
      this.vel.x = dir.x * k; this.vel.z = dir.z * k;
      if (launch && !this.def.boss) { this.vel.y = launch; this.onGround = false; }
      if (this.atk && this.state !== 'attack') this.atk = null;
      if (launch > 3 || kb > 9) { this.go(this.def.boss ? 'stagger' : 'down'); }
      else if (this.state !== 'attack' || !this.def.boss) { this.go('hurt'); this.stun = stun * (this.def.boss ? 0.5 : 1); }
    }
    if (this.def.static) { this.root.rotation.z = (Math.random() - 0.5) * 0.15; this.wob = 0.2; }
    // limiares de fase (eventos de chefe) — só enquanto a luta continua
    if (this.def.phases && this.hp > 0) for (const ph of this.def.phases) if (ph.event && this.hp / this.maxHp <= ph.at && !this.phaseFired.has(ph.at)) { this.phaseFired.add(ph.at); this.w.bossEvent?.(this, ph.event); }
    if (this.hp <= 0) this.kill();
    return d;
  }
  pull(p) {
    const d = new V(p.pos.x - this.pos.x, 0, p.pos.z - this.pos.z);
    const L = d.length(); d.normalize();
    this.vel.set(d.x * Math.max(0, L - 1.5) * 3, 3, d.z * Math.max(0, L - 1.5) * 3);
    this.onGround = false;
    this.go('hurt'); this.stun = 0.9;
  }
  kill() {
    if (this.def.boss && this.def.finisher) { this.hp = 1; this.invuln = true; this.go('stagger'); this.w.bossDefeated?.(this); return; }
    this.state = 'dead'; this.st = 0;
    this.hp = 0;
    this.w.onEnemyKilled(this);
    if (this.def.explode) { this.w.fx.burst(this.center, [0xff8a2a, 0xffd23a, 0x333333], 18, 9, { size: 0.25 }); this.w.audio.sfx('explode'); this.w.fx.flash(this.center, 2, 0xffa040, 0.25); this.remove(); }
    else if (this.def.static) { this.w.fx.burst(this.center, [0xd8d8d0, 0x5a5a5a, 0x8a6a4a], 16, 7, { size: 0.25 }); this.w.audio.sfx('heavy'); this.remove(); }
    else { this.vel.y = Math.max(this.vel.y, 5); this.onGround = false; }
  }
  go(s) { this.state = s; this.st = 0; }

  update(dt) {
    if (!this.alive) return;
    this.t += dt; this.st += dt;
    const p = this.w.player;
    const def = this.def;
    let pose = null;
    if (this.wob) { this.wob -= dt; if (this.wob <= 0) this.root.rotation.z = 0; }
    if (def.static) return;
    const toP = new V(p.pos.x - this.pos.x, 0, p.pos.z - this.pos.z);
    const dist = toP.length();
    switch (this.state) {
      case 'spawn': {
        const k = Math.min(1, this.st / 0.35);
        this.root.scale.setScalar(this.spawnScale * k);
        pose = POSES.idle(this.t);
        if (k >= 1) this.go('chase');
        break;
      }
      case 'idle': case 'chase': {
        this.cd -= dt;
        if (def.passive || !this.w.control) { pose = POSES.idle(this.t); this.vel.x *= 0.8; this.vel.z *= 0.8; break; }
        const atks = this.attacks;
        // escolhe um ataque disponível
        if (this.cd <= 0 && p.state !== 'dead') {
          const opts = atks.filter(a => dist <= a.range && (!a.min || dist >= a.min));
          if (opts.length && this.w.takeToken(this)) {
            const tot = opts.reduce((s, a) => s + (a.weight || 1), 0);
            let r = Math.random() * tot;
            this.atk = opts.find(a => (r -= (a.weight || 1)) <= 0) || opts[0];
            this.startAttack();
            break;
          }
        }
        const keep = def.keep || (atks[0] ? Math.min(...atks.map(a => a.range)) * 0.8 : 1.5);
        let sp = def.speed;
        let mx = 0, mz = 0;
        if (dist > keep) { mx = toP.x / dist; mz = toP.z / dist; }
        else if (dist < keep * 0.5) { mx = -toP.x / dist * 0.5; mz = -toP.z / dist * 0.5; }
        // circula um pouco quando espera
        if (dist < keep * 1.6 && this.cd > 0) { const s = (this.id % 2 ? 1 : -1) * 0.6; mx += -toP.z / dist * s; mz += toP.x / dist * s; sp *= 0.5; }
        // separação entre inimigos
        for (const o of this.w.enemies) if (o !== this && o.alive && !o.def.static) {
          const dx = this.pos.x - o.pos.x, dz = this.pos.z - o.pos.z, d2 = dx * dx + dz * dz, R = this.radius + o.radius + 0.3;
          if (d2 < R * R && d2 > 1e-4) { const d = Math.sqrt(d2); mx += dx / d * 0.8; mz += dz / d * 0.8; }
        }
        this.vel.x += (mx * sp - this.vel.x) * Math.min(1, 8 * dt);
        this.vel.z += (mz * sp - this.vel.z) * Math.min(1, 8 * dt);
        this.faceTo(p.pos, 1 - Math.exp(-8 * dt));
        const spd = Math.hypot(this.vel.x, this.vel.z);
        pose = def.robot ? null : spd > 0.6 ? POSES.run(this.t, spd / 6) : POSES.idle(this.t);
        if (def.fly) { this.pos.y += (def.fly + Math.sin(this.t * 2) * 0.4 - this.pos.y) * Math.min(1, 3 * dt); this.vel.y = 0; pose = POSES.float(this.t); }
        break;
      }
      case 'windup': {
        const a = this.atk;
        const k = Math.min(1, this.st / a.windup);
        pose = a.pose ? POSES[a.pose](k) : (a.kind === 'slam' || a.kind === 'leap' ? POSES.slam(1 - k) : a.kind === 'spikes' ? POSES.touchGround(this.t) : POSES.windup(k));
        this.vel.x *= 0.8; this.vel.z *= 0.8;
        if (a.track !== false) this.faceTo(p.pos, 1 - Math.exp(-6 * dt));
        if (this.st >= a.windup) this.fire();
        if (def.fly) this.vel.y = 0;
        break;
      }
      case 'attack': {
        const a = this.atk;
        pose = a.kind === 'dash' ? POSES.dash(this.t) : a.kind === 'slam' || a.kind === 'leap' ? POSES.slam(1) : POSES.jab(Math.min(1, 0.3 + this.st * 2), 1);
        if (a.kind === 'dash') {
          const f = this.fwd();
          this.vel.x = f.x * a.speed; this.vel.z = f.z * a.speed;
          if (!this.hitDone && dist < this.radius + 1.0 && Math.abs(p.pos.y - this.pos.y) < 1.5) { this.hitDone = true; this.hitPlayer(a); }
          if (Math.random() < 0.5) this.w.fx.particle(this.pos.clone().setY(0.2), 0x9a9080, { vel: new V(0, 1, 0), size: 0.2, life: 0.4, grav: 0 });
          if (this.st >= a.dur) this.recover(a);
        } else if (a.kind === 'leap' || a.kind === 'dive') {
          if (this.onGround && this.st > 0.1 && !def.fly) this.land(a);
          if (def.fly) {
            const tgt = this.leapTo;
            const d = new V(tgt.x - this.pos.x, tgt.y - this.pos.y, tgt.z - this.pos.z);
            if (d.length() < 0.8 || this.st > 1.2) this.land(a);
            else { d.normalize().multiplyScalar(22); this.vel.copy(d); }
          }
        } else if (a.kind === 'beam') {
          if (this.st > (a.dur || 1.2)) this.recover(a);
        } else if (this.st > 0.25) this.recover(a);
        break;
      }
      case 'recover': pose = POSES.idle(this.t); this.vel.x *= 0.85; this.vel.z *= 0.85; if (this.st > (this.atk?.recover ?? 0.5)) { this.go('chase'); this.atk = null; } break;
      case 'hurt': pose = POSES.hurt(this.st); this.vel.x *= 0.9; this.vel.z *= 0.9; if (this.st > this.stun) this.go('chase'); break;
      case 'stagger': pose = POSES.hurt(this.st); this.vel.x *= 0.9; this.vel.z *= 0.9; if (this.st > 0.9 && !this.invuln) this.go('chase'); break;
      case 'down': {
        pose = POSES.down();
        if (this.onGround) { this.vel.x *= 0.85; this.vel.z *= 0.85; }
        if (this.landed) { this.w.fx.burst(this.pos.clone(), 0x9a9080, 6, 3, { size: 0.15 }); this.w.audio.sfx('land'); }
        if (this.st > 1.3) this.go('chase');
        break;
      }
      case 'dead': {
        pose = POSES.down();
        this.vel.x *= 0.9; this.vel.z *= 0.9;
        if (this.st > 1.2) { this.root.scale.multiplyScalar(0.85); }
        if (this.st > 1.6) { this.w.fx.burst(this.center, 0xffffff, 6, 3, { size: 0.12, life: 0.4 }); this.remove(); }
        break;
      }
    }
    if (def.fly && this.state !== 'attack' && this.state !== 'dead' && this.state !== 'down') this.grav = 0; else this.grav = def.flyGrav ?? 1;
    this.physics(dt);
    if (pose && this.anim) this.anim.apply(pose, dt, this.state === 'attack' ? 26 : 14);
    if (def.robot && this.rig.userData?.body) { this.rig.userData.body.rotation.z = Math.sin(this.t * 10) * 0.03 * Math.hypot(this.vel.x, this.vel.z); }
    if (this.rig.wings) this.rig.wings.forEach(w => w.rotation.z = w.userData.wing * (0.3 + Math.sin(this.t * 12) * 0.5));
    if (this.pos.y < -10) this.kill();
  }

  startAttack() {
    const a = this.atk, p = this.w.player;
    this.go('windup');
    this.hitDone = false;
    this.faceTo(p.pos, 1);
    if (a.say) this.w.ui.bark(this.def.name || '', a.say);
    if (a.kind === 'dash') this.tele = this.w.fx.telegraphLine(this.pos.clone(), this.fwd(), a.speed * a.dur, this.radius * 2.2, a.windup);
    else if (a.kind === 'slam') this.tele = this.w.fx.telegraph(this.pos, a.radius, a.windup);
    else if (a.kind === 'leap' || a.kind === 'dive') { this.leapTo = p.pos.clone(); this.tele = this.w.fx.telegraph(this.leapTo, a.radius, a.windup + 0.5); }
    else if (a.kind === 'spikes') {
      this.spikeAt = [p.pos.clone()];
      for (let i = 0; i < (a.count || 3) - 1; i++) this.spikeAt.push(p.pos.clone().add(new V((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8)));
      this.spikeAt.forEach(s => this.w.fx.telegraph(s, a.radius, a.windup));
    } else if (a.kind === 'wave') this.tele = this.w.fx.telegraph(this.pos, 2.5, a.windup, 0xa040ff);
    else if (a.kind === 'melee' && this.def.boss) this.w.fx.telegraph(this.pos.clone().addScaledVector(this.fwd(), a.range * 0.6), a.range * 0.6, a.windup, 0xff8030);
    if (a.kind === 'melee' || a.kind === 'grab') this.w.fx.flash(this.center.clone().setY(this.pos.y + (this.rig.height || 1.8) + 0.4), 0.6, 0xff3030, a.windup);
  }

  fire() {
    const a = this.atk, p = this.w.player;
    this.go('attack');
    const f = this.fwd();
    switch (a.kind) {
      case 'melee': case 'grab': {
        const d = this.pos.distanceTo(p.pos);
        const dot = ((p.pos.x - this.pos.x) * f.x + (p.pos.z - this.pos.z) * f.z) / (d || 1);
        if (d < a.range + 0.4 && dot > 0.2 && Math.abs(p.pos.y - this.pos.y) < 1.8) this.hitPlayer(a);
        this.w.audio.sfx(a.kind === 'grab' || a.slash ? 'slash' : 'whoosh');
        if (a.slash) this.w.fx.shockwave(this.center.clone().addScaledVector(f, 1), 0xd0d8ff, 1.6, 0.2, f);
        break;
      }
      case 'dash': this.w.audio.sfx('whoosh'); break;
      case 'projectile': {
        const n = a.count || 1;
        for (let i = 0; i < n; i++) {
          const ang = (i - (n - 1) / 2) * (a.spread || 0.25);
          const dir = new V(Math.sin(this.yaw + ang), 0, Math.cos(this.yaw + ang));
          const start = this.center.clone().addScaledVector(dir, this.radius + 0.4);
          let vel;
          if (a.arc) {
            const tgt = p.pos.clone().add(new V(Math.sin(ang) * 3, 0, Math.cos(ang) * 3).multiplyScalar(i === (n - 1) / 2 ? 0 : 1));
            const T = Math.max(0.6, start.distanceTo(tgt) / a.speed);
            vel = new V((tgt.x - start.x) / T, (tgt.y - start.y) / T + 0.5 * 20 * T, (tgt.z - start.z) / T);
            this.w.fx.telegraph(tgt, 1.6, T);
          } else {
            const aim = p.center.clone().sub(start).normalize();
            const yaw = Math.atan2(aim.x, aim.z) + ang;
            vel = new V(Math.sin(yaw), aim.y, Math.cos(yaw)).normalize().multiplyScalar(a.speed);
          }
          this.w.projectile({ pos: start, vel, dmg: a.dmg, owner: 'enemy', radius: a.size || 0.4, life: 4, color: a.color || 0xff4040, size: a.size || 0.35, grav: a.arc ? 20 : 0, kb: a.kb || 4, blast: a.arc ? 1.6 : 0, onHit: a.paralyze ? { paralyze: a.paralyze } : null });
        }
        this.w.audio.sfx(a.sfx || 'whoosh');
        break;
      }
      case 'slam': {
        if (p.pos.distanceTo(this.pos) < a.radius + 0.3 && p.pos.y - this.pos.y < 1.5) this.hitPlayer(a);
        this.w.fx.shockwave(this.pos.clone().setY(this.pos.y + 0.1), 0xffd8a0, a.radius, 0.4);
        this.w.fx.burst(this.pos.clone(), 0x9a9080, 14, 6, { size: 0.2 });
        this.w.audio.sfx('heavy'); this.w.shake(0.3);
        break;
      }
      case 'leap': this.vel.set((this.leapTo.x - this.pos.x) / 0.7, 13, (this.leapTo.z - this.pos.z) / 0.7); this.onGround = false; this.w.audio.sfx('jump'); break;
      case 'dive': this.w.audio.sfx('whoosh'); this.grav = 0; break;
      case 'spikes': {
        for (const s of this.spikeAt) {
          this.w.spikes(s, a.radius, a.color);
          if (Math.hypot(p.pos.x - s.x, p.pos.z - s.z) < a.radius + 0.3 && p.pos.y < 2) this.hitPlayer(a, s);
        }
        this.w.audio.sfx('heavy');
        break;
      }
      case 'wave': this.w.groundWave(this.pos.clone(), a); this.w.audio.sfx(a.sfx || 'decay'); break;
      case 'summon': for (let i = 0; i < (a.count || 2); i++) { const ang = Math.random() * 6.28; this.w.spawn(a.type, this.pos.clone().add(new V(Math.cos(ang) * 3, 0, Math.sin(ang) * 3))); } break;
      case 'beam': {
        const dir = new V(p.pos.x - this.pos.x, 0, p.pos.z - this.pos.z).normalize();
        this.w.projectile({ pos: this.center.clone().addScaledVector(dir, 1), vel: dir.multiplyScalar(a.speed || 26), dmg: a.dmg, owner: 'enemy', radius: 1.1, life: 1.2, color: a.color || 0xff3030, size: 1.0, kb: 10, pierce: true });
        this.w.audio.sfx('explode');
        break;
      }
    }
    if (a.next) { this.queuedNext = a.next; }
  }
  land(a) {
    const p = this.w.player;
    if (p.pos.distanceTo(this.pos) < a.radius + 0.4 && p.pos.y - this.pos.y < 1.5) this.hitPlayer(a);
    this.w.fx.shockwave(this.pos.clone().setY(0.1), 0xffd8a0, a.radius + 1, 0.4);
    this.w.fx.burst(this.pos.clone(), 0x9a9080, 16, 7, { size: 0.22 });
    this.w.audio.sfx('heavy'); this.w.shake(0.35);
    this.vel.set(0, 0, 0);
    if (this.def.fly) this.pos.y = Math.max(this.pos.y, 0.5);
    this.recover(a);
  }
  hitPlayer(a, from) {
    const p = this.w.player;
    p.hurt(a.dmg * (this.w.diff || 1), from || this.pos, a.kb || 5, { paralyze: a.paralyze, down: a.down });
  }
  recover(a) {
    this.go('recover');
    this.cd = a.cd * (0.75 + Math.random() * 0.5);
    this.w.releaseToken(this);
    if (a.combo && (this.comboN = (this.comboN || 0) + 1) < a.combo) { this.cd = 0.05; }
    else this.comboN = 0;
  }
}

// ---------------------------------------------------------------- NPC (aliados, falas, cutscenes)
export class Npc extends Actor {
  constructor(world, rig, pos, { pose = 'calm', face = null } = {}) {
    super(world, rig);
    this.pos.copy(pos);
    this.pose = pose;
    this.target = null;
    this.speed = 5;
    if (face) this.faceTo(face, 1);
    this.grav = 1;
  }
  walkTo(p, speed = 5) { this.target = p.clone(); this.speed = speed; return new Promise(r => (this.onArrive = r)); }
  update(dt) {
    this.t += dt;
    let pose = POSES[this.pose] ? POSES[this.pose](this.t) : POSES.calm(this.t);
    if (this.target) {
      const d = new V(this.target.x - this.pos.x, 0, this.target.z - this.pos.z), L = d.length();
      if (L < 0.2) { this.target = null; this.vel.x = this.vel.z = 0; this.onArrive?.(); }
      else { d.normalize(); this.vel.x = d.x * this.speed; this.vel.z = d.z * this.speed; this.face(d.x, d.z, 0.3); pose = POSES.run(this.t, this.speed / 6); }
    } else { this.vel.x *= 0.8; this.vel.z *= 0.8; if (this.lookAt) this.faceTo(this.lookAt.pos || this.lookAt, 0.1); }
    if (this.floating) { this.grav = 0; this.vel.y = 0; }
    this.noBounds = true;
    this.physics(dt);
    if (this.anim && pose) this.anim.apply(pose, dt, 10);
  }
}
