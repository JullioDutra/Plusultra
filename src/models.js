// Modelos low-poly com toon shading + contorno (inverted hull), no espírito dos jogos de anime do PS2.
import * as THREE from 'three';

const grad = (() => {
  const d = new Uint8Array([140, 200, 255]); // sombra clara, estilo anime atual
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

// luz de recorte (rim light) compartilhada: cada cenário escolhe a cor
export const RIM = { color: { value: new THREE.Color(0x9ad0ff) }, strength: { value: 0.55 } };
function addRim(m) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.rimColor = RIM.color; sh.uniforms.rimStrength = RIM.strength;
    sh.fragmentShader = 'uniform vec3 rimColor; uniform float rimStrength;\n' + sh.fragmentShader.replace('#include <opaque_fragment>',
      'float rimK = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);\n outgoingLight += rimColor * smoothstep(0.25, 0.6, rimK) * rimStrength;\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'rim';
  return m;
}
const matCache = new Map();
export function toon(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!matCache.has(key)) matCache.set(key, addRim(new THREE.MeshToonMaterial({ color, gradientMap: grad, ...extra })));
  return matCache.get(key);
}
export const outlineMat = new THREE.MeshBasicMaterial({ color: 0x0b0b10, side: THREE.BackSide });

export function part(parent, geo, color, x = 0, y = 0, z = 0, outline = 0.03) {
  const m = new THREE.Mesh(geo, typeof color === 'object' ? color : toon(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  if (outline) {
    geo.computeBoundingSphere();
    const r = Math.max(0.05, geo.boundingSphere.radius);
    const o = new THREE.Mesh(geo, outlineMat);
    o.scale.setScalar(1 + outline / r);
    m.add(o);
  }
  return m;
}

const G = {
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  sph: (r, s = 12) => new THREE.SphereGeometry(r, s, Math.max(6, s * 0.75 | 0)),
  cap: (r, l) => new THREE.CapsuleGeometry(r, l, 4, 8),
  cone: (r, h, s = 6) => new THREE.ConeGeometry(r, h, s),
  cyl: (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s),
  tor: (r, t) => new THREE.TorusGeometry(r, t, 6, 16),
};
export { G };

// espinhos de cabelo distribuídos sobre a cabeça
function spikes(head, color, { count = 18, r = 0.27, len = 0.22, thick = 0.08, minY = -0.1, seed = 1, droop = 0 } = {}) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const mat = toon(color);
  const geo = G.cone(thick, len, 5);
  for (let i = 0; i < count; i++) {
    const u = rnd(), v = rnd();
    const th = u * Math.PI * 2;
    const y = minY + (1 - minY) * Math.sqrt(v);
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const dir = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr);
    if (dir.z > 0.55 && dir.y < 0.55) continue; // deixa o rosto livre
    dir.y -= droop;
    dir.normalize();
    const m = part(head, geo, mat, 0, 0, 0, 0.02);
    m.position.copy(dir).multiplyScalar(r);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  }
  part(head, G.sph(r * 0.98, 10), mat, 0, 0.02, -0.02, 0.02);
}

function eyes(head, iris = 0x2a8a3a, { size = 0.065, gap = 0.1, y = 0.02, z = 0.235, angry = false, red = false } = {}) {
  for (const sx of [-1, 1]) {
    const w = part(head, G.sph(size, 8), 0xffffff, sx * gap, y, z, 0);
    w.scale.set(1, 1.25, 0.4);
    const p = part(head, G.sph(size * 0.6, 8), red ? 0xd01818 : iris, sx * gap, y - 0.005, z + 0.022, 0);
    p.scale.set(1, 1.3, 0.35);
    if (angry) {
      const b = part(head, G.box(0.13, 0.025, 0.02), 0x111111, sx * gap, y + 0.09, z + 0.01, 0);
      b.rotation.z = sx * -0.35;
    }
  }
}

// Esqueleto humanoide genérico. Frente = +Z.
export function humanoid(spec) {
  const c = Object.assign({
    skin: 0xf2c9a0, top: 0x2f6b3a, bottom: 0x2f6b3a, sleeve: null, glove: null, shoe: 0x222222,
    hair: 0x1d3b26,
  }, spec.colors || {});
  const s = spec.scale || 1;
  const bulk = spec.bulk || 1;
  const legL = 0.82 * (spec.leg || 1);
  const torsoH = 0.72 * (spec.torso || 1);
  const tw = 0.46 * bulk, td = 0.26 * bulk;
  const armR = 0.075 * bulk;
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.scale.setScalar(s);
  root.add(body);

  const hips = new THREE.Group(); hips.position.y = legL; body.add(hips);
  const torso = new THREE.Group(); hips.add(torso);
  part(torso, G.box(tw * 0.9, 0.22, td), c.bottom, 0, 0.02, 0);
  const chest = part(torso, G.box(tw, torsoH * 0.78, td * 1.05), c.top, 0, torsoH * 0.5, 0);
  if (spec.chestScale) chest.scale.set(...spec.chestScale);
  const neck = new THREE.Group(); neck.position.y = torsoH; torso.add(neck);
  part(neck, G.cyl(0.07, 0.08, 0.12, 8), c.skin, 0, 0.04, 0, 0);
  const head = new THREE.Group(); head.position.y = 0.26; neck.add(head);
  const headSize = spec.head || 1;
  head.scale.setScalar(headSize);
  if (!spec.noFace) {
    const hm = part(head, G.sph(0.24, 14), c.skin);
    hm.scale.set(0.95, 1.05, 1);
  }

  const mk = (side) => {
    const sh = new THREE.Group(); sh.position.set(side * (tw / 2 + armR * 0.9), torsoH - 0.07, 0); torso.add(sh);
    const ua = 0.3 * (spec.arm || 1), fa = 0.28 * (spec.arm || 1);
    part(sh, G.cap(armR, ua), c.sleeve ?? c.top, 0, -ua / 2, 0);
    const el = new THREE.Group(); el.position.y = -ua - armR * 0.5; sh.add(el);
    part(el, G.cap(armR * 0.92, fa), c.forearm ?? c.sleeve ?? c.skin, 0, -fa / 2, 0);
    const hand = part(el, G.sph(armR * 1.35, 8), c.glove ?? c.skin, 0, -fa - armR * 0.6, 0.01);
    const hp = new THREE.Group(); hp.position.set(0, -ua / 2, 0); // pivô para acessórios
    const hipj = new THREE.Group(); hipj.position.set(side * tw * 0.26, 0, 0); hips.add(hipj);
    const th = 0.4 * (spec.leg || 1), sn = 0.38 * (spec.leg || 1);
    const legR = 0.095 * bulk;
    part(hipj, G.cap(legR, th - legR), c.bottom, 0, -th / 2, 0);
    const kn = new THREE.Group(); kn.position.y = -th; hipj.add(kn);
    part(kn, G.cap(legR * 0.9, sn - legR), c.shin ?? c.bottom, 0, -sn / 2, 0);
    const foot = part(kn, G.box(legR * 2, 0.11, legR * 3.3), c.shoe, 0, -sn + 0.0, 0.06);
    return { sh, el, hand, hipj, kn, foot };
  };
  const L = mk(1), R = mk(-1);
  const rig = {
    root, body, hips, torso, neck, head, c, s, legL,
    shL: L.sh, elL: L.el, handL: L.hand, hipL: L.hipj, knL: L.kn, footL: L.foot,
    shR: R.sh, elR: R.el, handR: R.hand, hipR: R.hipj, knR: R.kn, footR: R.foot,
    height: (legL + torsoH + 0.5 * headSize) * s,
  };
  if (spec.extra) spec.extra(rig);
  return rig;
}

// ---------------- Personagens ----------------
const DEKU_HAIR = 0x16331f;

export function deku(outfit = 'hero') {
  const outfits = {
    uniform: { top: 0x1a1d2a, bottom: 0x1a1d2a, sleeve: 0x1a1d2a, forearm: 0x1a1d2a, shoe: 0xc23a2a },
    training: { top: 0xf2f2ee, bottom: 0x2a3f8f, sleeve: 0xf2f2ee, forearm: 0xf2c9a0, shoe: 0xc23a2a },
    gym: { top: 0x2b4db5, bottom: 0x2b4db5, sleeve: 0x2b4db5, forearm: 0x2b4db5, shoe: 0xc23a2a },
    hero: { top: 0x2c5e43, bottom: 0x2c5e43, sleeve: 0x2c5e43, forearm: 0x355f4c, glove: 0xeeeeee, shoe: 0xc8281e, shin: 0x2c5e43 },
    final: { top: 0x1f3d2c, bottom: 0x1f3d2c, sleeve: 0x1f3d2c, forearm: 0x7a7f86, glove: 0x7a7f86, shoe: 0xc8281e, shin: 0x1f3d2c },
  };
  return humanoid({
    colors: { skin: 0xf3cba5, hair: DEKU_HAIR, ...outfits[outfit] },
    head: 1.08,
    extra(r) {
      spikes(r.head, DEKU_HAIR, { count: 30, r: 0.255, len: 0.2, thick: 0.075, minY: -0.35, seed: 7 });
      eyes(r.head, 0x1f8a3c, { size: 0.07, gap: 0.095 });
      // sardas
      for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) part(r.head, G.sph(0.008, 4), 0x9a5a3a, sx * (0.07 + i * 0.022), -0.06 - (i % 2) * 0.015, 0.228, 0);
      if (outfit === 'hero' || outfit === 'final') {
        // faixa vermelha no peito / cinto e "orelhas" do capuz
        part(r.torso, G.box(0.48, 0.07, 0.29), 0xc8281e, 0, 0.1, 0, 0.01);
        for (const sx of [-1, 1]) {
          const ear = part(r.head, G.cone(0.05, 0.22, 4), 0x2c5e43, sx * 0.17, 0.27, -0.05, 0.015);
          ear.rotation.z = sx * -0.35;
        }
        part(r.head, G.box(0.2, 0.06, 0.06), 0x9aa1a8, 0, -0.14, 0.2, 0.01); // respirador
        part(r.torso, G.box(0.08, 0.08, 0.05), 0xd8b23a, 0.12, 0.55, 0.14, 0.01);
      }
      if (outfit === 'uniform') part(r.torso, G.box(0.06, 0.06, 0.02), 0xd8b23a, 0, 0.6, 0.14, 0);
      if (outfit === 'training') {
        // camiseta com estampa (All Might)
        part(r.torso, G.box(0.18, 0.14, 0.02), 0x2a5bc4, 0, 0.45, 0.14, 0);
      }
    },
  });
}

export function allMight(form = 'muscle') {
  if (form === 'skinny') {
    return humanoid({
      colors: { skin: 0xe7c49c, top: 0xf0e8d0, bottom: 0x3a3f4a, sleeve: 0xf0e8d0, forearm: 0xe7c49c, shoe: 0x5a3a22 },
      scale: 1.12, bulk: 0.78, leg: 1.12, torso: 1.05,
      extra(r) {
        spikes(r.head, 0xf3d64a, { count: 10, r: 0.25, len: 0.25, thick: 0.06, minY: 0.1, seed: 3, droop: 0.4 });
        for (const sx of [-1, 1]) { const a = part(r.head, G.cone(0.05, 0.35, 4), 0xf3d64a, sx * 0.07, 0.3, 0.12, 0.015); a.rotation.z = sx * -0.25; a.rotation.x = 0.4; }
        for (const sx of [-1, 1]) part(r.head, G.sph(0.05, 6), 0x101418, sx * 0.09, 0.02, 0.2, 0);
        for (const sx of [-1, 1]) part(r.head, G.sph(0.018, 6), 0x5ab0ff, sx * 0.09, 0.02, 0.24, 0);
      },
    });
  }
  return humanoid({
    colors: { skin: 0xf0c99c, top: 0x2b56c8, bottom: 0x2b56c8, sleeve: 0x2b56c8, forearm: 0xf6f6f6, glove: 0xf3d64a, shoe: 0xc8281e, shin: 0xc8281e },
    scale: 1.42, bulk: 1.65, leg: 1.0, torso: 1.1, head: 0.86, chestScale: [1.18, 1.05, 1.15],
    extra(r) {
      spikes(r.head, 0xf3d64a, { count: 12, r: 0.25, len: 0.18, thick: 0.08, minY: 0.0, seed: 11, droop: 0.6 });
      for (const sx of [-1, 1]) { const a = part(r.head, G.cone(0.07, 0.5, 4), 0xf3d64a, sx * 0.1, 0.38, 0.06, 0.02); a.rotation.z = sx * -0.42; a.rotation.x = -0.15; }
      // olhos sombreados e sorriso enorme
      for (const sx of [-1, 1]) part(r.head, G.box(0.11, 0.07, 0.03), 0x101418, sx * 0.09, 0.04, 0.215, 0);
      for (const sx of [-1, 1]) part(r.head, G.sph(0.016, 6), 0x7ad0ff, sx * 0.09, 0.04, 0.235, 0);
      const smile = part(r.head, G.box(0.24, 0.07, 0.03), 0xffffff, 0, -0.1, 0.215, 0.01);
      smile.scale.set(1, 1, 1);
      part(r.torso, G.box(0.3, 0.12, 0.05), 0xf6f6f6, 0, 0.72, 0.21, 0.01);
      part(r.torso, G.box(0.5, 0.08, 0.3), 0xc8281e, 0, 0.12, 0, 0.01);
      const cape = part(r.torso, G.box(0.62, 0.05, 0.26), 0xf3d64a, 0, 0.78, -0.04, 0.01);
      cape.rotation.x = 0.1;
    },
  });
}

export function bakugo(outfit = 'uniform') {
  const o = outfit === 'hero'
    ? { top: 0x1d1d22, bottom: 0x1d1d22, sleeve: 0x1d1d22, forearm: 0xf0c49a, glove: 0x3f4a2a, shoe: 0x111111 }
    : { top: 0x1a1d2a, bottom: 0x1a1d2a, sleeve: 0x1a1d2a, forearm: 0x1a1d2a, shoe: 0x6a4024 };
  return humanoid({
    colors: { skin: 0xf0c49a, hair: 0xe8dca0, ...o },
    head: 1.05,
    extra(r) {
      spikes(r.head, 0xe8dca0, { count: 34, r: 0.255, len: 0.28, thick: 0.07, minY: -0.4, seed: 21 });
      eyes(r.head, 0xc81e1e, { angry: true, size: 0.055, gap: 0.1 });
      if (outfit === 'hero') {
        for (const s of [r.handL, r.handR]) part(s, G.cyl(0.13, 0.11, 0.24, 8), 0x3f4a2a, 0, 0.05, 0, 0.02);
        part(r.torso, G.box(0.06, 0.6, 0.02), 0xe07a1a, 0.06, 0.4, 0.14, 0).rotation.z = 0.6;
        part(r.torso, G.box(0.06, 0.6, 0.02), 0xe07a1a, -0.06, 0.4, 0.14, 0).rotation.z = -0.6;
      }
    },
  });
}

export function uraraka() {
  return humanoid({
    colors: { skin: 0xf6d2b4, top: 0x1d1d26, bottom: 0x1d1d26, sleeve: 0xf2a6c2, forearm: 0x1d1d26, glove: 0xf2a6c2, shoe: 0xf2a6c2, hair: 0x5a3622 },
    scale: 0.92, head: 1.08,
    extra(r) {
      part(r.head, G.sph(0.265, 12), 0x5a3622, 0, 0.03, -0.03, 0.02).scale.set(1.05, 0.95, 1);
      for (const sx of [-1, 1]) part(r.head, G.box(0.08, 0.26, 0.12), 0x5a3622, sx * 0.21, -0.08, 0.1, 0.015);
      eyes(r.head, 0x6a3a22, { size: 0.07 });
      for (const sx of [-1, 1]) part(r.head, G.sph(0.03, 6), 0xf28a9a, sx * 0.13, -0.07, 0.2, 0);
    },
  });
}

export function iida() {
  return humanoid({
    colors: { skin: 0xf0c9a0, top: 0xc8d2e0, bottom: 0xc8d2e0, sleeve: 0xc8d2e0, forearm: 0xc8d2e0, glove: 0x8a96a8, shoe: 0x8a96a8, shin: 0xc8d2e0 },
    scale: 1.1, bulk: 1.15,
    extra(r) {
      part(r.head, G.box(0.46, 0.4, 0.46), 0xc8d2e0, 0, 0.02, 0, 0.02);
      part(r.head, G.box(0.38, 0.08, 0.05), 0x1a2a4a, 0, 0.03, 0.235, 0);
      for (const k of [r.knL, r.knR]) for (let i = 0; i < 3; i++) part(k, G.cyl(0.035, 0.035, 0.12, 6), 0x55606e, (i - 1) * 0.06, -0.12, -0.12, 0.01).rotation.x = 0.5;
    },
  });
}

export function todoroki() {
  return humanoid({
    colors: { skin: 0xf2d4bc, top: 0x2e4f86, bottom: 0x2e4f86, sleeve: 0x2e4f86, forearm: 0x2e4f86, glove: 0x2e4f86, shoe: 0x3a3a40 },
    scale: 1.03,
    extra(r) {
      const half = (color, side) => {
        const g = new THREE.SphereGeometry(0.265, 12, 9, side > 0 ? 0 : Math.PI, Math.PI);
        part(r.head, g, color, 0, 0.04, -0.02, 0.02);
      };
      half(0xf2f2f2, -1); half(0xc81e2a, 1);
      eyes(r.head, 0x6a7a8a, { size: 0.055 });
      part(r.head, G.box(0.08, 0.08, 0.02), 0xa83a2a, 0.1, 0.05, 0.245, 0);
    },
  });
}

export function kirishima() {
  return humanoid({
    colors: { skin: 0xf0c49a, top: 0xf0c49a, bottom: 0x3a2a22, sleeve: 0xf0c49a, forearm: 0xf0c49a, shoe: 0x6a3a22, hair: 0xc81e1e },
    bulk: 1.12,
    extra(r) {
      spikes(r.head, 0xc81e1e, { count: 22, r: 0.255, len: 0.3, thick: 0.07, minY: 0.1, seed: 40 });
      eyes(r.head, 0xc81e1e, { size: 0.055 });
    },
  });
}

export function tsuyu() {
  return humanoid({
    colors: { skin: 0xf3dcc6, top: 0x3a7a4a, bottom: 0x3a7a4a, sleeve: 0x3a7a4a, forearm: 0x3a7a4a, glove: 0x3a7a4a, shoe: 0xe8d23a, hair: 0x2a3a2a },
    scale: 0.92,
    extra(r) {
      part(r.head, G.sph(0.265, 12), 0x2a3a2a, 0, 0.03, -0.05, 0.02);
      part(r.head, G.cap(0.06, 0.6), 0x2a3a2a, 0, -0.35, -0.22, 0.015).rotation.x = 0.3;
      for (const sx of [-1, 1]) part(r.head, G.sph(0.075, 8), 0x101010, sx * 0.12, 0.05, 0.2, 0);
    },
  });
}

export function eri() {
  return humanoid({
    colors: { skin: 0xf6dccb, top: 0xe8e4dc, bottom: 0xe8e4dc, sleeve: 0xe8e4dc, forearm: 0xe8e4dc, shoe: 0xe8e4dc },
    scale: 0.58, head: 1.25,
    extra(r) {
      part(r.head, G.sph(0.265, 12), 0xd8dde8, 0, 0.0, -0.05, 0.02).scale.set(1.05, 1.15, 1);
      const horn = part(r.head, G.cone(0.04, 0.16, 6), 0xe8d8c8, 0.08, 0.26, 0.05, 0.01); horn.rotation.z = -0.3;
      eyes(r.head, 0xc81e1e, { size: 0.07 });
    },
  });
}

export function kota() {
  return humanoid({
    colors: { skin: 0xf0c49a, top: 0x3a3a3a, bottom: 0x2a2a42, sleeve: 0x3a3a3a, forearm: 0xf0c49a, shoe: 0x111111 },
    scale: 0.6, head: 1.2,
    extra(r) {
      part(r.head, G.sph(0.27, 12), 0xc8281e, 0, 0.08, -0.02, 0.02).scale.set(1, 0.7, 1);
      for (const sx of [-1, 1]) { const h = part(r.head, G.cone(0.05, 0.2, 5), 0xc8281e, sx * 0.17, 0.25, 0, 0.01); h.rotation.z = sx * -0.6; }
      eyes(r.head, 0x222222, { angry: true, size: 0.06 });
    },
  });
}

// ---------------- Vilões ----------------
export function thug(variant = 0) {
  const pal = [
    { top: 0x3a2f4a, bottom: 0x22222a, hair: 0x6a2a7a, skin: 0xd9b28c },
    { top: 0x5a2a22, bottom: 0x2a2a2a, hair: 0x111111, skin: 0xc29a74 },
    { top: 0x2a4a5a, bottom: 0x1e1e26, hair: 0xa8a8a8, skin: 0x9cb86a },
    { top: 0x4a4a22, bottom: 0x2a2a1e, hair: 0xd85a1a, skin: 0xe0b890 },
  ][variant % 4];
  return humanoid({
    colors: { ...pal, sleeve: pal.top, forearm: pal.skin, shoe: 0x111111 },
    bulk: 1 + (variant % 3) * 0.12,
    extra(r) {
      spikes(r.head, pal.hair, { count: 10, r: 0.25, len: 0.15, thick: 0.09, minY: 0.2, seed: 50 + variant });
      eyes(r.head, 0xaa2222, { angry: true, size: 0.05 });
      if (variant % 2) part(r.head, G.box(0.36, 0.12, 0.05), 0x111111, 0, -0.08, 0.22, 0.01);
    },
  });
}

export function waterThug() {
  return humanoid({
    colors: { skin: 0x4a8aa8, top: 0x2a3a6a, bottom: 0x1e2a4a, sleeve: 0x2a3a6a, forearm: 0x4a8aa8, shoe: 0x4a8aa8 },
    bulk: 1.1,
    extra(r) {
      const fin = part(r.head, G.cone(0.1, 0.35, 3), 0x3a6a88, 0, 0.25, -0.05, 0.02); fin.scale.z = 0.3;
      part(r.head, G.box(0.3, 0.06, 0.05), 0x111111, 0, -0.09, 0.22, 0);
      eyes(r.head, 0xe8d23a, { size: 0.05, angry: true });
    },
  });
}

export function hassaikai() {
  return humanoid({
    colors: { skin: 0xd8b08a, top: 0x2a2a2e, bottom: 0x2a2a2e, sleeve: 0x2a2a2e, forearm: 0x2a2a2e, glove: 0x9a3a2a, shoe: 0x111111 },
    bulk: 1.05,
    extra(r) {
      const beak = part(r.head, G.cone(0.1, 0.3, 6), 0xe8e0d0, 0, -0.05, 0.3, 0.015); beak.rotation.x = Math.PI / 2;
      part(r.head, G.sph(0.26, 10), 0x2a2a2e, 0, 0.06, -0.03, 0.02).scale.set(1, 0.8, 1);
      for (const sx of [-1, 1]) part(r.head, G.sph(0.04, 6), 0x111111, sx * 0.09, 0.05, 0.21, 0);
    },
  });
}

export function nomu({ wings = false, scale = 1.6, color = 0x22262c } = {}) {
  return humanoid({
    colors: { skin: color, top: color, bottom: 0x3a2a2a, sleeve: color, forearm: color, shoe: color },
    scale, bulk: 1.8, head: 0.95, chestScale: [1.2, 1.1, 1.2],
    extra(r) {
      const brain = part(r.head, G.sph(0.22, 10), 0xe88aa0, 0, 0.17, -0.02, 0.02); brain.scale.set(1, 0.8, 1.15);
      for (let i = 0; i < 4; i++) part(r.head, G.tor(0.1 + i * 0.02, 0.012), 0xc06a80, 0, 0.2, 0, 0).rotation.x = Math.PI / 2;
      // bico
      const beak = part(r.head, G.cone(0.13, 0.22, 5), 0xe8d8a0, 0, -0.08, 0.2, 0.02); beak.rotation.x = Math.PI;
      for (const sx of [-1, 1]) part(r.head, G.sph(0.045, 6), 0xf0e050, sx * 0.1, 0.0, 0.2, 0);
      if (wings) for (const sx of [-1, 1]) {
        const w = part(r.torso, G.box(0.9, 0.04, 0.4), 0x2a2030, sx * 0.6, 0.6, -0.2, 0.02);
        w.rotation.z = sx * 0.4; w.userData.wing = sx;
        (r.wings ||= []).push(w);
      }
    },
  });
}

export function stain() {
  return humanoid({
    colors: { skin: 0xd8b48c, top: 0x2a2a30, bottom: 0x2a2a30, sleeve: 0x2a2a30, forearm: 0x6a6a70, glove: 0x6a6a70, shoe: 0x3a3a3a, shin: 0x6a6a70 },
    bulk: 0.95, leg: 1.08,
    extra(r) {
      spikes(r.head, 0x111111, { count: 16, r: 0.25, len: 0.2, thick: 0.07, minY: 0.0, seed: 66 });
      const band = part(r.head, G.cyl(0.27, 0.27, 0.1, 12), 0xd8d8d0, 0, 0.04, 0, 0.015);
      const tail = part(r.head, G.box(0.06, 0.6, 0.02), 0xc8281e, 0, -0.1, -0.27, 0.01); tail.rotation.x = 0.35;
      part(r.torso, G.box(0.56, 0.1, 0.32), 0xc8281e, 0, 0.66, 0, 0.015); // cachecol
      eyes(r.head, 0xc81e1e, { angry: true, size: 0.045 });
      const sw = part(r.torso, G.box(0.05, 1.0, 0.02), 0xbfc4cc, 0.12, 0.55, -0.2, 0.01); sw.rotation.z = 0.7;
      const kn = part(r.handR, G.box(0.03, 0.55, 0.012), 0xd8dde4, 0, -0.22, 0.05, 0.01);
      r.blade = kn;
    },
  });
}

export function muscular() {
  return humanoid({
    colors: { skin: 0xc8946a, top: 0x6a5a4a, bottom: 0x2a2a2a, sleeve: 0xb8222a, forearm: 0xb8222a, glove: 0xb8222a, shoe: 0x222222 },
    scale: 1.55, bulk: 1.7, chestScale: [1.2, 1.05, 1.2],
    extra(r) {
      spikes(r.head, 0x8a5a2a, { count: 14, r: 0.25, len: 0.16, thick: 0.1, minY: 0.0, seed: 70 });
      part(r.head, G.sph(0.06, 8), 0xe0e8f0, 0.09, 0.03, 0.21, 0);
      part(r.head, G.sph(0.03, 8), 0x22aaee, 0.09, 0.03, 0.26, 0);
      part(r.head, G.box(0.2, 0.05, 0.03), 0xffffff, 0, -0.1, 0.22, 0);
      // fibras musculares expostas
      for (const sh of [r.shL, r.shR]) for (let i = 0; i < 3; i++) part(sh, G.cap(0.06, 0.35), 0xd02a32, (i - 1) * 0.06, -0.2, 0.06, 0.015);
      r.fibers = [];
    },
  });
}

export function overhaul() {
  return humanoid({
    colors: { skin: 0xead2b6, top: 0x2f4a3a, bottom: 0x1e1e22, sleeve: 0x2f4a3a, forearm: 0x2f4a3a, glove: 0x6a1a22, shoe: 0x111111 },
    leg: 1.05,
    extra(r) {
      spikes(r.head, 0x2a1e1a, { count: 12, r: 0.25, len: 0.12, thick: 0.08, minY: 0.2, seed: 80 });
      const beak = part(r.head, G.cone(0.08, 0.28, 6), 0x2a1a1a, 0, -0.07, 0.3, 0.015); beak.rotation.x = Math.PI / 2;
      eyes(r.head, 0xd8b23a, { size: 0.045, angry: true });
      const fur = part(r.torso, G.tor(0.26, 0.09), 0xb8a888, 0, 0.7, 0, 0.02); fur.rotation.x = Math.PI / 2;
      // casaco longo
      part(r.hips, G.box(0.5, 0.6, 0.3), 0x2f4a3a, 0, -0.25, -0.02, 0.015);
    },
  });
}

export function shigaraki(final = false) {
  const hair = final ? 0xe8e8ee : 0x9aa8b8;
  return humanoid({
    colors: { skin: 0xd8d4cc, top: 0x1a1a1e, bottom: 0x1a1a1e, sleeve: 0x1a1a1e, forearm: 0xd0ccc4, glove: 0xd0ccc4, shoe: 0x6a2a2a },
    bulk: final ? 1.25 : 0.92, scale: final ? 1.25 : 1,
    extra(r) {
      spikes(r.head, hair, { count: 28, r: 0.255, len: 0.3, thick: 0.06, minY: -0.6, seed: 90, droop: 0.9 });
      eyes(r.head, 0xc81e1e, { red: true, size: 0.05, angry: true });
      if (!final) {
        // "Pai" — mão no rosto, e mãos espalhadas pelo corpo
        const f = part(r.head, G.box(0.22, 0.28, 0.04), 0xe4e0d8, 0.02, -0.02, 0.25, 0.01);
        for (let i = 0; i < 4; i++) part(f, G.box(0.04, 0.16, 0.03), 0xe4e0d8, -0.08 + i * 0.055, 0.2, 0, 0.008);
        for (const [x, y] of [[0.1, 0.5], [-0.12, 0.3], [0, 0.65]]) part(r.torso, G.box(0.16, 0.2, 0.04), 0xe4e0d8, x, y, 0.15, 0.008);
      } else {
        for (let i = 0; i < 8; i++) part(r.torso, G.box(0.02, 0.4, 0.02), 0x7a1a1a, -0.2 + i * 0.055, 0.4, 0.145, 0).rotation.z = (i % 2 ? 0.3 : -0.3);
      }
      part(r.head, G.box(0.18, 0.02, 0.02), 0x6a3a3a, 0, -0.13, 0.225, 0); // lábios rachados
    },
  });
}

export function allForOne() {
  return humanoid({
    colors: { skin: 0x1a1a20, top: 0x101014, bottom: 0x101014, sleeve: 0x101014, forearm: 0x101014, glove: 0x101014, shoe: 0x101014 },
    scale: 1.35, bulk: 1.3, noFace: true,
    extra(r) {
      const m = part(r.head, G.sph(0.25, 12), 0x14141a, 0, 0, 0, 0.02); m.scale.set(1, 1.2, 1);
      for (let i = 0; i < 5; i++) {
        const t = part(r.head, G.cyl(0.03, 0.03, 0.4, 6), 0x3a3a46, -0.15 + i * 0.075, -0.25, -0.1, 0.01); t.rotation.x = 0.5;
      }
      part(r.torso, G.box(0.08, 0.6, 0.03), 0xd8d8d8, 0, 0.4, 0.14, 0); // camisa e gravata
      part(r.torso, G.box(0.05, 0.5, 0.035), 0x6a1a1a, 0, 0.4, 0.15, 0);
    },
  });
}

export function sludge() {
  const g = new THREE.Group();
  const mat = toon(0x3e8a2a, { transparent: true, opacity: 0.92 });
  const blobs = [];
  for (let i = 0; i < 9; i++) {
    const b = part(g, G.sph(0.8 + (i % 3) * 0.25, 10), mat, Math.sin(i * 1.7) * 0.9, 0.6 + i * 0.35, Math.cos(i * 2.3) * 0.6, 0.04);
    blobs.push(b);
  }
  for (const sx of [-1, 1]) {
    part(g, G.sph(0.22, 8), 0xf0e8a0, sx * 0.35, 3.3, 0.85, 0.02);
    part(g, G.sph(0.08, 6), 0x111111, sx * 0.35, 3.3, 1.05, 0);
  }
  part(g, G.box(0.9, 0.18, 0.1), 0xf8f8f0, 0, 2.9, 1.0, 0.02);
  g.userData.blobs = blobs;
  return g;
}

export function robot(points = 1) {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const col = [0x5a7a9a, 0x7a8a5a, 0x9a5a4a][points - 1];
  const s = [1, 1.2, 1.6][points - 1];
  body.scale.setScalar(s);
  if (points === 1) {
    part(body, G.cyl(0.35, 0.35, 0.2, 12), 0x333333, 0, 0.35, 0).rotation.z = Math.PI / 2;
    part(body, G.box(0.7, 0.8, 0.6), col, 0, 1.05, 0);
    part(body, G.box(0.5, 0.35, 0.5), col, 0, 1.65, 0.05);
    part(body, G.sph(0.09, 8), 0xff3322, 0, 1.68, 0.32, 0);
    for (const sx of [-1, 1]) part(body, G.box(0.18, 0.6, 0.18), 0x444a52, sx * 0.5, 1.0, 0.2);
  } else if (points === 2) {
    part(body, G.box(1.1, 0.6, 1.3), col, 0, 0.8, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(body, G.box(0.14, 0.7, 0.14), 0x333333, sx * 0.55, 0.35, sz * 0.5);
    const tail = part(body, G.cyl(0.08, 0.12, 1.2, 8), col, 0, 1.6, -0.5); tail.rotation.x = -0.5;
    part(body, G.sph(0.1, 8), 0xff3322, 0, 1.05, 0.66, 0);
  } else {
    part(body, G.box(1.2, 0.5, 1.6), 0x333333, 0, 0.3, 0);
    part(body, G.box(1.0, 1.0, 1.0), col, 0, 1.1, 0);
    for (const sx of [-1, 1]) part(body, G.cyl(0.15, 0.15, 0.9, 8), 0x555555, sx * 0.7, 1.4, 0.1).rotation.x = Math.PI / 2;
    part(body, G.sph(0.12, 8), 0xff3322, 0, 1.3, 0.52, 0);
  }
  // placa de pontos
  const c = document.createElement('canvas'); c.width = 64; c.height = 32;
  const x = c.getContext('2d'); x.fillStyle = '#ffd23a'; x.fillRect(0, 0, 64, 32); x.fillStyle = '#111'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.fillText(points + 'P', 32, 26);
  const tex = new THREE.CanvasTexture(c);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: tex }));
  plate.position.set(0, points === 1 ? 1.3 : 1.2, points === 2 ? 0.67 : 0.52 * (points === 3 ? 1 : 0.6) + 0.02);
  body.add(plate);
  g.userData.body = body;
  return g;
}

export function zeroPointer() {
  const g = new THREE.Group();
  const col = 0x4a5a6a;
  part(g, G.box(9, 3, 7), 0x2a2a2e, 0, 1.5, 0, 0.1);
  for (const sx of [-1, 1]) part(g, G.box(2, 2.6, 8), 0x1e1e22, sx * 4.4, 1.3, 0, 0.08);
  const torso = new THREE.Group(); torso.position.y = 3; g.add(torso);
  part(torso, G.box(7, 9, 5.5), col, 0, 4.5, 0, 0.12);
  const head = part(torso, G.box(4, 3, 3.5), col, 0, 10.5, 0.6, 0.1);
  part(head, G.box(3, 0.7, 0.2), 0xff3322, 0, 0.2, 1.8, 0);
  part(head, G.box(1.4, 0.8, 0.3), 0xffd23a, 0, 1.1, 1.8, 0);
  const arms = [];
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 4.6, 7.5, 0); torso.add(sh);
    part(sh, G.box(1.8, 6, 1.8), 0x3a4652, 0, -3, 0, 0.1);
    part(sh, G.box(2.4, 2.2, 2.4), 0x2a2a2e, 0, -6.3, 0, 0.1);
    arms.push(sh);
  }
  g.userData = { torso, head, arms };
  return g;
}

// fantasma dos portadores (vestígios) — silhuetas translúcidas
export function vestige(color = 0x9ad8ff) {
  const r = humanoid({ colors: { skin: color, top: color, bottom: color, sleeve: color, forearm: color, shoe: color } });
  r.root.traverse(o => { if (o.isMesh && o.material !== outlineMat) o.material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false }); else if (o.isMesh) o.visible = false; });
  return r;
}


// ---------------- Personagens extras (v2) ----------------
export function mineta() {
  return humanoid({
    colors: { skin: 0xf0c49a, top: 0x5a3a8a, bottom: 0x5a3a8a, sleeve: 0x5a3a8a, forearm: 0x5a3a8a, shoe: 0xe8d23a },
    scale: 0.6, head: 1.3,
    extra(r) { for (let i = 0; i < 6; i++) part(r.head, G.sph(0.09, 8), 0x6a2a8a, Math.cos(i) * 0.15, 0.2 + (i % 2) * 0.05, Math.sin(i) * 0.15 - 0.05, 0.015); eyes(r.head, 0x222222, { size: 0.06 }); },
  });
}
export function aizawa() {
  return humanoid({
    colors: { skin: 0xe8c8a8, top: 0x1a1a1e, bottom: 0x1a1a1e, sleeve: 0x1a1a1e, forearm: 0x1a1a1e, shoe: 0x111111 },
    leg: 1.06,
    extra(r) {
      spikes(r.head, 0x111111, { count: 22, r: 0.255, len: 0.28, thick: 0.06, minY: -0.5, seed: 120, droop: 0.8 });
      const sc = part(r.torso, G.tor(0.28, 0.08), 0xd8d8d0, 0, 0.72, 0, 0.015); sc.rotation.x = Math.PI / 2;
      part(r.head, G.box(0.36, 0.07, 0.06), 0xe8d23a, 0, 0.06, 0.22, 0.01);
    },
  });
}
export function kurogiri() {
  const r = humanoid({
    colors: { skin: 0x1a1030, top: 0x2a2a30, bottom: 0x2a2a30, sleeve: 0x2a2a30, forearm: 0x2a2a30, shoe: 0x111111 },
    scale: 1.2, noFace: true,
    extra(r) {
      const m = new THREE.MeshBasicMaterial({ color: 0x5a2a9a, transparent: true, opacity: 0.75 });
      for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(G.sph(0.22 + (i % 3) * 0.06, 8), m); b.position.set(Math.cos(i) * 0.12, 0.05 + i * 0.05, Math.sin(i) * 0.12); r.head.add(b); }
      for (const sx of [-1, 1]) part(r.head, G.box(0.1, 0.03, 0.02), 0xf0e060, sx * 0.08, 0.1, 0.24, 0);
      part(r.torso, G.box(0.36, 0.14, 0.05), 0x8a8a90, 0, 0.72, 0.15, 0.01);
    },
  });
  return r;
}
export function gangOrca() {
  return humanoid({
    colors: { skin: 0x1a1a22, top: 0xe8e8ee, bottom: 0x1a1a22, sleeve: 0xe8e8ee, forearm: 0x1a1a22, glove: 0x1a1a22, shoe: 0x111111 },
    scale: 1.45, bulk: 1.5, chestScale: [1.15, 1, 1.1],
    extra(r) {
      const h = part(r.head, G.sph(0.27, 12), 0x14141c, 0, 0.02, 0.02, 0.02); h.scale.set(1, 1, 1.25);
      for (const sx of [-1, 1]) part(r.head, G.sph(0.07, 8), 0xf0f0f0, sx * 0.14, 0.08, 0.2, 0);
      part(r.head, G.box(0.26, 0.03, 0.03), 0xd8d8d8, 0, -0.1, 0.27, 0);
      const fin = part(r.torso, G.cone(0.15, 0.6, 4), 0x14141c, 0, 0.8, -0.2, 0.02); fin.scale.z = 0.3; fin.rotation.x = -0.4;
    },
  });
}
export function ladyNagant() {
  return humanoid({
    colors: { skin: 0xe8d0c0, top: 0x2a3a6a, bottom: 0x2a3a6a, sleeve: 0x2a3a6a, forearm: 0x2a3a6a, glove: 0x8a90a0, shoe: 0x111111, shin: 0x2a3a6a },
    leg: 1.12, scale: 1.05,
    extra(r) {
      spikes(r.head, 0x2a2a3a, { count: 16, r: 0.255, len: 0.3, thick: 0.065, minY: -0.6, seed: 140, droop: 0.9 });
      for (let i = 0; i < 6; i++) part(r.head, G.sph(0.05, 6), [0xd85ab0, 0x5ac8e8][i % 2], -0.2 + i * 0.08, 0.2, -0.15, 0.01);
      eyes(r.head, 0x6a2a8a, { size: 0.05 });
      // braço-rifle
      const gun = part(r.elR, G.cyl(0.045, 0.06, 0.9, 8), 0x50566a, 0, -0.55, 0, 0.015);
      part(r.elR, G.box(0.1, 0.12, 0.2), 0x3a3e4a, 0, -0.2, 0, 0.01);
      r.gun = gun;
    },
  });
}
export function inasa() {
  return humanoid({
    colors: { skin: 0xd8a882, top: 0xe8e4dc, bottom: 0x2a2a30, sleeve: 0xe8e4dc, forearm: 0xd8a882, shoe: 0x6a3a2a },
    scale: 1.2, bulk: 1.25,
    extra(r) {
      const h = part(r.head, G.cone(0.3, 0.55, 8), 0x2a2a2a, 0, 0.35, -0.04, 0.02); h.rotation.x = -0.4;
      eyes(r.head, 0x222222, { size: 0.06 });
      part(r.torso, G.box(0.08, 0.5, 0.03), 0x8a1a1a, 0, 0.4, 0.15, 0);
    },
  });
}
export function civilian(v = 0) {
  const pal = [[0xe8a83a, 0x3a4a8a], [0x8ad0e8, 0x4a3a3a], [0xd85a6a, 0x2a2a2a], [0x9ae8a0, 0x5a4a3a], [0xf0f0f0, 0x3a5a8a]][v % 5];
  const hair = [0x2a1a10, 0x6a4a2a, 0x111111, 0xd8b06a, 0x8a3a1a][v % 5];
  return humanoid({
    colors: { skin: [0xf2cba5, 0xd8a882, 0xb88a64, 0xf6d8c0, 0xe8c09a][v % 5], top: pal[0], bottom: pal[1], sleeve: pal[0], shoe: 0x3a3a3a, hair },
    scale: 0.92 + (v % 3) * 0.05,
    extra(r) { spikes(r.head, hair, { count: 12, r: 0.25, len: 0.12, thick: 0.1, minY: 0.0, seed: 200 + v, droop: 0.5 }); eyes(r.head, 0x3a2a1a, { size: 0.055 }); },
  });
}
export function student(color = 0x2a2a6a, v = 0) {
  return humanoid({
    colors: { skin: [0xf2cba5, 0xd8a882, 0xe8c09a][v % 3], top: color, bottom: color, sleeve: color, forearm: color, glove: 0xeeeeee, shoe: 0x222222, hair: [0x1a1a1a, 0x8a5a2a, 0xd8d8e8][v % 3] },
    extra(r) {
      spikes(r.head, [0x1a1a1a, 0x8a5a2a, 0xd8d8e8][v % 3], { count: 14, r: 0.25, len: 0.16, thick: 0.08, minY: 0, seed: 300 + v });
      eyes(r.head, 0x2a2a2a, { size: 0.055, angry: true });
      // alvos do exame da licença (3 por aluno)
      const tm = new THREE.MeshBasicMaterial({ color: 0xff8a1a });
      r.targets = [];
      for (const [x, y, z] of [[0, 0.5, 0.15], [0.15, 0.3, 0.14], [-0.15, 0.3, 0.14]]) { const t = new THREE.Mesh(G.cyl(0.07, 0.07, 0.03, 10), tm); t.rotation.x = Math.PI / 2; t.position.set(x, y, z); r.torso.add(t); r.targets.push(t); }
    },
  });
}

// ---------------- Objetos de cenário ----------------
export function car(color = 0xc8281e) {
  const g = new THREE.Group();
  part(g, G.box(1.9, 0.6, 4.2), color, 0, 0.55, 0, 0.04);
  part(g, G.box(1.6, 0.55, 2.2), color, 0, 1.1, -0.2, 0.04);
  part(g, G.box(1.62, 0.42, 2.0), 0x2a3a4a, 0, 1.1, -0.2, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = part(g, G.cyl(0.33, 0.33, 0.25, 10), 0x1a1a1a, sx * 0.9, 0.33, sz * 1.35, 0.02); w.rotation.z = Math.PI / 2; }
  for (const sx of [-1, 1]) { const l = new THREE.Mesh(G.box(0.3, 0.12, 0.05), new THREE.MeshBasicMaterial({ color: 0xfff0c0 })); l.position.set(sx * 0.6, 0.6, 2.11); g.add(l); }
  return g;
}
export function vending(color = 0xd8282e) {
  const g = new THREE.Group();
  part(g, G.box(0.9, 1.9, 0.7), color, 0, 0.95, 0, 0.03);
  const front = new THREE.Mesh(G.box(0.7, 1.0, 0.02), new THREE.MeshBasicMaterial({ color: 0xe8f4ff }));
  front.position.set(0, 1.2, 0.36); g.add(front);
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(G.box(0.08, 0.16, 0.03), new THREE.MeshBasicMaterial({ color: [0xff4a4a, 0x4aaaff, 0xffd23a][i % 3] })); c.position.set(-0.25 + (i % 3) * 0.25, 1.4 - Math.floor(i / 3) * 0.35, 0.38); g.add(c); }
  return g;
}
export function barrier() {
  const g = new THREE.Group();
  part(g, G.box(2, 0.25, 0.12), 0xf0f0f0, 0, 0.8, 0, 0.02);
  for (let i = 0; i < 3; i++) part(g, G.box(0.3, 0.26, 0.13), 0xd8281e, -0.6 + i * 0.6, 0.8, 0, 0);
  for (const sx of [-1, 1]) part(g, G.box(0.1, 0.9, 0.1), 0x3a3a3a, sx * 0.85, 0.45, 0, 0.02);
  return g;
}
export function cone() {
  const g = new THREE.Group();
  part(g, G.cone(0.2, 0.6, 10), 0xff7a1a, 0, 0.32, 0, 0.02);
  part(g, G.box(0.45, 0.05, 0.45), 0x2a2a2a, 0, 0.02, 0, 0.01);
  return g;
}
export function crate(color = 0x8a6a3a) {
  const g = new THREE.Group();
  part(g, G.box(1, 1, 1), color, 0, 0.5, 0, 0.03);
  part(g, G.box(1.02, 0.12, 1.02), 0x5a4024, 0, 0.5, 0, 0);
  return g;
}
export function notebook() {
  const g = new THREE.Group();
  const b = part(g, G.box(0.5, 0.06, 0.7), 0xe8d8a0, 0, 0, 0, 0.02);
  const label = new THREE.Mesh(G.box(0.3, 0.07, 0.2), new THREE.MeshBasicMaterial({ color: 0x2c8a52 }));
  label.position.set(0, 0.005, -0.1); g.add(label);
  const glow = new THREE.Mesh(G.sph(0.55, 12), new THREE.MeshBasicMaterial({ color: 0x7dffb0, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.add(glow);
  void b;
  return g;
}
export function mine() {
  const g = new THREE.Group();
  part(g, G.cyl(0.32, 0.36, 0.12, 12), 0x5a5a62, 0, 0.04, 0, 0.02);
  const led = new THREE.Mesh(G.sph(0.07, 8), new THREE.MeshBasicMaterial({ color: 0xff5ac8 }));
  led.position.y = 0.12; g.add(led);
  g.userData.led = led;
  return g;
}

export const CHARS = { deku, allMight, bakugo, uraraka, iida, todoroki, kirishima, tsuyu, eri, kota, thug, waterThug, hassaikai, nomu, stain, muscular, overhaul, shigaraki, allForOne, mineta, aizawa, kurogiri, gangOrca, ladyNagant, inasa, civilian, student };
