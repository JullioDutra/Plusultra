// Cenários inspirados nos locais do anime, construídos proceduralmente.
import * as THREE from 'three';
import { toon, part, G, sludge, zeroPointer } from './models.js';
import * as M from './models.js';

let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = a => a[Math.floor(rnd() * a.length)];

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

const texCache = {};
// fachada: cor + emissiva (janelas acesas brilham à noite com o bloom)
function windowsTex(base, lit, night) {
  const k = base + lit + night;
  if (texCache[k]) return texCache[k];
  const on = [];
  const map = canvasTex(128, 256, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let yy = 10; yy < h - 8; yy += 24) {
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, yy - 4, w, 2);
      for (let xx = 8; xx < w - 8; xx += 24) {
        const lt = Math.random() < lit; on.push([xx, yy, lt]);
        x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(xx - 1, yy - 1, 16, 16);
        x.fillStyle = lt ? (night ? '#ffd890' : '#d8ecff') : (night ? '#141826' : '#6a7c94');
        x.fillRect(xx, yy, 14, 14);
        if (!night) { x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(xx, yy, 5, 14); }
      }
    }
  });
  const emis = canvasTex(128, 256, (x, w, h) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
    for (const [xx, yy, lt] of on) if (lt && night) { x.fillStyle = Math.random() < 0.3 ? '#9ad8ff' : '#ffcf80'; x.fillRect(xx, yy, 14, 14); }
  });
  return (texCache[k] = { map, emis });
}
function groundTex(kind) {
  if (texCache['g' + kind]) return texCache['g' + kind];
  const t = canvasTex(256, 256, (x, w, h) => {
    const P = {
      asphalt: ['#4c505a', '#444852', '#575b66'], sand: ['#e2cf9a', '#d8c48c', '#ead8a8'], concrete: ['#8a8c90', '#7e8084', '#96989c'],
      grass: ['#2e5a2a', '#294f25', '#356a30'], tile: ['#b8b4a8', '#aca89c', '#c4c0b4'], dirt: ['#4a3a2a', '#423426', '#544232'], deck: ['#7a5a3a', '#6e5034', '#86643f'],
      ruin: ['#6a6460', '#5e5854', '#78726c'], floor: ['#5a5a5e', '#505054', '#646468'], arena: ['#a09c94', '#96928a', '#aaa69e'], roof: ['#4a4c56', '#40424c', '#545660'], rock: ['#8a7a66', '#7c6e5c', '#968670'],
    }[kind];
    // estilizado: manchas grandes e suaves, poucos detalhes finos
    x.fillStyle = P[0]; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      const r = 20 + Math.random() * 60, cx = Math.random() * w, cy = Math.random() * h;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, P[1 + (i % 2)] + '88'); g.addColorStop(1, P[1 + (i % 2)] + '00');
      x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    for (let i = 0; i < 160; i++) { x.fillStyle = P[1 + (i % 2)] + 'aa'; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    if (kind === 'tile' || kind === 'floor') { x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 2; for (let i = 0; i <= w; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } }
    if (kind === 'deck') { x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 2; for (let i = 0; i <= h; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } }
    if (kind === 'grass') for (let i = 0; i < 300; i++) { x.strokeStyle = 'rgba(120,180,90,0.25)'; x.beginPath(); const gx = Math.random() * w, gy = Math.random() * h; x.moveTo(gx, gy); x.lineTo(gx + 1, gy - 5); x.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return (texCache['g' + kind] = t);
}

export class Env {
  constructor(scene) { this.scene = scene; this.objs = []; }
  add(o) { this.scene.add(o); this.objs.push(o); return o; }
  reset() {
    for (const o of this.objs) this.scene.remove(o);
    this.objs = [];
    this.colliders = [];
    this.hazards = [];
    this.updaters = [];
    this.bounds = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
    this.props = [];
    this.anchors = {};
    this.waterLevel = null;
    this.camBox = null;
    this._lamps = 0; this._fires = 0;
    this.baseY = 0; this.killY = undefined; this.ring = null; this.anchorsWhip = null;
    this.rim = 0x9ad0ff; this.rimStrength = 0.55; this.tint = 0xffffff;
    this.dynamicColliders = null; this.night = false;
  }
  collider(x, z, w, d, top = 99) { this.colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, top }); }
  // clima visual do cenário: luz de recorte, tom geral, nuvens, estrelas e sol
  mood({ rim, rimStrength, tint, clouds = 0, cloudColor = 0xffffff, stars = 0, sunDisk = null, sunPos = [-60, 50, -200] } = {}) {
    if (rim !== undefined) this.rim = rim;
    if (rimStrength !== undefined) this.rimStrength = rimStrength;
    if (tint !== undefined) this.tint = tint;
    for (let i = 0; i < clouds; i++) {
      const g = new THREE.Group();
      const mat = new THREE.MeshLambertMaterial({ color: cloudColor, emissive: cloudColor, emissiveIntensity: 0.35, fog: false, transparent: true, opacity: 0.92 });
      for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(G.sph(6 + rnd() * 6, 10), mat); b.position.set(k * 7 - 14 + rnd() * 3, rnd() * 3, rnd() * 4); b.scale.y = 0.55; g.add(b); }
      const a = rnd() * Math.PI * 2, d = 180 + rnd() * 80;
      g.position.set(Math.cos(a) * d, 50 + rnd() * 40, Math.sin(a) * d);
      g.lookAt(0, g.position.y, 0);
      this.add(g);
      const sp = 0.004 + rnd() * 0.004;
      this.updaters.push((dt) => { g.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), sp * dt); });
    }
    if (stars) {
      const n = stars, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, e = 0.15 + rnd() * 1.3, d = 350; pos.set([Math.cos(a) * Math.cos(e) * d, Math.sin(e) * d, Math.sin(a) * Math.cos(e) * d], i * 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
      this.add(pts);
    }
    if (sunDisk) {
      const m = new THREE.Mesh(G.sph(12, 16), new THREE.MeshBasicMaterial({ color: sunDisk, fog: false }));
      m.position.set(...sunPos); this.add(m);
      const halo = new THREE.Mesh(G.sph(26, 16), new THREE.MeshBasicMaterial({ color: sunDisk, fog: false, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.position.copy(m.position); this.add(halo);
    }
  }
  prop(fn, x, z, ry = 0, solid = null, y = 0) {
    const g = fn(); g.position.set(x, y, z); g.rotation.y = ry;
    g.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
    this.add(g);
    if (solid) {
      const c = Math.abs(Math.cos(ry)), sn = Math.abs(Math.sin(ry));
      this.collider(x, z, solid[0] * c + solid[1] * sn, solid[0] * sn + solid[1] * c, y + (solid[2] || 1.5));
    }
    return g;
  }
  // plataforma sólida (o chão para cenários sobre abismo)
  platform(x, z, w, d, top = 0, color = 0x8a8c94, depth = 3) {
    const g = new THREE.Group(); g.position.set(x, top - depth / 2, z);
    const m = part(g, G.box(w, depth, d), color, 0, 0, 0, 0.05);
    m.receiveShadow = true;
    this.add(g);
    this.collider(x, z, w, d, top);
    this.colliders[this.colliders.length - 1].bottom = top - depth;
    return g;
  }

  sky(top, bottom, fogColor, fogNear, fogFar, sun = 0xffffff, sunI = 1.6, hemi = [0xbfd8ff, 0x4a4030, 0.9]) {
    const g = new THREE.SphereGeometry(400, 24, 12);
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { a: { value: new THREE.Color(top) }, b: { value: new THREE.Color(bottom) } },
      vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
      fragmentShader: 'uniform vec3 a; uniform vec3 b; varying float h; void main(){ gl_FragColor = vec4(mix(b,a,smoothstep(-0.05,0.6,h)),1.0);} ',
    });
    const s = new THREE.Mesh(g, m); s.renderOrder = -1;
    this.add(s);
    this.skyMesh = s;
    this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
    this.scene.background = new THREE.Color(bottom);
    const h = new THREE.HemisphereLight(hemi[0], hemi[1], hemi[2] * 1.5); this.add(h);
    if (sunI < 1.2) this.add(new THREE.AmbientLight(hemi[0], 0.55)); // noite: o chão não some no preto
    const d = new THREE.DirectionalLight(sun, sunI < 1 ? sunI * 1.4 : sunI * 0.8);
    d.castShadow = true;
    d.shadow.mapSize.set(2048, 2048);
    const c = d.shadow.camera; c.left = -26; c.right = 26; c.top = 26; c.bottom = -26; c.near = 1; c.far = 120;
    d.shadow.bias = -0.0015;
    this.add(d); this.add(d.target);
    this.sun = d; this.sunOffset = new THREE.Vector3(18, 35, 12);
  }
  ground(kind, size = 200, color = 0xffffff, y = 0) {
    const t = groundTex(kind).clone(); t.needsUpdate = true; t.repeat.set(size / 6, size / 6);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshLambertMaterial({ map: t, color }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true;
    return this.add(m);
  }
  building(x, z, w, d, h, { color = '#6a7280', lit = 0.4, night = false, solid = true, roof = 0x3a3e46 } = {}) {
    const W = windowsTex(color, lit, night);
    const t = { map: W.map.clone(), emis: W.emis.clone() };
    for (const k of ['map', 'emis']) { t[k].needsUpdate = true; t[k].wrapS = t[k].wrapT = THREE.RepeatWrapping; t[k].repeat.set(Math.max(1, w / 6), Math.max(1, h / 12)); }
    const side = new THREE.MeshLambertMaterial({ map: t.map });
    if (night && t.emis) { side.emissiveMap = t.emis; side.emissive = new THREE.Color(0xffffff); side.emissiveIntensity = 1.4; }
    const top = new THREE.MeshLambertMaterial({ color: roof });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, top, side, side]);
    m.position.set(x, h / 2, z); m.castShadow = true; m.receiveShadow = true;
    this.add(m);
    if (solid) this.collider(x, z, w, d, h);
    return m;
  }
  box(x, y, z, w, h, d, color, solid = false, outline = 0.04) {
    const g = new THREE.Group(); g.position.set(x, y, z);
    const m = part(g, G.box(w, h, d), color, 0, 0, 0, outline);
    m.receiveShadow = true;
    this.add(g);
    if (solid) this.collider(x, z, w, d, y + h / 2);
    return g;
  }
  tree(x, z, s = 1, dark = false) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
    part(g, G.cyl(0.25, 0.35, 2.2, 6), dark ? 0x2a1e16 : 0x5a3e26, 0, 1.1, 0, 0.03);
    const leaf = dark ? 0x173a2a : 0x2f6a2a;
    part(g, G.cone(1.6, 2.6, 7), leaf, 0, 3.0, 0, 0.05);
    part(g, G.cone(1.25, 2.2, 7), dark ? 0x1d4632 : 0x3a7a32, 0, 4.1, 0, 0.05);
    part(g, G.cone(0.85, 1.8, 7), leaf, 0, 5.1, 0, 0.05);
    this.add(g);
    this.collider(x, z, 0.8 * s, 0.8 * s);
    return g;
  }
  fire(x, z, r = 1.2, hazard = true, color = [0xff7a1a, 0xffc23a, 0xff3a1a]) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const flames = [];
    for (let i = 0; i < 7; i++) {
      const f = new THREE.Mesh(G.cone(0.35 * r, 1.4 * r, 5), new THREE.MeshBasicMaterial({ color: color[i % color.length], transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      f.position.set((rnd() - 0.5) * r, 0.6 * r, (rnd() - 0.5) * r);
      g.add(f); flames.push(f);
    }
    let L = null;
    if ((this._fires = (this._fires || 0) + 1) <= 6) { L = new THREE.PointLight(color[0], 2.5, 9 * r, 1.5); L.position.y = 1.2; g.add(L); }
    this.add(g);
    const ph = rnd() * 10;
    this.updaters.push((dt, t) => {
      flames.forEach((f, i) => { const k = 0.75 + 0.35 * Math.sin(t * 12 + i * 2 + ph); f.scale.set(k, k * (1 + 0.3 * Math.sin(t * 9 + i)), k); });
      if (L) L.intensity = 2 + Math.sin(t * 20 + ph) * 0.6;
    });
    if (hazard) this.hazards.push({ x, z, r: r * 0.9, dmg: 8, kind: 'fire' });
    return g;
  }
  gas(x, z, r = 3) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(G.sph(r * (0.4 + rnd() * 0.3), 8), new THREE.MeshBasicMaterial({ color: 0x8a3ac8, transparent: true, opacity: 0.25, depthWrite: false }));
      s.position.set((rnd() - 0.5) * r, 0.6 + rnd(), (rnd() - 0.5) * r); g.add(s);
    }
    this.add(g);
    this.updaters.push((dt, t) => { g.rotation.y += dt * 0.3; g.children.forEach((c, i) => c.position.y = 0.8 + Math.sin(t + i) * 0.3); });
    this.hazards.push({ x, z, r: r * 0.8, dmg: 5, kind: 'gas' });
  }
  water(y, size = 400, color = 0x1e5a8a, wave = 0.25) {
    const g = new THREE.PlaneGeometry(size, size, 60, 60);
    const m = new THREE.Mesh(g, new THREE.MeshPhongMaterial({ color, shininess: 80, transparent: true, opacity: 0.88, flatShading: true }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true;
    this.add(m);
    const pos = g.attributes.position, base = pos.array.slice();
    this.updaters.push((dt, t) => {
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], yy = base[i * 3 + 1];
        pos.array[i * 3 + 2] = Math.sin(x * 0.3 + t * 1.5) * wave + Math.cos(yy * 0.25 + t * 1.1) * wave;
      }
      pos.needsUpdate = true; g.computeVertexNormals();
    });
    this.waterLevel = y;
    return m;
  }
  sign(x, y, z, w, h, text, bg = '#c8281e', fg = '#fff', rotY = 0) {
    const t = canvasTex(256, 128, (c, W, H) => { c.fillStyle = bg; c.fillRect(0, 0, W, H); c.fillStyle = fg; c.font = 'bold 54px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, H / 2); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.y = rotY;
    return this.add(m);
  }
  lamp(x, z, color = 0xffd88a, h = 4) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    part(g, G.cyl(0.08, 0.1, h, 6), 0x3a3a40, 0, h / 2, 0, 0.02);
    part(g, G.box(0.5, 0.15, 0.3), 0x3a3a40, 0.2, h, 0, 0.02);
    const b = new THREE.Mesh(G.sph(0.14, 8), new THREE.MeshBasicMaterial({ color }));
    b.position.set(0.3, h - 0.1, 0); g.add(b);
    // só alguns postes iluminam de verdade (luzes pontuais custam caro no celular)
    if ((this._lamps = (this._lamps || 0) + 1) % 3 === 0) { const L = new THREE.PointLight(color, 3, 14, 1.4); L.position.set(0.3, h - 0.3, 0); g.add(L); }
    this.add(g);
  }
  rubble(x, z, n = 6, spread = 2, color = 0x6a6660) {
    for (let i = 0; i < n; i++) {
      const s = 0.4 + rnd() * 1.1;
      const g = this.box(x + (rnd() - 0.5) * spread * 2, s / 2 - 0.1, z + (rnd() - 0.5) * spread * 2, s, s * 0.8, s * 1.2, color, false, 0.03);
      g.rotation.set(rnd() * 0.6, rnd() * 3, rnd() * 0.6);
    }
  }
  skyline(dist = 120, count = 40, night = false, color = '#5a6474') {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rnd() * 0.1;
      const w = 8 + rnd() * 12, h = 15 + rnd() * 45;
      this.building(Math.cos(a) * dist, Math.sin(a) * dist, w, w, h, { color, lit: night ? 0.5 : 0.25, night, solid: false });
    }
  }

  // ---------------- Cenários ----------------
  build(name) {
    this.reset();
    seed = [...name].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 2147483646 + 1;
    const fn = this['_' + name];
    if (!fn) throw new Error('cenário inexistente: ' + name);
    fn.call(this);
    return this;
  }

  // Tatooin — rua comercial onde o Vilão de Lama ataca
  _tatooin() {
    this.sky(0xf0a868, 0xffe0b0, 0xf6c89a, 40, 140, 0xffd2a0, 1.5, [0xffe0c0, 0x5a4030, 0.9]);
    this.mood({ rim: 0xffb070, clouds: 8, cloudColor: 0xffc8a0, sunDisk: 0xffe0a8, sunPos: [0, 30, -260], tint: 0xfff2e6 });
    for (let z = 0; z > -60; z -= 15) { this.prop(() => M.car(pick([0xc8281e, 0x2a5bc4, 0xe8e8e8, 0x2a2a2a])), pick([-5.6, 5.6]), z - 4, Math.PI / 2 * (rnd() < 0.5 ? 1 : -1) + 0.2, [1.9, 4.2, 1.4]); this.prop(() => M.vending(pick([0xd8282e, 0x2a6ac8])), pick([-6.6, 6.6]), z - 9, 0, [0.9, 0.7, 1.9]); }
    this.ground('asphalt', 220);
    this.bounds = { minX: -7, maxX: 7, minZ: -70, maxZ: 8 };
    const cols = ['#b88a6a', '#8a9aaa', '#c8b48a', '#9a7a8a', '#7a8a7a'];
    for (let z = 10; z > -95; z -= 9) for (const s of [-1, 1]) {
      const h = 7 + rnd() * 10;
      this.building(s * 13, z, 10, 8, h, { color: pick(cols), lit: 0.3 });
      this.sign(s * 7.9, 3.4, z, 3.2, 1.2, pick(['ラーメン', 'HERO', 'カフェ', 'BOOKS', '本屋', 'ゲーム']), pick(['#c8281e', '#2a5bc4', '#e8a21a', '#2a8a4a']), '#fff', s * -Math.PI / 2);
    }
    for (let z = 0; z > -70; z -= 12) { this.lamp(-7.5, z); this.lamp(7.5, z - 6); }
    // focos de incêndio causados pela luta
    this.fire(-3, -22, 1.1); this.fire(3.5, -34, 1.3); this.fire(-2, -46, 1.2); this.fire(4, -14, 0.9);
    this.rubble(-4, -28, 4, 1.5); this.rubble(3, -40, 4, 1.5);
    this.anchors.sludge = new THREE.Vector3(0, 0, -62);
    const sl = sludge(); sl.position.copy(this.anchors.sludge); sl.scale.setScalar(1.3); this.add(sl);
    this.sludgeObj = sl;
    this.updaters.push((dt, t) => sl.userData.blobs.forEach((b, i) => { b.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.08); b.position.x += Math.sin(t * 2 + i) * 0.003; }));
    // multidão de curiosos
    this.anchors.crowd = new THREE.Vector3(0, 0, -52);
    for (let i = 0; i < 10; i++) this.box(-6 + i * 1.3, 0.9, -52 + (i % 2) * 0.8, 0.5, 1.8, 0.4, pick([0x3a4a6a, 0x6a3a3a, 0x4a6a4a, 0x8a7a5a, 0x2a2a2a]), false, 0.03);
    this.anchors.start = new THREE.Vector3(0, 0, 4);
  }

  // Praia Dagobah — dez meses de treino limpando lixo
  _dagobah() {
    this.sky(0x6a8ad8, 0xffb88a, 0xffc8a0, 50, 180, 0xffc890, 1.4, [0xffd8b0, 0x6a5a40, 1]);
    this.mood({ rim: 0xffc890, clouds: 10, cloudColor: 0xffd0c0, tint: 0xfff4ea });
    // a areia termina em z=-30 e dali em diante é mar
    this.ground('sand', 260, 0xffffff).position.z = 100;
    this.water(-0.35, 400, 0x2a6a9a, 0.18);
    this.bounds = { minX: -26, maxX: 26, minZ: -24, maxZ: 22 };
    // sol nascente
    const sun = new THREE.Mesh(G.sph(14, 16), new THREE.MeshBasicMaterial({ color: 0xffe0a0, fog: false })); sun.position.set(-40, 18, -200); this.add(sun);
    this.skyline(160, 26, false, '#8a96a8');
    this.box(0, 1.2, 30, 70, 2.4, 2, 0x9a9a92, true); // muro do calçadão
    for (let x = -30; x <= 30; x += 10) this.lamp(x, 27);
    this.anchors.start = new THREE.Vector3(0, 0, 12);
    this.anchors.allMight = new THREE.Vector3(-4, 0, 16);
  }

  // Centro de Batalha B — exame prático da U.A.
  _exam() {
    this.sky(0x5a9ae8, 0xc8e4ff, 0xc8dcf0, 60, 200, 0xffffff, 1.7);
    this.mood({ rim: 0xd0ecff, clouds: 12, sunDisk: 0xfff4d0, sunPos: [80, 120, -200] });
    for (let i = 0; i < 6; i++) this.prop(() => M.car(pick([0xc8c8c8, 0x2a5bc4, 0x8a2a2a])), pick([-15, 15]), -5 - i * 10, 0, [1.9, 4.2, 1.4]);
    for (let i = 0; i < 8; i++) this.prop(() => M.cone(), (rnd() - 0.5) * 26, -rnd() * 55);
    this.ground('asphalt', 260);
    this.bounds = { minX: -18, maxX: 18, minZ: -60, maxZ: 18 };
    const cols = ['#9aa4b0', '#b0a48a', '#8a96a4', '#a8a8b8', '#c0b8a8'];
    for (let z = 20; z > -110; z -= 14) for (const s of [-1, 1]) {
      this.building(s * (24 + rnd() * 3), z, 12, 11, 12 + rnd() * 26, { color: pick(cols), lit: 0.2 });
    }
    for (let i = 0; i < 6; i++) this.box(pick([-12, 12, -6, 6]), 0.6, -10 - i * 9, 1.4, 1.2, 1.4, 0x8a8a7a, true);
    // faixas de pedestre
    for (let z = 10; z > -60; z -= 20) for (let x = -14; x <= 14; x += 3) { const s = this.box(x, 0.01, z, 1.6, 0.02, 4, 0xeeeeee, false, 0); }
    this.anchors.start = new THREE.Vector3(0, 0, 12);
    this.anchors.uraraka = new THREE.Vector3(3, 0, -38);
    this.anchors.zero = new THREE.Vector3(0, 0, -62);
  }

  // U.S.J. — Zona de Naufrágio
  _usjShip() {
    this.sky(0x8ab4d8, 0xd8ecff, 0xa8c8e0, 30, 140, 0xffffff, 1.4);
    this.mood({ rim: 0xcfe8ff, clouds: 6 });
    this.water(-1.3, 400, 0x1a5a8a, 0.35);
    // navio: convés como plataforma em y=0 (o mar fica abaixo visualmente)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 30), new THREE.MeshLambertMaterial({ map: (() => { const t = groundTex('deck').clone(); t.needsUpdate = true; t.repeat.set(3, 6); return t; })() }));
    deck.position.set(0, -0.6, 0); deck.receiveShadow = true; this.add(deck);
    const hull = this.box(0, -2.2, 0, 14.4, 3.4, 30.4, 0x8a2a22, false, 0.06);
    const bow = new THREE.Mesh(G.cone(7.2, 8, 4), toon(0x8a2a22)); bow.rotation.set(Math.PI / 2, Math.PI / 4, 0); bow.position.set(0, -1.5, -19); bow.scale.set(1, 1, 0.45); this.add(bow);
    this.box(0, 1.6, -11, 7, 3.2, 4, 0xeeeeee, true); // cabine na proa
    this.box(0, 4, -11, 1.6, 1.6, 1.6, 0x333333, false);
    const mast = this.box(0, 6, -6, 0.4, 12, 0.4, 0x6a4a2a, false);
    for (let z = -14; z <= 14; z += 2) for (const s of [-1, 1]) this.box(s * 6.9, 0.5, z, 0.12, 1, 0.12, 0xdddddd);
    this.box(0, 0.5, 15, 14, 1, 0.12, 0xdddddd); this.box(0, 0.5, -15, 14, 1, 0.12, 0xdddddd);
    this.bounds = { minX: -6.6, maxX: 6.6, minZ: -14.6, maxZ: 14.6 };
    // a cúpula da USJ ao fundo
    const dome = new THREE.Mesh(new THREE.SphereGeometry(150, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xa8d0f0, wireframe: true, transparent: true, opacity: 0.25, fog: false }));
    this.add(dome);
    this.box(-60, 10, -40, 20, 20, 30, 0x8a7a6a); // zona de deslizamento
    this.box(60, 15, -60, 18, 30, 18, 0x6a8aa8);
    this.anchors.start = new THREE.Vector3(0, 0, 4);
    this.anchors.tsuyu = new THREE.Vector3(-3, 0, 8);
    this.anchors.mineta = new THREE.Vector3(3, 0, 8);
    this.waterLevel = -99; // o convés impede a queda
  }

  // U.S.J. — Praça Central
  _usjPlaza() {
    this.sky(0x8ab4d8, 0xd8ecff, 0xb8d0e8, 40, 160, 0xffffff, 1.5);
    this.mood({ rim: 0xcfe8ff, clouds: 6 });
    this.ground('tile', 260, 0xf0f0f0);
    this.bounds = { minX: -22, maxX: 22, minZ: -22, maxZ: 22 };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(110, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xa8d0f0, wireframe: true, transparent: true, opacity: 0.3, fog: false }));
    this.add(dome);
    const ring = new THREE.Mesh(new THREE.RingGeometry(14, 15, 48), new THREE.MeshBasicMaterial({ color: 0x8a8a8a, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; this.add(ring);
    part(this.add(new THREE.Group()), G.cyl(2.5, 3, 1, 16), 0xb8b8c0, 0, 0.5, 0, 0.05); // fonte
    this.collider(0, 0, 5, 5, 1);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; this.box(Math.cos(a) * 24, 3, Math.sin(a) * 24, 1, 6, 1, 0x9a9aa8, true); }
    // escadaria de entrada
    for (let i = 0; i < 6; i++) this.box(0, i * 0.5, 30 + i * 1.2, 18, 1, 1.2, 0xc8c8cc);
    this.box(-40, 12, -50, 24, 24, 24, 0x8a6a4a); this.box(45, 10, -40, 20, 20, 28, 0x5a8aaa); this.box(50, 6, 30, 30, 12, 20, 0x6aa86a);
    this.anchors.start = new THREE.Vector3(0, 0, 12);
    this.anchors.boss = new THREE.Vector3(0, 0, -10);
    this.anchors.shigaraki = new THREE.Vector3(-8, 0, -18);
  }

  // Hosu — noite, incêndios e Nomus
  _hosuStreet() {
    this.sky(0x1a1030, 0x8a3a2a, 0x3a1e22, 20, 110, 0xff9a6a, 0.6, [0x6a4a8a, 0x2a1010, 0.7]);
    this.mood({ rim: 0xff9a5a, rimStrength: 0.7, tint: 0xfff0e6, stars: 150 });
    for (let i = 0; i < 5; i++) { const c = this.prop(() => M.car(pick([0x3a3a3a, 0x5a2a2a, 0x2a3a5a])), pick([-8, 8, -4, 4]), -3 - i * 9, rnd() * 3, [2.6, 4.2, 1.4]); c.rotation.z = rnd() < 0.3 ? 0.4 : 0; }
    for (let i = 0; i < 6; i++) this.prop(() => M.barrier(), (rnd() - 0.5) * 18, -rnd() * 40, rnd() * 3);
    this.ground('asphalt', 220);
    this.bounds = { minX: -11, maxX: 11, minZ: -45, maxZ: 14 };
    for (let z = 16; z > -80; z -= 10) for (const s of [-1, 1]) this.building(s * 17, z, 11, 9, 12 + rnd() * 25, { color: '#3a3a4a', lit: 0.5, night: true });
    this.fire(-6, -8, 1.4); this.fire(7, -20, 1.6); this.fire(-8, -30, 1.3); this.fire(5, 4, 1.0);
    this.rubble(0, -15, 6, 3); this.rubble(-4, -36, 5, 2);
    for (let z = 10; z > -50; z -= 14) { this.lamp(-11.5, z, 0xffb86a); this.lamp(11.5, z - 7, 0xffb86a); }
    this.sign(-11.4, 4.5, -4, 3.5, 1.3, '保須', '#2a2a4a', '#ffd23a', Math.PI / 2);
    this.anchors.start = new THREE.Vector3(0, 0, 10);
  }
  _hosuAlley() {
    this.sky(0x0e0a1e, 0x4a1e2a, 0x1e1428, 12, 70, 0x9a8aff, 0.6, [0x6a6ab0, 0x2a1a1a, 1.0]);
    this.mood({ rim: 0xb08aff, rimStrength: 0.75, stars: 100 });
    this.ground('concrete', 120, 0x8a8a9a);
    this.bounds = { minX: -4.5, maxX: 4.5, minZ: -26, maxZ: 6 };
    for (const s of [-1, 1]) for (let z = 8; z > -40; z -= 8) this.building(s * 9, z, 9, 8, 18 + rnd() * 10, { color: '#2a2a34', lit: 0.15, night: true });
    for (let z = 2; z > -26; z -= 6) { this.box(-4, 0.7, z, 0.9, 1.4, 1.6, 0x3a5a3a, true); }
    this.box(3.9, 0.5, -8, 1, 1, 1, 0x5a4a3a, true); this.box(3.8, 0.4, -18, 1, 0.8, 2, 0x3a3a5a, true);
    for (let z = 0; z > -26; z -= 7) { const L = new THREE.PointLight(0xc8a0ff, 1.5, 10); L.position.set(0, 5, z); this.add(L); }
    this.anchors.start = new THREE.Vector3(0, 0, 4);
    this.anchors.boss = new THREE.Vector3(0, 0, -16);
    this.anchors.iida = new THREE.Vector3(3.6, 0, -22);
    this.anchors.native = new THREE.Vector3(-3.6, 0, -23);
  }

  // Floresta do acampamento (Bosque das Feras)
  _forest() {
    this.sky(0x0a0e22, 0x1e2a4a, 0x101a2c, 18, 90, 0xb8c8ff, 0.9, [0x7a8ad0, 0x1a2a18, 1.2]);
    this.mood({ rim: 0x8ab0ff, rimStrength: 0.7, stars: 400 });
    this.ground('grass', 220, 0xaabbcc);
    this.bounds = { minX: -16, maxX: 16, minZ: -50, maxZ: 14 };
    const moon = new THREE.Mesh(G.sph(8, 16), new THREE.MeshBasicMaterial({ color: 0xf0f0ff, fog: false })); moon.position.set(60, 70, -160); this.add(moon);
    for (let i = 0; i < 90; i++) {
      const x = (rnd() - 0.5) * 90, z = 20 - rnd() * 100;
      if (Math.abs(x) < 15 && z < 12 && z > -52 && rnd() < 0.8) continue;
      this.tree(x, z, 0.9 + rnd() * 0.7, true);
    }
    for (let i = 0; i < 6; i++) this.tree(pick([-12, -9, 9, 12]), -5 - i * 8, 0.8, true);
    // chamas azuis do Dabi e gás do Mustard
    const blue = [0x3a7aff, 0x7ab0ff, 0x1a3aff];
    this.fire(-10, -18, 1.5, true, blue); this.fire(11, -30, 1.7, true, blue); this.fire(-6, -40, 1.4, true, blue);
    this.gas(6, -12, 3.2); this.gas(-8, -32, 3.5);
    this.anchors.start = new THREE.Vector3(0, 0, 10);
  }
  _forestCliff() {
    this.sky(0x0a0e22, 0x223058, 0x121a2e, 24, 100, 0xb8c8ff, 1.0, [0x7a8ad0, 0x1a2a18, 1.2]);
    this.mood({ rim: 0x8ab0ff, rimStrength: 0.7, stars: 400 });
    this.ground('dirt', 200, 0x9a9aa8);
    this.bounds = { minX: -13, maxX: 13, minZ: -16, maxZ: 10 };
    // penhasco com a caverna secreta do Kota
    this.box(0, 6, -22, 40, 12, 10, 0x4a4038, true, 0.08);
    this.box(0, 1.6, -16.6, 3.2, 3.2, 0.5, 0x0a0a0a, false, 0);
    for (let i = 0; i < 18; i++) { const a = rnd() * Math.PI * 2; this.tree(Math.cos(a) * (24 + rnd() * 20), Math.sin(a) * (20 + rnd() * 20) + 8, 1 + rnd() * 0.5, true); }
    for (const s of [-1, 1]) this.box(s * 16, 4, 0, 4, 8, 30, 0x4a4038, true, 0.06);
    const moon = new THREE.Mesh(G.sph(9, 16), new THREE.MeshBasicMaterial({ color: 0xf0f0ff, fog: false })); moon.position.set(-50, 80, -150); this.add(moon);
    this.rubble(-8, -10, 5, 2, 0x5a5048); this.rubble(9, -6, 4, 2, 0x5a5048);
    this.anchors.start = new THREE.Vector3(0, 0, 6);
    this.anchors.boss = new THREE.Vector3(0, 0, -8);
    this.anchors.kota = new THREE.Vector3(-4, 0, -14.5);
  }

  // Kamino — bairro destruído, para a corrida automática
  _kamino() {
    this.sky(0x0a0a18, 0x4a2a3a, 0x241a28, 30, 120, 0xc8b8ff, 0.8, [0x8a7ab0, 0x2a1a1a, 1.0]);
    this.mood({ rim: 0xc8a0ff, rimStrength: 0.7, stars: 200 });
    this.ground('ruin', 640, 0xaaaaaa).position.z = -290;
    for (let z = 20; z > -600; z -= 12) for (const s of [-1, 1]) {
      const h = 4 + rnd() * 20;
      const b = this.building(s * (13 + rnd() * 4), z, 8 + rnd() * 4, 9, h, { color: '#3a3640', lit: 0.12, night: true, solid: false });
      b.rotation.z = (rnd() - 0.5) * 0.2;
    }
    for (let z = 0; z > -600; z -= 30) this.fire((rnd() - 0.5) * 20, z, 1, false);
    this.anchors.start = new THREE.Vector3(0, 0, 0);
  }

  // Esconderijo da Shie Hassaikai — labirinto subterrâneo
  _hideout() {
    this.sky(0x0a0a0a, 0x1a1a1a, 0x141210, 10, 60, 0xffe8c8, 0.5, [0xb0a890, 0x2a2a2a, 1.4]);
    this.mood({ rim: 0xffd8b0, rimStrength: 0.5 });
    this.ground('floor', 120, 0xc8c8c8);
    this.bounds = { minX: -9, maxX: 9, minZ: -40, maxZ: 8 };
    this.camBox = { minX: -8.6, maxX: 8.6, minZ: -40, maxZ: 8.8, maxY: 5.6 };
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(40, 70), new THREE.MeshLambertMaterial({ color: 0x3a3a3c })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 6, -16); this.add(ceil);
    for (const s of [-1, 1]) this.box(s * 10, 3, -16, 2, 6, 52, 0x5a5a60, true, 0.05);
    this.box(0, 3, 9.5, 20, 6, 1, 0x5a5a60, true); this.box(0, 3, -41, 20, 6, 1, 0x5a5a60, true);
    for (let z = 4; z > -40; z -= 8) { const L = new THREE.PointLight(0xffe0b0, 2, 12, 1.5); L.position.set(0, 5.4, z); this.add(L); this.box(0, 5.9, z, 2, 0.1, 0.5, 0xfff4d8, false, 0); }
    // paredes móveis (quirk do Irinaka)
    this.moving = [];
    for (let i = 0; i < 4; i++) {
      const z = -6 - i * 8.5, w = this.box(0, 3, z, 7, 6, 1.2, 0x6a6a70, false, 0.05);
      this.moving.push({ g: w, z, phase: i * 1.7 });
    }
    this.updaters.push((dt, t) => {
      for (const m of this.moving) m.g.position.x = Math.sin(t * 0.5 + m.phase) * 6.5;
    });
    this.dynamicColliders = () => this.moving.map(m => ({ minX: m.g.position.x - 3.5, maxX: m.g.position.x + 3.5, minZ: m.z - 0.6, maxZ: m.z + 0.6, top: 99 }));
    this.anchors.start = new THREE.Vector3(0, 0, 5);
  }
  _hideoutBoss() {
    this.sky(0x0a0a0a, 0x1e1a18, 0x141010, 14, 80, 0xffe8c8, 0.7, [0xb0a890, 0x2a2a2a, 1.3]);
    this.mood({ rim: 0xffd8b0, rimStrength: 0.6 });
    this.ground('floor', 140, 0xa8a8a8);
    this.bounds = { minX: -16, maxX: 16, minZ: -16, maxZ: 12 };
    for (const [x, z] of [[-9, -6], [9, -6], [-9, 6], [9, 6]]) this.box(x, 3, z, 1.4, 6, 1.4, 0x6a6a70, true);
    for (let i = 0; i < 6; i++) { const L = new THREE.PointLight(0xffe0b0, 2, 16, 1.5); L.position.set((i % 3 - 1) * 10, 6, i < 3 ? -6 : 6); this.add(L); }
    this.anchors.start = new THREE.Vector3(0, 0, 8);
    this.anchors.boss = new THREE.Vector3(0, 0, -8);
    this.anchors.eri = new THREE.Vector3(-12, 0, 10);
  }

  // Jaku — campo de batalha final em ruínas
  _jaku() {
    this.sky(0x2a2a3a, 0x8a6a5a, 0x4a4040, 30, 140, 0xffd8c0, 1.4, [0xa8a8c8, 0x3a3030, 1.1]);
    this.mood({ rim: 0xffb0a0, rimStrength: 0.7, clouds: 12, cloudColor: 0x7a6a6a, tint: 0xfff0ea });
    this.ground('ruin', 260, 0x9a9090);
    this.bounds = { minX: -24, maxX: 24, minZ: -24, maxZ: 24 };
    for (let i = 0; i < 26; i++) {
      const a = rnd() * Math.PI * 2, d = 35 + rnd() * 50;
      const b = this.building(Math.cos(a) * d, Math.sin(a) * d, 6 + rnd() * 8, 6 + rnd() * 8, 4 + rnd() * 18, { color: '#5a5450', lit: 0, solid: false });
      b.rotation.set((rnd() - 0.5) * 0.4, rnd() * 3, (rnd() - 0.5) * 0.4);
    }
    for (let i = 0; i < 10; i++) this.rubble((rnd() - 0.5) * 40, (rnd() - 0.5) * 40, 3, 1.2, 0x5a5450);
    // destroços flutuando
    const floaters = [];
    for (let i = 0; i < 14; i++) { const g = this.box((rnd() - 0.5) * 80, 8 + rnd() * 20, (rnd() - 0.5) * 80, 1 + rnd() * 3, 1 + rnd() * 2, 1 + rnd() * 3, 0x5a5450); floaters.push(g); }
    this.updaters.push((dt, t) => floaters.forEach((f, i) => { f.position.y += Math.sin(t + i) * dt * 0.5; f.rotation.y += dt * 0.1; }));
    this.anchors.start = new THREE.Vector3(0, 0, 12);
    this.anchors.boss = new THREE.Vector3(0, 0, -10);
  }

  // Treino de Batalha — prédio de concreto da U.A. (heróis vs. vilões)
  _battleTrial() {
    this.sky(0x0a0a0a, 0x1a1a1e, 0x18181c, 10, 60, 0xfff0e0, 0.6, [0xd0d0e0, 0x3a3a3a, 1.3]);
    this.mood({ rim: 0xcfe0ff, rimStrength: 0.55 });
    this.ground('floor', 120, 0xd0d0d0);
    this.bounds = { minX: -13, maxX: 13, minZ: -24, maxZ: 10 };
    this.camBox = { minX: -12.6, maxX: 12.6, minZ: -24, maxZ: 9.8, maxY: 6.2 };
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(40, 50), new THREE.MeshLambertMaterial({ color: 0x4a4a50 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 7, -7); this.add(ceil);
    for (const sx of [-1, 1]) this.box(sx * 14, 3.5, -7, 2, 7, 36, 0x7a7a80, true, 0.05);
    this.box(0, 3.5, 11, 30, 7, 1, 0x7a7a80, true); this.box(0, 3.5, -25, 30, 7, 1, 0x7a7a80, true);
    // corredores internos com vãos
    for (const [x, z, w, d] of [[-7, -2, 8, 1], [7, -2, 6, 1], [-4, -12, 1, 8], [6, -14, 10, 1]]) this.box(x, 3.5, z, w, 7, d, 0x8a8a90, true, 0.05);
    for (let z = 6; z > -24; z -= 8) { const L = new THREE.PointLight(0xfff0d8, 2.2, 16, 1.4); L.position.set(0, 6.4, z); this.add(L); this.box(0, 6.9, z, 3, 0.1, 0.4, 0xffffff, false, 0); }
    // a "arma nuclear" falsa dos vilões
    const bomb = new THREE.Group(); bomb.position.set(0, 0, -20);
    part(bomb, G.cyl(0.9, 0.9, 3.4, 12), 0xc8c8c0, 0, 1.7, 0, 0.04); part(bomb, G.cone(0.9, 1.4, 12), 0xc8281e, 0, 4.1, 0, 0.04);
    this.add(bomb); this.collider(0, -20, 2, 2, 5);
    for (let i = 0; i < 6; i++) this.prop(() => M.crate(), (rnd() - 0.5) * 20, -rnd() * 22, rnd() * 3, [1, 1, 1]);
    this.anchors.start = new THREE.Vector3(-8, 0, 7);
    this.anchors.boss = new THREE.Vector3(4, 0, -6);
    this.anchors.bomb = new THREE.Vector3(0, 0, -20);
  }

  // Festival Esportivo — Corrida de Obstáculos (plataformas sobre o abismo)
  _race() {
    this.sky(0x4a8ae8, 0xc8e4ff, 0xb8d4f0, 50, 220, 0xffffff, 1.7);
    this.mood({ rim: 0xd8ecff, clouds: 14, sunDisk: 0xfff4d0, sunPos: [60, 110, -260] });
    this.baseY = -80; this.killY = -10;
    this.bounds = { minX: -16, maxX: 16, minZ: -200, maxZ: 14 };
    const abyss = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: 0x1a2a3a })); abyss.rotation.x = -Math.PI / 2; abyss.position.y = -60; this.add(abyss);
    // largada + zona dos robôs
    this.platform(0, -25, 30, 80, 0, 0x7a808c, 6);
    for (let z = 6; z > -60; z -= 12) for (const sx of [-1, 1]) this.box(sx * 15.5, 0.6, z, 0.6, 1.2, 10, 0xc8281e, true, 0.03);
    // The Fall: pilares e cordas
    const pillars = [[0, -72], [-6, -80], [5, -86], [-2, -96], [7, -104], [0, -114]];
    for (const [x, z] of pillars) this.platform(x, z, 4.2, 4.2, 0, 0x8a7a6a, 40);
    const ropes = [[[0, -64], [0, -72]], [[0, -72], [-6, -80]], [[-6, -80], [5, -86]], [[5, -86], [-2, -96]], [[-2, -96], [7, -104]], [[7, -104], [0, -114]], [[0, -114], [0, -122]]];
    for (const [[x1, z1], [x2, z2]] of ropes) {
      const L = Math.hypot(x2 - x1, z2 - z1), a = Math.atan2(x2 - x1, z2 - z1);
      const g = new THREE.Group(); g.position.set((x1 + x2) / 2, -0.12, (z1 + z2) / 2); g.rotation.y = a;
      part(g, G.box(0.9, 0.24, L), 0xd8c08a, 0, 0, 0, 0.02); this.add(g);
      // colisor aproximado por segmentos ao longo da corda
      for (let k = 0; k <= L; k += 0.8) { const x = x1 + (x2 - x1) * k / L, z = z1 + (z2 - z1) * k / L; this.colliders.push({ minX: x - 0.6, maxX: x + 0.6, minZ: z - 0.6, maxZ: z + 0.6, top: 0, bottom: -0.5 }); }
    }
    // campo minado + chegada
    this.platform(0, -150, 30, 56, 0, 0x6a9a5a, 6);
    this.platform(0, -190, 30, 24, 0, 0x7a808c, 6);
    for (const sx of [-1, 1]) this.box(sx * 9, 8, -197, 4, 16, 4, 0x3a5bc4, false, 0.05);
    this.box(0, 15, -197, 22, 3, 4, 0x3a5bc4, false, 0.05);
    this.sign(0, 15, -194.9, 16, 2.4, 'CHEGADA', '#2a4bb4', '#ffd23a');
    // arquibancadas ao longe
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; this.box(Math.cos(a) * 140, 12, -90 + Math.sin(a) * 140, 30, 24, 10, 0x9aa4b4).lookAt(0, 12, -90); }
    this.anchors.start = new THREE.Vector3(0, 0, 8);
    this.anchors.fall = new THREE.Vector3(0, 0, -62);
    this.anchors.mines = new THREE.Vector3(0, 0, -124);
    this.anchors.finish = new THREE.Vector3(0, 0, -190);
  }

  // Festival Esportivo — arena do torneio (ring-out!)
  _stadium() {
    this.sky(0x4a8ae8, 0xd0e8ff, 0xc0d8f0, 60, 240, 0xffffff, 1.4);
    this.mood({ rim: 0xd8ecff, clouds: 12, sunDisk: 0xfff4d0, sunPos: [60, 120, -260] });
    this.ground('grass', 260, 0xbfe0a8);
    this.bounds = { minX: -22, maxX: 22, minZ: -22, maxZ: 22 };
    // ringue de concreto 24x24 (sair dele = derrota)
    const ring = new THREE.Group(); ring.position.y = -0.25;
    const t = groundTex('arena').clone(); t.needsUpdate = true; t.repeat.set(4, 4);
    const m = new THREE.Mesh(new THREE.BoxGeometry(24, 1, 24), new THREE.MeshLambertMaterial({ map: t })); m.receiveShadow = true; ring.add(m);
    this.add(ring);
    this.collider(0, 0, 24, 24, 0.25);
    this.ring = { minX: -12, maxX: 12, minZ: -12, maxZ: 12 };
    const line = new THREE.Mesh(new THREE.RingGeometry(16.6, 17, 4, 1), new THREE.MeshBasicMaterial({ color: 0xffffff })); line.rotation.set(-Math.PI / 2, 0, Math.PI / 4); line.position.y = 0.27; this.add(line);
    // arquibancadas com torcida
    const crowd = new THREE.InstancedMesh(G.box(0.5, 0.8, 0.5), new THREE.MeshLambertMaterial(), 1600);
    let n = 0; const mtx = new THREE.Matrix4(), col = new THREE.Color();
    for (let side = 0; side < 4; side++) for (let row = 0; row < 8; row++) for (let i = 0; i < 50 && n < 1600; i++) {
      const along = -24 + i * 0.98, out = 30 + row * 1.6, y = 1.2 + row * 1.2;
      const [x, z] = [[along, -out], [out, along], [-along, out], [-out, -along]][side];
      mtx.makeTranslation(x, y, z); crowd.setMatrixAt(n, mtx);
      crowd.setColorAt(n, col.setHSL(rnd(), 0.6, 0.55)); n++;
    }
    crowd.count = n; this.add(crowd);
    // arquibancadas em degraus sob a torcida
    for (let side = 0; side < 4; side++) for (let row = 0; row < 8; row++) {
      const out = 30 + row * 1.6, h = 0.8 + row * 1.2;
      const g = this.box(0, h / 2, 0, side % 2 ? 1.6 : 52, h, side % 2 ? 52 : 1.6, row % 2 ? 0x6a7488 : 0x7a8498, false, 0.02);
      g.position.set(...[[0, h / 2, -out], [out, h / 2, 0], [0, h / 2, out], [-out, h / 2, 0]][side]);
    }
    this.updaters.push((dt, t) => { crowd.position.y = Math.abs(Math.sin(t * 6)) * 0.08; });
    this.sign(0, 16, -46, 24, 6, 'U.A. SPORTS FESTIVAL', '#2a4bb4', '#ffffff');
    this.anchors.start = new THREE.Vector3(0, 0.25, 8);
    this.anchors.boss = new THREE.Vector3(0, 0.25, -8);
  }

  // Exame da Licença Provisória — campo rochoso e zona de desastre
  _license() {
    this.sky(0x5a9ae8, 0xd8e8f8, 0xc0d0e0, 40, 200, 0xffffff, 1.6);
    this.mood({ rim: 0xd8ecff, clouds: 10 });
    this.ground('rock', 260, 0xd8c8b8);
    this.bounds = { minX: -22, maxX: 22, minZ: -52, maxZ: 20 };
    for (let i = 0; i < 18; i++) { const x = (rnd() - 0.5) * 40, z = 18 - rnd() * 26; const sz = 1 + rnd() * 2.5; const g = this.box(x, sz / 2, z, sz, sz, sz * 1.2, 0x6a5a4c, true, 0.05); g.rotation.y = rnd() * 3; }
    // zona de desastre (ruínas)
    for (let i = 0; i < 14; i++) { const b = this.building((rnd() - 0.5) * 40, -18 - rnd() * 32, 5 + rnd() * 4, 5 + rnd() * 4, 3 + rnd() * 8, { color: '#7a746c', lit: 0, solid: true }); b.rotation.z = (rnd() - 0.5) * 0.12; }
    for (let i = 0; i < 10; i++) this.rubble((rnd() - 0.5) * 40, -14 - rnd() * 36, 4, 1.8);
    this.fire(-12, -30, 1.2); this.fire(14, -40, 1.4); this.fire(4, -22, 1);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; this.box(Math.cos(a) * 90, 25, -15 + Math.sin(a) * 90, 40, 50, 10, 0x9aa0a8).lookAt(0, 25, -15); }
    this.anchors.start = new THREE.Vector3(0, 0, 16);
    this.anchors.ruins = new THREE.Vector3(0, 0, -20);
    this.anchors.boss = new THREE.Vector3(0, 0, -34);
  }

  // Ground Beta — campo de treino à noite (Deku vs. Kacchan II)
  _groundBeta() {
    this.sky(0x060a1e, 0x1a2244, 0x0c1226, 24, 110, 0xb8c8ff, 0.9, [0x7a8ad0, 0x1a1a2a, 1.1]);
    this.mood({ rim: 0x9ab8ff, rimStrength: 0.8, stars: 500 });
    this.ground('asphalt', 220, 0xb0b8d0);
    this.bounds = { minX: -18, maxX: 18, minZ: -18, maxZ: 18 };
    const moon = new THREE.Mesh(G.sph(10, 16), new THREE.MeshBasicMaterial({ color: 0xf4f4ff, fog: false })); moon.position.set(-80, 90, -180); this.add(moon);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; this.building(Math.cos(a) * 30, Math.sin(a) * 30, 9, 9, 10 + rnd() * 20, { color: '#4a5266', lit: 0.25, night: true, solid: false }); }
    for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) this.box(x, 2, z, 3, 4, 3, 0x6a7080, true, 0.05);
    for (let i = 0; i < 8; i++) this.lamp(Math.cos(i / 8 * 6.28) * 17, Math.sin(i / 8 * 6.28) * 17, 0xd8e4ff);
    this.anchors.start = new THREE.Vector3(0, 0, 8);
    this.anchors.boss = new THREE.Vector3(0, 0, -8);
  }

  // Telhados na chuva — perseguição à Lady Nagant
  _rooftops() {
    this.sky(0x0a0e1a, 0x2a3048, 0x1a2030, 30, 150, 0xa8b8e0, 0.7, [0x7080b0, 0x1a1a24, 1.0]);
    this.mood({ rim: 0x8ac8ff, rimStrength: 0.8 });
    this.ground('asphalt', 400, 0x5a6070);
    this.killY = 6;
    this.bounds = { minX: -40, maxX: 40, minZ: -150, maxZ: 20 };
    // telhados em sequência: [x, z, w, d, h]
    const roofs = [[0, 8, 14, 16, 14], [-4, -12, 10, 10, 15], [6, -28, 10, 10, 13], [-2, -46, 12, 12, 16], [5, -66, 10, 10, 14], [0, -92, 26, 26, 15]];
    this.anchorsWhip = [];
    roofs.forEach(([x, z, w, d, h], i) => {
      this.building(x, z, w, d, h, { color: '#3a4054', lit: 0.35, night: true });
      for (let k = 0; k < 2; k++) this.prop(() => M.crate(0x5a5a62), x + (rnd() - 0.5) * (w - 3), z + (rnd() - 0.5) * (d - 3), rnd() * 3, [1, 1, 1], h);
      this.box(x + w / 2 - 1, h + 1, z - d / 2 + 1, 1.2, 2, 1.2, 0x6a6e78, true, 0.03); // caixa d'água
      this.anchorsWhip.push(new THREE.Vector3(x, h + 0.2, z + d / 2 - 1.5), new THREE.Vector3(x, h + 0.2, z));
      this.anchors['roof' + i] = new THREE.Vector3(x, h, z);
    });
    for (let i = 0; i < 40; i++) { const x = (rnd() < 0.5 ? -1 : 1) * (22 + rnd() * 20), z = 20 - rnd() * 170; this.building(x, z, 8 + rnd() * 6, 8 + rnd() * 6, 10 + rnd() * 30, { color: '#2a3044', lit: 0.4, night: true, solid: false }); }
    for (let i = 0; i < 8; i++) { const s = this.sign((rnd() - 0.5) * 30, 18 + rnd() * 6, -rnd() * 120, 4, 1.6, pick(['ホテル', 'BAR', '24H', 'カラオケ']), pick(['#d8288a', '#28a8d8', '#d8a828']), '#fff', rnd() * 3); s.material.color.setScalar(1.6); }
    this.anchors.start = new THREE.Vector3(0, 14, 12);
    this.anchors.boss = new THREE.Vector3(0, 15, -96);
  }

  update(dt, t) { for (const u of this.updaters) u(dt, t); }
}

export { canvasTex, zeroPointer };
