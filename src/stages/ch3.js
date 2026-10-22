// Capítulo 3 — Acampamento, Kamino, Licença Provisória e Ground Beta (Ep. 39–61)
import { V, M, C, K, BOSS, NOTES, bg, tween, shot, bigFinish, mis } from './common.js';

export default [
  // ============================================================ 8
  {
    id: 'floresta', ep: 'CAPÍTULO 8', name: 'Acampamento na Floresta', arc: 'Acampamento de Treinamento — Ep. 39–45', color: '#5a7aff',
    sub: 'A Liga ataca o acampamento. Fogo azul, gás venenoso, colegas desmaiados — e o pequeno Kota sozinho no penhasco.', par: 280,
    missions: [mis('Resgate os 2 colegas desmaiados no gás', s => s.rescued >= 2), mis('Faça 15 golpes aéreos', s => s.airHits >= 15), mis('Encontre a página do caderno', s => s.notebooks >= 1)],
    async script(g) {
      let p = g.setup('forest', { kit: K.forest, music: 'night', weather: 'ember', yaw: 0 });
      g.ui.portrait('DK', 'Deku');
      g.notebook(new V(13, 0, -38), NOTES.floresta);
      await g.say([
        { who: 'Mandalay (telepatia)', text: 'Atenção, todos! Vilões invadiram o acampamento! Voltem para o centro e não lutem!' },
        { who: 'Izuku', cam: p, text: 'O Kota não estava no acampamento. Ele sempre vai para aquele penhasco escondido!' },
        { who: 'Izuku', text: '(Chamas azuis e gás roxo... tem colegas desmaiados no caminho. Primeiro eles!)' },
      ]);
      const mates = [g.civilian(new V(7, 0, -16), { variant: 4, time: 70, label: 'Colega' }), g.civilian(new V(-9, 0, -34), { variant: 1, time: 85, label: 'Colega' })];
      const w = g.wave([
        [{ type: 'thug' }, { type: 'thug' }, { type: 'gunner' }],
        [{ type: 'nomuLow' }, { type: 'bomber' }, { type: 'thug' }],
      ], { objective: 'Abra caminho e resgate os colegas no gás' });
      await Promise.all([w, g.rescueAll(mates)]);
      await g.reach(new V(0, 0, -45), 2.5, 'Chegue ao penhasco do Kota!');
      await g.ui.fade(true);
      g.keepTime = true;
      p = g.setup('forestCliff', { kit: K.forest, music: 'boss', yaw: 0, camDist: 9.5, camH: 4.5 });
      const kota = g.npc('kota', g.env.anchors.kota, { face: new V(0, 0, -8) });
      const mus = g.npc('muscular', new V(0, 0, -10), { face: kota.pos });
      shot(g, 6, 2.5, -6, -2, 1.5, -12, true);
      await g.ui.fade(false);
      await g.say([
        { who: 'Muscular', cam: mus, text: 'Você é o filho dos Water Hose, né? Fui eu quem deu aquele jeitinho no rosto deles. Hehe!' },
        { who: 'Kota', cam: kota, shot: { dist: 2, h: 0.3 }, text: 'Você... você matou o papai e a mamãe!' },
        { who: 'Izuku', do: () => { p.pos.set(-2, 0, -12.5); p.faceTo(mus.pos); }, cam: p, text: 'Kota! Está tudo bem! Eu vou te proteger!' },
        { who: 'Muscular', cam: mus, do: () => { mus.pose = 'cheer'; }, text: 'O garoto do cabelo verde! Que sorte! Aumento Muscular: pele de fibra, força BRUTA! Seus socos nem me arranham!' },
        { who: 'Izuku', cam: p, text: '(Golpes comuns quase não passam. Lançador e SMASH carregado! E ataques aéreos pelo alto!)' },
      ]);
      g.removeNpc(mus);
      p.setCowl(true);
      kota.pose = 'sit';
      g.bossEvent = (b, ev) => { if (ev === 'muscleUp') { g.ui.bark('Muscular', 'Agora é sério! Tudo, tudo, TUDO!'); b.def.speed = 6; b.root.scale.multiplyScalar(1.15); p.addGauge(1); } };
      const boss = await g.boss(BOSS.muscular, g.env.anchors.boss);
      await g.cinema(true);
      shot(g, 4, 2.2, -2, -1, 2, -9);
      await g.say([
        { who: 'Muscular', cam: boss, text: 'Hahaha! Quebrou o braço e ainda tá de pé?! Isso é DIVERTIDO!' },
        { who: 'Izuku', cam: p, text: 'Não vou deixar você tocar no Kota! Mesmo que meus braços se despedacem...' },
        { who: 'Izuku', cam: p, text: 'UM MILHÃO POR CENTO...' },
      ]);
      await g.qte('mash', {
        title: '1.000.000% DELAWARE DETROIT SMASH!', label: 'J/K', key: 'attack', alt: 'smash', gain: 0.045, drain: 0.28, time: 9, start: 0.45,
        onTick: (v) => { boss.pos.z = -4 - v * 6; p.pos.z = -2 - v * 6; },
        onPress: () => g.fx.burst(p.center.clone().add(new V(0, 0, -1)), [0x7dff9a, 0xff4040], 3, 8, { add: true, size: 0.12, grav: 0 }),
      });
      bigFinish(g, boss.center.clone(), 'DELAWARE DETROIT SMASH!!');
      const bf = boss.pos.clone();
      await tween(g, 0.7, k => boss.pos.set(bf.x, bf.y + Math.sin(k * Math.PI) * 3, bf.z - k * 8));
      boss.go('down'); boss.def = { ...boss.def, passive: true };
      g.ui.bossHide();
      kota.pose = 'calm'; p.cinePose = 'hurt';
      await g.say([
        { who: 'Kota', cam: kota, text: 'Por quê...? Por que você foi tão longe por mim? A gente nem se conhece!' },
        { who: 'Izuku', cam: p, text: 'Seus pais também teriam feito isso. Salvar alguém, mesmo sem conhecer. Isso é ser herói, Kota.' },
        { who: 'Kota', cam: kota, text: '(Ele é igualzinho ao papai e à mamãe...) Obrigado... OBRIGADO!' },
        { who: 'Izuku', text: '...Os vilões disseram que o alvo era o Kacchan. Eu preciso ir. Com os braços assim mesmo.' },
      ]);
    },
  },
  // ============================================================ 9
  {
    id: 'kamino', ep: 'CAPÍTULO 9', name: 'Kamino — O Fim de uma Era', arc: 'Ataque ao Esconderijo — Ep. 46–49', color: '#9a6ae8',
    sub: 'All Might enfrenta All For One. O plano de Kirishima: pular, agarrar o Kacchan e fugir. Sem lutar.', par: 150,
    missions: [mis('Soque 6 Nomus pelo caminho', s => (s.flags.nomus || 0) >= 6), mis('Chegue recebendo menos de 30 de dano', s => s.taken < 30), mis('Encontre a página do caderno', s => s.notebooks >= 1)],
    async script(g) {
      const p = g.setup('kamino', { kit: K.kamino, music: 'final', weather: 'ash', yaw: 0, camDist: 7 });
      g.ui.portrait('DK', 'Deku');
      p.setCowl(true);
      await g.say([
        { who: 'Kirishima', text: 'O plano é simples: o Iida corre, o Midoriya pula, eu endureço e o Bakugo agarra a minha mão!' },
        { who: 'Iida', text: 'Não vamos lutar. Só vamos tirar o Bakugo de lá e correr. Se ele vir a nossa mão... ele vai pegar.' },
        { who: 'Izuku', cam: p, text: 'All For One apagou um bairro inteiro com um golpe... Vamos!' },
        { who: 'Izuku', text: '(Lados para desviar, PULO para os destroços baixos, J para socar os Nomus no caminho!)' },
      ]);
      g.flags.nomus = 0;
      const sc = g.score;
      await g.autorun({ length: 460, speed: 17, objective: 'Atravesse Kamino!' });
      g.flags.nomus = Math.round((g.score - sc) / 300);
      g.player.stats.notebooks = (g.player.stats.notebooks || 0) + 1; // a página cai durante a corrida
      g.ui.notebookCard(NOTES.kamino); g.onNotebook?.(NOTES.kamino);
      await g.cinema(true);
      const kc = g.npc('bakugo', p.pos.clone().add(new V(1.5, 0, -10)), { face: p.pos, args: ['hero'] });
      shot(g, p.pos.x + 6, 3, p.pos.z - 3, p.pos.x, 3, p.pos.z - 8);
      await g.say([
        { who: 'Izuku', cam: p, text: 'Agora! Iida, Kirishima — PULEM!' },
        { who: 'Kirishima', text: 'BAKUGO! VEM!!!' },
      ]);
      p.cinePose = 'jump';
      const from = p.pos.clone();
      await tween(g, 0.8, k => { p.pos.set(from.x, Math.sin(k * Math.PI / 2) * 12, from.z - k * 8); g.shot(p.pos.clone().add(new V(5, -1, 6)), p.pos); });
      const ok = await g.qte('timing', { title: 'ESTENDA A MÃO PARA O KACCHAN!', label: 'K', speed: 1.0, tries: 3 });
      kc.pos.copy(p.pos).add(new V(0.8, -0.5, 0.3)); kc.floating = true; kc.pose = 'cheer';
      g.audio.sfx('explode'); g.fx.burst(kc.pos.clone(), [0xffa020, 0xffe060], 20, 10, { size: 0.2, add: true });
      await g.say([{ who: 'Bakugo', cam: kc, text: ok ? '...Idiotas. Não fiquem achando que eu tô agradecendo!' : 'Tch! Peguei a mão do cabelo espetado. Agora VOA, seus idiotas!' }]);
      kc.floating = false;
      await g.ui.fade(true);
      g.removeNpc(kc);
      p.pos.set(0, 0, -150); p.vel.set(0, 0, 0); p.cinePose = 'calm';
      p.root.visible = false;
      const am = g.npc('allMight', new V(0, 0, -480), { face: new V(0, 0, -490) });
      const afo = g.npc('allForOne', new V(0, 0, -490), { face: am.pos });
      g.player.pos.set(0, 0, -475);
      shot(g, 8, 3, -478, 0, 3, -485, true);
      g.audio.playTrack('sad');
      await g.ui.fade(false);
      await g.say([
        { who: 'All For One', cam: afo, text: 'Lembra de Nana Shimura, All Might? Sua mestra. O neto dela... é Tomura Shigaraki.' },
        { who: 'All Might', cam: am, text: '(...Não. Não posso desmoronar. Ainda há pessoas olhando!)' },
        { who: 'Civil', color: C.nar, text: 'Vença... VENÇA, ALL MIGHT!!!' },
        { who: 'Izuku (pela TV)', text: '(Vença...!)' },
        { who: 'All Might', cam: am, text: 'Mesmo que esta seja minha última chama... é a chama que ilumina o caminho para quem vem depois!' },
      ]);
      g.audio.playTrack('final');
      g.ui.portrait('AM', 'All Might');
      am.pose = 'charge';
      shot(g, 5, 2, -477, 0, 2.5, -483);
      await g.qte('hold', { title: 'REÚNA TUDO O QUE RESTA!', label: 'K', speed: 1.2 });
      am.pose = 'smash';
      await g.qte('mash', { title: 'UNITED STATES OF SMASH!!!', label: 'J/K', key: 'attack', alt: 'smash', gain: 0.05, drain: 0.18, time: 7, start: 0.35, onPress: () => g.fx.hitSpark(afo.center.clone(), true, 0xffe060) });
      bigFinish(g, afo.center.clone(), 'UNITED STATES OF SMASH!', 0xffe060);
      for (let i = 0; i < 7; i++) g.fx.shockwave(new V(0, 0.2, -490), 0xffffff, 6 + i * 4, 0.8 + i * 0.1);
      afo.pose = 'down';
      await g.wait(1.5);
      const amPos = am.pos.clone();
      g.removeNpc(am);
      const skinny = g.npc(() => M.allMight('skinny'), amPos, { face: new V(8, 0, -477) });
      skinny.pose = 'raise';
      g.audio.playTrack('sad');
      shot(g, 2.5, 2.4, -477, 0, 2.6, -480);
      await g.say([
        { who: '', text: 'A poeira baixa. Diante de todas as câmeras do Japão, o Símbolo da Paz revela sua forma esquelética. E aponta.' },
        { who: 'All Might (magro)', cam: skinny, text: 'Agora...' },
        { who: 'All Might (magro)', cam: skinny, text: '...é a sua vez.' },
        { who: 'Izuku', text: '(Isso não foi para o mundo. Foi uma mensagem... para mim.)' },
      ]);
      p.root.visible = true;
    },
  },
  // ============================================================ 10
  {
    id: 'licenca', ep: 'CAPÍTULO 10', name: 'Exame da Licença Provisória', arc: 'Licença Provisória — Ep. 52–60', color: '#ffb020',
    sub: 'Primeira fase: acertar os alvos dos alunos de outras escolas. Segunda fase: zona de desastre. E então o Gang Orca entra como "vilão".', par: 320,
    missions: [mis('Resgate os 5 feridos da zona de desastre', s => s.rescued >= 5), mis('Chegue ao rank de estilo S', s => s.bestStyle === 'S'), mis('Encontre a página do caderno', s => s.notebooks >= 1)],
    async script(g) {
      const p = g.setup('license', { kit: K.license, music: 'tension', yaw: 0, camDist: 9 });
      g.ui.portrait('DK', 'Deku');
      g.notebook(new V(-18, 0, -46), NOTES.licenca);
      const inasa = g.npc('inasa', new V(4, 0, 10), { face: p.pos });
      await g.say([
        { who: 'Izuku', cam: p, text: 'Meus braços não aguentam mais SMASH. A Recovery Girl avisou. Por isso: SHOOT STYLE! As pernas são mais fortes que os braços.' },
        { who: 'Izuku', text: '(J no ar = chutes. K no ar = St. Louis Smash, caindo com tudo. Full Cowl 8% no corpo todo!)' },
        { who: 'Inasa', cam: inasa, text: 'EU AMO A U.A.!!! Sou Inasa Yoarashi, da Shiketsu! Hoje vocês vão ver o vento de quem quer ser herói!' },
        { who: '', text: 'Primeira fase: 1.540 candidatos, 100 vagas. Cada aluno carrega 3 alvos. Elimine rivais acertando os alvos.' },
      ]);
      g.removeNpc(inasa);
      p.setCowl(true);
      await g.wave([
        [{ type: 'student' }, { type: 'student' }, { type: 'student' }],
        [{ type: 'student' }, { type: 'student' }, { type: 'shield', over: { model: () => M.student(0x5a2a2a, 1), name: 'Aluno com escudo' } }, { type: 'student' }],
      ], { objective: 'Elimine os alunos rivais (acerte os alvos deles)' });
      await g.say([
        { who: 'Mestre de cerimônias', color: C.nar, text: 'Aprovados na primeira fase! Segunda fase: RESGATE. A zona de desastre está cheia de "vítimas" do H.U.C. Comecem!' },
        { who: 'Izuku', cam: p, text: '(Os feridos são profissionais avaliando a gente. Chegar rápido, falar com calma, nunca deixar ninguém sozinho.)' },
      ]);
      g.camYaw = 0;
      const vic = [[-10, -18], [9, -22], [-4, -32], [14, -36], [-14, -42]].map(([x, z], i) => g.civilian(new V(x, 0, z), { variant: i, time: 80, label: 'Vítima' }));
      await g.rescueAll(vic, 'Resgate as vítimas da zona de desastre');
      // o "vilão" do exame
      g.audio.sfx('explode'); g.shake(0.8);
      const orca = g.npc('gangOrca', g.env.anchors.boss, { face: p.pos });
      await g.cinema(true);
      shot(g, 6, 3, -26, 0, 3, -34);
      await g.say([
        { who: 'Gang Orca', cam: orca, text: 'Nós somos os vilões desta fase. Protejam as vítimas enquanto nós atacamos. Mostrem do que são feitos.' },
        { who: 'Gang Orca', cam: orca, text: 'Minha onda ultrassônica paralisa. Fique na frente e você não se mexe.' },
        { who: 'Izuku', cam: p, text: '(Cone azul no chão = onda sônica. Saia pelos lados e ataque pelas costas!)' },
      ]);
      await g.cinema(false); g.freeCam(); g.removeNpc(orca);
      let examOver = false;
      g.timerStart(100, () => { examOver = true; });
      g.bossEvent = (b, ev) => { if (ev === 'orcaHalf') { g.ui.bark('Gang Orca', 'Nada mal, garoto. Ajudantes, cimento neles!'); } };
      const bossP = g.boss(BOSS.gangOrca, g.env.anchors.boss);
      bossP.catch(() => {});
      await Promise.race([bossP, g.until(() => examOver)]);
      const boss = g.curBoss;
      g.countdown = null; g.ui.timer(null);
      for (const e of g.alive()) if (e !== boss) e.kill();
      await g.cinema(true);
      if (boss) { boss.def = { ...boss.def, passive: true }; boss.invuln = true; }
      g.ui.bossHide();
      shot(g, 6, 3, p.pos.z + 6, p.pos.x, 2, p.pos.z - 4);
      await g.say([
        { who: 'Mestre de cerimônias', color: C.nar, text: 'Todas as vítimas foram resgatadas. O EXAME ESTÁ ENCERRADO!' },
        { who: 'Gang Orca', text: 'Eu segurei a força, mas vocês não fugiram. Isso é o que importa.' },
        { who: '', text: 'Resultados: Izuku Midoriya — APROVADO. Bakugo e Todoroki ficaram de fora e farão o curso especial.' },
        { who: 'Izuku', cam: p, text: '(Licença provisória... Eu posso agir como herói de verdade agora. Kacchan... por que você ficou olhando pra mim daquele jeito?)' },
      ]);
    },
  },
  // ============================================================ 11
  {
    id: 'kacchan2', ep: 'CAPÍTULO 11', name: 'Deku vs. Kacchan II', arc: 'Depois do exame — Ep. 61', color: '#ff8a2a',
    sub: 'Meia-noite. Ground Beta, onde tudo começou. Kacchan quer respostas sobre o All Might — e só sabe pedir lutando.', par: 220,
    missions: [mis('Desvie de 2 granadas de luz', s => s.flags.flashDodged >= 2), mis('Faça um combo de 30 golpes', s => s.maxCombo >= 30), mis('Encontre a página do caderno', s => s.notebooks >= 1)],
    async script(g) {
      const p = g.setup('groundBeta', { kit: K.license, music: 'night', yaw: 0, camDist: 9 });
      g.ui.portrait('DK', 'Deku');
      g.notebook(new V(15, 0, 15), NOTES.kacchan2);
      const kc = g.npc('bakugo', g.env.anchors.boss, { face: p.pos, args: ['hero'] });
      shot(g, 3, 2, 3, 0, 1.8, -8, true);
      await g.say([
        { who: 'Bakugo', cam: kc, text: 'Fui eu, não fui? O All Might se aposentou por minha causa. Porque eu me deixei sequestrar.' },
        { who: 'Bakugo', cam: kc, text: 'E você... desde o Vilão de Lama. Você ganhou o poder dele. Eu vi.' },
        { who: 'Izuku', cam: p, text: 'Kacchan...' },
        { who: 'Bakugo', cam: kc, text: 'Luta comigo. Aqui. Agora. Eu preciso saber o que você tem que eu não tenho!' },
        { who: 'Izuku', cam: p, text: '...Tá bom. Mas eu vou com tudo também. Eu sempre corri atrás de você, Kacchan!' },
      ]);
      g.removeNpc(kc);
      p.setCowl(true);
      g.flags.flashDodged = 0;
      const prevHurt = p.hurt.bind(p);
      p.hurt = (d, f, kb, o = {}) => { if (d === 0 && (p.state === 'dodge' || p.state === 'airdash')) g.flags.flashDodged++; return prevHurt(d, f, kb, o); };
      g.bossEvent = (b, ev) => bg(async () => {
        if (ev === 'kacchanCry') {
          await g.say([
            { who: 'Bakugo', cam: b, text: 'Eu sempre estive à frente! Por que o All Might escolheu VOCÊ?! Você, que nunca teve nada!' },
            { who: 'Bakugo', cam: b, text: 'Por que eu sou tão fraco que deixei ele terminar daquele jeito?!' },
            { who: 'Izuku', cam: p, text: '(Ele estava chorando... esse tempo todo, sozinho com isso.)' },
          ]);
        }
      });
      const boss = await g.boss(BOSS.bakugo2, g.env.anchors.boss);
      await g.cinema(true);
      shot(g, 6, 2, 0, 0, 2, -4);
      await g.say([{ who: 'Bakugo', cam: boss, text: 'NÃO PARA DE OLHAR PRA MIM DE CIMA, DEKU!' }]);
      await g.qte('mash', { title: 'SMASH vs. EXPLOSÃO!', label: 'J/K', key: 'attack', alt: 'smash', gain: 0.04, drain: 0.24, time: 7, start: 0.4,
        onPress: () => g.fx.burst(p.center.clone().lerp(boss.center, 0.5), [0x7dff9a, 0xffa020], 4, 9, { add: true, size: 0.12, grav: 0 }) });
      bigFinish(g, p.center.clone().lerp(boss.center, 0.5), 'BOOOM!!', 0xffa020);
      g.ui.bossHide();
      boss.def = { ...boss.def, passive: true };
      p.cinePose = 'down';
      const am = g.npc(() => M.allMight('skinny'), new V(6, 0, 4), { face: p.pos });
      await g.wait(1);
      shot(g, 4, 2.4, 6, 2, 1.6, 0);
      await g.say([
        { who: '', text: 'Kacchan vence. Ofegante, ele aperta Deku contra o chão. Então uma voz cansada atravessa a noite.' },
        { who: 'All Might (magro)', cam: am, text: 'Chega, vocês dois. ...Jovem Bakugo. A culpa não é sua. Era a minha hora.' },
        { who: 'All Might (magro)', cam: am, text: 'Eu escolhi o jovem Midoriya porque ele correu sem poder nenhum para te salvar. Mas vocês dois são o futuro.' },
        { who: 'Bakugo', cam: boss, text: '...Então eu vou ficar mais forte que ele. E aí eu vou ser o melhor herói. Esse é o meu jeito de resolver isso.' },
        { who: 'Izuku', cam: p, text: 'E eu vou te alcançar. Rivais... e, um dia, amigos. Kacchan.' },
        { who: 'Aizawa', text: '(de manhã) Os dois brigaram de madrugada. Bakugo: 4 dias de suspensão. Midoriya: 3. Limpando os dormitórios.' },
      ]);
    },
  },
];
