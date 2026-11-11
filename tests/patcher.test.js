// Testes do patcher e do núcleo (rodam com: npm test). Usam trechos de código SINTÉTICOS, sem o código do HaxBall.
const assert = require('assert');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const { patchOfficial } = require('../src/patcher');
const coreJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');

let passed = 0;
function test(name, fn) { try { fn(); passed++; console.log('  ok   ' + name); } catch (e) { console.error('  FALHA ' + name + '\n        ' + e.message); process.exitCode = 1; } }

// trecho no formato do jogo: comandos (switch) e o indicador de digitação, com nomes diferentes dos reais
const FIXTURE = `
var Q = { run: function (c, a) { switch (c) {
    case "extrapolation": 2 == a.length ? (a = parseInt(a[1])) : this.zz("x"); break;
    default: this.ba('Unrecognized command: "' + c + '"') } },
  Fp: function (a) { var b = this; this.zh = a; null == this.Nf && (this.Nf = window.setTimeout(function () { b.Nf = null; b.bm(b.zh) }, 50)) } };`;

console.log('patcher');
test('encaixa comandos e chat bubble', () => {
  const r = patchOfficial(FIXTURE, coreJs);
  assert.deepStrictEqual(r.applied.sort(), ['Chat Bubble', 'Comandos de chat']);
  assert.strictEqual(r.skipped.length, 0);
  assert.ok(r.code.includes('HBMOD.runCommand(c,a,HBMOD.sayer(this,"ba"))'));
  assert.ok(r.code.includes('HBMOD.chatBubbleOn()||a'));
  new vm.Script(r.code);                                   // o resultado precisa ser JavaScript válido
});
test('funciona com nomes diferentes e código compactado', () => {
  const mini = FIXTURE.replace(/\n\s*/g, ' ').replace(/\bba\b/g, 'Qx').replace(/\bzh\b/g, 'k1').replace(/Nf/g, 'k2');
  const r = patchOfficial(mini, coreJs);
  assert.ok(r.applied.includes('Chat Bubble') && r.applied.includes('Comandos de chat'), JSON.stringify(r));
  new vm.Script(r.code);
});
test('ignora (sem quebrar) quando a estrutura muda e registra o motivo', () => {
  const r = patchOfficial(FIXTURE.replace('null == this.Nf', 'this.Nf === null'), coreJs);
  assert.ok(r.skipped.some((s) => s.startsWith('Chat Bubble')));
  assert.ok(r.applied.includes('Comandos de chat'));
  new vm.Script(r.code);
});
test('não aplica quando acha o trecho mais de uma vez (ambíguo)', () => {
  const r = patchOfficial(FIXTURE + FIXTURE, coreJs);
  assert.ok(r.skipped.some((s) => s.startsWith('Chat Bubble')));
});
test('marca quais ganchos encaixaram', () => {
  const r = patchOfficial(FIXTURE, coreJs);
  assert.ok(/HBMOD\.hooks = \{"op":false,"ping":false,"bubble":true\}/.test(r.code));
});
test('extensões recebem os helpers e podem aplicar patches', () => {
  const r = patchOfficial(FIXTURE + ' var Z = alfa(1);', coreJs, [(h) => h.apply('Teste', [/alfa\(1\)/], () => 'alfa(2)')]);
  assert.ok(r.applied.includes('Teste') && r.code.includes('alfa(2)'));
});
test('erro dentro de uma extensão não derruba o patcher', () => {
  const r = patchOfficial(FIXTURE, coreJs, [() => { throw new Error('boom'); }]);
  assert.ok(r.skipped.some((s) => s.includes('boom')) && r.applied.includes('Chat Bubble'));
});

// ---------- núcleo (core.js) em um ambiente simulado ----------
function makeEnv(storage) {
  const listeners = {};
  const el = () => ({ style: {}, appendChild() { }, textContent: '' });
  const sandbox = {
    document: { documentElement: { appendChild() { } }, createElement: el, createTextNode: (t) => ({ t }), addEventListener: (t, f) => (listeners[t] = f) },
    localStorage: { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => (storage[k] = String(v)), removeItem: (k) => delete storage[k] }
  };
  sandbox.document.querySelector = () => null;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(coreJs, sandbox);
  return sandbox;
}

console.log('núcleo');
test('comandos desconhecidos retornam false; conhecidos, true', () => {
  const w = makeEnv({}); const out = [];
  assert.strictEqual(w.HBMOD.runCommand('naoexiste', ['x'], (m) => out.push(m)), false);
  assert.strictEqual(w.HBMOD.runCommand('mod', ['mod'], (m) => out.push(m)), true);
  assert.ok(out.join('\n').includes('/chat_bubble'));
});
test('/chat_bubble liga, desliga e alterna (on não vira off)', () => {
  const w = makeEnv({}); const say = () => { };
  w.HBMOD.runCommand('chat_bubble', ['chat_bubble', 'on'], say); assert.strictEqual(w.HBMOD.chatBubbleOn(), true);
  w.HBMOD.runCommand('chat_bubble', ['chat_bubble', 'off'], say); assert.strictEqual(w.HBMOD.chatBubbleOn(), false);
  w.HBMOD.runCommand('chat_bubble', ['chat_bubble'], say); assert.strictEqual(w.HBMOD.chatBubbleOn(), true);
});
test('configuração é salva e restaurada', () => {
  const st = {}; const a = makeEnv(st);
  a.HBMOD.runCommand('chat_bubble', ['chat_bubble', 'on'], () => { });
  assert.strictEqual(makeEnv(st).HBMOD.chatBubbleOn(), true);
});
test('/mod reset volta ao padrão', () => {
  const w = makeEnv({}); const say = () => { };
  w.HBMOD.runCommand('chat_bubble', ['chat_bubble', 'on'], say); w.HBMOD.runCommand('mod', ['mod', 'reset'], say);
  assert.strictEqual(w.HBMOD.chatBubbleOn(), false);
});
test('sem extensão, o mod não altera frame nem ping', () => {
  const w = makeEnv({}); assert.strictEqual(w.HBMOD.frameToSend(1234), 1234); assert.strictEqual(w.HBMOD.fakePingValue(30), 30);
});
test('erro dentro de um comando não propaga para o jogo', () => {
  const w = makeEnv({}); w.HBMOD.registerCommand('quebra', () => { throw new Error('x'); });
  assert.strictEqual(w.HBMOD.runCommand('quebra', ['quebra'], () => { }), true);
});


console.log('personalização (núcleo)');
test('setGame aceita só valores válidos e limita os números', () => {
  const w = makeEnv({});
  w.HBMOD.setUi({ game: { flat: true, ground: '#112233', crossSize: 999, chatFont: 4, vol: { kick: 30, goal: -9 }, hideTimer: true, crossColor: 'javascript:1' } });
  const g = w.HBMOD.game();
  assert.strictEqual(g.flat, true); assert.strictEqual(g.ground, '#112233'); assert.strictEqual(g.crossSize, 200);
  assert.strictEqual(g.chatFont, 10); assert.strictEqual(g.vol.kick, 30); assert.strictEqual(g.vol.goal, 0);
  assert.strictEqual(g.hideTimer, true); assert.strictEqual(g.crossColor, '#ffffff');
});
test('perfil: grava apelido e avatar onde o jogo lê, e o estado da sala informa os dois', () => {
  const st = {}; const w = makeEnv(st);
  assert.strictEqual(w.HBMOD.setProfile({ name: '  Gabriel  ', avatar: '7' }), true);
  assert.strictEqual(st.player_name, 'Gabriel'); assert.strictEqual(st.avatar, '7');
  w.HBMOD.setProfile({ name: 'Outro', avatar: '' }); assert.ok(!('avatar' in st));
  const info = w.HBMOD.roomInfo(); assert.strictEqual(info.nick, 'Outro'); assert.strictEqual(info.inRoom, false);
});

// ---------- canvas e áudio simulados: o núcleo observa as chamadas do navegador ----------
function makeMedia() {
  const calls = [];
  function Ctx() { this.globalAlpha = 1; this._fill = '#000'; }
  Ctx.prototype = {
    createPattern(img, rep) { return { pattern: true, rep }; },
    arc(x, y, r) { calls.push(['arc', x, y, r]); }, stroke() { calls.push(['stroke', this.strokeStyle]); },
    fill() { calls.push(['fill', this.fillStyle]); }, fillText(t) { calls.push(['text', t]); }, drawImage(...a) { calls.push(['img'].concat(a.slice(1))); },
    save() { }, restore() { }, beginPath() { }, moveTo() { }, lineTo() { }, setLineDash() { }
  };
  Object.defineProperty(Ctx.prototype, 'fillStyle', { configurable: true, enumerable: true, get() { return this._fill; }, set(v) { this._fill = v; } });
  Object.defineProperty(Ctx.prototype, 'strokeStyle', { configurable: true, enumerable: true, get() { return this._stroke; }, set(v) { this._stroke = v; } });
  const lines = [];                                              // linhas do chat simuladas
  const p = (text, cls) => { const e = { nodeName: 'P', textContent: text, className: cls || '', style: {} }; lines.push(e); return e; };
  let frame = null, drop = null, roomName = null, chatOpen = false;
  function AudioNode() { }
  AudioNode.prototype.connect = function (d) { (this.to = this.to || []).push(d); return d; };
  function Gain(ctx) { this.context = ctx; this.gain = { value: 1 }; } Gain.prototype = Object.create(AudioNode.prototype);
  function Source(ctx) { this.context = ctx; this._b = null; } Source.prototype = Object.create(AudioNode.prototype);
  Object.defineProperty(Source.prototype, 'buffer', { configurable: true, enumerable: true, get() { return this._b; }, set(v) { this._b = v; } });
  function AudioContext() { this.destination = new Gain(this); }
  AudioContext.prototype = { decodeAudioData(data, ok) { ok({ id: data instanceof ArrayBuffer ? 'custom' : data }); }, createGain() { return new Gain(this); }, createBufferSource() { return new Source(this); } };
  const sandbox = {
    CanvasRenderingContext2D: Ctx, AudioContext, AudioNode, AudioBufferSourceNode: Source, atob: (t) => Buffer.from(t, 'base64').toString('binary'), Uint8Array, ArrayBuffer,
    requestAnimationFrame: (cb) => { frame = cb; },
    document: { documentElement: { appendChild() { } }, createTextNode: (t) => ({ t }), addEventListener() { },
      createElement: (tag) => (tag === 'canvas' ? { width: 0, height: 0, getContext: () => new Ctx() } : { style: {}, appendChild() { }, textContent: '' }),
      querySelector: (q) => (q.includes('disconnected') ? drop : q.includes('room-name') ? roomName : q.includes('chatbox') && chatOpen ? {} : null),
      querySelectorAll: () => lines },
    localStorage: { getItem: () => null, setItem() { }, removeItem() { } }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox); vm.runInContext(coreJs, sandbox);
  return { w: sandbox, Ctx, AudioContext, calls, p, lines, nextFrame: () => { sandbox.requestAnimationFrame(() => { }); frame(0); },
    set drop(v) { drop = v; }, set roomName(v) { roomName = v; }, set chatOpen(v) { chatOpen = v; } };
}
test('campo liso: a textura vira a cor escolhida só quando ligado', () => {
  const { w, Ctx } = makeMedia(); const c = new Ctx();
  const grass = c.createPattern({}, null), other = c.createPattern({}, 'no-repeat');
  c.fillStyle = grass; assert.strictEqual(c.fillStyle, grass);
  w.HBMOD.setGame({ flat: true, ground: '#224466' });
  c.fillStyle = grass; assert.strictEqual(c.fillStyle, '#224466');
  c.fillStyle = other; assert.strictEqual(c.fillStyle, other);        // o que não é textura do campo fica igual
  c.fillStyle = '#fff'; assert.strictEqual(c.fillStyle, '#fff');
});
test('mira: desenhada só em volta do anel do seu jogador, e só quando ligada', () => {
  const { w, Ctx, calls } = makeMedia(); const c = new Ctx();
  const ring = () => { c.globalAlpha = 0.3; c.arc(100, 50, 25, 0, 6.28, false); c.stroke(); c.globalAlpha = 1; };
  ring(); assert.strictEqual(calls.length, 2);
  w.HBMOD.setGame({ cross: true, crossColor: '#ff0000', crossSize: 200 });
  calls.length = 0; c.arc(10, 10, 15, 0, 6.28); c.stroke();           // outro jogador: nada a mais
  assert.strictEqual(calls.length, 2);
  calls.length = 0; ring();
  assert.deepStrictEqual(calls[2], ['arc', 100, 50, 50]); assert.deepStrictEqual(calls[3], ['stroke', '#ff0000']);
  assert.strictEqual(calls.length, 4);
});
test('volumes: cada tipo de som passa pelo seu controle', () => {
  const { w, AudioContext } = makeMedia(); const ac = new AudioContext(), master = ac.createGain(), bufs = [];
  for (let i = 0; i < 7; i++) ac.decodeAudioData(i, (b) => bufs.push(b));   // chat, destaque, chute, gol, entrou, saiu, torcida
  w.HBMOD.setGame({ vol: { kick: 20, goal: 50 } });
  const play = (b) => { const s = ac.createBufferSource(); s.buffer = b; s.connect(master); return s.to[0]; };
  const kick = play(bufs[2]), goal = play(bufs[3]), crowd = play(bufs[6]);
  assert.notStrictEqual(kick, master); assert.strictEqual(kick.to[0], master);
  assert.strictEqual(kick.gain.value, 0.2); assert.strictEqual(goal.gain.value, 0.5);
  assert.strictEqual(crowd, goal);                                   // gol e torcida usam o mesmo controle ("Gol")
  assert.strictEqual(play(bufs[2]), kick);                           // o mesmo controle é reaproveitado
  w.HBMOD.setGame({ vol: { kick: 0 } }); assert.strictEqual(kick.gain.value, 0);
  assert.strictEqual(master.connect(ac.destination), ac.destination); // o resto do áudio não muda
});

test('som próprio: toca o seu arquivo no lugar do original, com o volume da categoria; remover volta ao original', () => {
  const { w, AudioContext } = makeMedia(); const ac = new AudioContext(), master = ac.createGain(), bufs = [];
  for (let i = 0; i < 7; i++) ac.decodeAudioData(i, (b) => bufs.push(b));
  assert.strictEqual(w.HBMOD.setSound('crowd', 'AAAA'), false);       // só chute, gol e menção
  assert.strictEqual(w.HBMOD.setSound('kick', 'AAAA'), true);
  assert.deepStrictEqual(Array.from(w.HBMOD.roomInfo().snd), ['kick']);
  const s = ac.createBufferSource(); s.buffer = bufs[2]; assert.strictEqual(s.buffer.id, 'custom');
  w.HBMOD.setGame({ vol: { kick: 10 } }); s.connect(master); assert.strictEqual(s.to[0].gain.value, 0.1);
  const g = ac.createBufferSource(); g.buffer = bufs[3]; assert.strictEqual(g.buffer, bufs[3]);
  w.HBMOD.setSound('kick', null);
  const s2 = ac.createBufferSource(); s2.buffer = bufs[2]; assert.strictEqual(s2.buffer, bufs[2]);
});
test('bola: só o primeiro disco de cor lisa de cada quadro muda de cor', () => {
  const m = makeMedia(), c = new m.Ctx(), shirt = c.createPattern({}, 'no-repeat');
  const disc = (style) => { c.fillStyle = style; c.arc(1, 1, 10, 0, 6.28); c.fill(); c.stroke(); };
  m.w.HBMOD.setGame({ ballOn: true, ballColor: '#00ff00' });
  m.nextFrame(); m.calls.length = 0;
  disc(shirt); disc('rgba(255,255,255,255)'); disc('rgba(255,0,0,255)');
  const fills = m.calls.filter((x) => x[0] === 'fill').map((x) => x[1]);
  assert.deepStrictEqual(fills, [shirt, '#00ff00', 'rgba(255,0,0,255)']);
  assert.strictEqual(c.fillStyle, 'rgba(255,0,0,255)');
  m.nextFrame(); m.calls.length = 0; disc('rgba(255,255,255,255)');
  assert.strictEqual(m.calls.find((x) => x[0] === 'fill')[1], '#00ff00');
});
test('linhas do campo e tamanho dos nomes', () => {
  const m = makeMedia(), c = new m.Ctx();
  c.strokeStyle = '#C7E6BD'; assert.strictEqual(c.strokeStyle, '#C7E6BD');
  m.w.HBMOD.setGame({ lineOn: true, lineColor: '#ff00ff', nameSize: 200 });
  c.strokeStyle = '#C7E6BD'; assert.strictEqual(c.strokeStyle, '#ff00ff');
  c.strokeStyle = 'rgba(199,230,189,255)'; assert.strictEqual(c.strokeStyle, '#ff00ff');
  c.strokeStyle = 'black'; assert.strictEqual(c.strokeStyle, 'black');
  c.strokeStyle = 'rgba(255,255,255,255)'; assert.strictEqual(c.strokeStyle, '#ff00ff');   // linhas de qualquer mapa, não só as dos mapas clássicos
  c.strokeStyle = 'white'; assert.strictEqual(c.strokeStyle, 'white');                   // contorno de jogador/bola (cor por nome) fica igual
  m.calls.length = 0; c.drawImage({}, 0, 0, 160, 34, 60, 100, 80, 17);     // um nome: centro em x=100
  assert.deepStrictEqual(m.calls[0], ['img', 0, 0, 160, 34, 20, 100, 160, 34]);
  m.calls.length = 0; c.drawImage({}, 5, 5); assert.deepStrictEqual(m.calls[0], ['img', 5, 5]);
});
test('avatares: os dos outros somem, o seu fica', () => {
  const m = makeMedia(), c = new m.Ctx(), small = new m.Ctx(); small.canvas = { width: 64, height: 64 };
  const mk = (t) => { small.fillText(t, 32, 44); return small.createPattern(small.canvas, 'no-repeat'); };
  const mine = mk('7'), other = mk('GK');
  const ring = (x, y) => { c.globalAlpha = 0.3; c.arc(x, y, 25, 0, 6.28); c.stroke(); c.globalAlpha = 1; };
  const player = (shirt, x, y) => { c.fillStyle = shirt; c.arc(x, y, 15, 0, 6.28); c.fill(); return m.calls.filter((k) => k[0] === 'fill').pop()[1]; };
  m.nextFrame(); ring(10, 10);
  assert.strictEqual(player(other, 50, 50), other);                    // desligado: nada muda
  m.w.HBMOD.setGame({ hideAvatars: true });
  m.nextFrame(); ring(10, 10);
  assert.strictEqual(player(mine, 10, 10), mine);
  const shown = player(other, 50, 50); assert.ok(shown !== other && shown.pattern);
});
test('modo gravação: campo, mira, bola, linhas e nomes voltam ao visual original', () => {
  const m = makeMedia(), c = new m.Ctx(), grass = c.createPattern({}, null);
  m.w.HBMOD.setGame({ flat: true, cross: true, ballOn: true, lineOn: true, nameSize: 200 });
  m.w.HBMOD.setUi({ hidden: true });
  c.fillStyle = grass; assert.strictEqual(c.fillStyle, grass);
  c.strokeStyle = '#C7E6BD'; assert.strictEqual(c.strokeStyle, '#C7E6BD');
  m.nextFrame(); m.calls.length = 0;
  c.globalAlpha = 0.3; c.arc(1, 1, 25, 0, 6.28); c.stroke(); c.globalAlpha = 1; assert.strictEqual(m.calls.length, 2);
  c.fillStyle = '#fff'; c.arc(1, 1, 10, 0, 6.28); c.fill(); assert.strictEqual(m.calls.pop()[1], '#fff');
  c.drawImage({}, 0, 0, 160, 34, 60, 100, 80, 17); assert.deepStrictEqual(m.calls.pop(), ['img', 0, 0, 160, 34, 60, 100, 80, 17]);
  m.w.HBMOD.setUi({ hidden: false }); c.fillStyle = grass; assert.notStrictEqual(c.fillStyle, grass);
});
test('filtro do chat: esconde entrou/saiu, jogadores e palavras; o resto fica', () => {
  const m = makeMedia();
  const a = m.p('Fulano has joined', 'notice'), b = m.p('Game started', 'notice'), c = m.p('Chato: oi gente'), d = m.p('Amigo: isso é SPAM puro'), e = m.p('Amigo: bora jogar', 'highlight');
  m.w.HBMOD.setChat({ hideJoin: true, players: ['CHATO'], words: ['spam'] });
  assert.deepStrictEqual([a, b, c, d, e].map((x) => x.style.display), ['none', '', 'none', 'none', '']);
  m.w.HBMOD.setChat({ hideJoin: false, players: [], words: [] });
  assert.deepStrictEqual([a, c, d].map((x) => x.style.display), ['', '', '']);
});
test('nome da sala fica guardado enquanto você está nela; queda de conexão é informada', () => {
  const m = makeMedia();
  m.chatOpen = true; m.roomName = { textContent: ' Sala X ' }; assert.strictEqual(m.w.HBMOD.roomInfo().name, 'Sala X');
  m.roomName = null; assert.strictEqual(m.w.HBMOD.roomInfo().name, 'Sala X');          // Esc fechado
  m.chatOpen = false; m.drop = { querySelector: () => ({ textContent: 'Connection closed' }) };
  const info = m.w.HBMOD.roomInfo(); assert.strictEqual(info.name, ''); assert.strictEqual(info.dropped, 'Connection closed');
});

console.log('\n' + passed + ' testes passaram' + (process.exitCode ? ' (HÁ FALHAS)' : '.'));
