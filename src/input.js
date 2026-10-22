// Entrada unificada: teclado, controle (Gamepad API) e botões de toque.
const KEYMAP = {
  up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  jump: ['Space'], attack: ['KeyJ', 'KeyZ'], smash: ['KeyK', 'KeyX'], dodge: ['KeyL', 'ShiftLeft', 'ShiftRight', 'KeyC'],
  cowl: ['KeyQ'], special: ['KeyE', 'KeyV'], lock: ['Tab', 'KeyR'], camL: ['KeyU', 'Comma'], camR: ['KeyO', 'Period'], pause: ['Escape', 'KeyP'], confirm: ['Enter', 'NumpadEnter'],
};
const PAD = { jump: 0, dodge: 1, attack: 2, smash: 3, cowl: 4, special: 5, lock: 11, pause: 9, confirm: 0, up: 12, down: 13, left: 14, right: 15 };

export class Input {
  constructor() {
    this.keys = new Set();
    this.prev = {};
    this.now = {};
    this.axis = { x: 0, y: 0 };
    this.cam = 0;
    this.touch = { x: 0, y: 0, btn: {} };
    this.anyPressed = false;
    this.taps = new Set(); // toques rápidos (apertou e soltou no mesmo quadro) não se perdem
    addEventListener('keydown', e => {
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code); this.taps.add(e.code); this.anyPressed = true;
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }
  poll() {
    this.prev = this.now;
    const n = {};
    for (const a in KEYMAP) n[a] = KEYMAP[a].some(k => this.keys.has(k) || this.taps.has(k)) || !!this.touch.btn[a];
    this.taps.clear();
    let ax = (n.right ? 1 : 0) - (n.left ? 1 : 0), ay = (n.down ? 1 : 0) - (n.up ? 1 : 0);
    let cam = (n.camR ? 1 : 0) - (n.camL ? 1 : 0);
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      for (const a in PAD) if (p.buttons[PAD[a]]?.pressed) n[a] = true;
      const dz = v => Math.abs(v) < 0.2 ? 0 : v;
      if (dz(p.axes[0]) || dz(p.axes[1])) { ax = dz(p.axes[0]); ay = dz(p.axes[1]); }
      if (dz(p.axes[2])) cam = dz(p.axes[2]);
      if (p.buttons.some(b => b.pressed)) this.anyPressed = true;
    }
    if (this.touch.x || this.touch.y) { ax = this.touch.x; ay = this.touch.y; }
    const len = Math.hypot(ax, ay);
    if (len > 1) { ax /= len; ay /= len; }
    this.axis.x = ax; this.axis.y = ay; this.cam = cam;
    this.now = n;
  }
  held(a) { return !!this.now[a]; }
  pressed(a) { return !!this.now[a] && !this.prev[a]; }
  released(a) { return !this.now[a] && !!this.prev[a]; }
  // qualquer botão de "avançar"
  advance() { return this.pressed('attack') || this.pressed('confirm') || this.pressed('jump'); }

  bindTouch(root) {
    const stick = root.querySelector('#tstick'), knob = root.querySelector('#tknob');
    let id = null, cx = 0, cy = 0;
    const R = 50;
    stick.addEventListener('pointerdown', e => { id = e.pointerId; const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; stick.setPointerCapture(id); move(e); });
    const move = e => {
      if (e.pointerId !== id) return;
      let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy);
      if (l > R) { dx *= R / l; dy *= R / l; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      this.touch.x = dx / R; this.touch.y = dy / R;
    };
    stick.addEventListener('pointermove', move);
    const end = e => { if (e.pointerId !== id) return; id = null; this.touch.x = this.touch.y = 0; knob.style.transform = ''; };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
    root.querySelectorAll('[data-btn]').forEach(b => {
      const a = b.dataset.btn;
      b.addEventListener('pointerdown', e => { e.preventDefault(); this.touch.btn[a] = true; this.anyPressed = true; });
      const up = () => { this.touch.btn[a] = false; };
      b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    });
  }
}
