// VOID HaxBall Mod - "Jogando HaxBall" no perfil do Discord (Rich Presence).
//
// O aplicativo do Discord, quando está aberto no computador, deixa outros programas avisarem o que você está
// jogando por um canal local (um "pipe" chamado discord-ipc-0 ... discord-ipc-9). Nada passa pela internet
// a partir daqui: quem publica no seu perfil é o próprio Discord.
//
// Cada mensagem tem um cabeçalho de 8 bytes (tipo e tamanho, dois inteiros de 32 bits) seguido de um JSON:
//   tipo 0 = apresentação  { v: 1, client_id: "<ID do aplicativo>" }
//   tipo 1 = comando       { cmd: "SET_ACTIVITY", args: { pid, activity }, nonce }
// Não usa nenhuma biblioteca externa.
const net = require('net');
const path = require('path');

const APP_ID = /^\d{17,20}$/;

function encode(op, obj) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8'), head = Buffer.alloc(8);
  head.writeInt32LE(op, 0); head.writeInt32LE(body.length, 4);
  return Buffer.concat([head, body]);
}
// lê as mensagens completas que já chegaram; devolve as mensagens e o que sobrou do buffer
function decode(buf) {
  const out = [];
  while (buf.length >= 8) {
    const len = buf.readInt32LE(4);
    if (len < 0 || len > 1 << 20) return { messages: out, rest: Buffer.alloc(0) };
    if (buf.length < 8 + len) break;
    try { out.push({ op: buf.readInt32LE(0), data: JSON.parse(buf.slice(8, 8 + len).toString('utf8')) }); } catch (e) { }
    buf = buf.slice(8 + len);
  }
  return { messages: out, rest: buf };
}
function pipePaths() {
  const base = process.platform === 'win32' ? '\\\\?\\pipe\\' : path.join(process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || '/tmp', '/');
  return Array.from({ length: 10 }, (_, i) => base + 'discord-ipc-' + i);
}
// o Discord exige textos de 2 a 128 caracteres
function text(t) { t = String(t == null ? '' : t).replace(/\s+/g, ' ').trim().slice(0, 120); return t.length >= 2 ? t : t + '  '; }

// O que aparece no perfil: "HaxBall" na primeira linha e a sala (ou "No menu") na segunda.
function buildActivity(o) {
  const en = o.lang === 'en';
  const state = !o.inRoom ? (en ? 'In the menu' : 'No menu') : (o.showRoom && o.roomName ? (en ? 'Room: ' : 'Sala: ') + o.roomName : (en ? 'In a room' : 'Em uma sala'));
  return { details: text('HaxBall · VOID'), state: text(state), timestamps: { start: Math.floor(o.since / 1000) },
    // Imagem: o Discord procura, no seu aplicativo, uma imagem enviada em "Rich Presence > Art Assets" com o nome "void".
    // Se ela não existir, o perfil fica sem imagem (ou com o ícone do aplicativo); nada quebra.
    assets: { large_image: 'void', large_text: 'VOID HaxBall Mod' }, instance: false };
}

function createPresence(log, paths) {
  let sock = null, ready = false, appId = '', buf = Buffer.alloc(0), wanted = null, sentKey = '', status = 'off', nonce = 0, lastTry = 0;

  function send(op, obj) { try { if (sock) sock.write(encode(op, obj)); } catch (e) { } }
  function flush() {
    if (!ready) return;
    const key = JSON.stringify(wanted);
    if (key === sentKey) return;                       // só fala com o Discord quando algo mudou
    sentKey = key;
    send(1, { cmd: 'SET_ACTIVITY', args: { pid: process.pid, activity: wanted || undefined }, nonce: String(++nonce) });
  }
  function drop(next) {
    ready = false; sentKey = ''; buf = Buffer.alloc(0);
    if (sock) { try { sock.destroy(); } catch (e) { } sock = null; }
    status = next;
  }
  function tryPipe(list, i) {
    if (i >= list.length) { drop('nodiscord'); return; }   // Discord fechado (ou versão de navegador, que não tem esse canal)
    const s = net.createConnection(list[i]);
    let open = false;
    s.once('connect', () => { open = true; sock = s; send(0, { v: 1, client_id: appId }); });
    s.on('data', (chunk) => {
      const r = decode(Buffer.concat([buf, chunk])); buf = r.rest;
      for (const m of r.messages) {
        if (m.op === 1 && m.data && m.data.evt === 'READY') { ready = true; status = 'ok'; flush(); }
        else if (m.op === 2) { if (log) log('discord recusou: ' + String((m.data && m.data.message) || '').slice(0, 80)); drop('badid'); }
        else if (m.op === 3) send(4, m.data);            // ping -> pong
      }
    });
    s.on('error', () => { if (!open) tryPipe(list, i + 1); });
    s.on('close', () => { if (open && sock === s) drop(status === 'badid' ? 'badid' : 'nodiscord'); });
  }

  return {
    // chamado a cada poucos segundos pelo app com o estado atual
    update(o) {
      const on = !!o.on, id = APP_ID.test(o.appId || '') ? o.appId : '';
      if (!on) { if (sock) { wanted = null; flush(); } drop('off'); return; }
      if (!id) { drop('noid'); return; }
      if (id !== appId) { drop('connecting'); appId = id; lastTry = 0; }
      wanted = buildActivity(o);
      if (sock) { flush(); return; }
      if (Date.now() - lastTry < 20000) return;        // Discord fechado: tenta de novo a cada 20 s
      lastTry = Date.now();
      if (status !== 'badid') status = 'connecting';
      tryPipe(paths || pipePaths(), 0);
    },
    close() { if (sock && ready) { wanted = null; flush(); } drop('off'); },
    get status() { return status; }
  };
}

module.exports = { createPresence, buildActivity, encode, decode, APP_ID };
