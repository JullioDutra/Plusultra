// Interface em DOM sobre o canvas: HUD, diálogos, QTE e telas de menu.
const $ = s => document.querySelector(s);

export class UI {
  constructor(audio) {
    this.audio = audio;
    this.el = {
      hud: $('#hud'), hpfill: $('#hpfill'), hplag: $('#hplag'), segs: [...document.querySelectorAll('#gauge .seg')],
      cowl: $('#cowl'), objective: $('#objective'), timer: $('#timer'), score: $('#score'), combo: $('#combo'),
      boss: $('#boss'), bossName: $('#bossName'), bossfill: $('#bossfill'), charge: $('#charge'), toasts: $('#toasts'),
      smash: $('#smash'), lines: $('#lines'), bark: $('#bark'), dialog: $('#dialog'), dname: $('#dname'), dtext: $('#dtext'), dnext: $('#dnext'),
      qte: $('#qte'), qteTitle: $('#qteTitle'), qteKey: $('#qteKey'), qteLbl: $('#qteLbl'), qteRing: $('#qteRing'), qteBar: $('#qteBar'), qteTime: $('#qteTime'),
      screens: $('#screens'), fade: $('#fade'), ui: $('#ui'), portrait: $('#portrait'), touch: $('#touch'),
    };
    this.dialogDone = true;
    this.menuState = null;
  }
  hud(on) { this.el.hud.classList.toggle('hidden', !on); }
  portrait(txt, bg) { this.el.portrait.textContent = txt; this.el.portrait.style.background = bg || ''; }
  hp(f, hurt) {
    f = Math.max(0, Math.min(1, f));
    this.el.hpfill.style.transform = `scaleX(${f})`;
    this.el.hplag.style.transform = `scaleX(${f})`;
    this.el.hpfill.style.background = f < 0.3 ? 'linear-gradient(#ff8a5a,#d8321c)' : '';
  }
  gauge(v) {
    this.el.segs.forEach((s, i) => { const k = Math.max(0, Math.min(1, v - i)); s.firstChild.style.transform = `scaleX(${k})`; s.classList.toggle('full', k >= 1); });
  }
  cowl(p) { this.el.cowl.textContent = p ? `ONE FOR ALL • ${p}%` : ''; }
  objective(t) { this.el.objective.textContent = t || ''; }
  timer(s) { this.el.timer.textContent = s == null ? '' : Math.ceil(s); }
  score(t) { this.el.score.textContent = t || ''; }
  combo(n) {
    const c = this.el.combo;
    c.innerHTML = n > 1 ? `${n}<small>HITS!</small>` : '';
    c.style.transform = 'scale(1.3)'; setTimeout(() => (c.style.transform = ''), 80);
  }
  bossBar(name, title) { this.el.boss.classList.remove('hidden'); this.el.bossName.innerHTML = `${name}${title ? `<small>${title}</small>` : ''}`; }
  bossHp(f) { this.el.bossfill.style.transform = `scaleX(${Math.max(0, f)})`; }
  bossHide() { this.el.boss.classList.add('hidden'); }
  charge(k, ready) {
    const c = this.el.charge;
    if (k < 0) { c.classList.add('hidden'); return; }
    c.classList.remove('hidden'); c.firstChild.style.transform = `scaleX(${k})`; c.classList.toggle('ready', k >= 1 && ready);
  }
  toast(t, color = '') {
    const d = document.createElement('div'); d.className = 'toast comic ' + color; d.textContent = t;
    this.el.toasts.appendChild(d);
    while (this.el.toasts.children.length > 3) this.el.toasts.firstChild.remove();
    setTimeout(() => d.remove(), 1800);
  }
  smashText(t, small = false) {
    this.el.smash.innerHTML = `<span class="comic ${small ? 'small' : ''}">${t}</span>`;
  }
  speedLines(t) { this.el.lines.classList.add('on'); clearTimeout(this._sl); this._sl = setTimeout(() => this.el.lines.classList.remove('on'), t * 1000); }
  bark(name, t) { const b = this.el.bark; b.textContent = (name ? name + ': ' : '') + t; b.classList.remove('hidden'); clearTimeout(this._bk); this._bk = setTimeout(() => b.classList.add('hidden'), 2200); }
  letterbox(on) { this.el.ui.classList.toggle('lbOn', on); this._lb = on; }
  isLetterbox() { return !!this._lb; }
  fade(on) { this.el.fade.classList.toggle('on', on); return new Promise(r => setTimeout(r, 520)); }

  dialog(who, text, color) {
    const e = this.el;
    e.dialog.classList.remove('hidden');
    e.dname.textContent = who || '';
    e.dname.style.display = who ? '' : 'none';
    e.dname.style.background = color || 'var(--green)';
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
    e.qteKey.className = 'comic' + (kind === 'mash' ? ' mash' : '');
    e.qteRing.style.display = kind === 'timing' ? '' : 'none';
    e.qteBar.style.display = kind === 'timing' ? 'none' : '';
    e.qteBar.querySelector('b').style.display = kind === 'hold' ? '' : 'none';
    e.qteTime.style.display = kind === 'mash' ? '' : 'none';
    this._qk = kind;
  }
  qteUpdate(v, t) {
    const e = this.el;
    if (this._qk === 'timing') { const s = 1 + Math.max(0, v) * 2.2; e.qteRing.style.transform = `scale(${s})`; e.qteRing.style.borderColor = Math.abs(v) < 0.12 ? '#7dff9a' : '#ffd23a'; }
    else e.qteBar.querySelector('i').style.transform = `scaleX(${v})`;
    e.qteTime.firstChild.style.transform = `scaleX(${Math.max(0, t)})`;
  }
  qteHide() { this.el.qte.classList.add('hidden'); }

  // -------- telas
  show(html, cls = '') {
    this.el.screens.innerHTML = `<div class="screen ${cls}" id="${cls}">${html}</div>`;
    return this.el.screens.firstChild;
  }
  hideScreen() { this.el.screens.innerHTML = ''; this.menuState = null; }

  // menu navegável por teclado/controle/mouse
  menu(container, items, onBack) {
    container.innerHTML = '';
    const btns = items.map((it, i) => {
      const b = document.createElement('button');
      b.innerHTML = it.label + (it.sub ? `<small>${it.sub}</small>` : '');
      b.disabled = !!it.disabled;
      b.onclick = () => { if (!it.disabled) { this.audio.init(); this.audio.sfx('select'); it.action(); } };
      b.onmouseenter = () => this.select(i);
      container.appendChild(b);
      return b;
    });
    this.menuState = { btns, items, i: Math.max(0, items.findIndex(x => !x.disabled)), onBack };
    this.select(this.menuState.i);
  }
  select(i) {
    const m = this.menuState; if (!m) return;
    m.i = i; m.btns.forEach((b, j) => b.classList.toggle('sel', j === i));
    m.btns[i]?.scrollIntoView?.({ block: 'nearest' });
  }

  tick(dt, input) {
    // máquina de escrever
    if (!this.dialogDone) {
      if (this._typing) {
        this._shown += dt * 48;
        const n = Math.min(this._full.length, Math.floor(this._shown));
        this.el.dtext.textContent = this._full.slice(0, n);
        if (n >= this._full.length) { this._typing = false; this.el.dnext.style.visibility = 'visible'; }
        else if (n % 3 === 0 && this._lastN !== n) { this._lastN = n; }
      }
      this._hold -= dt;
      if (this._hold <= 0 && (input.advance() || input.pressed('smash'))) {
        if (this._typing) { this._typing = false; this.el.dtext.textContent = this._full; this.el.dnext.style.visibility = 'visible'; }
        else { this.dialogDone = true; }
      }
      return;
    }
    const m = this.menuState;
    if (m && m.btns.length) {
      const n = m.btns.length;
      const step = d => { let i = m.i; for (let k = 0; k < n; k++) { i = (i + d + n) % n; if (!m.items[i].disabled) break; } this.select(i); this.audio.sfx('blip'); };
      if (input.pressed('down')) step(1);
      if (input.pressed('up')) step(-1);
      if (input.pressed('confirm') || input.pressed('attack') || input.pressed('jump')) { const it = m.items[m.i]; if (it && !it.disabled) { this.audio.init(); this.audio.sfx('select'); it.action(); } }
      else if ((input.pressed('dodge') || input.pressed('pause')) && m.onBack) { this.audio.sfx('blip'); m.onBack(); }
    }
  }
}

document.addEventListener('pointerdown', e => {
  // clique/toque avança diálogo
  const d = document.querySelector('#dialog');
  if (d && !d.classList.contains('hidden') && window.__ui) { const u = window.__ui; if (u._hold <= 0) { if (u._typing) { u._typing = false; u.el.dtext.textContent = u._full; u.el.dnext.style.visibility = 'visible'; } else u.dialogDone = true; } }
});
