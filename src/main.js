// VOID HaxBall Mod - processo principal (Electron).
const { app, BrowserWindow, protocol, net, shell, Menu, ipcMain, session, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const { patchOfficial } = require('./patcher');
const { createPresence, APP_ID } = require('./discord');

const VERSION = '1.0';
const START_URL = 'https://www.haxball.com/play';
const AD_HOSTS = ['doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'adnxs.com',
  'amazon-adsystem.com', 'adservice.google.com', 'adsafeprotected.com', 'adinplay.com', 'pubmatic.com',
  'rubiconproject.com', 'criteo.com', 'taboola.com', 'outbrain.com'];

const DEFAULTS = {
  mode: 'auto', hideAds: true, fps: false, alwaysOnTop: false, zoom: 0,
  autoMsg: { text: '', onJoin: false }, layout: {}, collapsed: {}, toggleKey: 'ShiftRight', bounds: null,
  accent: 72, recording: false, history: [],
  lang: 'pt', splash: true, theme: 'red', autoRejoin: false,
  titleBar: true, hideSite: true,                          // barra de título do VOID; esconder o menu do site
  discord: { on: false, room: true, appId: '' },           // "Jogando HaxBall" no perfil do Discord
  chat: { hideJoin: false, words: [], players: [] },       // filtro do chat (só na sua tela)
  bg: { file: '', dim: 70 },                               // imagem de fundo do menu
  sounds: {},                                              // sons próprios: { kick|goal|mention: { file, name } }
  // personalização (aplicada dentro do jogo pelo core.js)
  game: {
    flat: false, ground: '#3d6b45', lineOn: false, lineColor: '#ffffff', ballOn: false, ballColor: '#ffd84a',
    cross: false, crossColor: '#ffffff', crossSize: 100, nameSize: 100, hideAvatars: false,
    kickLine: false, kickColor: '#ffffff', kickRange: 160, kickExt: 140, kickRing: false, kickRingColor: '#ffd84a', teamOn: false, teamRed: '#e56e56', teamBlue: '#5689e5',
    vol: { goal: 100, kick: 100, chat: 100 },
    chatFont: 0, chatOpacity: 100, hideScore: false, hideTimer: false
  },
  profiles: [],                                            // { name, avatar }
  quick: [                                                 // ações rápidas: { label, cmd }
    { label: 'Extrapolation 0', cmd: '/extrapolation 0' },
    { label: 'Limpar avatar', cmd: '/clear_avatar' },
    { label: 'Chat Bubble', cmd: '/chat_bubble' }
  ]
};
const LIST_MAX = 12;
const HISTORY_MAX = 10, FAV_MAX = 10;
const ROOM_CODE = /^[\w-]{4,64}$/;

let win = null, config = JSON.parse(JSON.stringify(DEFAULTS)), cfgPath = '', logPath = '';
const status = { served: false, mode: 'auto', applied: [], skipped: [], note: '' };
const seenHosts = new Set();
let capturingKey = false, shiftArmed = false, lastSend = 0, lastAuto = 0, wasInRoom = false;
let lastRoomCode = '', rejoinTries = 0, lastRejoin = 0, dropped = '', update = null, bgRev = 0;
let pendingRoom = null, currentRoom = null, roomState = { inRoom: false, name: '', bubble: false, nick: '', avatar: '', op: null };

const root = path.join(__dirname, '..');
const read = (f, enc) => fs.readFileSync(path.join(__dirname, f), enc);

// ---------- módulo privado opcional (pasta private/, ignorada pelo git) ----------
const priv = { core: '', patches: [], frozen: null, active: false };
function loadPrivate() {
  const dir = path.join(root, 'private');
  try {
    if (fs.existsSync(path.join(dir, 'netcode-core.js')) && fs.existsSync(path.join(dir, 'netcode-patches.js'))) {
      priv.core = fs.readFileSync(path.join(dir, 'netcode-core.js'), 'utf8');
      priv.patches.push(require(path.join(dir, 'netcode-patches.js')));
      priv.active = true;
    }
    const fz = path.join(dir, 'game-min.frozen.js');
    if (fs.existsSync(fz)) priv.frozen = fs.readFileSync(fz, 'utf8');
  } catch (e) { log('erro ao carregar módulo privado: ' + e.message); }
}


function log(msg) {
  try { fs.appendFileSync(logPath, new Date().toISOString().slice(11, 19) + ' ' + msg + '\n'); } catch (e) { }
}
function saveConfig() { try { fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2)); } catch (e) { log('erro ao salvar config: ' + e.message); } }
function loadConfig() {
  let saved = {};
  try { saved = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch (e) { }
  config = { ...JSON.parse(JSON.stringify(DEFAULTS)), ...saved };
  // migração: a versão antiga tinha 4 mensagens rápidas
  if (Array.isArray(saved.quickChat) && !(saved.autoMsg && saved.autoMsg.text)) {
    config.autoMsg = { text: String(saved.quickChat.find((t) => t) || '').slice(0, 140), onJoin: false };
  }
  delete config.quickChat;
  if (!['auto', 'frozen', 'original'].includes(config.mode)) config.mode = 'auto';
  config.accent = clampAccent(config.accent);
  config.recording = config.recording === true;
  config.history = cleanHistory(config.history);
  config.lang = config.lang === 'en' ? 'en' : 'pt';
  config.splash = config.splash !== false;
  config.game = cleanGame(saved.game, DEFAULTS.game);
  if (saved.game && saved.game.vol && saved.game.vol.crowd != null && saved.game.vol.crowd < config.game.vol.goal) config.game.vol.goal = clampInt(saved.game.vol.crowd, 0, 100, 100);   // 1.4 tinha "torcida" separada
  config.theme = THEME_NAMES.includes(config.theme) ? config.theme : 'red';
  config.autoRejoin = config.autoRejoin === true;
  config.titleBar = config.titleBar !== false; config.hideSite = config.hideSite !== false;
  config.discord = cleanDiscord(saved.discord, DEFAULTS.discord);
  config.chat = cleanChat(saved.chat, DEFAULTS.chat);
  config.sounds = cleanSounds(saved.sounds);
  config.bg = cleanBg(null, saved.bg || DEFAULTS.bg);
  config.profiles = cleanProfiles(saved.profiles);
  config.quick = Array.isArray(saved.quick) ? cleanQuick(saved.quick) : JSON.parse(JSON.stringify(DEFAULTS.quick));
  config.layout = config.layout && config.layout.menu ? { menu: config.layout.menu } : {};
  delete config.collapsed;
}

// ---------- personalização: tudo que vem da interface é validado aqui ----------
const HEX = /^#[0-9a-f]{6}$/i;
const clampInt = (v, min, max, def) => { v = Math.round(Number(v)); return isFinite(v) ? Math.min(max, Math.max(min, v)) : def; };
const chars = (t, n) => Array.from(String(t == null ? '' : t).replace(/[\x00-\x1f\x7f]/g, '').trim()).slice(0, n).join('');
function cleanGame(g, base) {
  const b = base || config.game, D = DEFAULTS.game, out = {};
  for (const k of Object.keys(D)) out[k] = k === 'vol' ? {} : (typeof b[k] === typeof D[k] ? b[k] : D[k]);
  for (const k of Object.keys(D.vol)) out.vol[k] = clampInt(b.vol && b.vol[k], 0, 100, D.vol[k]);
  if (!g || typeof g !== 'object') return out;
  for (const k of ['flat', 'lineOn', 'ballOn', 'cross', 'hideAvatars', 'hideScore', 'hideTimer', 'kickLine', 'kickRing', 'teamOn']) if (typeof g[k] === 'boolean') out[k] = g[k];
  if (g.kickRange != null) out.kickRange = clampInt(g.kickRange, 40, 1000, out.kickRange);
  if (g.kickExt != null) out.kickExt = clampInt(g.kickExt, 0, 600, out.kickExt);
  for (const k of ['ground', 'lineColor', 'ballColor', 'crossColor', 'kickColor', 'kickRingColor', 'teamRed', 'teamBlue']) if (typeof g[k] === 'string' && HEX.test(g[k])) out[k] = g[k].toLowerCase();
  if (g.crossSize != null) out.crossSize = clampInt(g.crossSize, 60, 200, out.crossSize);
  if (g.nameSize != null) out.nameSize = clampInt(g.nameSize, 60, 200, out.nameSize);
  if (g.chatFont != null) { const f = clampInt(g.chatFont, 0, 24, out.chatFont); out.chatFont = f && f < 10 ? 10 : f; }   // 0 = tamanho do jogo
  if (g.chatOpacity != null) out.chatOpacity = clampInt(g.chatOpacity, 20, 100, out.chatOpacity);
  if (g.vol && typeof g.vol === 'object') for (const k of Object.keys(out.vol)) if (g.vol[k] != null) out.vol[k] = clampInt(g.vol[k], 0, 100, out.vol[k]);
  return out;
}
function cleanDiscord(d, base) {
  const b = base || config.discord || DEFAULTS.discord, out = { on: !!b.on, room: b.room !== false, appId: APP_ID.test(b.appId || '') ? b.appId : '' };
  if (!d || typeof d !== 'object') return out;
  if (typeof d.on === 'boolean') out.on = d.on;
  if (typeof d.room === 'boolean') out.room = d.room;
  if (typeof d.appId === 'string') { const id = d.appId.trim(); if (id === '' || APP_ID.test(id)) out.appId = id; }
  return out;
}
function cleanWords(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((t) => chars(t, 30).toLowerCase()).filter(Boolean))].slice(0, 30);
}
function cleanChat(c, base) {
  const b = base || config.chat || DEFAULTS.chat;
  const out = { hideJoin: !!b.hideJoin, words: cleanWords(b.words), players: cleanWords(b.players) };
  if (!c || typeof c !== 'object') return out;
  if (typeof c.hideJoin === 'boolean') out.hideJoin = c.hideJoin;
  if (Array.isArray(c.words)) out.words = cleanWords(c.words);
  if (Array.isArray(c.players)) out.players = cleanWords(c.players);
  return out;
}
const SOUND_SLOTS = ['kick', 'goal', 'mention'];
const SAFE_FILE = /^[\w-]{1,24}\.[a-z0-9]{2,5}$/;
function cleanSounds(o) {
  const out = {};
  if (o && typeof o === 'object') for (const k of SOUND_SLOTS) if (o[k] && SAFE_FILE.test(o[k].file || '')) out[k] = { file: o[k].file, name: chars(o[k].name, 40) || o[k].file };
  return out;
}
function cleanBg(o, base) {
  const b = base || config.bg || DEFAULTS.bg, out = { file: SAFE_FILE.test(b.file || '') ? b.file : '', dim: clampInt(b.dim, 0, 95, 70) };
  if (o && typeof o === 'object' && o.dim != null) out.dim = clampInt(o.dim, 0, 95, out.dim);
  return out;
}
function cleanProfiles(list) {
  if (!Array.isArray(list)) return [];
  return list.map((p) => ({ name: chars(p && p.name, 25), avatar: chars(p && p.avatar, 2) })).filter((p) => p.name).slice(0, LIST_MAX);
}
function cleanQuick(list) {
  if (!Array.isArray(list)) return [];
  return list.map((q) => ({ label: chars(q && q.label, 22), cmd: chars(q && q.cmd, 140) }))
    .filter((q) => q.cmd).map((q) => ({ label: q.label || q.cmd.slice(0, 22), cmd: q.cmd })).slice(0, LIST_MAX);
}

// ---------- cor de destaque (intensidade do vermelho) ----------
// 0 = vermelho escuro e apagado, 100 = vermelho vivo. O padrão (72) é o vermelho original da interface.
// A mesma fórmula existe em ui.js (para a pré-visualização ao arrastar o controle).
function clampAccent(v) { v = Math.round(Number(v)); return isFinite(v) ? Math.min(100, Math.max(0, v)) : DEFAULTS.accent; }
function hslHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, '0');
  return '#' + f(0) + f(8) + f(4);
}
function palette(t, theme) {
  const THEMES = { red: 355, blue: 215, purple: 268, green: 145, white: -1 };
  t = clampAccent(t);
  const hue = THEMES[theme] === undefined ? THEMES.red : THEMES[theme];
  const accent = hue < 0 ? hslHex(0, 0, 56 + t * 0.36) : hslHex(hue, 30 + t * 0.62, 25 + t * 0.34);
  const hi = hue < 0 ? hslHex(0, 0, 66 + t * 0.34) : hslHex(hue, 35 + t * 0.62, 34 + t * 0.34);
  const rgb = [1, 3, 5].map((i) => parseInt(accent.slice(i, i + 2), 16)).join(',');
  return { accent, hi, glow: 'rgba(' + rgb + ',.25)', on: hue < 0 ? '#111114' : '#ffffff' };
}
const THEME_NAMES = ['red', 'blue', 'purple', 'green', 'white'];

// ---------- histórico de salas ----------
// Fica salvo por ordem de uso (a mais recente primeiro). Favoritas não são apagadas quando a lista enche.
function cleanHistory(h) {
  if (!Array.isArray(h)) return [];
  let favs = 0, rest = 0;
  return h.filter((r) => r && ROOM_CODE.test(r.code))
    .map((r) => ({ code: r.code, name: String(r.name || '').slice(0, 60), at: Number(r.at) || 0, fav: r.fav === true }))
    .filter((r) => (r.fav ? ++favs <= FAV_MAX : ++rest <= HISTORY_MAX));
}
function addHistory(code, name) {
  if (!ROOM_CODE.test(code || '')) return;
  const old = config.history.find((r) => r.code === code);
  const entry = { code, name: String(name || (old && old.name) || '').slice(0, 60), at: Date.now(), fav: !!(old && old.fav) };
  config.history = cleanHistory([entry].concat(config.history.filter((r) => r.code !== code)));
  saveConfig();
}
function renameHistory(code, name) {
  const r = config.history.find((x) => x.code === code);
  if (r && name && r.name !== name) { r.name = String(name).slice(0, 60); saveConfig(); }
}
// o jogo abre uma conexão "client?id=<código da sala>" ao entrar numa sala
function noteSocket(url) {
  try {
    const u = new URL(url);
    const id = u.searchParams.get('id');
    if (/client\/?$/.test(u.pathname) && ROOM_CODE.test(id || '')) pendingRoom = { code: id, at: Date.now() };
  } catch (e) { }
}
function roomCodeFrom(text) {
  text = String(text || '').trim();
  if (ROOM_CODE.test(text)) return text;
  try { const c = new URL(text).searchParams.get('c'); return ROOM_CODE.test(c || '') ? c : null; } catch (e) { return null; }
}

const isAdHost = (h) => AD_HOSTS.some((d) => h === d || h.endsWith('.' + d));
const isHaxball = (h) => h === 'haxball.com' || h.endsWith('.haxball.com');

function jsResponse(code) {
  return new Response(code, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' } });
}

// Repassa a requisição sem mexer. Remove content-encoding/length porque net.fetch já descomprime o corpo.
async function passthrough(request) {
  const res = await net.fetch(request, { bypassCustomProtocolHandlers: true });
  const headers = new Headers(res.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');
  const noBody = [101, 204, 205, 304].includes(res.status);
  return new Response(noBody ? null : res.body, { status: res.status, statusText: res.statusText, headers });
}

async function serveGame(request) {
  status.mode = config.mode;
  status.applied = []; status.skipped = []; status.note = ''; status.served = false;
  if (config.mode === 'original') { status.note = 'Sem mod (jogo original).'; log('game-min.js: original'); return passthrough(request); }
  if (config.mode === 'frozen' && priv.frozen) {
    status.served = true; status.applied = ['cópia antiga'];
    log('game-min.js: cópia antiga servida');
    return jsResponse(priv.frozen);
  }
  try {
    const res = await net.fetch(request, { bypassCustomProtocolHandlers: true });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    try { fs.writeFileSync(path.join(app.getPath('userData'), 'game-min.official.js'), text); } catch (e) { }
    const r = patchOfficial(text, read('core.js', 'utf8') + '\n' + priv.core, priv.patches);
    status.served = true; status.applied = r.applied; status.skipped = r.skipped;
    if (!r.patched) status.note = 'Nenhum patch encaixou: jogo oficial rodando sem mod.';
    r.diag.forEach((d) => log('[diag] ' + d.slice(0, 600)));
    log('game-min.js oficial: aplicados=[' + r.applied.join(', ') + '] ignorados=[' + r.skipped.join('; ') + ']');
    return jsResponse(r.patched ? r.code : text);
  } catch (e) {
    status.note = 'Falha ao preparar o mod (' + e.message + '). Usando o original.';
    log('ERRO serveGame: ' + e.message);
    return passthrough(request);
  }
}

function registerHandler() {
  protocol.handle('https', async (request) => {
    try {
      const url = new URL(request.url);
      const host = url.hostname;
      if (config.hideAds && isAdHost(host)) {
        if (!seenHosts.has(host)) { seenHosts.add(host); log('anúncio bloqueado: ' + host); }
        return new Response(null, { status: 204 });
      }
      if (isHaxball(host) && /game-min\.js$/.test(url.pathname)) return await serveGame(request);
      if (!isHaxball(host) && seenHosts.size < 80 && !seenHosts.has(host)) { seenHosts.add(host); log('host externo: ' + host); }
      return await passthrough(request);
    } catch (e) {
      log('ERRO handler ' + request.url.slice(0, 80) + ': ' + e.message);
      return new Response('erro', { status: 502 });
    }
  });
}

function parseJoin(t) {
  t = (t || '').trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) { try { return isHaxball(new URL(t).hostname) ? t : null; } catch (e) { return null; } }
  if (/^[\w-]{4,}$/.test(t)) return START_URL + '?c=' + encodeURIComponent(t);
  return null;
}

// ---------- chat ----------
const CHAT_INPUT = '.chatbox-view [data-hook="input"], .chatbox-view input[type="text"]';
async function inEachFrame(code) {
  if (!win) return false;
  const frames = win.webContents.mainFrame.framesInSubtree || [win.webContents.mainFrame];
  for (const f of frames) { try { if (await f.executeJavaScript(code)) return true; } catch (e) { } }
  return false;
}
async function sendChat(text) {
  text = String(text || '').trim().slice(0, 140);
  // anti-spam: no máximo 1 mensagem a cada 3 s. Comandos ("/algo") ficam só no seu jogo, então o intervalo é curto.
  if (!text || Date.now() - lastSend < (text[0] === '/' ? 400 : 3000)) return false;
  const code = '(function(t){var i=document.querySelector(' + JSON.stringify(CHAT_INPUT) + ');if(!i)return false;' +
    'i.value=t;var b=document.querySelector(\'.chatbox-view [data-hook="send"]\');' +
    'if(b){b.click();}else{i.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",keyCode:13,which:13,bubbles:true}));}return true;})(' + JSON.stringify(text) + ')';
  const ok = await inEachFrame(code);
  if (ok) { lastSend = Date.now(); log('mensagem enviada'); }
  return ok;
}
// Passa a cor e o modo gravação para o jogo e lê o estado da sala (a cada 2,5 s).
function uiPayload() { return Object.assign(palette(config.accent, config.theme), { hidden: !!config.recording, game: config.game, chat: config.chat }); }
async function pollRoom() {
  if (!win) return;
  const code = '(function(){var H=window.HBMOD;if(!H||!H.roomInfo)return null;H.setUi(' + JSON.stringify(uiPayload()) + ');return H.roomInfo();})()';
  let info = null;
  const frames = win.webContents.mainFrame.framesInSubtree || [win.webContents.mainFrame];
  for (const f of frames) {
    try { const r = await f.executeJavaScript(code); if (r && (!info || r.inRoom)) info = r; } catch (e) { }
  }
  const gameReady = !!info;
  info = info || { inRoom: false, name: '', bubble: roomState.bubble };
  const inRoom = !!info.inRoom;

  if (inRoom && !wasInRoom) {
    // Mensagem automática: UMA mensagem, uma vez ao entrar na sala (se ligado), no mínimo 30 s entre envios.
    if (config.autoMsg.onJoin && config.autoMsg.text && Date.now() - lastAuto > 30000) {
      lastAuto = Date.now();
      setTimeout(() => sendChat(config.autoMsg.text), 2500);
    }
    // Histórico: só registra se o código da sala foi visto há pouco (evita gravar um código antigo).
    if (pendingRoom && Date.now() - pendingRoom.at < 90000) { currentRoom = pendingRoom.code; lastRoomCode = currentRoom; addHistory(currentRoom, info.name); }
    pendingRoom = null; rejoinTries = 0;
    // registra no log como a tela do jogo está montada (uma vez por sala): ajuda a ajustar o que não encaixar
    setTimeout(() => inGame('window.HBMOD&&HBMOD.domInfo?HBMOD.domInfo():null').then((d) => { if (d) log('[tela] ' + JSON.stringify(d).slice(0, 2500)); }).catch(() => { }), 4000);
  } else if (inRoom && currentRoom) {
    renameHistory(currentRoom, info.name);
  } else if (!inRoom && wasInRoom) {
    currentRoom = null;
  }
  const op = info.op && typeof info.op === 'object' ? { on: !!info.op.on, value: clampInt(info.op.value, -9999, 9999, 10), key: String(info.op.key || '').slice(0, 20), ping: /^\d{1,4}[+-]?$/.test(info.op.ping) ? info.op.ping : '' } : null;
  if (inRoom !== wasInRoom) since = Date.now();
  wasInRoom = inRoom;
  // conexão caiu (caixa "Disconnected" do jogo): volta sozinho, se ligado. Nunca depois de expulsão ou banimento.
  dropped = inRoom ? '' : String(info.dropped || '').slice(0, 120);
  if (dropped && config.autoRejoin && canRejoin() && Date.now() - lastRejoin > 15000 && rejoinTries < 3) { rejoinTries++; log('reentrando na sala (tentativa ' + rejoinTries + ')'); rejoin(); }
  updatePresence();
  if (gameReady) pushSounds(Array.isArray(info.snd) ? info.snd : []).catch(() => { });
  roomState = { inRoom, name: String(info.name || '').slice(0, 60), bubble: !!info.bubble, nick: chars(info.nick, 25), avatar: chars(info.avatar, 2), op };
}
const wasRemoved = (why) => /kick|ban/i.test(why || '');
function lastRoom() { return lastRoomCode ? config.history.find((r) => r.code === lastRoomCode) || { code: lastRoomCode, name: '' } : config.history.slice().sort((a, b) => b.at - a.at)[0] || null; }
function canRejoin() { return !!lastRoom() && !wasRemoved(dropped); }
function rejoin() {
  const r = lastRoom();
  if (!r || !win) return false;
  lastRejoin = Date.now(); pendingRoom = { code: r.code, at: Date.now() };
  win.loadURL(START_URL + '?c=' + encodeURIComponent(r.code));
  return true;
}

// ---------- arquivos do usuário (sons próprios e imagem de fundo ficam na pasta de dados do app) ----------
const userFile = (...p) => path.join(app.getPath('userData'), ...p);
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
async function pickFile(title, name, exts, maxBytes) {
  const r = await dialog.showOpenDialog(win, { title, properties: ['openFile'], filters: [{ name, extensions: exts }] });
  const f = r && !r.canceled && r.filePaths && r.filePaths[0];
  if (!f) return null;
  const ext = path.extname(f).slice(1).toLowerCase();
  if (!exts.includes(ext)) return { error: 'type' };
  if (fs.statSync(f).size > maxBytes) return { error: 'size' };
  return { path: f, ext, base: path.basename(f) };
}
async function pickSound(slot) {
  if (!SOUND_SLOTS.includes(slot)) return false;
  const f = await pickFile('VOID', 'Audio', ['ogg', 'wav', 'mp3'], 1500000);
  if (!f || f.error) return f ? f.error : null;
  fs.mkdirSync(userFile('sounds'), { recursive: true });
  for (const old of fs.readdirSync(userFile('sounds'))) if (old.startsWith(slot + '.')) fs.rmSync(userFile('sounds', old), { force: true });
  fs.copyFileSync(f.path, userFile('sounds', slot + '.' + f.ext));
  config.sounds[slot] = { file: slot + '.' + f.ext, name: chars(f.base, 40) }; saveConfig();
  await inGame('window.HBMOD&&HBMOD.setSound?HBMOD.setSound(' + JSON.stringify(slot) + ',null):false');   // o próximo ciclo envia o arquivo novo
  return true;
}
async function clearSound(slot) {
  if (!SOUND_SLOTS.includes(slot)) return false;
  delete config.sounds[slot]; saveConfig();
  await inGame('window.HBMOD&&HBMOD.setSound?HBMOD.setSound(' + JSON.stringify(slot) + ',null):false');
  return true;
}
// envia ao jogo os sons próprios que ele ainda não tem (um por ciclo)
async function pushSounds(loaded) {
  const slot = Object.keys(config.sounds).find((k) => !loaded.includes(k));
  if (!slot) return;
  let b64;
  try { b64 = fs.readFileSync(userFile('sounds', config.sounds[slot].file)).toString('base64'); } catch (e) { delete config.sounds[slot]; saveConfig(); return; }
  await inGame('window.HBMOD&&HBMOD.setSound?HBMOD.setSound(' + JSON.stringify(slot) + ',' + JSON.stringify(b64) + '):false');
}
async function pickBg() {
  const f = await pickFile('VOID', 'Image', ['png', 'jpg', 'jpeg', 'webp'], 4000000);
  if (!f || f.error) return f ? f.error : null;
  clearBgFile();
  fs.copyFileSync(f.path, userFile('menu-bg.' + f.ext));
  config.bg.file = 'menu-bg.' + f.ext; bgRev = Date.now(); saveConfig();
  return true;
}
function clearBgFile() { if (config.bg.file) { try { fs.rmSync(userFile(config.bg.file), { force: true }); } catch (e) { } } config.bg.file = ''; bgRev = Date.now(); }
function bgData() {
  if (!config.bg.file) return '';
  try { return 'data:' + MIME[config.bg.file.split('.').pop()] + ';base64,' + fs.readFileSync(userFile(config.bg.file)).toString('base64'); } catch (e) { return ''; }
}

// ---------- exportar / importar configurações (um arquivo .json) ----------
function exportData() {
  return { void: 1, version: VERSION, accent: config.accent, theme: config.theme, lang: config.lang, game: config.game, chat: config.chat,
    profiles: config.profiles, quick: config.quick, autoMsg: config.autoMsg, autoRejoin: config.autoRejoin,
    favorites: config.history.filter((r) => r.fav).map((r) => ({ code: r.code, name: r.name })) };
}
// tudo que vem do arquivo passa pela mesma validação do que vem da interface
function applyImport(data) {
  if (!data || typeof data !== 'object' || data.void !== 1) return false;
  Object.assign(config, sanitizePatch(data));
  if (Array.isArray(data.favorites)) {
    const favs = data.favorites.filter((r) => r && ROOM_CODE.test(r.code)).map((r) => ({ code: r.code, name: r.name, at: 0, fav: true }));
    const codes = new Set(favs.map((r) => r.code));
    config.history = cleanHistory(config.history.map((r) => (codes.delete(r.code) ? { ...r, fav: true } : r)).concat(favs.filter((r) => codes.has(r.code))));
  }
  saveConfig();
  return true;
}
async function exportConfig() {
  const r = await dialog.showSaveDialog(win, { title: 'VOID', defaultPath: 'void-config.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (!r || r.canceled || !r.filePath) return null;
  try { fs.writeFileSync(r.filePath, JSON.stringify(exportData(), null, 2)); return true; } catch (e) { log('erro ao exportar: ' + e.message); return false; }
}
async function importConfig() {
  const f = await pickFile('VOID', 'JSON', ['json'], 1000000);
  if (!f) return null;
  if (f.error) return false;
  try { const ok = applyImport(JSON.parse(fs.readFileSync(f.path, 'utf8'))); if (ok) pollRoom().catch(() => { }); return ok; } catch (e) { return false; }
}

// ---------- aviso de atualização ----------
// Lê o campo "repository" do package.json (ex.: "usuario/void-haxball-mod") e pergunta ao GitHub qual é a
// versão mais recente publicada em Releases. Só lê; não baixa nem instala nada.
function repoName(text) {
  try {
    const r = text === undefined ? require(path.join(root, 'package.json')).repository : text, t = typeof r === 'string' ? r : (r && r.url) || '';
    const m = /^(?:(?:git\+)?https?:\/\/github\.com\/|git@github\.com:|github:)?([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/.exec(t.trim());
    return m ? m[1] : '';
  } catch (e) { return ''; }
}
function isNewer(a, b) {
  const pa = String(a).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0), pb = String(b).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0); }
  return false;
}
async function checkUpdate() {
  const repo = repoName();
  if (!repo) return;
  try {
    const res = await net.fetch('https://api.github.com/repos/' + repo + '/releases/latest', { bypassCustomProtocolHandlers: true, headers: { accept: 'application/vnd.github+json' } });
    if (!res.ok) return;
    const tag = String((await res.json()).tag_name || '');
    const current = require(path.join(root, 'package.json')).version || VERSION;
    if (/^v?\d+(\.\d+){0,2}$/.test(tag) && isNewer(tag, current)) { update = { version: tag.replace(/^v/i, ''), url: 'https://github.com/' + repo + '/releases/latest' }; log('versão nova disponível: ' + tag); }
  } catch (e) { log('não foi possível verificar atualização: ' + e.message); }
}

// Discord: o estado atual vai para o perfil (se ligado). A sala só aparece se você deixar.
let presence = null, since = Date.now();

// ---------- barra de título própria ----------
// A janela é criada sem a barra do Windows; os botões de minimizar/maximizar/fechar continuam sendo os do
// sistema (desenhados por cima, com a cor que escolhemos) e a faixa com a logo é desenhada pelo ui.js.
// A cor é o tom do tema escurecido pela metade, para não brigar com o jogo.
const BAR_H = 34;
let barActive = false;
function barColor() {
  const a = palette(config.accent, config.theme).accent;
  return '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * 0.5).toString(16).padStart(2, '0')).join('');
}
function barOverlay() { return { color: barColor(), symbolColor: '#ffffff', height: BAR_H }; }
function syncBar() { try { if (barActive && win && win.setTitleBarOverlay) win.setTitleBarOverlay(barOverlay()); } catch (e) { } }
function updatePresence() {
  if (!presence) presence = createPresence(log);
  const d = config.discord;
  presence.update({ on: d.on && !config.recording, appId: d.appId, showRoom: d.room, inRoom: roomState.inRoom, roomName: roomState.name, lang: config.lang, since });
}
// roda um trecho em cada frame até um deles responder (o jogo fica dentro de um iframe)
async function inGame(code) {
  if (!win) return null;
  const frames = win.webContents.mainFrame.framesInSubtree || [win.webContents.mainFrame];
  for (const f of frames) { try { const r = await f.executeJavaScript(code); if (r) return r; } catch (e) { } }
  return null;
}
// Troca de perfil. O apelido só vale ao entrar numa sala, então: fora de sala o jogo é recarregado;
// dentro de sala o avatar muda na hora (comando /avatar) e o apelido fica salvo para a próxima sala.
async function useProfile(p) {
  p = cleanProfiles([p])[0];
  if (!p) return false;
  const ok = await inGame('window.HBMOD&&HBMOD.setProfile?HBMOD.setProfile(' + JSON.stringify(p) + '):false');
  if (!ok) return false;
  await pollRoom().catch(() => { });
  if (roomState.inRoom) { lastSend = 0; await sendChat(p.avatar ? '/avatar ' + p.avatar : '/clear_avatar'); return 'room'; }
  win.webContents.reloadIgnoringCache();
  return 'reload';
}
async function setOp(arg) {
  if (!priv.active || !arg || typeof arg !== 'object') return false;
  const o = {};
  if (typeof arg.on === 'boolean') o.on = arg.on;
  if (arg.value != null) o.value = clampInt(arg.value, -9999, 9999, 10);
  if (typeof arg.key === 'string' && /^[A-Za-z0-9]{0,20}$/.test(arg.key)) o.key = arg.key;
  if (typeof arg.ping === 'string' && /^(\d{1,4}[+-]?)?$/.test(arg.ping)) o.ping = arg.ping;   // '' desliga o ping falso
  const ok = await inGame('window.HBMOD&&HBMOD.op?(HBMOD.op.set(' + JSON.stringify(o) + '),true):false');
  if (ok) await pollRoom().catch(() => { });
  return !!ok;
}
async function setBubble(on) {
  if (!win) return false;
  const frames = win.webContents.mainFrame.framesInSubtree || [win.webContents.mainFrame];
  for (const f of frames) {
    try { if (await f.executeJavaScript('window.HBMOD&&HBMOD.setChatBubble?(HBMOD.setChatBubble(' + (on ? 'true' : 'false') + '),true):false')) { roomState.bubble = !!on; return true; } } catch (e) { }
  }
  return false;
}
function toggleRecording() {
  config.recording = !config.recording; saveConfig();
  pollRoom().catch(() => { });
  runUi('window.__hbui&&window.__hbui.refresh()');
  return config.recording;
}

function applyZoom() { if (win) win.webContents.setZoomLevel(config.zoom || 0); }
function runUi(js) { return win.webContents.executeJavaScript(js).catch(() => { }); }

async function doAction(name, arg) {
  const wc = win.webContents;
  switch (name) {
    case 'reload': wc.reloadIgnoringCache(); return true;
    case 'fullscreen': win.setFullScreen(!win.isFullScreen()); return true;
    case 'top': config.alwaysOnTop = !config.alwaysOnTop; win.setAlwaysOnTop(config.alwaysOnTop); saveConfig(); return true;
    case 'zoomin': config.zoom = Math.min(3, (config.zoom || 0) + 0.5); applyZoom(); saveConfig(); return true;
    case 'zoomout': config.zoom = Math.max(-3, (config.zoom || 0) - 0.5); applyZoom(); saveConfig(); return true;
    case 'shot': {
      try {
        const img = await wc.capturePage();
        const dir = path.join(app.getPath('pictures'), 'VOID-HaxBallMod');
        fs.mkdirSync(dir, { recursive: true });
        const f = path.join(dir, 'captura-' + new Date().toISOString().replace(/[:.]/g, '-') + '.png');
        fs.writeFileSync(f, img.toPNG());
        return f;
      } catch (e) { log('erro captura: ' + e.message); return null; }
    }
    case 'shotfolder': { const dir = path.join(app.getPath('pictures'), 'VOID-HaxBallMod'); fs.mkdirSync(dir, { recursive: true }); shell.openPath(dir); return true; }
    case 'join': {
      const u = parseJoin(arg); if (!u) return false;
      const c = roomCodeFrom(arg); if (c) pendingRoom = { code: c, at: Date.now() };
      win.loadURL(u); return true;
    }
    case 'history:clear': config.history = []; saveConfig(); return true;
    case 'history:remove': config.history = config.history.filter((r) => r.code !== String(arg)); saveConfig(); return true;
    case 'history:fav': {
      const r = config.history.find((x) => x.code === String(arg)); if (!r) return false;
      if (!r.fav && config.history.filter((x) => x.fav).length >= FAV_MAX) return 'full';
      r.fav = !r.fav; config.history = cleanHistory(config.history); saveConfig(); return true;
    }
    case 'rejoin': rejoinTries = 0; return rejoin();
    case 'export': return exportConfig();
    case 'import': return importConfig();
    case 'sound:pick': return pickSound(String(arg));
    case 'sound:clear': return clearSound(String(arg));
    case 'bg:pick': return pickBg();
    case 'bg:clear': clearBgFile(); saveConfig(); return true;
    case 'bg:get': return bgData();
    case 'update:open': if (update && update.url.startsWith('https://github.com/')) { shell.openExternal(update.url); return true; } return false;
    case 'rec': return toggleRecording();
    case 'bubble': return setBubble(arg === true);
    case 'log': shell.showItemInFolder(logPath); return true;
    case 'devtools': wc.toggleDevTools(); return true;
    case 'chat': return sendChat(arg === undefined ? config.autoMsg.text : arg);
    case 'quick': { const q = config.quick[Number(arg)]; return q ? sendChat(q.cmd) : false; }
    case 'profile': return useProfile(config.profiles[Number(arg)]);
    case 'op': return setOp(arg);
    case 'captureKey': capturingKey = true; return true;
    default: return false;
  }
}

// ---------- janela ----------
// ---------- tela de abertura ----------
// Uma janelinha sem borda com a logo, mostrada enquanto o HaxBall carrega. A janela principal só aparece
// quando a página terminou de carregar (ou depois de 10 s, para nunca ficar presa).
const SPLASH_MIN = 2400, SPLASH_MAX = 10000;
function createSplash() {
  if (!config.splash) return null;
  try {
    const s = new BrowserWindow({
      width: 560, height: 340, frame: false, resizable: false, center: true, skipTaskbar: true, alwaysOnTop: true,
      backgroundColor: '#08080a', title: 'VOID', icon: path.join(root, 'assets', 'icon.ico'),
      webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false }
    });
    s.loadFile(path.join(__dirname, 'splash.html'));
    return s;
  } catch (e) { log('erro na tela de abertura: ' + e.message); return null; }
}

function createWindow() {
  Menu.setApplicationMenu(null);
  const started = Date.now(), splash = createSplash();
  const b = config.bounds || {};
  win = new BrowserWindow({
    width: b.width || 1280, height: b.height || 800, x: b.x, y: b.y, title: 'VOID HaxBall Mod',
    icon: path.join(root, 'assets', 'icon.ico'),
    autoHideMenuBar: true, backgroundColor: '#0a0a0c', alwaysOnTop: !!config.alwaysOnTop, show: !splash,
    ...(config.titleBar ? { titleBarStyle: 'hidden', titleBarOverlay: barOverlay() } : {}),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  const wc = win.webContents;
  win.on('page-title-updated', (e) => e.preventDefault());           // mantém o título "VOID HaxBall Mod"
  if (splash) {
    let done = false;
    const reveal = () => {
      if (done) return; done = true;
      setTimeout(() => {
        try { win.show(); win.focus(); } catch (e) { }
        try { if (!splash.isDestroyed()) splash.close(); } catch (e) { }
      }, Math.max(0, SPLASH_MIN - (Date.now() - started)));
    };
    wc.once('did-finish-load', reveal);
    const guard = setTimeout(reveal, SPLASH_MAX); if (guard.unref) guard.unref();
  }

  wc.on('dom-ready', () => {
    applyZoom();
    wc.insertCSS('ins.adsbygoogle,[id^="google_ads"],[class*="adsbygoogle"]{display:none!important}').catch(() => { });
    wc.executeJavaScript(read('ui.js', 'utf8')).catch((e) => log('erro ui.js: ' + e.message));
  });
  wc.on('console-message', (...a) => {
    let level, msg, src;
    if (a[1] && typeof a[1] === 'object') ({ level, message: msg, sourceId: src } = a[1]); else { level = a[1]; msg = a[2]; src = a[4]; }
    if (level === 3 || level === 'error') log('[console] ' + String(msg).slice(0, 300) + ' @ ' + String(src).slice(-60));
  });
  wc.on('did-fail-load', (e, code, desc, url) => log('falha ao carregar ' + String(url).slice(0, 80) + ': ' + desc + ' (' + code + ')'));
  wc.on('render-process-gone', (e, d) => log('processo de renderização caiu: ' + d.reason));

  // segurança: o app só navega dentro do haxball.com; o resto abre no navegador padrão
  wc.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  wc.on('will-navigate', (e, url) => { try { if (!isHaxball(new URL(url).hostname)) { e.preventDefault(); shell.openExternal(url); } } catch (x) { e.preventDefault(); } });
  wc.on('will-attach-webview', (e) => e.preventDefault());

  // atalhos (valem também com o foco dentro do jogo)
  wc.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && capturingKey) {
      capturingKey = false;
      if (input.code !== 'Escape') { config.toggleKey = input.code; saveConfig(); }
      e.preventDefault(); return;
    }
    const tk = config.toggleKey || 'ShiftRight';
    if (input.type === 'keyDown') {
      shiftArmed = input.code === tk;                                  // só vale se a tecla for pressionada sozinha
      if (input.code === tk && tk !== 'ShiftRight' && tk !== 'ShiftLeft' && !input.isAutoRepeat) { runUi('window.__hbui&&window.__hbui.toggle()'); e.preventDefault(); return; }
      const k = input.key;
      if (k === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
      else if (k === 'F5') { wc.reloadIgnoringCache(); e.preventDefault(); }
      else if (k === 'F2') { runUi('window.__hbui&&window.__hbui.toggle()'); e.preventDefault(); }
      else if (k === 'F3') { runUi('window.__hbui&&window.__hbui.toggleFps()'); e.preventDefault(); }
      else if (k === 'F4') { toggleRecording(); e.preventDefault(); }
      else if (input.control && input.shift && k.toLowerCase() === 'i') { wc.toggleDevTools(); e.preventDefault(); }
      else if (input.alt && input.code === 'Digit1') { sendChat(config.autoMsg.text); e.preventDefault(); }
    } else if (input.type === 'keyUp') {
      if ((tk === 'ShiftRight' || tk === 'ShiftLeft') && input.code === tk && shiftArmed) { runUi('window.__hbui&&window.__hbui.toggle()'); }
      shiftArmed = false;
    }
  });

  barActive = !!config.titleBar;
  for (const ev of ['enter-full-screen', 'leave-full-screen']) win.on(ev, () => runUi('window.__hbui&&window.__hbui.refresh()'));   // em tela cheia a barra some
  win.on('close', () => { config.bounds = win.getBounds(); saveConfig(); });
  // quem abrir o app com um link de sala (…/play?c=CÓDIGO) também entra no histórico
  win.loadURL(START_URL);
  setInterval(() => pollRoom().catch(() => { }), 2500);
}

// ---------- IPC (só a página principal do haxball.com pode chamar) ----------
function trusted(e) {
  try { return !!win && e.senderFrame === win.webContents.mainFrame && isHaxball(new URL(e.senderFrame.url).hostname); } catch (x) { return false; }
}
const isNum = (n) => typeof n === 'number' && isFinite(n);

function sanitizePatch(p) {
  const out = {};
  if (!p || typeof p !== 'object') return out;
  if (['auto', 'frozen', 'original'].includes(p.mode) && (p.mode !== 'frozen' || priv.frozen)) out.mode = p.mode;
  if (typeof p.hideAds === 'boolean') out.hideAds = p.hideAds;
  if (typeof p.fps === 'boolean') out.fps = p.fps;
  if (typeof p.recording === 'boolean') out.recording = p.recording;
  if (typeof p.splash === 'boolean') out.splash = p.splash;
  if (typeof p.titleBar === 'boolean') out.titleBar = p.titleBar;
  if (typeof p.hideSite === 'boolean') out.hideSite = p.hideSite;
  if (typeof p.autoRejoin === 'boolean') out.autoRejoin = p.autoRejoin;
  if (p.discord && typeof p.discord === 'object') out.discord = cleanDiscord(p.discord);
  if (THEME_NAMES.includes(p.theme)) out.theme = p.theme;
  if (p.chat && typeof p.chat === 'object') out.chat = cleanChat(p.chat);
  if (p.bg && typeof p.bg === 'object') out.bg = cleanBg(p.bg);                 // só a transparência; o arquivo é escolhido pelo app
  if (p.lang === 'pt' || p.lang === 'en') out.lang = p.lang;
  if (p.game && typeof p.game === 'object') out.game = cleanGame(p.game);       // parcial: mescla com o que já está salvo
  if (Array.isArray(p.profiles)) out.profiles = cleanProfiles(p.profiles);
  if (Array.isArray(p.quick)) out.quick = cleanQuick(p.quick);
  if (isNum(p.accent)) out.accent = clampAccent(p.accent);
  if (p.autoMsg && typeof p.autoMsg === 'object') {
    out.autoMsg = { text: String(p.autoMsg.text == null ? config.autoMsg.text : p.autoMsg.text).slice(0, 140), onJoin: !!p.autoMsg.onJoin };
  }
  if (p.layout && typeof p.layout === 'object') {
    out.layout = {};
    const v = p.layout.menu;
    if (v && isNum(v.x) && isNum(v.y)) out.layout.menu = { x: Math.round(v.x), y: Math.round(v.y) };
  }
  return out;
}

function registerIpc() {
  ipcMain.handle('state:get', (e) => {
    if (!trusted(e)) return null;
    return {
      config, status, version: VERSION, capturing: capturingKey, room: roomState, palette: palette(config.accent, config.theme),
      discord: presence ? presence.status : 'off',
      bgRev: config.bg.file ? bgRev || 1 : 0, update, dropped, canRejoin: canRejoin(), lastRoom: (lastRoom() || {}).name || (lastRoom() || {}).code || '',
      bar: { active: barActive && !(win && win.isFullScreen && win.isFullScreen()), height: BAR_H, color: barColor(), restart: barActive !== !!config.titleBar },
      flags: { frozen: !!priv.frozen, privateModule: priv.active }
    };
  });
  ipcMain.handle('config:set', async (e, patch) => {
    if (!trusted(e)) return false;
    const p = sanitizePatch(patch);
    const modeBefore = config.mode, adsBefore = config.hideAds;
    if (p.layout) p.layout = { ...config.layout, ...p.layout };
    Object.assign(config, p);
    saveConfig();
    if ('accent' in p || 'theme' in p) syncBar();
    if ('accent' in p || 'theme' in p || 'recording' in p || 'game' in p || 'chat' in p || 'discord' in p) pollRoom().catch(() => { });
    if (config.mode !== modeBefore || config.hideAds !== adsBefore) {
      await session.defaultSession.clearCache();
      win.webContents.reloadIgnoringCache();
    }
    return true;
  });
  ipcMain.handle('action', (e, name, arg) => (trusted(e) ? doAction(String(name), arg) : false));
  ipcMain.on('log', (e, text) => { if (trusted(e)) log('[página] ' + String(text).slice(0, 600)); });
}

app.whenReady().then(() => {
  cfgPath = path.join(app.getPath('userData'), 'config.json');
  logPath = path.join(app.getPath('userData'), 'log.txt');
  try { fs.writeFileSync(logPath, ''); } catch (e) { }
  loadConfig();
  loadPrivate();
  // barra de título da janela escura (no lugar da branca do Windows), combinando com o VOID
  try { if (nativeTheme) nativeTheme.themeSource = 'dark'; } catch (e) { }
  log('VOID HaxBall Mod ' + VERSION + ' iniciado (modo ' + config.mode + ', módulo privado: ' + (priv.active ? 'sim' : 'não') + ')');
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => cb(['fullscreen', 'clipboard-sanitized-write'].includes(permission)));
  // só observa (não altera) a conexão do jogo, para saber o código da sala no histórico
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['wss://*/*', 'ws://*/*'] }, (d, cb) => { noteSocket(d.url); cb({}); });
  registerHandler();
  registerIpc();
  createWindow();
  const upd = setTimeout(() => checkUpdate(), 6000); if (upd.unref) upd.unref();
});
app.on('window-all-closed', () => { try { if (presence) presence.close(); } catch (e) { } app.quit(); });

// usado apenas pelos testes automáticos (tests/main.test.js)
if (process.env.VOID_TEST) {
  module.exports = { exportData, applyImport, isNewer, repoName, cleanChat, cleanHistory, palette, clampAccent, addHistory, noteSocket, roomCodeFrom, pollRoom, sanitizePatch, cleanGame, cleanProfiles, cleanQuick,
    get config() { return config; }, get roomState() { return roomState; }, get pendingRoom() { return pendingRoom; } };
}
