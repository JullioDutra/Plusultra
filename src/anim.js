// Animação procedural por poses: cada estado devolve rotações-alvo das juntas e o Animator interpola.
const J = ['hips', 'torso', 'neck', 'shL', 'elL', 'shR', 'elR', 'hipL', 'knL', 'hipR', 'knR'];

const base = () => ({
  hips: [0, 0, 0], torso: [0, 0, 0], neck: [0, 0, 0],
  shL: [0, 0, 0.12], elL: [0, 0, 0], shR: [0, 0, -0.12], elR: [0, 0, 0],
  hipL: [0, 0, 0], knL: [0, 0, 0], hipR: [0, 0, 0], knR: [0, 0, 0],
  y: 0,
});

export const POSES = {
  idle(t) {
    const p = base(), b = Math.sin(t * 2.2) * 0.03;
    p.shL = [-0.5, 0, 0.25]; p.elL = [-1.5 + b, 0, 0];
    p.shR = [-0.4, 0, -0.25]; p.elR = [-1.6 - b, 0, 0];
    p.hipL = [-0.15, 0, 0.08]; p.knL = [0.3, 0, 0]; p.hipR = [0.15, 0, -0.08]; p.knR = [0.2, 0, 0];
    p.torso = [0.08 + b, 0.15, 0]; p.y = -0.04 + b * 0.5;
    return p;
  },
  calm(t) {
    const p = base(), b = Math.sin(t * 1.8) * 0.02;
    p.torso = [b, 0, 0]; p.shL = [0, 0, 0.12 + b]; p.shR = [0, 0, -0.12 - b];
    return p;
  },
  run(t, speed = 1) {
    const p = base(), w = t * 11 * speed, s = Math.sin(w), c = Math.cos(w);
    p.torso = [0.35, -s * 0.15, 0]; p.neck = [-0.25, s * 0.1, 0];
    p.shL = [s * 1.0, 0, 0.15]; p.elL = [-1.3, 0, 0];
    p.shR = [-s * 1.0, 0, -0.15]; p.elR = [-1.3, 0, 0];
    p.hipL = [-s * 1.0, 0, 0]; p.knL = [Math.max(0, c) * 1.4 + 0.2, 0, 0];
    p.hipR = [s * 1.0, 0, 0]; p.knR = [Math.max(0, -c) * 1.4 + 0.2, 0, 0];
    p.y = Math.abs(c) * 0.08;
    return p;
  },
  // corrida "ninja" com braços para trás (Full Cowl / Iida)
  dash(t) {
    const p = POSES.run(t, 1.3);
    p.torso[0] = 0.6; p.shL = [0.9, 0, 0.3]; p.shR = [0.9, 0, -0.3]; p.elL = [0, 0, 0]; p.elR = [0, 0, 0];
    return p;
  },
  jump(t, vy = 0) {
    const p = base();
    p.shL = [-0.5, 0, 0.9]; p.shR = [-0.5, 0, -0.9]; p.elL = [-0.8, 0, 0]; p.elR = [-0.8, 0, 0];
    p.hipL = [-1.1, 0, 0]; p.knL = [1.6, 0, 0]; p.hipR = [-0.3, 0, 0]; p.knR = [0.6, 0, 0];
    p.torso = [vy > 0 ? 0.1 : 0.25, 0, 0];
    return p;
  },
  float(t) {
    const p = base(), b = Math.sin(t * 3) * 0.1;
    p.shL = [0, 0, 1.2 + b]; p.shR = [0, 0, -1.2 - b]; p.hipL = [-0.2, 0, 0.1]; p.hipR = [0.1, 0, -0.1]; p.knL = [0.4, 0, 0];
    return p;
  },
  jab(k, side = 1) { // k: 0..1 progresso
    const p = POSES.idle(0), e = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65 * 0.6;
    const sh = side > 0 ? 'shR' : 'shL', el = side > 0 ? 'elR' : 'elL';
    p[sh] = [-1.55 * e - 0.3 * (1 - e), 0, -0.1 * side]; p[el] = [-1.5 * (1 - e), 0, 0];
    p.torso = [0.15, -0.6 * e * side, 0];
    return p;
  },
  hook(k) {
    const p = POSES.idle(0), e = Math.sin(Math.min(1, k * 1.6) * Math.PI);
    p.shR = [-1.4, 0.0, -1.2 * e - 0.3]; p.elR = [-0.6, 0, 0]; p.torso = [0.15, 0.6 - 1.4 * e, 0];
    return p;
  },
  kick(k) {
    const p = POSES.idle(0), e = Math.sin(Math.min(1, k * 1.5) * Math.PI);
    p.hipR = [-1.8 * e, 0, -0.2 * e]; p.knR = [1.5 * (1 - e) + 0.1, 0, 0];
    p.torso = [-0.3 * e, 0.4 * e, 0]; p.shL = [-0.8, 0, 0.8]; p.shR = [0.4, 0, -0.8];
    return p;
  },
  axeKick(k) {
    const p = base(), e = k < 0.5 ? k * 2 : 1;
    p.hipR = [-2.6 + e * 2.4, 0, 0]; p.knR = [0.1, 0, 0]; p.hipL = [0.3, 0, 0]; p.knL = [0.6, 0, 0];
    p.torso = [-0.3 + e * 0.6, 0, 0]; p.shL = [0, 0, 1.2]; p.shR = [0, 0, -1.2];
    return p;
  },
  charge(t) {
    const p = base(), q = Math.sin(t * 40) * 0.03;
    p.shR = [0.6, 0, -0.3]; p.elR = [-1.9 + q, 0, 0]; p.shL = [-1.2, 0, 0.5]; p.elL = [-0.6, 0, 0];
    p.torso = [0.25, 0.9, 0]; p.hipL = [-0.6, 0, 0.1]; p.knL = [0.7, 0, 0]; p.hipR = [0.4, 0, -0.1]; p.knR = [0.4, 0, 0];
    p.y = -0.15;
    return p;
  },
  smash(k) {
    const p = base();
    p.shR = [-1.65, 0, 0]; p.elR = [0, 0, 0]; p.shL = [0.6, 0, 0.6]; p.elL = [-0.8, 0, 0];
    p.torso = [0.3, -0.7, 0]; p.hipL = [-0.9, 0, 0]; p.knL = [0.9, 0, 0]; p.hipR = [0.6, 0, 0]; p.knR = [0.2, 0, 0];
    p.y = -0.2;
    return p;
  },
  uppercut(k) {
    const p = POSES.smash(k);
    p.shR = [-2.9, 0, -0.2]; p.torso = [-0.3, -0.3, 0]; p.y = 0;
    return p;
  },
  flick(k) {
    const p = POSES.idle(0);
    p.shR = [-1.6, 0, 0]; p.elR = [0, 0, 0]; p.torso = [0.1, -0.3, 0];
    return p;
  },
  whip(k) {
    const p = POSES.idle(0);
    p.shR = [-1.6, 0, -0.3]; p.elR = [-0.2, 0, 0]; p.shL = [-1.0, 0, 0.6];
    p.torso = [0.1, -0.5 + k, 0];
    return p;
  },
  roll(k) {
    const p = base();
    p.torso = [1.4, 0, 0]; p.hipL = [-1.8, 0, 0]; p.knL = [2.2, 0, 0]; p.hipR = [-1.8, 0, 0]; p.knR = [2.2, 0, 0];
    p.shL = [-1.5, 0, 0.3]; p.shR = [-1.5, 0, -0.3]; p.elL = [-1.5, 0, 0]; p.elR = [-1.5, 0, 0];
    p.y = -0.45;
    return p;
  },
  hurt(k) {
    const p = base();
    p.torso = [-0.5, 0, 0]; p.neck = [-0.4, 0, 0]; p.shL = [0.4, 0, 0.6]; p.shR = [0.4, 0, -0.6];
    p.hipL = [-0.3, 0, 0]; p.knL = [0.4, 0, 0];
    return p;
  },
  down() {
    const p = base();
    p.hips = [-1.5, 0, 0]; p.neck = [0.2, 0, 0]; p.shL = [0, 0, 1.4]; p.shR = [0, 0, -1.4];
    p.hipL = [0.1, 0, 0.2]; p.hipR = [0.05, 0, -0.2];
    p.y = -0.68;
    return p;
  },
  paralyzed(t) {
    const p = POSES.hurt(0), q = Math.sin(t * 50) * 0.04;
    p.torso[1] = q; p.neck[2] = q;
    return p;
  },
  windup(k) { // ataque genérico de inimigo
    const p = base();
    p.shR = [-2.5 * k, 0, -0.4]; p.elR = [-0.8, 0, 0]; p.torso = [-0.2 * k, 0.4 * k, 0]; p.shL = [-0.4, 0, 0.4];
    return p;
  },
  slam(k) {
    const p = base();
    p.shR = [-2.8 + 2.0 * k, 0, -0.2]; p.shL = [-2.8 + 2.0 * k, 0, 0.2]; p.torso = [0.6 * k, 0, 0];
    p.hipL = [-0.5, 0, 0]; p.knL = [0.8, 0, 0]; p.hipR = [-0.5, 0, 0]; p.knR = [0.8, 0, 0]; p.y = -0.2 * k;
    return p;
  },
  raise(t) {
    const p = base();
    p.shR = [-2.9, 0, -0.1]; p.elR = [0, 0, 0]; p.shL = [0, 0, 0.3]; p.torso = [-0.05, 0, 0];
    return p;
  },
  touchGround(t) { // Overhaul
    const p = base();
    p.torso = [1.1, 0, 0]; p.shR = [-1.2, 0, -0.2]; p.shL = [-1.2, 0, 0.2]; p.hipL = [-1.2, 0, 0]; p.knL = [1.6, 0, 0]; p.hipR = [0.3, 0, 0]; p.knR = [1.8, 0, 0];
    p.y = -0.4;
    return p;
  },
  cheer(t) {
    const p = base(), b = Math.sin(t * 6) * 0.2;
    p.shL = [-2.6 + b, 0, 0.3]; p.shR = [-2.6 - b, 0, -0.3];
    return p;
  },
  sit() {
    const p = base();
    p.hipL = [-1.5, 0, 0.1]; p.hipR = [-1.5, 0, -0.1]; p.knL = [1.5, 0, 0]; p.knR = [1.5, 0, 0]; p.y = -0.4;
    p.shL = [-0.3, 0, 0.2]; p.shR = [-0.3, 0, -0.2]; p.elL = [-1.3, 0, 0]; p.elR = [-1.3, 0, 0];
    return p;
  },
};

export class Animator {
  constructor(rig) {
    this.rig = rig;
    this.cur = base();
    this.rate = 16;
  }
  apply(target, dt, rate = this.rate) {
    const a = 1 - Math.exp(-rate * dt);
    const r = this.rig;
    for (const j of J) {
      const c = this.cur[j], t = target[j];
      c[0] += (t[0] - c[0]) * a; c[1] += (t[1] - c[1]) * a; c[2] += (t[2] - c[2]) * a;
      r[j].rotation.set(c[0], c[1], c[2]);
    }
    this.cur.y += (target.y - this.cur.y) * a;
    r.body.position.y = this.cur.y * r.s;
  }
}
