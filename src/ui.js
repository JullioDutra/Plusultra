// Interface em DOM sobre o canvas: HUD, diálogos, QTE e telas de menu.
import { portrait, accentOf } from './portraits.js';

const $ = s => document.querySelector(s);
const STYLE_WORDS = { D: 'DECIDIDO', C: 'CORAJOSO', B: 'BRAVO', A: 'ALÉM DOS LIMITES', S: 'SMASHING!' };

export class UI {
  constructor(audio) {
    this.audio = audio;
    this.el = {
      hud: $('#hud'), hpbar: $('#hpbar'), hpfill: $('#hpfill'), hplag: $('#hplag'), segs: [...document.querySelectorAll('#gauge .seg')],
      cowl: $('#cowl'), objective: $('#objective'), timer: $('#timer'), score: $('#score'), combo: $('#combo'),
      style: $('#style'), styleL: $('#styleL'), styleWord: $('#styleWord'), styleBar: $('#styleBar i'),
      boss: $('#boss'), bossName: $('#bossName'), bossfill: $('#bossfill'), charge: $('#charge'), toasts: $('#toasts'),
      smash: $('#smash'), lines: $('#lines'), bark: $('#bark'), dialog: $('#dialog'), dport: $('#dport'), dname: $('#dname'), dtext: $('#dtext'), dnext: $('#dnext'),
      qte: $('#qte'), qteTitle: $('#qteTitle'), qteKey: $('#qteKey'), qteLbl: $('#qteLbl'), qteRing: $('#qteRing'), qteBar: $('#qteBar'), qteTime: $('#qteTime'),
      screens: $('#screens'), fade: $('#fade'), ui: $('#ui'), portrait: $('#portrait'), touch: $('#touch'),
      dmg: $('#dmg'), lock: $('#lock'), rescues: $('#rescues'), screenfx: $('#screenfx'), noteWrap: $('#noteWrap'),
    };
    this.dialogDone = true;
    this.menuState = null;
    this._rs = [];
  }
  hud(on) { this.el.hud.classList.toggle('hidden', !on); if (!on) { this.lockOn(null); this.rescues([]); } }
  portrait(txt, who) {
    const url = who && portrait(who);
    this.el.portrait.innerHTML = url ? `<img alt="" src="${url}">` : `<span>${txt}</span>`;
    this.el.portrait.style.background = who === 'All Might' ? 'linear-gradient(160deg,#4c7cf0,#1a2a6a)' : '';
  }
  hp(f) {
    f = Math.max(0, Math.min(1, f));
    this.el.hpfill.style.transform = `scaleX(${f})`;
    this.el.hplag.style.transform = `scaleX(${f})`;
    this.el.hpbar.classList.toggle('low', f < 0.3);
  }
  gauge(v) {
    this.el.segs.forEach((s, i) => { const k = Math.max(0, Math.min(1, v - i)); s.firstChild.style.transform = `scaleX(${k})`; s.classList.toggle('full', k >= 1); });
  }
  cowl(p) { this.el.cowl.textContent = p ? `ONE FOR ALL ${p}%` : ''; }
  objective(t) { if (this.el.objective.textContent !== (t || '')) this.el.objective.textContent = t || ''; }
  timer(s) { this.el.timer.textContent = s == null ? '' : Math.ceil(s); }
  score(t) { this.el.score.textContent = t || ''; }
  combo(n) { this.el.combo.innerHTML = n > 1 ? `${n}<small>HITS</small>` : ''; }
  style(r, frac, on) {
    const e = this.el;
    e.style.classList.toggle('on', !!on);
    if (e.style.dataset.r !== r) { e.style.dataset.r = r; e.styleL.textContent = r; e.styleWord.textContent = STYLE_WORDS[r]; e.styleL.animate?.([{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 220 }); }
    e.styleBar.style.transform = `scaleX(${Math.max(0, Math.min(1, frac))})`;
  }
  bossBar(name, title) { this.el.boss.classList.remove('hidden'); this.el.bossName.innerHTML = `<b>${name}</b>${title ? `<small>${title}</small>` : ''}`; }
  bossHp(f) { this.el.bossfill.style.transform = `scaleX(${Math.max(0, f)})`; }
  bossHide() { this.el.boss.classList.add('hidden'); }
  charge(k, ready) {
    const c = this.el.charge;
    if (k < 0) { c.classList.add('hidden'); return; }
    c.classList.remove('hidden'); c.firstChild.style.transform = `scaleX(${k})`; c.classList.toggle('ready', k >= 1 && ready);
  }
  toast(t, color = '') {
    const d = document.createElement('div'); d.className = 'toast ' + color; d.textContent = t;
    this.el.toasts.appendChild(d);
    while (this.el.toasts.children.length > 3) this.el.toasts.firstChild.remove();
    setTimeout(() => d.remove(), 1900);
  }
  smashText(t, small = false) { this.el.smash.innerHTML = `<span class="${small ? 'small' : ''}">${t}</span>`; }
  speedLines(t) { this.el.lines.classList.add('on'); clearTimeout(this._sl); this._sl = setTimeout(() => this.el.lines.classList.remove('on'), t * 1000); }
  bark(name, t) { const b = this.el.bark; b.innerHTML = (name ? `<b>${name}</b>` : '') + t; b.classList.remove('hidden'); clearTimeout(this._bk); this._bk = setTimeout(() => b.classList.add('hidden'), 2400); }
  letterbox(on) { this.el.ui.classList.toggle('lbOn', on); this._lb = on; }
  isLetterbox() { return !!this._lb; }
  fade(on) { this.el.fade.classList.toggle('on', on); return new Promise(r => setTimeout(r, 480)); }
  // efeitos de tela sem pós-processamento (modo leve)
  screenFx(kind, t) {
    const s = this.el.screenfx;
    s.className = kind === 'white' ? 'white' : '';
    s.style.transition = 'none'; s.style.opacity = '1';
    requestAnimationFrame(() => { s.style.transition = `opacity ${Math.max(0.05, t)}s`; s.style.opacity = '0'; });
  }
  dmg(x, y, v, crit) {
    if (this.el.dmg.childElementCount > 24) this.el.dmg.firstChild.remove();
    const d = document.createElement('div'); d.className = 'dn' + (crit ? ' crit' : ''); d.textContent = v;
    d.style.left = x + (Math.random() - 0.5) * 30 + 'px'; d.style.top = y + 'px';
    this.el.dmg.appendChild(d);
    setTimeout(() => d.remove(), 800);
  }
  lockOn(e) { this.el.lock.classList.toggle('hidden', !e); }
  lockPos(s) { const l = this.el.lock; l.style.left = s.x + 'px'; l.style.top = s.y + 'px'; l.style.visibility = s.on ? 'visible' : 'hidden'; }
  rescues(list) {
    const box = this.el.rescues;
    while (this._rs.length < list.length) { const d = document.createElement('div'); d.className = 'rs'; d.innerHTML = '<b>SOS</b>'; box.appendChild(d); this._rs.push(d); }
    this._rs.forEach((d, i) => {
      const r = list[i];
      if (!r || !r.on) { d.style.display = 'none'; return; }
      d.style.display = ''; d.style.left = r.x + 'px'; d.style.top = r.y + 'px'; d.style.setProperty('--p', r.prog);
      d.firstChild.textContent = r.time ? Math.ceil(r.time) + 's' : 'SOS';
    });
  }
  notebookCard(n) {
    const w = this.el.noteWrap;
    w.innerHTML = `<div id="note"><small>CADERNO DO DEKU · Nº ${n.n}</small><h4>${n.title}</h4><p>${n.text}</p></div>`;
    clearTimeout(this._nt); this._nt = setTimeout(() => (w.innerHTML = ''), 6000);
  }

  dialog(who, text, color) {
    const e = this.el;
    e.dialog.classList.remove('hidden');
    const accent = color || accentOf(who) || 'var(--ofa)';
    e.dialog.style.setProperty('--accent', accent);
    e.dname.textContent = who || '';
    e.dname.style.display = who ? '' : 'none';
    const url = who ? portrait(who) : null;
    e.dport.className = url ? '' : 'none';
    e.dport.innerHTML = url ? `<img alt="" src="${url}">` : '';
    e.dtext.textContent = '';
    this._full = text; this._shown = 0; this.dialogDone = false; this._typing = true; this._hold = 0.15;
    e.dnext.style.visibility = 'hidden';
  }
  closeDialog() { this.el.dialog.classList.add('hidden'); this.dialogDone = true; this._typing = false; }

  qteShow(kind, { label, title }) {
    const e = this.el;
    e.qte.classList.remove('hidden');
    e.qteTitle.textContent = title || '';
    e.qteLbl.textContent = label;
    e.qteKey.className = kind === 'mash' ? 'mash' : '';
    e.qteRing.style.display = kind === 'timing' ? '' : 'none';
    e.qteBar.style.display = kind === 'timing' ? 'none' : '';
    e.qteBar.querySelector('b').style.display = kind === 'hold' ? '' : 'none';
    e.qteTime.style.display = kind === 'mash' ? '' : 'none';
    this._qk = kind;
  }
  qteUpdate(v, t) {
    const e = this.el;
    if (this._qk === 'timing') { const s = 1 + Math.max(0, v) * 2.2; e.qteRing.style.transform = `scale(${s})`; e.qteRing.style.borderColor = Math.abs(v) < 0.12 ? '#36e38c' : '#ffc93c'; }
    else e.qteBar.querySelector('i').style.transform = `scaleX(${v})`;
    e.qteTime.firstChild.style.transform = `scaleX(${Math.max(0, t)})`;
  }
  qteHide() { this.el.qte.classList.add('hidden'); }

  // -------- telas
  show(html, cls = '') {
    this.el.screens.innerHTML = `<div class="screen" id="${cls}">${html}</div>`;
    return this.el.screens.firstChild;
  }
  hideScreen() { this.el.screens.innerHTML = ''; this.menuState = null; }

  // menu navegável por teclado/controle/mouse; aceita botões já existentes (cartões)
  menu(container, items, onBack, { grid = false } = {}) {
    let btns;
    if (grid) btns = [...container.children];
    else {
      container.innerHTML = '';
      btns = items.map((it) => {
        const b = document.createElement('button');
        b.innerHTML = it.label + (it.sub ? `<small>${it.sub}</small>` : '');
        b.disabled = !!it.disabled;
        container.appendChild(b);
        return b;
      });
    }
    btns.forEach((b, i) => {
      const it = items[i];
      b.onclick = () => { if (!it.disabled) { this.audio.init(); this.audio.sfx('select'); it.action(); } };
      b.onmouseenter = () => this.select(i);
    });
    this.menuState = { btns, items, i: Math.max(0, items.findIndex(x => !x.disabled)), onBack, grid, container };
    this.select(this.menuState.i);
  }
  select(i) {
    const m = this.menuState; if (!m) return;
    m.i = i; m.btns.forEach((b, j) => b.classList.toggle('sel', j === i));
    m.btns[i]?.scrollIntoView?.({ block: 'nearest' });
  }

  tick(dt, input) {
    if (!this.dialogDone) {
      if (this._typing) {
        this._shown += dt * 52;
        const n = Math.min(this._full.length, Math.floor(this._shown));
        this.el.dtext.textContent = this._full.slice(0, n);
        if (n >= this._full.length) { this._typing = false; this.el.dnext.style.visibility = 'visible'; }
      }
      this._hold -= dt;
      if (this._hold <= 0 && (input.advance() || input.pressed('smash'))) this.advance();
      return;
    }
    const m = this.menuState;
    if (m && m.btns.length) {
      const n = m.btns.length;
      // em grade, esquerda/direita andam 1 e cima/baixo andam uma linha
      let cols = 1;
      if (m.grid && m.btns.length > 1) { const y0 = m.btns[0].offsetTop; cols = m.btns.filter(b => b.offsetTop === y0).length || 1; }
      const step = d => { let i = m.i; for (let k = 0; k < n; k++) { i = (i + d + n * 4) % n; if (!m.items[i].disabled) break; } this.select(i); this.audio.sfx('blip'); };
      if (input.pressed('down')) step(cols);
      if (input.pressed('up')) step(-cols);
      if (m.grid && input.pressed('right')) step(1);
      if (m.grid && input.pressed('left')) step(-1);
      if (input.pressed('confirm') || input.pressed('attack') || input.pressed('jump')) { const it = m.items[m.i]; if (it && !it.disabled) { this.audio.init(); this.audio.sfx('select'); it.action(); } }
      else if ((input.pressed('dodge') || input.pressed('pause')) && m.onBack) { this.audio.sfx('blip'); m.onBack(); }
    }
  }
  advance() {
    if (this.dialogDone || this._hold > 0) return;
    if (this._typing) { this._typing = false; this.el.dtext.textContent = this._full; this.el.dnext.style.visibility = 'visible'; }
    else this.dialogDone = true;
  }
}

document.addEventListener('pointerdown', () => { const d = document.querySelector('#dialog'); if (d && !d.classList.contains('hidden')) window.__ui?.advance(); });
