// Capítulo 4 — Shie Hassaikai, Deku Sombrio e a Guerra Final
import { V, M, C, K, BOSS, NOTES, bg, tween, shot, bigFinish, mis } from './common.js';

export default [
  // ============================================================ 12
  {
    id: 'hassaikai', ep: 'CAPÍTULO 12', name: 'Resgate da Eri', arc: 'Shie Hassaikai — Ep. 64–77', color: '#6ab08a',
    sub: 'O esconderijo subterrâneo muda de forma. Capangas com escudos, homens-bomba — e, no fundo, uma menina que se acha amaldiçoada.', par: 320,
    missions: [mis('Quebre 3 escudos', s => (s.flags.shields || 0) >= 3), mis('Faça 3 contra-ataques', s => s.counters >= 3), mis('Encontre a página do caderno', s => s.notebooks >= 1)],
    async script(g) {
      let p = g.setup('hideout', { kit: K.overhaul, music: 'tension', yaw: 0, camDist: 7.5, camH: 3.6 });
      g.ui.portrait('DK', 'Deku');
      g.notebook(new V(7, 0, -30), NOTES.hassaikai);
      await g.say([
        { who: 'Izuku', cam: p, text: 'As paredes se mexem sozinhas: é a Individualidade "Remodelar". O labirinto vai tentar nos separar!' },
        { who: 'Izuku', cam: p, text: 'Agora eu tenho o Air Force com os dedos (E) e o Shoot Style. Full Cowl 20%!' },
        { who: 'Izuku', text: '(Da outra vez eu soltei a mão da Eri na rua. Desta vez... eu não vou soltar!)' },
      ]);
      p.setCowl(true);
      g.flags.shields = 0;
      g.onEnemyHit = (e) => { if (e.def.shield && !e.shield && !e._counted) { e._counted = true; g.flags.shields++; } };
      await g.wave([
        [{ type: 'hassai' }, { type: 'shield', over: { model: () => { const r = M.hassaikai(); M.part(r.elL, M.G.box(0.8, 1.1, 0.12), 0x6a7a8a, 0, -0.3, 0.25, 0.03); return r; } } }, { type: 'hassai' }],
        [{ type: 'bomber' }, { type: 'shield', over: { model: () => { const r = M.hassaikai(); M.part(r.elL, M.G.box(0.8, 1.1, 0.12), 0x6a7a8a, 0, -0.3, 0.25, 0.03); return r; } } }, { type: 'gunner' }, { type: 'hassai' }],
        [{ type: 'brute', over: { model: () => M.hassaikai(), scale: 1.4 } }, { type: 'shield' }, { type: 'bomber' }],
      ], { objective: 'Derrote os capangas (escudos caem com lançador ou SMASH)' });
      await g.reach(new V(0, 0, -37), 2.5, 'Avance pelo labirinto móvel!');
      await g.ui.fade(true);
      g.keepTime = true;
      p = g.setup('hideoutBoss', { kit: K.overhaul, music: 'boss', yaw: 0, camDist: 9, camH: 4.4 });
      p.setCowl(true);
      const eri = g.npc('eri', g.env.anchors.eri, { face: new V(0, 0, -8), pose: 'sit' });
      const ov = g.npc('overhaul', new V(0, 0, -9), { face: p.pos });
      shot(g, 0, 2.4, 2, 0, 1.6, -9, true);
      await g.ui.fade(false);
      await g.say([
        { who: 'Overhaul', cam: ov, text: 'Heróis são uma doença. Individualidades são uma doença. E a Eri é a cura.' },
        { who: 'Overhaul', cam: ov, text: 'Eu desmonto e remonto tudo o que toco. O chão. As paredes. Você.' },
        { who: 'Eri', cam: eri, shot: { dist: 2, h: 0 }, text: 'Pare... todos se machucam por minha causa... eu sou amaldiçoada...' },
        { who: 'Izuku', cam: p, text: 'Eri! Você não é amaldiçoada! Eu vim te buscar. Desta vez eu SEGURO a sua mão!' },
        { who: 'Izuku', text: '(Círculos e linhas no chão viram espinhos. Fique em movimento!)' },
      ]);
      g.removeNpc(ov);
      g.bossEvent = (b, ev) => bg(async () => {
        if (ev === 'eri') {
          await g.cinema(true);
          eri.pose = 'calm';
          eri.pos.set(p.pos.x - 1, 0, p.pos.z + 1.2);
          await g.say([
            { who: 'Eri', cam: eri, text: 'Eu... quero ajudar. Eu quero que você fique bem!' },
            { who: 'Izuku', cam: p, text: 'O "Rebobinar" dela me faz voltar antes de cada ferimento. Com isso...' },
            { who: 'Izuku', cam: p, text: 'Eu posso usar 100% sem me destruir! FULL COWL — 100%!!!' },
          ]);
          g.eriBoost = true;
          p.setCowl(true);
          p.gauge = 3;
          g.removeNpc(eri);
          await g.cinema(false); g.freeCam();
          bg(async () => { while (g.eriBoost) { await g.wait(0.5); p.heal(2); p.addGauge(0.25); } });
        } else if (ev === 'chrono') {
          g.ui.bark('Overhaul', 'Chronostasis... me empreste seu corpo! FUSÃO!');
          g.ui.bossBar('OVERHAUL — FUSÃO', 'Remodelação do próprio corpo');
          b.root.scale.multiplyScalar(1.35);
          b.def.speed = 6.2;
        }
      });
      const boss = await g.boss(BOSS.overhaul, g.env.anchors.boss);
      await g.cinema(true);
      shot(g, 6, 3, -2, 0, 3, -8);
      await g.say([
        { who: 'Overhaul', cam: boss, text: 'Você não entende nada! Eu ia devolver à Yakuza o seu lugar no mundo!' },
        { who: 'Izuku', cam: p, text: 'Uma menina chorando não é "lugar no mundo"! Isso acaba AGORA!' },
      ]);
      await g.qte('timing', { title: '100% — SMASH!', label: 'K', speed: 1.2, tries: 3 });
      bigFinish(g, boss.center.clone(), '100% DETROIT SMASH!');
      const bf = boss.pos.clone();
      await tween(g, 0.8, k => boss.pos.set(bf.x, bf.y + Math.sin(k * Math.PI) * 5, bf.z - k * 6));
      boss.go('down'); boss.def = { ...boss.def, passive: true };
      g.ui.bossHide();
      g.eriBoost = false; p.setCowl(true);
      const eri2 = g.npc('eri', p.pos.clone().add(new V(1, 0, 1)), { face: p.pos });
      await g.say([
        { who: 'Eri', cam: eri2, text: 'Você... ainda está segurando a minha mão.' },
        { who: 'Izuku', cam: p, text: 'Está tudo bem agora, Eri. Por quê? Porque eu estou aqui.' },
        { who: 'Eri', cam: eri2, text: '...Eu posso... sorrir? Eu não lembro como faz.' },
        { who: 'Izuku', cam: p, text: 'A gente vai te ensinar. No Festival Cultural da U.A., você vai sorrir de verdade. Prometo.' },
      ]);
    },
  },
  // ============================================================ 13
  {
    id: 'nagant', ep: 'CAPÍTULO 13', name: 'Deku Sombrio: Lady Nagant', arc: 'Arco Deku Sombrio — Temporada 6', color: '#d85ab0',
    sub: 'Deku deixou a U.A. para proteger todos de All For One. Na chuva, sobre os telhados, uma sniper lendária mira nele.', par: 260,
    missions: [mis('Chegue ao último telhado sem cair', s => !s.flags.fell), mis('Use o Blackwhip para cruzar 3 vãos', s => (s.flags.whips || 0) >= 3), mis('Encontre a página do caderno', s => s.notebooks >= 1)],
    async script(g) {
      const p = g.setup('rooftops', { kit: K.dark, music: 'night', weather: 'rain', yaw: 0, camDist: 9, camH: 4.4 });
      g.ui.portrait('DK', 'Deku');
      g.notebook(g.env.anchors.roof3.clone().add(new V(3, 0, 2)), NOTES.nagant);
      await g.say([
        { who: '', text: 'Depois da Guerra de Libertação Paranormal, a cidade virou caos. Deku saiu da U.A. sozinho, para que All For One não atacasse quem ele ama.' },
        { who: 'Izuku', cam: p, text: '(Não durmo direito há dias. O Sentido de Perigo dispara o tempo todo. ...Agora. Alguém está mirando.)' },
        { who: 'Lady Nagant', text: '(pelo rádio da cidade) Nono portador. Tenho ordens de te entregar vivo. Ou quase.' },
        { who: 'Izuku', cam: p, text: '(A linha vermelha é a mira dela. Quando piscar branca, esquive! Blackwhip (E) me puxa até a beira do próximo telhado. Segure PULO para flutuar.)' },
      ]);
      // a sniper atira de longe enquanto o Deku atravessa
      const boss = g.spawn(BOSS.nagant, g.env.anchors.boss.clone(), { boss: true });
      boss.invuln = true;
      g.curBoss = boss;
      g.ui.bossBar(BOSS.nagant.name, BOSS.nagant.title); g.ui.bossHp(1);
      g.flags.whips = 0;
      const prevSpecial = p.doSpecial.bind(p);
      p.doSpecial = () => { const y = p.pos.y; prevSpecial(); if (!p.onGround || p.vel.y > 6) { if (y > 10) g.flags.whips++; } };
      bg(async () => { while (!g.flags.arrived) { if (p.pos.y < 8) g.flags.fell = true; await g.wait(0.1); } });
      for (let i = 1; i <= 4; i++) {
        const r = g.env.anchors['roof' + i];
        await g.reach(r.clone(), 3, `Avance pelos telhados (${i}/5)`);
        g.setCheckpoint(r.clone());
      }
      await g.reach(g.env.anchors.roof5.clone().add(new V(0, 0, 10)), 3.5, 'Alcance o telhado da Lady Nagant!');
      g.flags.arrived = true;
      await g.cinema(true);
      g.shotOn(boss, { dist: 4 });
      await g.say([
        { who: 'Lady Nagant', cam: boss, text: 'Eu era heroína. A Comissão me mandava eliminar gente "inconveniente" no escuro. Um dia eu disse não.' },
        { who: 'Lady Nagant', cam: boss, text: 'A sociedade dos heróis é podre por dentro, garoto. Você está lutando por uma mentira.' },
        { who: 'Izuku', cam: p, text: 'Então me ajuda a consertar! Eu não vou desistir de ninguém. Nem de você!' },
      ]);
      await g.cinema(false); g.freeCam();
      boss.invuln = false;
      let result = null;
      g.bossDefeated = (b) => { if (b === boss) result = 'f'; };
      g.bossEvent = (b, ev) => { if (ev === 'nagantHalf') g.ui.bark('Lady Nagant', 'Você é teimoso. Igual a ela... igual a Nana.'); };
      await g.until(() => result);
      // a bomba que All For One deixou nela
      await g.cinema(true);
      g.ui.bossHide();
      boss.def = { ...boss.def, passive: true };
      shot(g, 4, 16.5, -90, 0, 16, -96);
      await g.say([
        { who: 'Lady Nagant', cam: boss, text: '...Talvez você esteja certo. Eu vou te contar onde All For One...' },
        { who: '', text: 'Uma luz surge no peito dela. All For One havia implantado uma Individualidade que explode se ela tentasse traí-lo.' },
        { who: 'Izuku', cam: p, text: 'NÃO! Eu não vou deixar ninguém morrer na minha frente!' },
      ]);
      await g.qte('mash', { title: 'BLACKWHIP — SEGURE A NAGANT!', label: 'J/K', key: 'attack', alt: 'smash', gain: 0.05, drain: 0.22, time: 6, start: 0.3,
        onPress: () => g.fx.tendrils(p.center.clone(), boss.center.clone(), 2) });
      bigFinish(g, boss.center.clone().add(new V(0, 4, 0)), 'BOOM!', 0xff5ac8);
      boss.pose = 'down'; boss.go('down');
      await g.say([
        { who: 'Lady Nagant', cam: boss, text: '(viva) ...Você me puxou pra longe da explosão. Seu idiota.' },
        { who: 'Uraraka', text: 'DEKU-KUN! Chega! Você está se destruindo sozinho! Volta pra U.A.!' },
        { who: 'Izuku', cam: p, text: '(Todos eles vieram me buscar... Eu estava tentando salvar todo mundo e esqueci de deixar que me salvassem.)' },
      ]);
    },
  },
  // ============================================================ 14
  {
    id: 'guerra', ep: 'ATO FINAL', name: 'Deku vs. Shigaraki', arc: 'Arco da Guerra Final', color: '#ff3b47',
    sub: 'Jaku em ruínas. O nono portador do One For All contra o herdeiro de All For One. A última batalha — e uma mão estendida.', par: 380,
    missions: [mis('Pule por cima de 6 ondas de Decadência', s => (s.flags.wavesJumped || 0) >= 6), mis('Termine com rank de estilo S', s => s.bestStyle === 'S'), mis('Encontre a página do caderno', s => s.notebooks >= 1)],
    async script(g) {
      const p = g.setup('jaku', { kit: K.final, music: 'final', weather: 'ash', yaw: 0, camDist: 10, camH: 5 });
      g.ui.portrait('DK', 'Deku');
      g.notebook(new V(-20, 0, 18), NOTES.guerra);
      p.setCowl(true);
      const sh = g.npc(() => M.shigaraki(true), new V(0, 0, -10), { face: p.pos });
      shot(g, 0, 3, 4, 0, 2.5, -10, true);
      await g.say([
        { who: '', text: 'O dia da guerra final. Heróis do Japão inteiro em campo. A Classe 1-A espalhada pelas frentes de batalha.' },
        { who: 'Shigaraki', cam: sh, text: 'Você de novo. O garotinho que quer salvar todo mundo. Eu vou destruir tudo... até não sobrar nada.' },
        { who: 'Izuku', cam: p, text: 'Eu não vim só para te vencer, Shigaraki. Eu vim... para te salvar.' },
        { who: 'Izuku', text: '(As ondas de Decadência se espalham pelo chão — PULE quando o anel passar! Blackwhip (E) puxa, segure PULO para flutuar.)' },
      ]);
      g.removeNpc(sh);
      g.flags.wavesJumped = 0;
      // conta as ondas evitadas no ar
      bg(async () => { while (true) { for (const w of g.waves) { const d = Math.hypot(p.pos.x - w.pos.x, p.pos.z - w.pos.z); if (!w.counted && !w.hit && Math.abs(d - w.r) < 0.8 && p.pos.y >= 0.9) { w.counted = true; g.flags.wavesJumped++; p.addStyle('jumpwave', 2); } } await g.wait(0); } });
      g.bossEvent = (b, ev) => bg(async () => {
        if (ev === 'afo') {
          await g.say([
            { who: 'All For One', cam: b, text: 'Tomura... deixe-me assumir. O corpo é meu tanto quanto seu.' },
            { who: 'Izuku', cam: p, text: 'Não! Tem alguém aí dentro chorando! Eu ouço... uma criança!' },
          ]);
        } else if (ev === 'vestiges') {
          await g.cinema(true);
          const cols = [0x9ad8ff, 0xffd8a0, 0xd8a0ff, 0xa0ffd8, 0xffa0a0, 0xffffa0, 0xa0a0ff];
          const vs = [];
          for (let i = 0; i < 7; i++) { const r = M.vestige(cols[i]); vs.push(g.npc(() => r, p.pos.clone().add(new V(Math.cos(i * 0.9 + 2) * 2.5, 0, Math.sin(i * 0.9 + 2) * 2.5 + 1.5)), { face: b.pos })); }
          shot(g, p.pos.x, 2.5, p.pos.z + 6, p.pos.x, 1.8, p.pos.z);
          await g.say([
            { who: 'Nana Shimura', text: 'Izuku. Nós não somos só poder. Somos a vontade de quem veio antes. Vá — com todos nós.' },
            { who: 'Yoichi', text: 'Meu irmão... Por favor, termine o que eu não consegui.' },
            { who: 'Izuku', cam: p, text: 'ONE FOR ALL... 100%... COM TODOS VOCÊS!' },
          ]);
          vs.forEach(n => g.removeNpc(n));
          p.gauge = 3; p.heal(60);
          p.kit.power *= 1.25;
          g.ui.toast('OS VESTÍGIOS ESTÃO COM VOCÊ!', 'gold');
          await g.cinema(false); g.freeCam();
          bg(async () => { while (b.alive && !b.invuln) { await g.wait(1); p.addGauge(0.12); } });
        }
      });
      const boss = await g.boss(BOSS.shigaraki, g.env.anchors.boss);
      await g.cinema(true);
      g.audio.playTrack('sad');
      shot(g, 0, 2.2, -4, 0, 2.2, -10);
      const tenko = g.npc(() => M.humanoid({ colors: { skin: 0xf2d8c8, top: 0xe8e0d0, bottom: 0x3a3a5a, sleeve: 0xe8e0d0, forearm: 0xf2d8c8, shoe: 0x6a3a2a }, scale: 0.6, head: 1.25, extra(r) { M.part(r.head, M.G.sph(0.265, 12), 0x3a4a6a, 0, 0.03, -0.04, 0.02); } }), boss.pos.clone().add(new V(1.2, 0, 1)), { face: p.pos, pose: 'sit' });
      await g.say([
        { who: '', text: 'No meio da poeira, Izuku vê um menino pequeno, sentado sozinho numa rua, esperando que alguém pare.' },
        { who: 'Tenko', cam: tenko, text: '...Ninguém parou. Ninguém nunca parou pra mim.' },
        { who: 'Izuku', cam: p, text: 'Eu parei. Eu estou aqui, Tenko. Desta vez alguém estendeu a mão.' },
        { who: 'All For One', text: 'Sentimentalismo! O corpo é MEU!' },
        { who: 'Izuku', cam: p, text: 'Então este é o último golpe. Para salvar quem está aí dentro — e para encerrar o que você começou, All For One!' },
      ]);
      g.audio.playTrack('final');
      await g.qte('hold', { title: 'TODOS OS VESTÍGIOS... JUNTOS!', label: 'K', speed: 1.3 });
      await g.qte('mash', { title: 'SMASH!!!', label: 'J/K', key: 'attack', alt: 'smash', gain: 0.04, drain: 0.2, time: 9, start: 0.3, onPress: () => g.fx.hitSpark(boss.center.clone().add(new V((Math.random() - 0.5) * 2, Math.random() * 2, 0.5)), true, 0x9affb0) });
      bigFinish(g, boss.center.clone(), 'SMASH!!!');
      for (let i = 0; i < 8; i++) g.fx.shockwave(new V(0, 0.3, -10), i % 2 ? 0x9affb0 : 0xffffff, 6 + i * 4, 0.9 + i * 0.1);
      boss.go('down'); boss.def = { ...boss.def, passive: true };
      g.ui.bossHide();
      g.removeNpc(tenko);
      await g.wait(1.5);
      g.fx.setWeather('petal', g.scene);
      g.audio.playTrack('sad');
      p.cinePose = 'calm';
      shot(g, 3, 2, p.pos.z + 3, 0, 1.6, p.pos.z - 2);
      await g.say([
        { who: '', text: 'O céu se abre sobre Jaku. A última brasa do One For All se apaga nos punhos de Izuku, entregue por inteiro.' },
        { who: 'Bakugo', color: C.kacchan, text: '(chegando, ferido) ...Deku. Você ganhou. Idiota.' },
        { who: 'Izuku', cam: p, text: 'Obrigado... All Might. Obrigado a todos vocês.' },
        { who: 'Izuku', cam: p, text: 'Eu não tenho mais Individualidade. Mas tenho uma coisa que ninguém me deu por sorte...' },
        { who: 'Izuku', cam: p, text: 'A vontade de estender a mão. Essa é a história de como eu me tornei o maior herói de todos.' },
      ]);
    },
  },
];
