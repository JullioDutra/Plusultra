// Capítulo 2 — U.S.J., Festival Esportivo e Hosu (Ep. 9–33)
import { V, M, C, K, BOSS, NOTES, bg, tween, ease, shot, bigFinish, mis } from './common.js';

export default [
  // ============================================================ 4
  {
    id: 'usj', ep: 'CAPÍTULO 4', name: 'Ataque à U.S.J.', arc: 'Arco U.S.J. — Ep. 9–13', color: '#5ac8e8',
    sub: 'A Liga dos Vilões invade o Centro de Simulação. Zona de Naufrágio... e então o Símbolo da Paz.', par: 270,
    missions: [mis('Use no máximo 4 Delaware Smash (proteja seus dedos)', s => (s.flags.flicks || 0) <= 4), mis('Como All Might, chegue ao rank de estilo A', s => 'AS'.includes(s.bestStyle)), mis('Encontre a página do caderno', s => s.notebooks >= 1)],
    async script(g) {
      // abertura: a névoa do Kurogiri
      let p = g.setup('usjPlaza', { kit: K.usj, music: 'tension', yaw: 0 });
      g.ui.portrait('DK', 'Deku');
      const kuro = g.npc('kurogiri', new V(0, 0, -6), { face: p.pos });
      const aiz = g.npc('aizawa', new V(-3, 0, 6), { face: kuro.pos });
      await g.say([
        { who: '', text: 'A U.S.J.: "Unforeseen Simulation Joint". Treino de resgate da Classe 1-A. Até que uma névoa negra se abre na praça.' },
        { who: 'Aizawa', cam: aiz, text: 'Fiquem juntos e não se mexam! ...Aquilo são vilões. Trinta, quarenta... Isso não é um exercício.' },
        { who: 'Kurogiri', cam: kuro, text: 'Somos a Liga dos Vilões. Viemos dar o último suspiro ao Símbolo da Paz. Mas, enquanto ele não chega... espalhem-se.' },
        { who: 'Izuku', cam: p, text: 'A névoa está nos engolindo! Tsu! Mineta!' },
      ]);
      await g.ui.fade(true);
      p = g.setup('usjShip', { kit: K.usj, music: 'tension', yaw: 0 });
      g.keepTime = true;
      const tsu = g.npc('tsuyu', g.env.anchors.tsuyu, { face: p.pos });
      const mineta = g.npc('mineta', g.env.anchors.mineta, { face: p.pos });
      g.notebook(new V(5.5, 0, -13), NOTES.usj);
      await g.ui.fade(false);
      await g.say([
        { who: 'Tsuyu', cam: tsu, text: 'Kero. Fomos jogados no navio da Zona de Naufrágio. Os vilões cercaram a água.' },
        { who: 'Izuku', cam: p, text: 'Eles mandaram a Tsu pra água sem saber que ela é anfíbia. Não conhecem nossos poderes! Isso é uma vantagem!' },
        { who: 'Mineta', cam: mineta, text: 'A gente vai morrer! Eu nem tive minha primeira namorada!' },
        { who: 'Izuku', cam: p, text: 'O DELAWARE SMASH (E) com o dedo afasta eles. Mas cada disparo quebra um dedo. O Smash total quebra o braço. Pensa, Izuku!' },
      ]);
      g.flags.flicks = 0;
      const prevSpecial = p.doSpecial.bind(p);
      p.doSpecial = () => { if (p.cd.special <= 0) g.flags.flicks++; prevSpecial(); };
      const edge = () => { const s = Math.random() < 0.5 ? -1 : 1; return new V(s * 6.2, 0, (Math.random() - 0.5) * 24); };
      await g.wave([
        [{ type: 'water', pos: edge() }, { type: 'water', pos: edge() }, { type: 'water', pos: edge() }],
        [{ type: 'water', pos: edge() }, { type: 'gunner', pos: edge() }, { type: 'thug', pos: edge() }, { type: 'water', pos: edge() }],
        [{ type: 'brute', pos: new V(0, 0, -12), over: { model: () => M.waterThug(), scale: 1.4 } }, { type: 'water', pos: edge() }, { type: 'bomber', pos: edge() }],
      ], { objective: 'Defenda o convés dos vilões aquáticos!' });
      await g.say([
        { who: 'Izuku', cam: p, text: 'Ainda tem dezenas lá embaixo! Tsu, quando eu acertar a água, pegue o Mineta e pule!' },
        { who: 'Mineta', cam: mineta, text: 'Então eu ajudo! Minhas bolinhas grudentas... vou jogar tudo na água!' },
        { who: 'Tsuyu', cam: tsu, text: 'Kero. Pode deixar.' },
      ]);
      g.shot(new V(0, 9, 18), new V(0, 0, -6));
      const ok = await g.qte('timing', { title: 'DELAWARE SMASH NA ÁGUA!', label: 'K', speed: 0.9, tries: 3 });
      bigFinish(g, new V(0, 0.5, -4), 'DELAWARE SMASH!', 0xa8e0ff);
      g.audio.sfx('water');
      for (let i = 0; i < 6; i++) g.fx.shockwave(new V(0, 0.2, -4), 0xa8e0ff, 4 + i * 3, 0.8 + i * 0.1);
      p.hp = Math.max(20, p.hp - (ok ? 6 : 14)); g.ui.hp(p.hp / p.kit.maxHp, true);
      await g.say([
        { who: 'Tsuyu', cam: tsu, text: 'O redemoinho juntou todos eles no centro e as bolinhas do Mineta prenderam. Midoriya-chan, você é incrível. Mas seu dedo está roxo, kero.' },
        { who: 'Izuku', cam: p, text: 'Não importa! O Aizawa-sensei está lutando sozinho na Praça Central!' },
      ]);
      await g.ui.fade(true);
      const hpLeft = p.hp;
      p = g.setup('usjPlaza', { kit: K.allMight, music: 'boss', yaw: 0, camDist: 11, camH: 5 });
      g.ui.portrait('AM', 'All Might');
      const shiga = g.npc('shigaraki', g.env.anchors.shigaraki, { face: p.pos });
      const dk = g.npc('deku', new V(9, 0, 21), { face: new V(0, 0, -10), args: ['hero'] });
      const aiz2 = g.npc('aizawa', new V(-7, 0, -3), { pose: 'down' });
      shot(g, 0, 3.5, 20, 0, 3, 10, true);
      await g.ui.fade(false);
      await g.say([
        { who: 'Shigaraki', cam: shiga, text: 'Game over para o Eraserhead. E o chefão ainda nem apareceu. Que tédio.' },
        { who: 'Aizawa', cam: aiz2, shot: { dist: 2.5, h: 0.6 }, text: '(Meus braços... Alunos... fujam...)' },
        { who: '', text: 'BLAM! As portas da U.S.J. voam pelos ares.' },
        { who: 'All Might', cam: p, shot: { dist: 4, h: 0.6 }, text: 'Está tudo bem agora. Por quê?' },
        { who: 'All Might', cam: p, shot: { dist: 4, h: 0.6 }, text: 'PORQUE EU ESTOU AQUI!' },
        { who: 'Shigaraki', cam: shiga, text: 'Até que enfim, o continue... Nomu. Mate o Símbolo da Paz.' },
        { who: 'All Might', cam: p, text: '(Absorção de Choque: golpes comuns quase não entram. Preciso de SMASHES — segure K com o Plus Ultra cheio!)' },
      ]);
      g.removeNpc(aiz2);
      g.audio.playTrack('boss');
      g.bossEvent = async (b, ev) => {
        if (ev === 'nomuHalf') { g.ui.bark('Shigaraki', 'Ele aguenta 100% dos seus golpes, All Might!'); p.addGauge(1.5); g.ui.toast('PLUS ULTRA recarregado!', 'gold'); }
      };
      const nomu = await g.boss(BOSS.nomu, new V(0, 0, -6));
      await g.cinema(true);
      shot(g, 7, 3, 4, 0, 3, -3);
      await g.say([
        { who: 'All Might', cam: p, text: 'Se ele absorve 100%... então eu vou com MAIS de 100%!' },
        { who: 'All Might', cam: p, text: 'Um herói sempre vai além dos limites! Conhece estas palavras, vilão?!' },
      ]);
      await g.qte('mash', { title: 'PLUS ULTRA!!! (soque sem parar)', label: 'J/K', key: 'attack', alt: 'smash', gain: 0.035, drain: 0.12, time: 8, start: 0.2,
        onPress: () => { g.fx.hitSpark(nomu.center.clone().add(new V((Math.random() - 0.5) * 2, Math.random() * 2, 1)), true, 0xffe060); p.cinePose = Math.random() < 0.5 ? 'smash' : 'jab'; nomu.pos.z -= 0.05; } });
      bigFinish(g, nomu.center.clone(), 'PLUS ULTRA SMASH!', 0xffe060);
      const nf = nomu.pos.clone();
      shot(g, 10, 4, 6, 0, 30, -40);
      nomu.def.passive = true;
      await tween(g, 1.4, k => { nomu.pos.set(nf.x, nf.y + k * 70, nf.z - k * 50); nomu.vel.set(0, 0, 0); });
      g.fx.burst(new V(0, 60, -50), [0xffffff, 0xa8d0f0], 40, 20, { size: 0.5, life: 1.5 });
      nomu.remove();
      g.ui.bossHide();
      await g.say([
        { who: 'All Might', cam: p, text: '(Hgh... passei do limite de hoje. Mas não posso deixar que percebam.)' },
        { who: 'Shigaraki', cam: shiga, text: 'Ele está mentindo... está fraco. Vamos acabar com ele agora!' },
        { who: 'Izuku', cam: dk, text: hpLeft < 40 ? 'Não toquem... NO ALL MIGHT!' : 'Afastem-se do All Might!', do: () => { dk.pose = 'smash'; } },
        { who: '', text: 'Um disparo corta o ar: a mão de Shigaraki é atravessada. Os professores da U.A. chegaram — chamados por Iida, que correu até a escola.' },
        { who: 'Shigaraki', cam: shiga, text: 'Game over... Da próxima vez, Símbolo da Paz. Da próxima vez a gente te mata.' },
      ]);
    },
  },
  // ============================================================ 5
  {
    id: 'corrida', ep: 'CAPÍTULO 5', name: 'Corrida de Obstáculos', arc: 'Festival Esportivo — Ep. 16', color: '#ffc93c',
    sub: '42 turmas, uma pista: robôs do exame, "The Fall" — cordas sobre o abismo — e um campo minado. Sem poder, só cabeça.', par: 150,
    missions: [mis('Chegue em 1º lugar', s => s.flags.place === 1), mis('Use as minas a seu favor 3 vezes', s => (s.mines || 0) >= 3), mis('Não caia no abismo nenhuma vez', s => !s.flags.fell)],
    async script(g) {
      const p = g.setup('race', { kit: K.race, music: 'hero', yaw: 0 });
      g.ui.portrait('DK', 'Deku');
      g.notebook(new V(-6, 0, -80), NOTES.corrida);
      const todo = g.npc('todoroki', new V(-3, 0, 6), { face: new V(0, 0, -10) });
      const kc = g.npc('bakugo', new V(3, 0, 7), { face: new V(0, 0, -10), args: ['uniform'] });
      todo.noPhysics = kc.noPhysics = true;
      await g.say([
        { who: 'Present Mic', text: 'É O FESTIVAL ESPORTIVO DA U.A.! Primeira prova: CORRIDA DE OBSTÁCULOS! Vale tudo dentro da pista!' },
        { who: 'Todoroki', cam: todo, text: 'Midoriya. Objetivamente, eu sou mais forte. Mas o All Might está de olho em você, não está? Vou te vencer.' },
        { who: 'Izuku', cam: p, text: 'Todo mundo está mirando no topo. Eu também vou com tudo, Todoroki. Sem poder nenhum, se precisar!' },
        { who: 'Midnight', color: C.midnight, text: 'Posições! ...JÁ!' },
      ]);
      // rivais correm pela pista em ritmo fixo
      const pathX = z => z > -66 ? 0 : z > -122 ? Math.sin(z * 0.2) * 3 : 0;
      let rivalsOn = true, finished = [];
      const runRival = (n, speed, name, delay = 0) => bg(async () => {
        await g.wait(delay);
        while (rivalsOn && n.pos.z > -188) {
          n.pos.z -= speed * (n.pos.z < -124 ? 0.55 : 1) * g._dt; n.pos.x += (pathX(n.pos.z) + (name === 'Bakugo' ? 2 : -2) - n.pos.x) * Math.min(1, g._dt * 3);
          n.pos.y = 0; n.pose = 'dash';
          if (name === 'Bakugo' && n.pos.z < -120 && Math.random() < 0.05) { g.fx.burst(n.center.clone(), [0xffa020, 0xffe060], 6, 5, { size: 0.12, add: true }); n.pos.y = 1.5; }
          if (name === 'Todoroki' && Math.random() < 0.04) g.spikes(n.pos.clone().add(new V(0, 0, 3)), 0.8, 0xb8e8ff, true);
          await g.wait(0);
        }
        if (rivalsOn) { finished.push(name); n.pose = 'calm'; }
      });
      runRival(todo, 4.5, 'Todoroki', 1.5); runRival(kc, 4.3, 'Bakugo', 1.8);
      g.ui.objective('Seção 1: os robôs do exame! (não precisa destruir todos)');
      bg(async () => { for (let i = 0; i < 8 && p.pos.z > -55; i++) { g.spawn(i % 3 === 2 ? 'robot2' : 'robot1', new V((Math.random() - 0.5) * 22, 0, p.pos.z - 14 - Math.random() * 8)); await g.wait(2.2); } });
      bg(async () => { // placar ao vivo
        while (!g.flags.done) {
          const ahead = [todo, kc].filter(n => n.pos.z < p.pos.z).length + finished.filter(x => !['Todoroki', 'Bakugo'].includes(x)).length;
          g.ui.score(`${ahead + 1}º LUGAR`);
          await g.wait(0.25);
        }
      });
      await g.reach(g.env.anchors.fall, 3, 'Seção 2: THE FALL — atravesse pelas cordas');
      g.setCheckpoint(new V(0, 0, -62));
      bg(async () => { while (!g.flags.done) { if (p.pos.y < -5) g.flags.fell = true; await g.wait(0.1); } });
      g.ui.toast('Pule entre os pilares! Cair te traz de volta', 'gold');
      await g.reach(new V(0, 0, -114), 2.6, 'Atravesse The Fall');
      g.setCheckpoint(new V(0, 0, -114));
      await g.reach(new V(0, 0, -124), 3, 'Seção 3: CAMPO MINADO');
      g.setCheckpoint(new V(0, 0, -124));
      for (let i = 0; i < 70; i++) g.mine(new V((Math.random() - 0.5) * 26, 0, -128 - Math.random() * 46));
      await g.cinema(true);
      shot(g, 4, 3, -120, 0, 0, -140);
      await g.say([
        { who: 'Present Mic', text: 'O campo minado! As minas não matam, mas ARREMESSAM longe! O Todoroki está indo devagar pra não pisar nelas!' },
        { who: 'Izuku', cam: p, text: '(Arremessam longe... pra FRENTE, se eu estiver de frente. Se não dá pra ganhar na velocidade... uso a explosão!)' },
      ]);
      await g.cinema(false); g.freeCam();
      g.ui.toast('Pise nas minas olhando para a frente: elas te lançam adiante!', 'gold');
      await g.reach(g.env.anchors.finish, 4, 'CRUZE A LINHA DE CHEGADA!');
      const ahead = [todo, kc].filter(n => n.pos.z < p.pos.z - 1).length;
      g.flags.place = ahead + 1; g.flags.done = true;
      rivalsOn = false;
      g.ui.score('');
      await g.cinema(true);
      shot(g, 0, 4, -178, 0, 2, -190);
      await g.say(ahead === 0 ? [
        { who: 'Present Mic', text: 'QUEM ESPERAVA POR ESSA?! O PRIMEIRO A CHEGAR É... IZUKU MIDORIYA!' },
        { who: 'Izuku', cam: p, text: '(Eu... cheguei em primeiro. Sem usar o One For All.)' },
        { who: 'Bakugo', color: C.kacchan, text: 'DEKUUU! Você usou as minas pra passar na minha frente?!' },
      ] : [
        { who: 'Present Mic', text: `E Izuku Midoriya cruza a linha em ${ahead + 1}º lugar! Que corrida!` },
        { who: 'Izuku', cam: p, text: '(Ainda não deu... Mas isso foi só a primeira prova.)' },
      ]);
    },
  },
  // ============================================================ 6
  {
    id: 'festival', ep: 'CAPÍTULO 6', name: 'Deku vs. Todoroki', arc: 'Festival Esportivo — Ep. 22–23', color: '#ff5a6a',
    sub: 'Ringue de concreto, sair dele é derrota. Todoroki só usa o gelo. Deku vai fazê-lo lembrar que o fogo também é dele.', par: 200,
    missions: [mis('Faça o Todoroki usar o fogo', s => !!s.flags.fire), mis('Use no máximo 6 Delaware Smash', s => (s.flags.flicks || 0) <= 6), mis('Encontre a página do caderno', s => s.notebooks >= 1)],
    async script(g) {
      const p = g.setup('stadium', { kit: K.festival, music: 'boss', yaw: 0, camDist: 9.5, camH: 4.4 });
      g.ui.portrait('DK', 'Deku');
      g.notebook(new V(9, 0.25, 9), NOTES.festival);
      const todo = g.npc('todoroki', g.env.anchors.boss, { face: p.pos });
      await g.say([
        { who: 'Present Mic', text: 'Semifinal da primeira rodada! De um lado, o garoto que venceu a corrida... do outro, o filho do herói nº 2!' },
        { who: 'Todoroki', cam: todo, text: 'Meu pai, Endeavor, casou com minha mãe por causa da Individualidade dela. Eu sou o "projeto" para superar o All Might.' },
        { who: 'Todoroki', cam: todo, text: 'Minha mãe não suportava olhar pro meu lado esquerdo. Jogou água fervendo no meu rosto. Por isso eu nunca vou usar o fogo dele.' },
        { who: 'Izuku', cam: p, text: '...Eu também recebi muita coisa de outras pessoas. É por isso que eu não posso perder!' },
        { who: 'Midnight', color: C.midnight, text: 'Quem sair do ringue perde! COMECEM!' },
      ]);
      g.removeNpc(todo);
      g.ui.toast('NÃO SAIA DO RINGUE. Esquive para os lados das geleiras!', 'red');
      g.flags.flicks = 0;
      const prevSpecial = p.doSpecial.bind(p);
      p.doSpecial = () => { if (p.cd.special <= 0) g.flags.flicks++; prevSpecial(); };
      g.bossEvent = (b, ev) => bg(async () => {
        if (ev === 'fire') {
          await g.say([
            { who: 'Izuku', cam: p, text: 'Todo mundo está dando tudo de si pra vencer! Você vai lutar com metade do poder?!' },
            { who: 'Izuku', cam: p, text: 'O que você quer... não é provar algo pro seu pai. ESSE PODER É SEU, NÃO DELE!' },
            { who: 'Todoroki', cam: b, text: '(...É meu. O poder é meu.)', do: () => { g.flags.fire = true; } },
            { who: 'Endeavor', color: '#ff7a2a', text: 'SHOTO! Finalmente aceitou! Agora sim você vai superar o All Might!' },
          ]);
          g.ui.bossBar('SHOTO TODOROKI', 'Gelo e fogo');
          g.fx.burst(b.center.clone(), [0xff7a2a, 0xffd23a], 30, 10, { size: 0.3, add: true });
        }
      });
      const boss = await g.boss(BOSS.todoroki, g.env.anchors.boss);
      await g.cinema(true);
      shot(g, 8, 3, 2, 0, 2, -4);
      await g.say([
        { who: 'Todoroki', cam: boss, text: 'Obrigado, Midoriya. ...Saia da frente.' },
        { who: 'Izuku', cam: p, text: 'Vem, Todoroki! Com tudo!' },
      ]);
      await g.qte('mash', { title: 'SMASH vs. FOGO E GELO!', label: 'J/K', key: 'attack', alt: 'smash', gain: 0.045, drain: 0.2, time: 7, start: 0.35,
        onPress: () => g.fx.burst(p.center.clone().lerp(boss.center, 0.5), [0x7dff9a, 0xff7a2a, 0xb8e8ff], 4, 8, { add: true, size: 0.12, grav: 0 }) });
      bigFinish(g, p.center.clone().lerp(boss.center, 0.5), 'SMASH!!', 0xffa060);
      g.fx.setWeather('ash', g.scene);
      g.ui.bossHide();
      boss.def = { ...boss.def, passive: true };
      await g.wait(1.2);
      await g.say([
        { who: '', text: 'O vapor da explosão cobre o estádio. Quando ele se dissipa, Midoriya está caído na parede, fora do ringue.' },
        { who: 'Midnight', color: C.midnight, text: 'Midoriya está fora do ringue! Todoroki avança para a próxima fase!' },
        { who: 'Todoroki', cam: boss, text: '(Eu perdi mesmo tendo vencido. Ele me fez lembrar... daquele dia na TV, quando eu queria ser herói.)' },
        { who: 'Izuku', text: '(Perdi. Mas valeu a pena. Os dedos quebrados... a mão que eu estendi... chegou até ele.)' },
      ]);
    },
  },
  // ============================================================ 7
  {
    id: 'hosu', ep: 'CAPÍTULO 7', name: 'Hosu — O Assassino de Heróis', arc: 'Arco Assassino de Heróis — Ep. 26–33', color: '#d83a3a',
    sub: 'Durante o estágio com Gran Torino, Hosu queima. Civis presos no fogo, Nomus no céu e Iida no beco com Stain.', par: 260,
    missions: [mis('Resgate os 4 civis antes do fogo', s => s.rescued >= 4), mis('Não seja paralisado pelo Stain', s => !s.paralyzed), mis('Encontre a página do caderno', s => s.notebooks >= 1)],
    async script(g) {
      let p = g.setup('hosuStreet', { kit: K.hosu, music: 'night', weather: 'ember', yaw: 0 });
      g.ui.portrait('DK', 'Deku');
      g.notebook(new V(-9, 0, -42), NOTES.hosu);
      await g.say([
        { who: 'Izuku', cam: p, text: 'Gran Torino me ensinou: não é para "usar" o One For All como algo especial. É deixar ele correr pelo corpo inteiro.' },
        { who: 'Izuku', cam: p, text: 'Como um ovo no micro-ondas... sem explodir. FULL COWL — 5%! (Q)' },
        { who: 'Civil', color: C.nar, text: 'Socorro! Tem gente presa perto do fogo!' },
      ]);
      g.ui.toast('Q liga o FULL COWL: mais velocidade e pulo duplo', 'green');
      const civ = [g.civilian(new V(-7, 0, -6), { time: 55 }), g.civilian(new V(8, 0, -16), { time: 65 }), g.civilian(new V(-8, 0, -26), { time: 75 }), g.civilian(new V(6, 0, -34), { time: 85 })];
      const waveP = g.wave([
        [{ type: 'nomuFly' }, { type: 'thug' }, { type: 'gunner' }],
        [{ type: 'nomuFly' }, { type: 'nomuLow' }, { type: 'thug' }],
      ], { objective: 'Proteja os civis: resgate todos e derrote os Nomus' });
      await Promise.all([waveP, g.rescueAll(civ)]);
      await g.say([{ who: 'Izuku', cam: p, text: 'O Iida sumiu do grupo do Manual... Ele foi atrás do Stain! O beco!' }]);
      await g.reach(new V(0, 0, -40), 2.5, 'Encontre o Iida no beco!');
      await g.ui.fade(true);
      g.keepTime = true;
      p = g.setup('hosuAlley', { kit: K.hosu, music: 'boss', yaw: 0, camDist: 7.5, camH: 3.4 });
      p.setCowl(true);
      const iida = g.npc('iida', g.env.anchors.iida, { pose: 'down' });
      shot(g, 2, 2.2, -10, 0, 1.4, -18, true);
      await g.ui.fade(false);
      const stain = g.npc('stain', new V(0, 0, -19), { face: p.pos });
      await g.say([
        { who: 'Stain', cam: stain, text: 'Um herói que só pensa em vingança é um herói falso. Por isso eu o expurgo.' },
        { who: 'Iida', cam: iida, shot: { dist: 2.5, h: 1 }, text: 'Midoriya?! Vá embora! Isso não tem nada a ver com você!' },
        { who: 'Izuku', cam: p, text: 'Se meter onde não é chamado... é a essência de ser herói!' },
        { who: 'Stain', cam: stain, text: '...Esses olhos. Mostre-me se você é digno.' },
        { who: 'Izuku', text: '(Se ele lamber meu sangue, eu paraliso. Esquive (L) dos cortes e ataque pelo alto!)' },
      ]);
      g.removeNpc(stain);
      let todo = null;
      g.bossEvent = (b, ev) => bg(async () => {
        if (ev === 'todoroki') {
          await g.cinema(true);
          todo = g.npc('todoroki', new V(-1.5, 0, 2), { face: b.pos });
          await g.say([
            { who: 'Todoroki', cam: todo, text: 'Midoriya. Você mandou sua localização sem dizer nada. Achei que era um pedido de ajuda.' },
            { who: 'Todoroki', cam: todo, text: 'Gelo e fogo de cobertura. Não deixe ele chegar perto de você.' },
          ]);
          await g.cinema(false); g.freeCam();
          bg(async () => {
            while (b.alive && !b.invuln) {
              await g.wait(5.5);
              if (!b.alive || b.invuln || !g.control) continue;
              const at = b.pos.clone();
              g.fx.telegraph(at, 1.8, 0.7, 0x7ad0ff);
              await g.wait(0.7);
              g.spikes(at, 1.6, 0xb8e8ff); g.audio.sfx('ice');
              if (b.pos.distanceTo(at) < 2.2) b.damage(25, new V(0, 0, -1), 6, { smash: true, stun: 0.8 });
              todo.pose = 'jab';
              await g.wait(0.4); todo.pose = 'calm';
            }
          });
        }
      });
      const boss = await g.boss(BOSS.stain, g.env.anchors.boss);
      await g.cinema(true);
      iida.pose = 'calm'; iida.pos.set(2, 0, -11);
      if (!todo) todo = g.npc('todoroki', new V(-1.5, 0, -8), { face: boss.pos });
      shot(g, 4, 2.2, -8, 0, 1.8, -15);
      await g.say([
        { who: 'Iida', cam: iida, text: 'A paralisia passou! Desculpem. Desta vez eu luto como herói, não como vingador!' },
        { who: 'Iida', cam: iida, text: 'RECIPRO BURST!' },
      ]);
      await g.qte('timing', { title: 'ATAQUE COMBINADO!', label: 'K', speed: 1.1, tries: 3 });
      bigFinish(g, boss.center.clone(), 'SMASH + RECIPRO!');
      g.spikes(boss.pos.clone(), 2, 0xb8e8ff); g.audio.sfx('fire');
      boss.go('down'); boss.def = { ...boss.def, passive: true }; boss.invuln = true;
      g.ui.bossHide();
      await g.wait(1);
      boss.go('chase');
      shot(g, 0, 1.6, -11, 0, 1.6, -16);
      await g.say([
        { who: '', text: 'Mesmo inconsciente, Stain se levanta. Seus olhos fazem até os heróis profissionais recuarem.' },
        { who: 'Stain', cam: boss, text: 'Falso... Retome o título de herói! Só há UM que pode me matar...' },
        { who: 'Stain', cam: boss, text: 'ALL MIGHT! Só ele merece ser chamado de herói!' },
        { who: 'Izuku', cam: p, text: '(Ele desmaiou... de pé. A convicção dele era tão forte quanto a de um herói. Isso é o que mais assusta.)' },
      ]);
    },
  },
];
