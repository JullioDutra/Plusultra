// Pipeline de imagem: tone mapping, bloom, gradação de cor e "impact frame".
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export const QUALITY = {
  ultra: { label: 'ULTRA', pr: 2, post: true, bloomScale: 1, shadow: 2048 },
  alto: { label: 'ALTO', pr: 1.5, post: true, bloomScale: 0.5, shadow: 2048 },
  leve: { label: 'LEVE', pr: 1, post: false, bloomScale: 0, shadow: 1024 },
  retro: { label: 'RETRÔ PS2', pr: 0, post: false, bloomScale: 0, shadow: 1024, retro: true },
};

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    vignette: { value: 0.32 },
    saturation: { value: 1.12 },
    contrast: { value: 1.06 },
    chroma: { value: 0 },
    invert: { value: 0 },
    tint: { value: new THREE.Color(1, 1, 1) },
    flash: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float vignette, saturation, contrast, chroma, invert, flash; uniform vec3 tint;
    varying vec2 vUv;
    void main(){
      vec2 d = vUv - 0.5;
      vec3 c;
      if (chroma > 0.0) {
        vec2 o = d * chroma * 0.03;
        c = vec3(texture2D(tDiffuse, vUv + o).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - o).b);
      } else c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l), c, saturation);
      // contraste em torno do cinza médio linear (0.18): não esmaga as sombras
      c = 0.18 * pow(max(c, 0.0) / 0.18, vec3(contrast));
      c *= tint;
      c *= 1.0 - vignette * smoothstep(0.35, 0.85, length(d) * 1.25);
      c = mix(c, vec3(1.0), flash);
      // impact frame: negativo em alto contraste
      if (invert > 0.0) { float k = step(0.35, dot(c, vec3(0.333))); c = mix(c, vec3(1.0 - k) * vec3(1.0, 0.95, 0.9), invert); }
      gl_FragColor = vec4(max(c, 0.0), 1.0);
    }`,
};

export class Render {
  constructor(canvas) {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.3;
    this.q = QUALITY.alto;
    this.impact = 0; this.chromaT = 0; this.flashT = 0;
  }
  setup(scene, camera) {
    this.scene = scene; this.camera = camera;
    const comp = this.composer = new EffectComposer(this.renderer);
    comp.addPass(new RenderPass(scene, camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.45, 0.82);
    comp.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader);
    comp.addPass(this.grade);
    comp.addPass(new OutputPass());
  }
  setQuality(name) {
    this.q = QUALITY[name] || QUALITY.alto;
    this.resize();
  }
  resize() {
    const w = innerWidth, h = innerHeight, q = this.q;
    const pr = q.retro ? Math.min(1, 448 / h) : Math.min(devicePixelRatio || 1, q.pr);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    const el = this.renderer.domElement;
    el.style.width = w + 'px'; el.style.height = h + 'px';
    el.style.imageRendering = q.retro ? 'pixelated' : 'auto';
    if (this.composer) {
      this.composer.setPixelRatio(pr);
      this.composer.setSize(w, h);
      this.bloom.resolution.set(w * pr * (q.bloomScale || 0.5), h * pr * (q.bloomScale || 0.5));
    }
  }
  // efeitos de tela disparados pelo jogo
  impactFrame(t = 0.07) { this.impact = Math.max(this.impact, t); }
  aberration(t = 0.4) { this.chromaT = Math.max(this.chromaT, t); }
  whiteout(t = 1) { this.flashT = Math.max(this.flashT, t); }
  setTint(c) { this.grade?.uniforms.tint.value.set(c); }

  render(dt) {
    const q = this.q;
    this.impact = Math.max(0, this.impact - dt);
    this.chromaT = Math.max(0, this.chromaT - dt);
    this.flashT = Math.max(0, this.flashT - dt);
    if (q.post && this.composer) {
      const u = this.grade.uniforms;
      u.invert.value = this.impact > 0 ? 1 : 0;
      u.chroma.value = Math.min(1, this.chromaT * 2.5);
      u.flash.value = Math.min(1, this.flashT);
      this.composer.render(dt);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
