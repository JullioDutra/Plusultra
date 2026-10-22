// Áudio 100% sintetizado (WebAudio): efeitos e trilhas originais por fase.
export class Audio {
  constructor() {
    this.ctx = null; this.master = null; this.music = null; this.vol = 0.7; this.musicOn = true;
    this.track = null; this.timer = null;
  }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = this.vol; this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
    this.musBus = this.ctx.createGain(); this.musBus.gain.value = 0.32; this.musBus.connect(this.master);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, len);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  setVolume(v) { this.vol = v; if (this.master) this.master.gain.value = v; }

  tone(freq, dur, { type = 'square', vol = 0.3, slide = 0, delay = 0, bus } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(bus || this.sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  }
  hiss(dur, { vol = 0.3, freq = 2000, q = 1, type = 'bandpass', delay = 0, sweep = 0, bus } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * sweep), t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || this.sfxBus);
    s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }

  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'punch': this.hiss(0.08, { vol: 0.5, freq: 900, q: 0.8 }); this.tone(140, 0.08, { type: 'sine', vol: 0.5, slide: 0.5 }); break;
      case 'hit': this.hiss(0.12, { vol: 0.6, freq: 1400, q: 0.6 }); this.tone(110, 0.12, { type: 'triangle', vol: 0.6, slide: 0.4 }); break;
      case 'heavy': this.hiss(0.25, { vol: 0.7, freq: 600, q: 0.5, sweep: 0.3 }); this.tone(80, 0.3, { type: 'sine', vol: 0.8, slide: 0.35 }); break;
      case 'smash':
        this.hiss(0.9, { vol: 0.9, freq: 3000, q: 0.4, sweep: 0.05 });
        this.tone(60, 1.0, { type: 'sine', vol: 1, slide: 0.4 });
        this.tone(120, 0.6, { type: 'sawtooth', vol: 0.25, slide: 0.3 });
        break;
      case 'charge': this.tone(200, 0.6, { type: 'sawtooth', vol: 0.08, slide: 3 }); break;
      case 'whoosh': this.hiss(0.18, { vol: 0.25, freq: 1200, q: 2, sweep: 3 }); break;
      case 'jump': this.tone(300, 0.12, { type: 'square', vol: 0.08, slide: 2 }); break;
      case 'land': this.hiss(0.06, { vol: 0.2, freq: 400 }); break;
      case 'hurt': this.tone(300, 0.2, { type: 'square', vol: 0.15, slide: 0.4 }); this.hiss(0.1, { vol: 0.3, freq: 800 }); break;
      case 'zap': this.hiss(0.15, { vol: 0.18, freq: 5000, q: 3, sweep: 0.5 }); this.tone(900, 0.08, { type: 'square', vol: 0.05, slide: 0.5 }); break;
      case 'cowl': this.tone(220, 0.5, { type: 'sawtooth', vol: 0.12, slide: 4 }); this.hiss(0.5, { vol: 0.25, freq: 4000, q: 2 }); break;
      case 'explode': this.hiss(0.7, { vol: 0.8, freq: 500, q: 0.4, sweep: 0.2, type: 'lowpass' }); this.tone(50, 0.6, { type: 'sine', vol: 0.8, slide: 0.5 }); break;
      case 'slash': this.hiss(0.15, { vol: 0.4, freq: 6000, q: 4, sweep: 0.4 }); this.tone(1400, 0.1, { type: 'sawtooth', vol: 0.06, slide: 0.5 }); break;
      case 'blip': this.tone(880, 0.05, { type: 'square', vol: 0.06 }); break;
      case 'select': this.tone(660, 0.08, { type: 'square', vol: 0.1 }); this.tone(990, 0.12, { type: 'square', vol: 0.1, delay: 0.07 }); break;
      case 'warn': this.tone(520, 0.15, { type: 'square', vol: 0.1 }); this.tone(520, 0.15, { type: 'square', vol: 0.1, delay: 0.2 }); break;
      case 'clear': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.35, { type: 'square', vol: 0.12, delay: i * 0.12 })); break;
      case 'fail': [392, 330, 262].forEach((f, i) => this.tone(f, 0.4, { type: 'triangle', vol: 0.2, delay: i * 0.2 })); break;
      case 'water': this.hiss(0.5, { vol: 0.4, freq: 700, q: 0.7, sweep: 0.4, type: 'lowpass' }); break;
      case 'ice': this.hiss(0.4, { vol: 0.4, freq: 7000, q: 2, sweep: 0.5 }); this.tone(1800, 0.3, { type: 'triangle', vol: 0.08, slide: 0.6 }); break;
      case 'fire': this.hiss(0.6, { vol: 0.35, freq: 400, q: 0.5, type: 'lowpass' }); break;
      case 'decay': this.hiss(1.2, { vol: 0.45, freq: 200, q: 0.4, sweep: 3, type: 'lowpass' }); this.tone(45, 1.2, { type: 'sawtooth', vol: 0.15, slide: 0.7 }); break;
      case 'pickup': this.tone(784, 0.07, { type: 'square', vol: 0.08 }); this.tone(1175, 0.1, { type: 'square', vol: 0.08, delay: 0.06 }); break;
    }
  }

  // ----- música procedural -----
  playTrack(name) {
    if (!this.ctx || this.track === name) return;
    this.stopMusic();
    this.track = name;
    if (!this.musicOn || !name) return;
    const T = TRACKS[name] || TRACKS.hero;
    const spb = 60 / T.bpm / 4; // semicolcheia
    let step = 0;
    let next = this.ctx.currentTime + 0.1;
    const note = (deg, oct = 0) => {
      const sc = T.scale, n = sc.length;
      const o = Math.floor(deg / n), d = ((deg % n) + n) % n;
      return 440 * Math.pow(2, (T.root + sc[d] + 12 * (o + oct) - 9) / 12);
    };
    const tick = () => {
      while (next < this.ctx.currentTime + 0.25) {
        const bar = Math.floor(step / 16) % T.prog.length, s = step % 16;
        const chord = T.prog[bar];
        const dt = next - this.ctx.currentTime;
        const B = this.musBus;
        // bateria
        if (T.kick[s] === 'x') { this.tone(110, 0.18, { type: 'sine', vol: 0.7, slide: 0.35, delay: dt, bus: B }); }
        if (T.snare[s] === 'x') this.hiss(0.14, { vol: 0.35, freq: 1800, q: 0.7, delay: dt, bus: B });
        if (T.hat[s] === 'x') this.hiss(0.03, { vol: 0.12, freq: 8000, q: 1, type: 'highpass', delay: dt, bus: B });
        // baixo
        if (T.bass[s] !== '.') this.tone(note(chord + (T.bass[s] === '5' ? 4 : 0), -2), spb * 1.8, { type: 'triangle', vol: 0.4, delay: dt, bus: B });
        // acorde (pad)
        if (s === 0) for (const k of [0, 2, 4]) this.tone(note(chord + k, -1), spb * 15, { type: 'sawtooth', vol: 0.035, delay: dt, bus: B });
        // melodia
        const m = T.mel[(bar * 16 + s) % T.mel.length];
        if (m !== null && m !== undefined) this.tone(note(chord + m, 0), spb * (T.legato || 1.6), { type: T.lead || 'square', vol: 0.07, delay: dt, bus: B });
        next += spb; step++;
      }
    };
    tick();
    this.timer = setInterval(tick, 60);
  }
  stopMusic() { clearInterval(this.timer); this.timer = null; this.track = null; }
  toggleMusic() { this.musicOn = !this.musicOn; const t = this.track; this.stopMusic(); if (this.musicOn && t) this.playTrack(t); return this.musicOn; }
}

const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10], HMIN = [0, 2, 3, 5, 7, 8, 11];
const _ = null;
const TRACKS = {
  // heroico (I V vi IV) — tema principal original
  hero: { bpm: 132, root: 2, scale: MAJ, prog: [0, 4, 5, 3], kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: 'x.x.5.x.x.x.5.x.',
    mel: [4, _, 4, 5, 7, _, 4, _, 2, _, 4, _, 0, _, _, _, 4, _, 4, 5, 7, _, 9, _, 7, _, 5, _, 4, _, _, _, 2, _, 2, 4, 5, _, 2, _, 0, _, 2, _, 4, _, _, _, 4, _, 5, _, 7, _, 7, 8, 7, _, _, _, _, _, _, _] },
  title: { bpm: 96, root: 2, scale: MAJ, prog: [0, 5, 3, 4], kick: 'x.......x.......', snare: '........x.......', hat: '..x...x...x...x.', bass: 'x.......x.......', legato: 3, lead: 'triangle',
    mel: [7, _, _, _, 4, _, 5, _, 7, _, _, _, 9, _, 7, _, 4, _, _, _, 2, _, 4, _, 5, _, _, _, 4, _, _, _] },
  calm: { bpm: 84, root: 7, scale: MAJ, prog: [0, 3, 0, 4], kick: 'x.........x.....', snare: '................', hat: 'x...x...x...x...', bass: 'x.....x.....x...', legato: 3, lead: 'triangle',
    mel: [2, _, 4, _, 7, _, _, _, 4, _, 2, _, 0, _, _, _, 2, _, 4, _, 5, _, 4, _, 2, _, _, _, _, _, _, _] },
  tension: { bpm: 140, root: 9, scale: HMIN, prog: [0, 5, 3, 4], kick: 'x..x..x.x..x..x.', snare: '....x.......x..x', hat: 'xxx.xxx.xxx.xxx.', bass: 'x.xx.x.xx.xx.x.x',
    mel: [0, _, 2, _, 4, _, 2, 0, 6, _, _, _, 4, _, _, _, 0, _, 2, _, 4, 5, 4, 2, 1, _, _, _, _, _, _, _] },
  boss: { bpm: 156, root: 4, scale: MIN, prog: [0, 0, 5, 6], kick: 'x.x...x.x.x...x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: 'xxx.xx.xxxx.xx.x', lead: 'sawtooth',
    mel: [0, _, 0, 2, 3, _, 2, _, 0, _, 4, _, 3, _, 2, _, 7, _, 7, 6, 4, _, 3, _, 2, _, 3, _, 4, _, _, _] },
  night: { bpm: 118, root: 11, scale: MIN, prog: [0, 6, 5, 4], kick: 'x.....x...x.....', snare: '....x.......x...', hat: '..x...x...x...x.', bass: 'x..x..x...x..x..', lead: 'triangle', legato: 2.4,
    mel: [4, _, _, 3, 2, _, 0, _, 2, _, _, _, _, _, _, _, 4, _, 5, _, 7, _, 5, _, 4, _, _, _, _, _, _, _] },
  final: { bpm: 168, root: 2, scale: HMIN, prog: [0, 5, 3, 4], kick: 'x.x.x.x.x.x.x.x.', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx', bass: 'x.xxx.xxx.xxx.xx', lead: 'sawtooth',
    mel: [7, _, 6, _, 7, _, 9, _, 11, _, 9, _, 7, _, 4, _, 4, _, 5, _, 7, _, 4, _, 2, _, 0, _, 2, _, 4, _] },
  sad: { bpm: 72, root: 9, scale: MIN, prog: [0, 5, 2, 6], kick: '................', snare: '................', hat: '................', bass: 'x.......x.......', lead: 'triangle', legato: 4,
    mel: [4, _, _, _, 2, _, _, _, 0, _, _, _, 2, _, 4, _, 5, _, _, _, 4, _, _, _, 2, _, _, _, _, _, _, _] },
};
