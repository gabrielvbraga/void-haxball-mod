// Testes do processo principal (src/main.js) com um Electron simulado. Rodam com: npm test
// Não abrem janela nem acessam a internet.
const assert = require('assert');
const Module = require('module');
const path = require('path');
const fs = require('fs');
const os = require('os');

process.env.VOID_TEST = '1';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'void-test-'));

// ---------- Electron simulado ----------
const H = { handler: null, ready: null, ipc: {}, events: {}, ui: [], loaded: [], perm: null, ws: null, opts: null, windows: [], files: [], reloads: 0, sent: [] };
const game = { HBMOD: true, inRoom: false, name: '', bubble: false, pushed: null, profile: null, op: null };   // estado do jogo dentro do iframe
const gameFrame = {
  url: 'https://html5.haxball.com/game',
  executeJavaScript: async (code) => {
    if (!game.HBMOD) return null;
    if (code.includes('roomInfo')) {
      const m = code.match(/H\.setUi\((\{.*?\})\);return/);
      if (m) game.pushed = JSON.parse(m[1]);
      return { inRoom: game.inRoom, name: game.name, bubble: game.bubble, dropped: game.dropped || '', snd: game.snd || ['kick', 'goal', 'mention'] };
    }
    const b = code.match(/setChatBubble\((true|false)\)/);
    if (b) { game.bubble = b[1] === 'true'; return true; }
    const sd = code.match(/HBMOD\.setSound\("(\w+)",(null|"[^"]*")\)/);
    if (sd) { if (sd[2] !== 'null') game.sound = [sd[1], JSON.parse(sd[2])]; return true; }
    const pr = code.match(/setProfile\((\{.*\})\)/);
    if (pr) { game.profile = JSON.parse(pr[1]); return true; }
    const op = code.match(/HBMOD\.op\.set\((\{.*?\})\)/);
    if (op) { game.op = JSON.parse(op[1]); return true; }
    if (code.includes('chatbox-view')) {                       // envio de mensagem
      if (game.inRoom) H.sent.push(JSON.parse(code.match(/\}\)\((".*")\)$/)[1]));
      return game.inRoom;
    }
    return null;
  }
};
const mainFrame = { url: 'https://www.haxball.com/play', executeJavaScript: async () => null, framesInSubtree: [] };
mainFrame.framesInSubtree = [mainFrame, gameFrame];
const wc = {
  on: (n, f) => { H.events[n] = f; }, once: (n, f) => { H.events['once:' + n] = f; }, setWindowOpenHandler() { }, setZoomLevel() { }, insertCSS: async () => { },
  reloadIgnoringCache() { H.reloads++; }, toggleDevTools() { }, mainFrame, executeJavaScript: async (c) => { H.ui.push(c); },
  capturePage: async () => ({ toPNG: () => Buffer.from('png') })
};
const win = { webContents: wc, on() { }, loadURL: (u) => H.loaded.push(u), loadFile: (f) => H.files.push(f), show() { }, focus() { }, close() { }, isDestroyed: () => false, setAlwaysOnTop() { }, isFullScreen: () => false, setFullScreen() { }, getBounds: () => ({}) };
const electron = {
  app: { whenReady: () => ({ then: (f) => { H.ready = f; } }), on() { }, getPath: () => tmp, quit() { } },
  BrowserWindow: function (o) { H.opts = o; H.windows.push(o); return win; },
  protocol: { handle: (s, h) => { H.handler = h; } },
  net: { fetch: async () => new Response('ok') },
  shell: { openExternal() { }, openPath() { }, showItemInFolder() { } },
  Menu: { setApplicationMenu() { } },
  dialog: { showOpenDialog: async () => H.pick, showSaveDialog: async () => H.save },
  ipcMain: { handle: (n, f) => { H.ipc[n] = f; }, on: (n, f) => { H.ipc[n] = f; } },
  session: { defaultSession: {
    clearCache: async () => { }, setPermissionRequestHandler: (f) => { H.perm = f; },
    webRequest: { onBeforeRequest: (filter, f) => { H.ws = { filter, f }; } }
  } }
};
const origLoad = Module._load;
Module._load = function (r, ...a) { return r === 'electron' ? electron : origLoad.call(this, r, ...a); };
global.setInterval = () => 0;   // o teste chama o "poll" manualmente

const M = require('../src/main.js');
H.ready();

const trusted = { senderFrame: mainFrame }, evil = { senderFrame: { url: 'https://evil.example/' } };
const key = (type, code, extra) => H.events['before-input-event']({ preventDefault() { } }, Object.assign({ type, code, key: code }, extra));
const socket = (url) => H.ws.f({ url }, () => { });

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ok   ' + name); } catch (e) { console.error('  FALHA ' + name + '\n        ' + e.message); process.exitCode = 1; }
}

(async () => {
  console.log('intensidade do vermelho');
  await test('72 (padrão) fica próximo do vermelho original #e0212f', () => {
    const c = M.palette(72).accent, d = [1, 3, 5].map((i) => Math.abs(parseInt(c.slice(i, i + 2), 16) - parseInt('e0212f'.slice(i - 1, i + 1), 16)));
    assert.ok(Math.max(...d) <= 12, c);
  });
  await test('mais intensidade = vermelho mais forte; valores fora de 0-100 são limitados', () => {
    const r = (t) => parseInt(M.palette(t).accent.slice(1, 3), 16);
    assert.ok(r(0) < r(50) && r(50) < r(100));
    assert.strictEqual(M.palette(-50).accent, M.palette(0).accent);
    assert.strictEqual(M.palette(999).accent, M.palette(100).accent);
    assert.strictEqual(M.clampAccent('abc'), 72);
  });
  await test('a fórmula do ui.js é idêntica à do main.js', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8');
    const fn = new Function(src.match(/function hslHex[\s\S]*?\n  }\n/)[0] + src.match(/function palette\(t, theme\) \{[\s\S]*?\n  }\n/)[0] + 'return palette;')();
    for (const theme of [undefined, 'red', 'blue', 'purple', 'green', 'white', 'nope']) for (const t of [0, 13, 50, 72, 88, 100]) {
      assert.strictEqual(fn(t, theme).accent, M.palette(t, theme).accent, theme + ' t=' + t);
      assert.strictEqual(fn(t, theme).hi, M.palette(t, theme).hi, theme + ' t=' + t);
      assert.strictEqual(fn(t, theme).on, M.palette(t, theme).on);
    }
  });
  await test('a cor escolhida é enviada ao jogo', async () => {
    await H.ipc['config:set'](trusted, { accent: 20 });
    await M.pollRoom();
    assert.strictEqual(game.pushed.accent, M.palette(20).accent);
    assert.strictEqual(M.config.accent, 20);
  });

  console.log('modo gravação');
  await test('F4 liga: o jogo recebe hidden=true e a interface é avisada', async () => {
    H.ui.length = 0; key('keyDown', 'F4', { key: 'F4' }); await new Promise((r) => setImmediate(r));
    assert.strictEqual(M.config.recording, true);
    assert.strictEqual(game.pushed.hidden, true);
    assert.ok(H.ui.some((c) => /__hbui\.refresh\(\)/.test(c)));
  });
  await test('F4 de novo desliga; a escolha fica salva no disco', async () => {
    key('keyDown', 'F4', { key: 'F4' }); await new Promise((r) => setImmediate(r));
    assert.strictEqual(game.pushed.hidden, false);
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(tmp, 'config.json'), 'utf8')).recording, false);
  });

  console.log('histórico de salas');
  await test('observa só conexões ws/wss (não mexe nelas)', () => {
    assert.deepStrictEqual(H.ws.filter.urls, ['wss://*/*', 'ws://*/*']);
    let called = null; H.ws.f({ url: 'wss://p2p.haxball.com/client?id=ZZZZ1' }, (r) => { called = r; });
    assert.deepStrictEqual(called, {});
  });
  await test('entrar numa sala pela lista registra código e nome', async () => {
    game.inRoom = false; await M.pollRoom();
    socket('wss://p2p.haxball.com/client?id=AbC123xyz&token=t');
    game.inRoom = true; game.name = ''; await M.pollRoom();
    assert.strictEqual(M.config.history[0].code, 'AbC123xyz');
    game.name = 'FUTSAL NORDESTE X4'; await M.pollRoom();
    assert.strictEqual(M.config.history[0].name, 'FUTSAL NORDESTE X4');
  });
  await test('código antigo NÃO é gravado como se fosse a sala nova', async () => {
    game.inRoom = false; await M.pollRoom();
    socket('wss://p2p.haxball.com/client?id=VELHA0001');
    const realNow = Date.now; Date.now = () => realNow() + 5 * 60000;   // 5 minutos depois
    game.inRoom = true; game.name = 'Outra sala'; await M.pollRoom();
    Date.now = realNow;
    assert.ok(!M.config.history.some((r) => r.code === 'VELHA0001'));
    assert.ok(!M.config.history.some((r) => r.name === 'Outra sala'));
  });
  await test('conexões que não são de sala são ignoradas', async () => {
    game.inRoom = false; await M.pollRoom();
    socket('wss://p2p.haxball.com/host?id=HOST1234'); socket('wss://p2p.haxball.com/client?id=a;b"c');
    game.inRoom = true; game.name = 'x'; await M.pollRoom();
    assert.ok(!M.config.history.some((r) => r.code === 'HOST1234' || r.code.includes('"')));
  });
  await test('entrar pelo campo do menu (código ou link) também registra', async () => {
    game.inRoom = false; await M.pollRoom();
    assert.strictEqual(await H.ipc.action(trusted, 'join', 'https://www.haxball.com/play?c=Link12345'), true);
    game.inRoom = true; game.name = 'Sala do link'; await M.pollRoom();
    assert.strictEqual(M.config.history[0].code, 'Link12345');
  });
  await test('entrar de novo na mesma sala não duplica; ela volta para o topo', async () => {
    game.inRoom = false; await M.pollRoom();
    socket('wss://p2p.haxball.com/client?id=AbC123xyz'); game.inRoom = true; game.name = ''; await M.pollRoom();
    assert.strictEqual(M.config.history.filter((r) => r.code === 'AbC123xyz').length, 1);
    assert.strictEqual(M.config.history[0].code, 'AbC123xyz');
    assert.strictEqual(M.config.history[0].name, 'FUTSAL NORDESTE X4');   // mantém o nome que já tinha
  });
  await test('guarda no máximo 10 salas', async () => {
    for (let i = 0; i < 14; i++) { game.inRoom = false; await M.pollRoom(); socket('wss://p2p.haxball.com/client?id=Sala' + i + 'xx'); game.inRoom = true; await M.pollRoom(); }
    assert.strictEqual(M.config.history.length, 10);
    assert.strictEqual(M.config.history[0].code, 'Sala13xx');
  });
  await test('clicar numa sala do histórico entra nela', async () => {
    H.loaded.length = 0;
    await H.ipc.action(trusted, 'join', 'Sala13xx');
    assert.ok(/haxball\.com\/play\?c=Sala13xx$/.test(H.loaded[0]));
  });
  await test('a página não consegue gravar o histórico direto', async () => {
    await H.ipc['config:set'](trusted, { history: [{ code: 'Falsa1234', name: '<img src=x onerror=alert(1)>' }] });
    assert.ok(!M.config.history.some((r) => r.code === 'Falsa1234'));
  });
  await test('limpar o histórico', async () => {
    await H.ipc.action(trusted, 'history:clear');
    assert.strictEqual(M.config.history.length, 0);
  });

  console.log('Chat Bubble pela tecla');
  await test('a tecla escolhida liga e desliga o Chat Bubble, menos enquanto você digita', async () => {
    const wait = () => new Promise((r) => setTimeout(r, 20));
    const press = async (code, extra) => { key('keyDown', code, extra); await wait(); key('keyUp', code); };
    await H.ipc.action(trusted, 'captureKey', 'bubble'); assert.strictEqual((await H.ipc['state:get'](trusted)).capturing, 'bubble');
    key('keyDown', 'KeyB'); key('keyUp', 'KeyB');
    let st = await H.ipc['state:get'](trusted); assert.strictEqual(st.config.bubbleKey, 'KeyB'); assert.strictEqual(st.capturing, false);
    game.bubble = false; await H.ipc.action(trusted, 'bubble', false);
    await press('KeyB'); assert.strictEqual(game.bubble, true); assert.ok(H.ui.some((c) => c.includes('__hbui.bubble(true,true)')));
    await press('KeyB'); assert.strictEqual(game.bubble, false);
    await press('KeyB', { control: true }); assert.strictEqual(game.bubble, false);          // Ctrl+B não conta
    await press('KeyB', { isAutoRepeat: true }); assert.strictEqual(game.bubble, false);     // tecla segurada não fica alternando
    const orig = gameFrame.executeJavaScript;                                               // digitando no chat: a tecla só escreve
    gameFrame.executeJavaScript = async (c) => (c.includes('activeElement') ? true : orig(c));
    await press('KeyB'); assert.strictEqual(game.bubble, false);
    gameFrame.executeJavaScript = orig;
  });
  await test('tecla reservada ou igual à do menu é recusada; trocar a do menu para a mesma tecla libera a do Chat Bubble', async () => {
    for (const code of ['F4', 'Escape', 'ShiftRight']) { await H.ipc.action(trusted, 'captureKey', 'bubble'); key('keyDown', code); key('keyUp', code); }
    assert.strictEqual((await H.ipc['state:get'](trusted)).config.bubbleKey, 'KeyB');
    await H.ipc['config:set'](trusted, { bubbleKey: 'KeyZ' }); assert.strictEqual((await H.ipc['state:get'](trusted)).config.bubbleKey, 'KeyB');   // pelo menu só remove
    await H.ipc.action(trusted, 'captureKey'); key('keyDown', 'KeyB'); key('keyUp', 'KeyB');
    let st = await H.ipc['state:get'](trusted); assert.strictEqual(st.config.toggleKey, 'KeyB'); assert.strictEqual(st.config.bubbleKey, '');
    await H.ipc.action(trusted, 'captureKey'); key('keyDown', 'ShiftRight'); key('keyUp', 'ShiftRight');
    await H.ipc.action(trusted, 'captureKey', 'bubble'); key('keyDown', 'KeyG'); key('keyUp', 'KeyG');
    await H.ipc['config:set'](trusted, { bubbleKey: '' }); assert.strictEqual((await H.ipc['state:get'](trusted)).config.bubbleKey, '');
  });

  console.log('Chat Bubble pelo menu');
  await test('ligar e desligar pelo menu chega ao jogo', async () => {
    assert.strictEqual(await H.ipc.action(trusted, 'bubble', true), true); assert.strictEqual(game.bubble, true);
    assert.strictEqual(await H.ipc.action(trusted, 'bubble', false), true); assert.strictEqual(game.bubble, false);
  });
  await test('sem o mod no jogo (modo original), o menu avisa que não deu', async () => {
    game.HBMOD = false; assert.strictEqual(await H.ipc.action(trusted, 'bubble', true), false); game.HBMOD = true;
  });

  console.log('segurança e atalhos');
  await test('chamadas de fora do haxball.com são recusadas', async () => {
    assert.strictEqual(await H.ipc['state:get'](evil), null);
    assert.strictEqual(await H.ipc.action(evil, 'join', 'abcd1234'), false);
    assert.strictEqual(await H.ipc['config:set'](evil, { accent: 0 }), false);
  });
  await test('links de outros sites não são abertos dentro do app', async () => {
    H.loaded.length = 0;
    assert.strictEqual(await H.ipc.action(trusted, 'join', 'https://evil.example/play?c=abcd1234'), false);
    assert.strictEqual(H.loaded.length, 0);
  });
  await test('valores inválidos de configuração são ignorados', async () => {
    await H.ipc['config:set'](trusted, { accent: 'muito', recording: 'sim', mode: 'hack' });
    assert.strictEqual(M.config.accent, 20); assert.strictEqual(M.config.recording, false); assert.strictEqual(M.config.mode, 'auto');
  });
  await test('Right Shift sozinho abre o menu; com outra tecla não', async () => {
    H.ui.length = 0; key('keyDown', 'ShiftRight'); key('keyUp', 'ShiftRight');
    assert.ok(H.ui.some((c) => /toggle\(\)/.test(c)));
    H.ui.length = 0; key('keyDown', 'ShiftRight'); key('keyDown', 'KeyA'); key('keyUp', 'ShiftRight');
    assert.strictEqual(H.ui.length, 0);
  });
  await test('janela isolada (sandbox, contextIsolation, sem nodeIntegration) e com o ícone VOID', () => {
    const w = H.opts.webPreferences;
    assert.ok(w.sandbox && w.contextIsolation && !w.nodeIntegration);
    assert.ok(fs.existsSync(H.opts.icon));
  });
  await test('permissões negadas por padrão (câmera, microfone, localização)', () => {
    const v = []; ['media', 'geolocation', 'notifications', 'fullscreen'].forEach((p) => H.perm(null, p, (x) => v.push(x)));
    assert.deepStrictEqual(v, [false, false, false, true]);
  });
  await test('o estado entregue à interface inclui sala, paleta e histórico', async () => {
    const st = await H.ipc['state:get'](trusted);
    assert.ok(st.room && st.palette && Array.isArray(st.config.history) && st.version === '1.0');
    assert.ok(st.config.game && Array.isArray(st.config.profiles) && Array.isArray(st.config.quick) && st.config.lang === 'pt');
  });

  console.log('barra de título');
  await test('a janela do jogo nasce sem a barra do Windows, com os botões na cor do tema', async () => {
    const o = H.windows[1];
    assert.strictEqual(o.titleBarStyle, 'hidden');
    assert.ok(/^#[0-9a-f]{6}$/.test(o.titleBarOverlay.color) && o.titleBarOverlay.height === 34);
    const st = await H.ipc['state:get'](trusted);
    assert.strictEqual(st.bar.active, true); assert.ok(/^#[0-9a-f]{6}$/.test(st.bar.color));       // a cor acompanha o tema atual
  });
  await test('desligar a barra pede para reabrir o app; esconder o menu do site é uma opção separada', async () => {
    await H.ipc['config:set'](trusted, { titleBar: false, hideSite: 'x' });
    let st = await H.ipc['state:get'](trusted);
    assert.strictEqual(st.config.titleBar, false); assert.strictEqual(st.bar.restart, true); assert.strictEqual(st.config.hideSite, true);
    await H.ipc['config:set'](trusted, { titleBar: true, hideSite: false });
    st = await H.ipc['state:get'](trusted);
    assert.strictEqual(st.bar.restart, false); assert.strictEqual(st.config.hideSite, false);
  });

  console.log('tela de abertura');
  await test('abre uma janela sem borda com a logo antes da janela do jogo (que começa escondida)', () => {
    assert.strictEqual(H.windows.length, 2);
    assert.strictEqual(H.windows[0].frame, false);
    assert.ok(H.windows[0].webPreferences.sandbox && !H.windows[0].webPreferences.nodeIntegration);
    assert.ok(/splash\.html$/.test(H.files[0]) && fs.existsSync(H.files[0]));
    assert.strictEqual(H.windows[1].show, false);
    assert.strictEqual(typeof H.events['once:did-finish-load'], 'function');
  });
  await test('dá para desligar a tela de abertura e trocar o idioma', async () => {
    await H.ipc['config:set'](trusted, { splash: false, lang: 'en' });
    assert.strictEqual(M.config.splash, false); assert.strictEqual(M.config.lang, 'en');
    await H.ipc['config:set'](trusted, { lang: 'xx', splash: 'no' });
    assert.strictEqual(M.config.lang, 'en'); assert.strictEqual(M.config.splash, false);
  });

  console.log('personalização');
  await test('campo liso, cor e volumes chegam ao jogo; o resto fica como estava', async () => {
    await H.ipc['config:set'](trusted, { game: { flat: true, ground: '#112233', vol: { kick: 30 } } });
    await M.pollRoom();
    const g = game.pushed.game;
    assert.strictEqual(g.flat, true); assert.strictEqual(g.ground, '#112233');
    assert.deepStrictEqual(g.vol, { goal: 100, kick: 30, chat: 100 });
    assert.strictEqual(g.cross, false);
  });
  await test('valores inválidos de personalização são ignorados ou limitados', async () => {
    await H.ipc['config:set'](trusted, { game: { ground: 'red;}', crossColor: '#GGGGGG', crossSize: 9999, chatFont: 3, chatOpacity: -5, flat: 'sim', vol: { goal: 500, x: 1 } } });
    const g = M.config.game;
    assert.strictEqual(g.ground, '#112233'); assert.strictEqual(g.crossColor, '#ffffff'); assert.strictEqual(g.flat, true);
    assert.strictEqual(g.crossSize, 200); assert.strictEqual(g.chatFont, 10); assert.strictEqual(g.chatOpacity, 20);
    assert.strictEqual(g.vol.goal, 100); assert.ok(!('x' in g.vol));
  });

  console.log('temas, favoritas, voltar à sala');
  await test('tema de cor é enviado ao jogo; tema desconhecido é ignorado', async () => {
    await H.ipc['config:set'](trusted, { theme: 'blue' }); await M.pollRoom();
    assert.strictEqual(game.pushed.accent, M.palette(M.config.accent, 'blue').accent);
    assert.notStrictEqual(game.pushed.accent, M.palette(M.config.accent, 'red').accent);
    await H.ipc['config:set'](trusted, { theme: 'rainbow' }); assert.strictEqual(M.config.theme, 'blue');
    assert.strictEqual(M.palette(72, 'white').on, '#111114');
  });
  await test('sala favorita não some quando a lista enche, e continua favorita ao entrar de novo', async () => {
    M.addHistory('FavRoom01', 'Minha sala');
    assert.strictEqual(await H.ipc.action(trusted, 'history:fav', 'FavRoom01'), true);
    for (let i = 0; i < 15; i++) M.addHistory('Cheia' + i + 'xx', 'Sala ' + i);
    const fav = M.config.history.find((r) => r.code === 'FavRoom01');
    assert.ok(fav && fav.fav); assert.strictEqual(M.config.history.filter((r) => !r.fav).length, 10);
    M.addHistory('FavRoom01', ''); assert.ok(M.config.history[0].code === 'FavRoom01' && M.config.history[0].fav && M.config.history[0].name === 'Minha sala');
    assert.strictEqual(await H.ipc.action(trusted, 'history:fav', 'NaoExiste1'), false);
  });
  await test('conexão caiu: com a opção ligada volta sozinho para a mesma sala; expulsão nunca', async () => {
    game.inRoom = false; await M.pollRoom();
    socket('wss://p2p.haxball.com/client?id=Queda1234'); game.inRoom = true; game.name = 'Sala da queda'; await M.pollRoom();
    await H.ipc['config:set'](trusted, { autoRejoin: true });
    game.inRoom = false; game.dropped = 'You were kicked'; H.loaded.length = 0; await M.pollRoom();
    assert.strictEqual(H.loaded.length, 0);
    assert.strictEqual((await H.ipc['state:get'](trusted)).canRejoin, false);
    game.dropped = 'Connection closed'; await M.pollRoom();
    assert.ok(/play\?c=Queda1234$/.test(H.loaded[0]));
    await M.pollRoom(); assert.strictEqual(H.loaded.length, 1);          // não tenta de novo em seguida
    const st = await H.ipc['state:get'](trusted); assert.strictEqual(st.lastRoom, 'Sala da queda'); assert.ok(st.dropped && st.canRejoin);
    game.dropped = ''; await H.ipc['config:set'](trusted, { autoRejoin: false });
    H.loaded.length = 0; assert.strictEqual(await H.ipc.action(trusted, 'rejoin'), true); assert.strictEqual(H.loaded.length, 1);
  });

  console.log('filtro do chat, exportar/importar, arquivos, atualização');
  await test('filtro do chat é limpo (minúsculas, sem repetidos) e enviado ao jogo', async () => {
    await H.ipc['config:set'](trusted, { chat: { hideJoin: true, words: ['Spam', 'spam', '  ', 'x'.repeat(50)], players: 'todos' } });
    assert.deepStrictEqual(M.config.chat.words, ['spam', 'x'.repeat(30)]); assert.deepStrictEqual(M.config.chat.players, []);
    await M.pollRoom(); assert.strictEqual(game.pushed.chat.hideJoin, true);
  });
  await test('exportar e importar: o arquivo passa pela mesma validação da interface', async () => {
    const data = JSON.parse(JSON.stringify(M.exportData()));
    assert.ok(data.void === 1 && data.game && data.profiles && data.favorites.some((r) => r.code === 'FavRoom01'));
    assert.ok(!('history' in data) && !('bounds' in data) && !('sounds' in data));
    data.theme = 'green'; data.game.ground = 'javascript:alert(1)'; data.game.nameSize = 150; data.profiles = [{ name: 'Importado', avatar: 'zzzz' }];
    data.favorites.push({ code: 'NovaFav123', name: 'Sala do amigo' }, { code: 'bad code!' }); data.history = [{ code: 'Injetada1' }];
    assert.strictEqual(M.applyImport(data), true);
    assert.strictEqual(M.config.theme, 'green'); assert.strictEqual(M.config.game.nameSize, 150); assert.strictEqual(M.config.game.ground, '#112233');
    assert.deepStrictEqual(M.config.profiles, [{ name: 'Importado', avatar: 'zz' }]);
    assert.ok(M.config.history.some((r) => r.code === 'NovaFav123' && r.fav)); assert.ok(!M.config.history.some((r) => r.code === 'Injetada1'));
    assert.strictEqual(M.applyImport({ game: {} }), false); assert.strictEqual(M.applyImport('x'), false);
    const out = path.join(tmp, 'exp.json'); H.save = { canceled: false, filePath: out };
    assert.strictEqual(await H.ipc.action(trusted, 'export'), true); assert.strictEqual(JSON.parse(fs.readFileSync(out, 'utf8')).void, 1);
    H.pick = { canceled: false, filePaths: [out] }; assert.strictEqual(await H.ipc.action(trusted, 'import'), true);
    fs.writeFileSync(out, 'não é json'); assert.strictEqual(await H.ipc.action(trusted, 'import'), false);
    H.pick = { canceled: true, filePaths: [] }; assert.strictEqual(await H.ipc.action(trusted, 'import'), null);
  });
  await test('som próprio: copiado para a pasta do app e enviado ao jogo; tipo ou tamanho errado é recusado', async () => {
    const snd = path.join(tmp, 'meu chute.ogg'); fs.writeFileSync(snd, Buffer.from('OggS-fake'));
    H.pick = { canceled: false, filePaths: [snd] };
    assert.strictEqual(await H.ipc.action(trusted, 'sound:pick', 'kick'), true);
    assert.strictEqual(M.config.sounds.kick.file, 'kick.ogg'); assert.strictEqual(M.config.sounds.kick.name, 'meu chute.ogg');
    assert.ok(fs.existsSync(path.join(tmp, 'sounds', 'kick.ogg')));
    game.snd = []; game.sound = null; await M.pollRoom(); await new Promise((r) => setImmediate(r));
    assert.deepStrictEqual(game.sound, ['kick', Buffer.from('OggS-fake').toString('base64')]);
    assert.strictEqual(await H.ipc.action(trusted, 'sound:pick', '../x'), false);
    const exe = path.join(tmp, 'a.exe'); fs.writeFileSync(exe, 'x'); H.pick = { canceled: false, filePaths: [exe] };
    assert.strictEqual(await H.ipc.action(trusted, 'sound:pick', 'goal'), 'type');
    const big = path.join(tmp, 'big.wav'); fs.writeFileSync(big, Buffer.alloc(1600000)); H.pick = { canceled: false, filePaths: [big] };
    assert.strictEqual(await H.ipc.action(trusted, 'sound:pick', 'goal'), 'size');
    assert.strictEqual(await H.ipc.action(trusted, 'sound:clear', 'kick'), true); assert.ok(!M.config.sounds.kick);
  });
  await test('imagem de fundo: escolher, ler e remover', async () => {
    const img = path.join(tmp, 'fundo.png'); fs.writeFileSync(img, Buffer.from([137, 80, 78, 71])); H.pick = { canceled: false, filePaths: [img] };
    assert.strictEqual(await H.ipc.action(trusted, 'bg:pick'), true);
    assert.ok((await H.ipc.action(trusted, 'bg:get')).startsWith('data:image/png;base64,'));
    assert.ok((await H.ipc['state:get'](trusted)).bgRev > 0);
    await H.ipc['config:set'](trusted, { bg: { dim: 40, file: '../../segredo.txt' } });
    assert.strictEqual(M.config.bg.dim, 40); assert.strictEqual(M.config.bg.file, 'menu-bg.png');
    await H.ipc.action(trusted, 'bg:clear'); assert.strictEqual(await H.ipc.action(trusted, 'bg:get'), '');
    assert.strictEqual((await H.ipc['state:get'](trusted)).bgRev, 0);
  });
  await test('aviso de atualização: compara versões e só aceita repositório do GitHub', () => {
    assert.ok(M.isNewer('v1.6.0', '1.5.0') && M.isNewer('1.5.1', '1.5.0') && M.isNewer('2.0', '1.9.9'));
    assert.ok(!M.isNewer('1.5.0', '1.5.0') && !M.isNewer('1.4.9', '1.5.0') && !M.isNewer('abc', '1.5.0'));
    assert.strictEqual(M.repoName('fulano/void-haxball-mod'), 'fulano/void-haxball-mod');
    assert.strictEqual(M.repoName('https://github.com/fulano/void-haxball-mod.git'), 'fulano/void-haxball-mod');
    assert.strictEqual(M.repoName({ type: 'git', url: 'git+https://github.com/fulano/void.git' }), 'fulano/void');
    assert.strictEqual(M.repoName('https://evil.example/a/b'), ''); assert.strictEqual(M.repoName(''), '');
  });

  console.log('perfis e ações rápidas');
  await test('perfis são limpos (apelido até 25, avatar até 2, no máximo 12)', async () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ name: 'Jogador ' + i, avatar: 'abcd' }));
    await H.ipc['config:set'](trusted, { profiles: [{ name: '  ' }, { name: 'x'.repeat(40), avatar: '\u{1F525}\u{1F525}\u{1F525}' }].concat(many) });
    assert.strictEqual(M.config.profiles.length, 12);
    assert.strictEqual(M.config.profiles[0].name.length, 25);
    assert.strictEqual(Array.from(M.config.profiles[0].avatar).length, 2);
    assert.strictEqual(M.config.profiles[1].avatar, 'ab');
  });
  await test('trocar de perfil fora de sala grava no jogo e recarrega', async () => {
    game.inRoom = false; H.reloads = 0;
    assert.strictEqual(await H.ipc.action(trusted, 'profile', 1), 'reload');
    assert.deepStrictEqual(game.profile, { name: 'Jogador 0', avatar: 'ab' });
    assert.strictEqual(H.reloads, 1);
  });
  await test('dentro de uma sala o avatar muda pelo comando /avatar, sem recarregar', async () => {
    game.inRoom = true; H.reloads = 0; H.sent.length = 0;
    assert.strictEqual(await H.ipc.action(trusted, 'profile', 2), 'room');
    assert.deepStrictEqual(H.sent, ['/avatar ab']); assert.strictEqual(H.reloads, 0);
  });
  await test('perfil que não existe não faz nada', async () => {
    assert.strictEqual(await H.ipc.action(trusted, 'profile', 99), false);
  });
  await test('ação rápida envia o comando salvo; índice inválido não envia', async () => {
    await H.ipc['config:set'](trusted, { quick: [{ label: 'Avatar 7', cmd: '/avatar 7' }, { cmd: '' }, { cmd: '/extrapolation 0' }] });
    assert.strictEqual(M.config.quick.length, 2); assert.strictEqual(M.config.quick[1].label, '/extrapolation 0');
    H.sent.length = 0; await new Promise((r) => setTimeout(r, 450));
    assert.strictEqual(await H.ipc.action(trusted, 'quick', 0), true);
    assert.deepStrictEqual(H.sent, ['/avatar 7']);
    assert.strictEqual(await H.ipc.action(trusted, 'quick', 7), false);
  });
  // a pasta private/ (módulo pessoal) não existe no repositório público: o teste cobre os dois casos
  const hasPrivate = fs.existsSync(path.join(__dirname, '..', 'private', 'netcode-core.js'));
  await test(hasPrivate ? 'com o módulo pessoal, o OP Mode recebe só valores validados' : 'sem o módulo pessoal, a ação do OP Mode é recusada', async () => {
    const r = await H.ipc.action(trusted, 'op', { on: true, value: 1e9, key: 'x"; alert(1)//' });
    if (!hasPrivate) { assert.strictEqual(r, false); assert.strictEqual(game.op, null); return; }
    assert.strictEqual(r, true); assert.deepStrictEqual(game.op, { on: true, value: 9999 });
    await H.ipc.action(trusted, 'op', { ping: '20+' }); assert.deepStrictEqual(game.op, { ping: '20+' });          // ping falso: só número, com + ou - no final
    await H.ipc.action(trusted, 'op', { ping: '9+; alert(1)//' }); assert.deepStrictEqual(game.op, {});
  });

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('\n' + passed + ' testes passaram' + (process.exitCode ? ' (HÁ FALHAS)' : '.'));
})();
