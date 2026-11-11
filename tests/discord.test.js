// Testes do Discord (src/discord.js) com um "Discord de mentira": um servidor local que fala o mesmo protocolo.
const assert = require('assert');
const net = require('net');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createPresence, buildActivity, encode, decode } = require('../src/discord');

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ok   ' + name); } catch (e) { console.error('  FALHA ' + name + '\n        ' + e.message); process.exitCode = 1; }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (fn) => { for (let i = 0; i < 100 && !fn(); i++) await wait(20); assert.ok(fn(), 'tempo esgotado'); };

(async () => {
  console.log('discord');
  await test('mensagens: cabeçalho de 8 bytes + JSON, inclusive quando chegam aos pedaços', () => {
    const a = encode(1, { cmd: 'X', txt: 'ação' }), b = encode(3, { n: 1 }), all = Buffer.concat([a, b]);
    const first = decode(all.slice(0, a.length + 5));
    assert.strictEqual(first.messages.length, 1); assert.strictEqual(first.messages[0].data.txt, 'ação');
    const second = decode(Buffer.concat([first.rest, all.slice(a.length + 5)]));
    assert.deepStrictEqual(second.messages, [{ op: 3, data: { n: 1 } }]); assert.strictEqual(second.rest.length, 0);
  });
  await test('texto do perfil: sala só aparece se permitido; idioma respeitado', () => {
    const base = { inRoom: true, roomName: 'Futsal x3', since: 5000 };
    assert.strictEqual(buildActivity({ ...base, showRoom: true, lang: 'pt' }).state, 'Sala: Futsal x3');
    assert.strictEqual(buildActivity({ ...base, showRoom: false, lang: 'pt' }).state, 'Em uma sala');
    assert.strictEqual(buildActivity({ ...base, inRoom: false, lang: 'en' }).state, 'In the menu');
    assert.strictEqual(buildActivity({ ...base, showRoom: true, lang: 'pt' }).timestamps.start, 5);
    assert.ok(buildActivity({ ...base, showRoom: true, roomName: 'x'.repeat(500) }).state.length <= 128);
    assert.deepStrictEqual(buildActivity({ ...base, lang: 'pt' }).assets, { large_image: 'void', large_text: 'VOID HaxBall Mod' });
  });

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'void-dc-'));
  const sockPath = process.platform === 'win32' ? '\\\\?\\pipe\\void-test-' + process.pid : path.join(dir, 'discord-ipc-0');
  const got = []; let conn = null, reject = false;
  const server = net.createServer((c) => {
    conn = c; let buf = Buffer.alloc(0);
    c.on('error', () => { });
    c.on('data', (d) => {
      const r = decode(Buffer.concat([buf, d])); buf = r.rest;
      for (const m of r.messages) {
        got.push(m);
        if (m.op === 0) c.write(reject ? encode(2, { code: 4000, message: 'Invalid Client ID' }) : encode(1, { cmd: 'DISPATCH', evt: 'READY', data: {} }));
      }
    });
  });
  await new Promise((r) => server.listen(sockPath, r));
  const state = { on: true, appId: '123456789012345678', showRoom: true, inRoom: false, roomName: '', lang: 'pt', since: Date.now() };

  await test('sem ID de aplicativo não tenta conectar', () => {
    const p = createPresence(null, [sockPath]); p.update({ ...state, appId: 'abc' });
    assert.strictEqual(p.status, 'noid'); assert.strictEqual(got.length, 0);
  });
  const p = createPresence(null, [path.join(dir, 'nao-existe'), sockPath]);
  await test('conecta (pulando canal que não existe), se apresenta e envia a atividade', async () => {
    p.update(state);
    await until(() => got.length >= 2);
    assert.deepStrictEqual(got[0], { op: 0, data: { v: 1, client_id: state.appId } });
    assert.strictEqual(got[1].data.cmd, 'SET_ACTIVITY'); assert.strictEqual(got[1].data.args.activity.state, 'No menu');
    assert.strictEqual(got[1].data.args.pid, process.pid); assert.strictEqual(p.status, 'ok');
  });
  await test('só fala de novo quando algo muda', async () => {
    p.update(state); p.update(state); await wait(80);
    assert.strictEqual(got.length, 2);
    p.update({ ...state, inRoom: true, roomName: 'Sala do Gabriel' });
    await until(() => got.length >= 3);
    assert.strictEqual(got[2].data.args.activity.state, 'Sala: Sala do Gabriel');
  });
  await test('desligar fecha a conexão (o Discord limpa o perfil sozinho)', async () => {
    let closed = false; conn.on('close', () => { closed = true; });
    p.update({ ...state, on: false });
    await until(() => closed);
    assert.strictEqual(p.status, 'off');
  });
  await test('ID recusado pelo Discord vira aviso, sem travar', async () => {
    reject = true; got.length = 0;
    const q = createPresence(null, [sockPath]); q.update(state);
    await until(() => q.status === 'badid');
    q.close();
  });
  await test('Discord fechado: status "não encontrado"', async () => {
    const q = createPresence(null, [path.join(dir, 'nada-1'), path.join(dir, 'nada-2')]); q.update(state);
    await until(() => q.status === 'nodiscord');
  });

  server.close(); if (conn) conn.destroy();
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('\n' + passed + ' testes passaram' + (process.exitCode ? ' (HÁ FALHAS)' : '.'));
})();
