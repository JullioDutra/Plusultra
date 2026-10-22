// Capítulo 1 — Entrando na U.A. (Ep. 1–7)
import { V, M, C, K, BOSS, NOTES, bg, tween, ease, shot, dropRock, bigFinish, mis } from './common.js';

export default [
  // ============================================================ 0
  {
    id: 'prologo', ep: 'PRÓLOGO', name: 'Todos Nascem Iguais?', arc: 'Entrando na U.A. — Ep. 1', color: '#9aa3b8',
    sub: 'Tatooin. Um garoto sem Individualidade vê o amigo de infância nas garras do Vilão de Lama.', par: 130,
    missions: [mis('Chegue ao vilão recebendo menos de 20 de dano', s => s.taken < 20), mis('Encontre a página do caderno', s => s.notebooks >= 1), mis('Termine em menos de 2 minutos', s => s.time < 120)],
    async script(g) {
      const p = g.setup('tatooin', { kit: K.quirkless, music: 'calm', yaw: 0 });
      g.ui.portrait('IZ', 'Izuku');
      g.notebook(new V(5.5, 0, -30), NOTES.prologo);
      await g.cinema(true);
      shot(g, 0, 2.2, 9, 0, 1.6, 0, true);
      await g.say([
        { who: '', text: 'Doze anos atrás. Um menino de quatro anos assiste pela milésima vez ao vídeo de estreia do All Might.' },
        { who: 'Izuku', text: '"Está tudo bem agora. Por quê? Porque eu estou aqui!" ...Mãe, eu também vou ser um herói assim, né?' },
        { who: '', text: 'O médico foi direto: uma articulação a mais no dedinho do pé. Sem Individualidade. Nunca vai ter.' },
        { who: 'Izuku', cam: p, text: 'Hoje, 80% das pessoas têm um superpoder. Eu não. Mesmo assim... eu ainda enchi treze cadernos analisando heróis.' },
        { who: 'Izuku', cam: p, text: 'O Kacchan jogou o último pela janela da escola hoje. "Vai pular do terraço e torcer pra renascer com poder." Ele disse isso.' },
      ]);
      g.audio.sfx('explode'); g.shake(0.6);
      g.audio.playTrack('tension');
      shot(g, 0, 6, -40, 0, 2, -62);
      await g.say([
        { who: 'Transeunte', color: C.nar, text: 'Um vilão de lama na rua comercial! Ele pegou um estudante!' },
        { who: 'Izuku', cam: p, text: 'Aquelas explosões... É o Kacchan?! E o All Might... ele estava comigo e o vilão escapou da garrafa por minha culpa!' },
      ]);
      await g.cinema(false); g.freeCam();
      g.ui.toast('Sem poder: desvie (L) dos destroços e do fogo', 'gold');
      const ctl = { stop: false };
      bg(async () => {
        while (!ctl.stop) {
          await g.wait(0.75);
          if (!g.control) continue;
          const q = g.player.pos;
          bg(() => dropRock(g, new V(Math.max(-6, Math.min(6, q.x + (Math.random() - 0.5) * 6)), 0, q.z - 2 - Math.random() * 7), 1.3, 10));
        }
      });
      await g.reach(new V(0, 0, -49), 3, 'Atravesse a rua em chamas');
      ctl.stop = true;
      await g.cinema(true);
      shot(g, 5, 3, -46, 0, 2.5, -62);
      g.sludgeKacchan = g.npc('bakugo', new V(0, 1.8, -61), { pose: 'hurt', face: p.pos });
      g.sludgeKacchan.floating = true;
      await g.say([
        { who: 'Herói', color: C.nar, text: 'Não dá pra chegar perto! A Individualidade do refém é explosiva. Precisamos esperar alguém com o poder certo!' },
        { who: 'Izuku', cam: p, text: 'Os profissionais estão parados... e os olhos do Kacchan... estão pedindo socorro.' },
        { who: 'Izuku', cam: p, text: '(Quando eu percebi, minhas pernas já estavam correndo.)' },
      ]);
      await g.cinema(false); g.freeCam();
      await g.reach(new V(0, 0, -58), 2.2, 'CORRA ATÉ O VILÃO!');
      await g.cinema(true);
      shot(g, 4, 3, -54, 0, 2.5, -61);
      await g.say([
        { who: 'Vilão de Lama', color: C.villain, cam: p, text: 'Um moleque sem poder nenhum? Saia da frente!' },
        { who: 'Izuku', text: 'Seção 25 do caderno: os olhos! — mochila no olho dele! Kacchan, me dá a mão!' },
      ]);
      const ok = await g.qte('mash', { title: 'PUXE O KACCHAN!', label: 'J', gain: 0.055, drain: 0.2, time: 6, start: 0.2, onPress: () => g.fx.burst(new V(0, 2, -60), 0x3e8a2a, 4, 5, { size: 0.2 }) });
      await g.say([
        { who: 'Bakugo', cam: g.sludgeKacchan, text: ok ? 'Deku?! Por que você...!' : 'Seu idiota! O que você pensa que tá fazendo?!' },
        { who: 'Izuku', cam: p, text: 'Eu não sei! Você parecia... estar pedindo ajuda!' },
      ]);
      const am = g.npc('allMight', new V(0, 0, -50), { face: new V(0, 0, -62) });
      g.audio.playTrack('hero');
      shot(g, -4, 2.6, -46, 0, 3, -52);
      await g.say([
        { who: 'All Might', cam: am, text: 'Que vergonha... Eu disse a esse garoto que ele não podia ser herói — e fiquei parado enquanto ele corria!' },
        { who: 'All Might', cam: am, text: 'Um profissional sempre arrisca a própria vida!' },
      ]);
      am.pose = 'smash';
      shot(g, 6, 2, -52, 0, 2.5, -60);
      bigFinish(g, new V(0, 2.5, -56), 'DETROIT SMASH!', 0xffe060);
      for (let i = 1; i < 6; i++) g.fx.shockwave(new V(0, 2.5, -52 - i * 2), 0xffffff, 2 + i, 0.5 + i * 0.08, new V(0, 0, -1));
      g.fx.burst(new V(0, 3, -61), [0x3e8a2a, 0x5aa83a], 40, 18, { size: 0.35, life: 1 });
      if (g.env.sludgeObj) g.env.sludgeObj.visible = false;
      g.sludgeKacchan.floating = false;
      await g.wait(1.2);
      g.fx.setWeather('rain', g.scene);
      await g.say([
        { who: 'Transeunte', color: C.nar, text: 'Ele... mudou o clima com um soco! Está chovendo!' },
        { who: 'Izuku', cam: p, text: '(Esse é o herói número um.)' },
      ]);
      await g.ui.fade(true);
      am.pos.set(1.2, 0, -30); am.faceTo(new V(0, 0, -28)); am.pose = 'calm';
      p.pos.set(-0.6, 0, -28); p.faceTo(am.pos);
      g.fx.setWeather(null, g.scene);
      g.audio.playTrack('calm');
      await g.ui.fade(false);
      await g.say([
        { who: 'Bakugo', color: C.kacchan, text: '(mais cedo, na saída) Eu não pedi a sua ajuda, Deku! Não pense que me deve nada... nem que eu te devo!' },
        { who: 'All Might', cam: am, text: 'Garoto. A maioria dos heróis diz que "o corpo se move antes de pensar". Hoje o seu se moveu.' },
        { who: 'All Might', cam: am, text: 'Você foi o único ali, sem poder algum, que se jogou para salvar alguém.' },
        { who: 'All Might', cam: am, text: 'Jovem Midoriya... você pode se tornar um herói!' },
        { who: 'Izuku', cam: p, text: '(Mãe... aquela vez você me abraçou e pediu desculpas. Mas o que eu queria ouvir... era isso.)' },
      ]);
    },
  },
  // ============================================================ 1
  {
    id: 'dagobah', ep: 'CAPÍTULO 1', name: 'Praia Dagobah', arc: 'Entrando na U.A. — Ep. 2', color: '#ffb070',
    sub: 'Dez meses para transformar o corpo num receptáculo digno do One For All. Limpe a praia inteira!', par: 150,
    missions: [mis('Termine com mais de 50 segundos sobrando', s => s.flags.timeLeft > 50), mis('Faça um combo de 12 golpes', s => s.maxCombo >= 12), mis('Encontre a página do caderno', s => s.notebooks >= 1)],
    async script(g) {
      const p = g.setup('dagobah', { kit: K.training, music: 'calm', yaw: 0 });
      g.ui.portrait('IZ', 'Izuku');
      const am = g.npc(() => M.allMight('skinny'), g.env.anchors.allMight, { face: p.pos });
      am.lookAt = p;
      await g.say([
        { who: 'All Might (magro)', cam: am, text: 'Este é meu verdadeiro corpo. Há seis anos, um vilão me feriu. Só consigo ser herói três horas por dia.' },
        { who: 'All Might (magro)', cam: am, text: 'Minha Individualidade se chama One For All. Um poder passado de mão em mão, cristalizado por gerações.' },
        { who: 'All Might (magro)', cam: am, text: 'Mas o seu corpo explodiria. Antes de herdar, você vai limpar esta praia. Toda ela!' },
        { who: 'Izuku', cam: p, text: 'Limpar o litoral... era o que os heróis faziam antigamente, né? Servir a comunidade!' },
        { who: 'All Might (magro)', cam: am, text: 'Exato! Combos com J, golpe forte segurando K. Um toque rápido em K joga o lixo pra cima. A geladeira só cede com o soco carregado!' },
      ]);
      const piles = [];
      const spots = [[-18, 8], [-12, -6], [-6, 14], [-20, -14], [0, 2], [6, -12], [12, 10], [18, -4], [22, 14], [-2, -20], [14, -18], [-14, 18]];
      for (const [x, z] of spots) piles.push(g.spawn('trash', new V(x, 0, z)));
      g.spawn('fridge', new V(-8, 0, 4)); g.spawn('fridge', new V(10, 0, 2));
      g.spawn('bigTrash', new V(0, 0, -14), { hp: 160 });
      g.notebook(new V(24, 0, -20), NOTES.dagobah);
      let left = piles.length + 3;
      const total = left;
      g.killHook = () => { left--; g.ui.score(`LIXO ${total - left}/${total}`); };
      g.ui.score(`LIXO 0/${total}`);
      g.ui.objective('Limpe a praia antes do prazo!');
      g.timerStart(180, () => { g.fail('O tempo acabou! O exame não espera.'); });
      g.audio.playTrack('hero');
      bg(async () => {
        const tips = ['Cada músculo é um passo, jovem!', 'Esse lixo foi jogado pelas correntes. Ninguém limpava há anos!', 'Coma bem e durma! Faz parte do treino!', 'Tente o lançador e continue no ar!', 'Você está à frente do plano!'];
        let i = 0;
        while (left > 0) { await g.wait(13); if (left > 0) g.ui.bark('All Might', tips[i++ % tips.length]); }
      });
      await g.until(() => left <= 0);
      g.flags.timeLeft = g.countdown?.t ?? 0;
      g.countdown = null; g.ui.timer(null); g.ui.score('');
      await g.cinema(true);
      g.audio.playTrack('title');
      await g.ui.fade(true);
      p.pos.set(0, 0, -12); p.faceTo(new V(0, 0, -30)); p.cinePose = 'cheer';
      am.pos.set(-3, 0, -4); am.faceTo(p.pos);
      shot(g, 6, 2, -4, 0, 2.2, -14, true);
      await g.ui.fade(false);
      await g.say([
        { who: '', text: 'Dez meses depois. O sol nasce sobre uma praia limpa como nunca.' },
        { who: 'Izuku', cam: p, text: 'AAAAAAHHHHH!!! Consegui... eu consegui!' },
        { who: 'All Might (magro)', cam: am, text: '(Ele foi além até do plano que fiz para ele... Plus Ultra, jovem.)' },
        { who: 'All Might (magro)', cam: am, do: () => { am.pose = 'calm'; p.cinePose = 'calm'; }, text: 'Há uma diferença entre receber algo por sorte e merecer algo por esforço. Isto você mereceu.' },
        { who: 'All Might (magro)', cam: am, text: 'Agora... coma isto!' },
        { who: 'Izuku', cam: p, text: 'Hã?! Um... fio de cabelo?!' },
      ]);
    },
  },
  // ============================================================ 2
  {
    id: 'exame', ep: 'CAPÍTULO 2', name: 'O Exame de Admissão', arc: 'Entrando na U.A. — Ep. 3–4', color: '#4cc9f0',
    sub: 'Centro de Batalha B. Robôs valem pontos — mas a nota secreta é salvar os outros candidatos.', par: 150,
    missions: [mis('Resgate os 3 candidatos feridos', s => s.rescued >= 3), mis('Some 25 pontos de vilão', s => s.flags.villainPts >= 25), mis('Encontre a página do caderno', s => s.notebooks >= 1)],
    async script(g) {
      const p = g.setup('exam', { kit: K.exam, music: 'tension', yaw: 0 });
      g.ui.portrait('IZ', 'Izuku');
      const uraraka = g.npc('uraraka', new V(2.5, 0, 9), { face: p.pos });
      g.notebook(new V(-14, 0, -44), NOTES.exame);
      await g.say([
        { who: 'Present Mic', text: 'E aí, ouvintes! Bem-vindos ao exame prático! Robôs de 1, 2 e 3 pontos. Destruam o máximo que puderem!' },
        { who: 'Present Mic', text: 'E o robô de 0 pontos? É só um obstáculo. Fujam dele!' },
        { who: 'Uraraka', cam: uraraka, text: 'Ah, você é o garoto que eu impedi de cair na entrada! Boa sorte, viu? Vamos passar juntos!' },
        { who: 'Izuku', cam: p, text: '(O One For All ainda não responde... vou com o que treinei na praia. E candidatos feridos não podem ficar pra trás.)' },
        { who: 'Present Mic', text: 'O que estão esperando? Não existe contagem regressiva no mundo real! VAI, VAI, VAI!' },
      ]);
      uraraka.walkTo(new V(10, 0, -20), 7).then(() => g.removeNpc(uraraka));
      let pts = 0;
      g.killHook = (e) => { if (e.def.robot) { pts += e.def.score; g.flags.villainPts = pts; g.ui.score(`PONTOS DE VILÃO ${pts}`); } };
      g.ui.score('PONTOS DE VILÃO 0');
      g.ui.objective('Destrua robôs e salve candidatos feridos (fique perto deles)');
      const hurt = [g.civilian(new V(-10, 0, -12), { variant: 0, time: 50, label: 'Candidato' }), g.civilian(new V(12, 0, -26), { variant: 1, time: 60, label: 'Candidato' }), g.civilian(new V(-6, 0, -40), { variant: 3, time: 70, label: 'Candidato' })];
      let timeUp = false;
      g.timerStart(75, () => (timeUp = true));
      bg(async () => {
        while (!timeUp) {
          if (g.alive().length < 6) {
            const r = Math.random(), type = r < 0.55 ? 'robot1' : r < 0.85 ? 'robot2' : 'robot3';
            g.spawn(type, g.ringPos(10 + Math.random() * 4));
          }
          await g.wait(1.4);
        }
      });
      await g.until(() => timeUp);
      g.flags.villainPts = pts;
      const rescuedHere = hurt.filter(c => c.done).length;
      g.control = false;
      g.audio.sfx('explode'); g.shake(1.2);
      const zp = M.zeroPointer(); zp.position.set(0, 0, -64);
      g.scene.add(zp); g.env.objs.push(zp);
      g.killHook = null;
      for (const e of g.alive()) e.kill();
      for (const c of hurt) if (!c.done) { c.failed = true; g.scene.remove(c.marker); }
      g.audio.playTrack('boss');
      const ur = g.npc('uraraka', g.env.anchors.uraraka, { pose: 'down' });
      await g.cinema(true);
      shot(g, 10, 4, -24, 0, 14, -64);
      await g.say([
        { who: 'Izuku', text: 'O robô de zero pontos... é do tamanho de um prédio!' },
        { who: 'Uraraka', cam: ur, shot: { dist: 3, h: 1 }, text: 'Ai... minha perna está presa nos escombros...!' },
        { who: 'Izuku', cam: p, text: `(Todos fugindo. Eu tenho ${pts} pontos. Se eu correr agora... eu reprovo.)` },
        { who: 'Izuku', cam: p, text: '(...Mas e daí?)' },
      ]);
      await g.cinema(false); g.freeCam();
      let advance = true;
      bg(async () => {
        while (advance) {
          zp.position.z = Math.min(zp.position.z + g._dt * 2.2, -46);
          zp.userData.arms.forEach((a, i) => (a.rotation.x = Math.sin(g.time * 1.5 + i * 3) * 0.6));
          g.shake(0.08);
          await g.wait(0);
        }
      });
      bg(async () => { while (advance) { await g.wait(1.0); if (advance) bg(() => dropRock(g, g.player.pos.clone().add(new V((Math.random() - 0.5) * 5, 0, -3)), 1.4, 10)); } });
      await g.reach(g.env.anchors.uraraka.clone().add(new V(0, 0, 3)), 2.4, 'Corra até a Uraraka!');
      advance = false;
      await g.cinema(true);
      p.faceTo(zp.position);
      shot(g, -5, 1.2, -30, 0, 10, -50);
      await g.say([
        { who: 'All Might', text: '(Contraia o ânus e grite do fundo do coração!)' },
        { who: 'Izuku', cam: p, text: 'O One For All... toda a força nas pernas!' },
      ]);
      const ok1 = await g.qte('hold', { title: 'CONCENTRE O PODER NAS PERNAS!', label: 'K', speed: 1.1 });
      g.audio.sfx('smash'); g.fx.shockwave(p.pos.clone().setY(0.2), 0x9affb0, 5, 0.5); g.shake(0.6);
      p.cinePose = 'jump';
      const from = p.pos.clone(), to = new V(0, 15, -44);
      bg(async () => { for (let i = 0; i < 40; i++) { g.fx.glow(p.pos.clone(), 0x9affb0, { size: 0.7, life: 0.4, vel: new V(0, -3, 0) }); await g.wait(0.02); } });
      await tween(g, 1.0, k => { const e = ease(k); p.pos.lerpVectors(from, to, e); p.pos.y = from.y + (to.y - from.y) * Math.sin(e * Math.PI / 2); g.shot(p.pos.clone().add(new V(5, -1.5, 8)), p.pos.clone().add(new V(0, 0, -2))); });
      p.cinePose = 'charge';
      g.slowmo(5, 0.15);
      shot(g, 6, 15, -38, 0, 14, -46);
      const ok2 = await g.qte('timing', { title: 'SMASH!', label: 'K', speed: 0.8, tries: 3 });
      g.timeScale = 1; g.slowT = 0;
      p.cinePose = 'smash';
      bigFinish(g, new V(0, 15, -47), 'SMASH!!!');
      g.fx.burst(new V(0, 14, -48), [0xff8a2a, 0xffd23a, 0x4a5a6a], 60, 20, { size: 0.5, life: 1.4 });
      zp.userData.head.visible = false;
      await tween(g, 1.4, k => { zp.rotation.x = -ease(k) * 0.9; });
      g.audio.sfx('explode'); g.shake(1.0);
      p.cinePose = 'hurt';
      await g.say([{ who: 'Izuku', cam: p, text: '(Meu braço... minhas pernas... quebrados. Eu vou cair!)' }]);
      const fallFrom = p.pos.clone();
      await tween(g, 0.9, k => { p.pos.y = fallFrom.y * (1 - k * 0.92); g.shot(p.pos.clone().add(new V(4, 2, 6)), p.pos); });
      g.removeNpc(ur);
      const ur2 = g.npc('uraraka', p.pos.clone().add(new V(1.2, -p.pos.y, 1.2)), { face: p.pos, pose: 'jab' });
      g.audio.sfx('punch');
      g.ui.smashText('ZERO GRAVITY!', true);
      await g.say([
        { who: 'Uraraka', cam: ur2, text: 'Te peguei! ...Desculpa o tapa! Liberar!' },
        { who: 'Present Mic', text: 'TEMPO ESGOTADO!' },
      ]);
      await tween(g, 0.3, k => { p.pos.y = p.pos.y * (1 - k); });
      p.cinePose = 'down';
      await g.ui.fade(true);
      g.audio.playTrack('hero');
      await g.ui.fade(false);
      const am = g.npc('allMight', new V(0, 0, 0), { face: new V(0, 0, 1) });
      shot(g, 0, 2.8, 5, 0, 2.6, 0, true);
      const rescuePts = 60 + rescuedHere * 5;
      await g.say([
        { who: 'All Might', cam: am, text: `Eu sou aqui... na tela! Jovem Midoriya, você fez ${pts} pontos de vilão.` },
        { who: 'All Might', cam: am, text: 'Mas o exame tinha outra nota, vigiada pelos professores: PONTOS DE RESGATE!' },
        { who: 'All Might', cam: am, text: `${rescuePts} pontos de resgate! E a Uraraka pediu para dar os pontos dela pra você. Venha, jovem. Esta é a sua Academia de Heróis!` },
        { who: 'Izuku', text: ok1 && ok2 ? '(Eu passei... Eu vou para a U.A.!)' : '(Mesmo sem controle nenhum... eu consegui. Eu vou para a U.A.!)' },
      ]);
    },
  },
  // ============================================================ 3
  {
    id: 'treino', ep: 'CAPÍTULO 3', name: 'Deku vs. Kacchan', arc: 'Treino de Batalha — Ep. 6–7', color: '#ff8a2a',
    sub: 'Heróis contra vilões dentro de um prédio. A Uraraka precisa tocar na "arma". O vilão no caminho é o Kacchan.', par: 170,
    missions: [mis('Faça 3 esquivas perfeitas no gancho do Kacchan', s => s.perfect >= 3), mis('Faça 2 contra-ataques', s => s.counters >= 2), mis('Encontre a página do caderno', s => s.notebooks >= 1)],
    async script(g) {
      const p = g.setup('battleTrial', { kit: K.trial, music: 'tension', yaw: 0, camDist: 7.2, camH: 3.6 });
      g.ui.portrait('DK', 'Deku');
      const ur = g.npc('uraraka', new V(-6, 0, 8), { face: new V(0, 0, 0) });
      g.notebook(new V(10, 0, -18), NOTES.treino);
      await g.say([
        { who: 'All Might', text: 'Treino de Batalha! Dupla A, heróis: Midoriya e Uraraka. Dupla D, vilões: Bakugo e Iida. Os heróis vencem tocando na arma!' },
        { who: 'Uraraka', cam: ur, text: 'Deku... é assim que o Bakugo te chama, né? Parece "dekiru", "consegue fazer". Eu gosto!' },
        { who: 'Izuku', cam: p, text: '"Deku" quer dizer inútil... mas se você gosta... então "Deku" é o meu nome de herói.' },
        { who: 'Izuku', cam: p, text: 'Eu seguro o Kacchan. Uraraka, sobe até a arma! Ele sempre abre com um gancho de direita: dá pra esquivar no tempo certo (L) e contra-atacar (J)!' },
      ]);
      ur.walkTo(new V(-10, 0, -10), 6).then(() => g.removeNpc(ur));
      g.ui.toast('Esquiva no tempo certo = câmera lenta. Aperte J para contra-atacar!', 'gold');
      let gaunt = false;
      g.bossEvent = (b, ev) => bg(async () => {
        if (ev === 'gauntlet') {
          gaunt = true;
          await g.say([
            { who: 'Bakugo', cam: b, text: 'Você tava me fazendo de idiota esse tempo todo, Deku?! Escondendo o poder?!' },
            { who: 'Bakugo', cam: b, text: 'A manopla guarda o meu suor. Quanto mais cheia... maior a explosão. Se não morrer, tá tudo certo!' },
            { who: 'All Might', text: 'Jovem Bakugo! Pare! Isso pode matá-lo!' },
          ]);
          g.ui.toast('Fuja da linha do disparo da manopla!', 'red');
        }
      });
      const boss = await g.boss(BOSS.bakugo1, g.env.anchors.boss);
      await g.cinema(true);
      shot(g, 3, 2, 0, 3, 2.2, -6);
      await g.say([
        { who: 'Bakugo', cam: boss, text: 'Por que... você não usa?! Tá me olhando de cima, é?!' },
        { who: 'Izuku', cam: p, text: 'Não é por isso! Eu sempre te admirei, Kacchan. É por isso que eu quero te vencer!' },
        { who: 'Izuku', text: '(Não é pra acertar ele. A Uraraka está no andar de cima... SOCO PRA CIMA!)' },
      ]);
      const ok = await g.qte('timing', { title: 'SMASH PARA CIMA!', label: 'K', speed: 1.0, tries: 3 });
      p.cinePose = 'uppercut';
      bigFinish(g, p.pos.clone().add(new V(0, 3, 0)), 'SMASH!');
      for (let i = 0; i < 6; i++) g.fx.shockwave(p.pos.clone().add(new V(0, 2 + i * 1.5, 0)), 0xffffff, 2 + i, 0.6, new V(0, 1, 0));
      g.fx.burst(new V(0, 6.5, -6), [0x8a8a90, 0x6a6a70], 40, 10, { size: 0.4, life: 1.6 });
      g.ui.bossHide();
      boss.def = { ...boss.def, passive: true };
      p.hp = Math.max(5, p.hp - 25); g.ui.hp(p.hp / p.kit.maxHp, true);
      await g.say([
        { who: 'Uraraka', text: '(lá de cima) Desculpa, Iida! COMETA METEORO! ...Toquei na arma!' },
        { who: 'All Might', text: 'OS HERÓIS... VENCEM!' },
        { who: 'Izuku', cam: p, text: ok ? '(Meu braço... de novo. Mas a gente venceu juntos.)' : '(Quebrei o braço outra vez... mas funcionou.)' },
      ]);
      await g.ui.fade(true);
      boss.pos.set(2, 0, 4); boss.faceTo(new V(-2, 0, 6)); boss.go('chase');
      p.pos.set(-2, 0, 6); p.faceTo(boss.pos); p.cinePose = 'calm';
      shot(g, 0, 2, 11, 0, 1.8, 5, true);
      g.audio.playTrack('calm');
      await g.ui.fade(false);
      await g.say([
        { who: 'Izuku', cam: p, text: 'Kacchan! Esse poder... me foi dado por alguém. Não posso dizer quem. Mas um dia ele vai ser meu de verdade, e aí eu te supero!' },
        { who: 'Bakugo', cam: boss, text: '...Eu perdi pra você hoje. Pra VOCÊ. Mas escuta aqui: eu vou ser o número um!' },
        { who: 'Bakugo', cam: boss, text: 'Você não vai me vencer de novo, seu nerd de merda!' },
        { who: 'All Might', text: '(Os dois se movem pelo outro. Uma rivalidade assim... vale ouro.)' },
      ]);
    },
  },
];
