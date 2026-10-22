import * as THREE from 'three';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const ringGeo = new THREE.RingGeometry(0.85, 1, 40);
const discGeo = new THREE.CircleGeometry(1, 32);
const planeGeo = new THREE.PlaneGeometry(1, 1);
const basic = new Map();
const mat = (color, opacity = 1, add = false) => {
  const k = color + ':' + opacity + ':' + add;
  if (!basic.has(k)) basic.set(k, new THREE.MeshBasicMaterial({ color, transparent: opacity < 1 || add, opacity, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide }));
  return basic.get(k);
};

// textura radial suave para brilhos
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const spriteMats = new Map();
const spriteMat = (color) => {
  if (!spriteMats.has(color)) spriteMats.set(color, new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  return spriteMats.get(color);
};

// rastro de golpe: fita que segue um ponto (mão/pé) e some aos poucos
export class Trail {
  constructor(scene, color = 0xffffff, n = 14, width = 0.35) {
    this.n = n; this.w = width; this.pts = []; this.on = false;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 2 * 3); this.alpha = new Float32Array(n * 2);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));
    const idx = [];
    for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setIndex(idx);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(color) } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float alpha; varying float va; void main(){ va = alpha; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
      fragmentShader: 'uniform vec3 color; varying float va; void main(){ gl_FragColor = vec4(color*1.6, va); }',
    });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }
  setColor(c) { this.mat.uniforms.color.value.set(c); }
  push(p, up) {
    this.pts.unshift({ a: p.clone().addScaledVector(up, this.w), b: p.clone().addScaledVector(up, -this.w), life: 1 });
    if (this.pts.length > this.n) this.pts.pop();
  }
  update(dt, src, up) {
    if (this.on && src) this.push(src, up);
    for (const q of this.pts) q.life -= dt * 5;
    while (this.pts.length && this.pts[this.pts.length - 1].life <= 0) this.pts.pop();
    for (let i = 0; i < this.n; i++) {
      const q = this.pts[Math.min(i, this.pts.length - 1)];
      if (!q) { this.alpha[i * 2] = this.alpha[i * 2 + 1] = 0; continue; }
      this.pos.set([q.a.x, q.a.y, q.a.z, q.b.x, q.b.y, q.b.z], i * 6);
      const k = i < this.pts.length ? Math.max(0, q.life) * (1 - i / this.n) * 0.85 : 0;
      this.alpha[i * 2] = k; this.alpha[i * 2 + 1] = k * 0.3;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.alpha.needsUpdate = true;
  }
}

export class FX {
  constructor(scene) {
    this.scene = scene;
    this.parts = [];
    this.items = [];
    this.pool = [];
    // raios do Full Cowl
    const g = new THREE.BufferGeometry();
    this.boltPos = new Float32Array(160 * 3);
    g.setAttribute('position', new THREE.BufferAttribute(this.boltPos, 3));
    this.bolt = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x7dff9a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending }));
    this.bolt.frustumCulled = false;
    this.bolt.visible = false;
    scene.add(this.bolt);
    this.weather = null;
  }

  glow(pos, color, { vel, size = 0.5, life = 0.4, grav = 0 } = {}) {
    const m = new THREE.Sprite(spriteMat(color));
    m.position.copy(pos); m.scale.setScalar(size);
    this.scene.add(m);
    this.parts.push({ m, vel: vel || new THREE.Vector3(), life, max: life, grav, spin: 0, size, shrink: true, sprite: true });
  }
  particle(pos, color, { vel, size = 0.15, life = 0.6, grav = -12, spin = 4, add = false, shrink = true } = {}) {
    if (add) return this.glow(pos, color, { vel, size: size * 3, life, grav });
    let m = this.pool.pop();
    if (!m) { m = new THREE.Mesh(boxGeo, mat(color)); }
    m.material = mat(color, 1, add);
    m.visible = true;
    m.position.copy(pos);
    m.scale.setScalar(size);
    this.scene.add(m);
    this.parts.push({ m, vel: vel || new THREE.Vector3(), life, max: life, grav, spin, size, shrink });
  }

  burst(pos, color, n = 12, speed = 6, opt = {}) {
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9, Math.random() - 0.5).normalize().multiplyScalar(speed * (0.4 + Math.random() * 0.8));
      this.particle(pos, Array.isArray(color) ? color[i % color.length] : color, { vel: v, ...opt, size: (opt.size || 0.15) * (0.6 + Math.random() * 0.8) });
    }
  }

  hitSpark(pos, big = false, color = 0xfff0a0) {
    this.burst(pos, [0xffffff, color, 0xffc040], big ? 18 : 9, big ? 13 : 8, { size: big ? 0.16 : 0.1, life: 0.3, grav: 0, add: true });
    this.glow(pos, 0xffffff, { size: big ? 3.2 : 1.6, life: 0.12 });
    this.glow(pos, color, { size: big ? 5 : 2.4, life: 0.2 });
    this.streaks(pos, big ? 10 : 5, big ? 2.4 : 1.4, color);
  }
  // faíscas em linha (estilo anime)
  streaks(pos, n, len, color = 0xffffff) {
    for (let i = 0; i < n; i++) {
      const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize();
      const m = new THREE.Mesh(planeGeo, mat(color, 0.95, true));
      m.position.copy(pos).addScaledVector(d, len * 0.4);
      m.lookAt(pos.clone().addScaledVector(d, 10));
      m.rotateX(Math.PI / 2);
      m.scale.set(0.06, len, 1);
      this.scene.add(m);
      this.items.push({ m, life: 0.16, max: 0.16, upd: (it, k) => { m.position.addScaledVector(d, 0.25); m.scale.set(0.06 * (1 - k), len * (1 - k * 0.5), 1); } });
    }
  }

  flash(pos, r, color, life = 0.15) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), mat(color, 0.8, true));
    m.position.copy(pos); m.scale.setScalar(r * 0.3);
    this.scene.add(m);
    this.items.push({ m, life, max: life, upd: (it, k) => { m.scale.setScalar(r * (0.3 + 0.7 * k)); m.material = mat(color, Math.max(0.05, 0.8 * (1 - k)), true); }, dispose: true });
  }

  shockwave(pos, color = 0xffffff, maxR = 6, life = 0.45, vertical = false, thick = 1) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    m.position.copy(pos);
    if (!vertical) m.rotation.x = -Math.PI / 2; else if (vertical !== true) m.lookAt(pos.clone().add(vertical));
    this.scene.add(m);
    this.items.push({ m, life, max: life, upd: (it, k) => { const r = 0.3 + maxR * (1 - (1 - k) * (1 - k)); m.scale.set(r, r, thick); m.material.opacity = 0.9 * (1 - k); }, ownMat: true });
  }

  // aviso de área no chão: círculo que se enche até o golpe
  telegraph(pos, r, life, color = 0xff3030) {
    const g = new THREE.Group();
    g.position.set(pos.x, (pos.y || 0) + 0.05, pos.z);
    const ring = new THREE.Mesh(ringGeo, mat(color, 0.9));
    ring.rotation.x = -Math.PI / 2; ring.scale.setScalar(r);
    const fill = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false }));
    fill.rotation.x = -Math.PI / 2;
    g.add(ring, fill);
    this.scene.add(g);
    const it = { m: g, life, max: life, upd: (it, k) => { fill.scale.setScalar(Math.max(0.01, r * k)); fill.material.opacity = 0.25 + 0.3 * k; }, dispose: true };
    this.items.push(it);
    return it;
  }

  telegraphLine(pos, dir, len, w, life, color = 0xff3030) {
    const m = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }));
    m.scale.set(w, len, 1);
    const mid = pos.clone().addScaledVector(dir, len / 2); mid.y = (pos.y || 0) + 0.06;
    m.position.copy(mid);
    // o plano nasce em XY: deita com X e gira em Y para alinhar o comprimento à direção
    m.rotation.order = 'YXZ';
    m.rotation.set(-Math.PI / 2, Math.atan2(dir.x, dir.z), 0);
    this.scene.add(m);
    const it = { m, life, max: life, upd: (it, k) => { m.material.opacity = 0.2 + 0.5 * k * (0.6 + 0.4 * Math.sin(k * 40)); }, ownMat: true };
    this.items.push(it);
    return it;
  }

  beam(from, to, color = 0x101010, width = 0.12, life = 0.25, add = false) {
    const d = to.clone().sub(from), len = d.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(width, width, 1, 6), mat(color, add ? 0.9 : 1, add));
    m.position.copy(from).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    m.scale.y = len;
    this.scene.add(m);
    this.items.push({ m, life, max: life, upd: (it, k) => { m.scale.x = m.scale.z = 1 - k; }, disposeGeo: true });
  }

  // blackwhip: fios escuros ondulando
  tendrils(from, to, n = 4) {
    for (let i = 0; i < n; i++) {
      const off = new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
      this.beam(from.clone().add(off.clone().multiplyScalar(0.3)), to.clone().add(off), i % 2 ? 0x0a0a0a : 0x1a3a1a, 0.06, 0.3);
    }
  }

  lightning(center, radius, height, active, intensity = 1) {
    this.bolt.visible = active;
    if (!active) return;
    const P = this.boltPos;
    let n = 0;
    const segs = Math.floor(10 + 30 * intensity);
    for (let s = 0; s < segs && n < 158; s++) {
      let x = center.x + (Math.random() - 0.5) * radius * 2, y = center.y + Math.random() * height, z = center.z + (Math.random() - 0.5) * radius * 2;
      for (let k = 0; k < 4 && n < 158; k++) {
        const nx = x + (Math.random() - 0.5) * 0.5, ny = y + (Math.random() - 0.5) * 0.5, nz = z + (Math.random() - 0.5) * 0.5;
        P.set([x, y, z, nx, ny, nz], n * 3); n += 2;
        x = nx; y = ny; z = nz;
      }
    }
    for (let i = n; i < 160; i++) P.set([0, -999, 0], i * 3);
    this.bolt.geometry.attributes.position.needsUpdate = true;
  }

  setWeather(kind, scene, area = 60) {
    if (this.weather) { scene.remove(this.weather.obj); this.weather = null; }
    if (!kind) return;
    const N = kind === 'rain' ? 1400 : 500;
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) p.set([(Math.random() - 0.5) * area, Math.random() * 30, (Math.random() - 0.5) * area], i * 3);
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const color = { rain: 0xa8c0e0, ember: 0xff8a3a, ash: 0x8a8a8a, spark: 0x7dff9a, petal: 0xffc0d8 }[kind];
    const obj = new THREE.Points(g, new THREE.PointsMaterial({ color, size: kind === 'rain' ? 0.08 : 0.14, transparent: true, opacity: 0.8, depthWrite: false, blending: kind === 'ember' || kind === 'spark' ? THREE.AdditiveBlending : THREE.NormalBlending }));
    obj.frustumCulled = false;
    scene.add(obj);
    this.weather = { obj, kind, p, N, area };
  }

  update(dt, focus) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const q = this.parts[i];
      q.life -= dt;
      if (q.life <= 0) { this.scene.remove(q.m); if (!q.sprite) this.pool.push(q.m); this.parts.splice(i, 1); continue; }
      q.vel.y += q.grav * dt;
      q.m.position.addScaledVector(q.vel, dt);
      if (!q.sprite && q.m.position.y < (this.floorY ?? 0) + 0.02 && q.grav < 0) { q.m.position.y = (this.floorY ?? 0) + 0.02; q.vel.multiplyScalar(0.5); q.vel.y *= -0.3; }
      q.m.rotation.x += q.spin * dt; q.m.rotation.y += q.spin * dt;
      if (q.sprite) { q.m.scale.setScalar(q.size * (q.life / q.max)); q.m.rotation.x = 0; q.m.rotation.y = 0; }
      else if (q.shrink) q.m.scale.setScalar(q.size * (q.life / q.max));
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life -= dt;
      const k = 1 - Math.max(0, it.life) / it.max;
      if (it.upd) it.upd(it, k);
      if (it.life <= 0 || it.dead) {
        this.scene.remove(it.m);
        if (it.ownMat) it.m.material.dispose();
        if (it.disposeGeo) it.m.geometry.dispose();
        if (it.dispose) it.m.traverse(o => { if (o.isMesh && o.material && !basicHas(o.material)) o.material.dispose(); });
        this.items.splice(i, 1);
      }
    }
    if (this.weather && focus) {
      const { p, N, kind, area } = this.weather;
      const fall = { rain: 28, ember: -1.5, ash: 1.2, spark: -2, petal: 1 }[kind];
      for (let i = 0; i < N; i++) {
        let y = p[i * 3 + 1] - fall * dt;
        if (kind !== 'rain') { p[i * 3] += Math.sin(y + i) * dt * 0.6; }
        if (y < 0) y += 30; if (y > 30) y -= 30;
        p[i * 3 + 1] = y;
        let x = p[i * 3] - focus.x, z = p[i * 3 + 2] - focus.z;
        if (x > area / 2) p[i * 3] -= area; else if (x < -area / 2) p[i * 3] += area;
        if (z > area / 2) p[i * 3 + 2] -= area; else if (z < -area / 2) p[i * 3 + 2] += area;
      }
      this.weather.obj.geometry.attributes.position.needsUpdate = true;
    }
  }

  clear() {
    for (const q of this.parts) { this.scene.remove(q.m); if (!q.sprite) this.pool.push(q.m); }
    this.parts.length = 0;
    for (const it of this.items) this.scene.remove(it.m);
    this.items.length = 0;
  }
}

function basicHas(m) { for (const v of basic.values()) if (v === m) return true; return false; }
