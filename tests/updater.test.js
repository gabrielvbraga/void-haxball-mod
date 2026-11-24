// Testes da atualização dentro do app (src/updater.js e o fluxo no main.js). Rodam com: npm test
// Não acessam a internet: o GitHub é simulado e os zips são montados aqui mesmo.
const assert = require('assert');
const Module = require('module');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const U = require('../src/updater');

let passed = 0;
async function test(name, fn) { try { await fn(); passed++; console.log('  ok   ' + name); } catch (e) { console.error('  FALHA ' + name + '\n        ' + (e.stack || e.message).split('\n').slice(0, 3).join('\n        ')); process.exitCode = 1; } }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'void-upd-'));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

// ---------- monta um .zip na mão (para testar nomes estranhos que nenhuma ferramenta gera) ----------
function crc(b) { return zlib.crc32 ? zlib.crc32(b) : U.crc32(b); }
function makeZip(entries, opts = {}) {
  const locals = [], central = []; let off = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8'), data = Buffer.from(e.data || '');
    const comp = e.stored ? data : zlib.deflateRawSync(data), method = e.stored ? 0 : 8;
    const c = e.badCrc ? (crc(data) ^ 1) >>> 0 : crc(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x800, 6); lh.writeUInt16LE(method, 8);
    lh.writeUInt32LE(c, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x800, 8); ch.writeUInt16LE(method, 10);
    ch.writeUInt32LE(c, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42);
    locals.push(lh, name, comp); central.push(ch, name); off += 30 + name.length + comp.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  const all = Buffer.concat([...locals, cd, end]);
  return opts.cut ? all.subarray(0, opts.cut) : all;
}
const APP = [{ name: 'VOID-HaxBall-Mod.exe', data: 'MZ exe' }, { name: 'resources/app.asar', data: 'asar' + 'x'.repeat(5000) }, { name: 'locales/pt-BR.pak', data: 'pak', stored: true }];

(async () => {
  console.log('escolha do arquivo no release');
  const repo = 'gabrielvbraga/void-haxball-mod', base = 'https://github.com/' + repo + '/releases/download/v1.2.0/';
  const rel = (assets) => ({ tag_name: 'v1.2.0', assets });
  await test('acha o zip do Windows e o SHA256SUMS.txt do próprio repositório', () => {
    const a = U.pickAsset(rel([{ name: 'SHA256SUMS.txt', browser_download_url: base + 'SHA256SUMS.txt', size: 100 }, { name: 'VOID-HaxBall-Mod-1.2.0-win64.zip', browser_download_url: base + 'VOID-HaxBall-Mod-1.2.0-win64.zip', size: 1234 }]), repo);
    assert.deepStrictEqual(a, { name: 'VOID-HaxBall-Mod-1.2.0-win64.zip', url: base + 'VOID-HaxBall-Mod-1.2.0-win64.zip', size: 1234, sha256: '', sumsUrl: base + 'SHA256SUMS.txt' });
  });
  await test('usa o SHA-256 que o GitHub publica no próprio arquivo, quando existe', () => {
    const h = 'ab'.repeat(32);
    assert.strictEqual(U.pickAsset(rel([{ name: 'VOID-HaxBall-Mod-1.2.0-win64.zip', browser_download_url: base + 'VOID-HaxBall-Mod-1.2.0-win64.zip', size: 9, digest: 'sha256:' + h.toUpperCase() }]), repo).sha256, h);
  });
  await test('recusa links de outro repositório, outro site, nomes diferentes e tamanhos absurdos', () => {
    const z = 'VOID-HaxBall-Mod-1.2.0-win64.zip';
    assert.strictEqual(U.pickAsset(rel([{ name: z, browser_download_url: 'https://github.com/outro/repo/releases/download/v1/' + z, size: 9 }]), repo), null);
    assert.strictEqual(U.pickAsset(rel([{ name: z, browser_download_url: 'https://evil.example/' + z, size: 9 }]), repo), null);
    assert.strictEqual(U.pickAsset(rel([{ name: 'VOID.exe', browser_download_url: base + 'VOID.exe', size: 9 }]), repo), null);
    assert.strictEqual(U.pickAsset(rel([{ name: z, browser_download_url: base + z, size: U.MAX_ZIP + 1 }]), repo), null);
    assert.strictEqual(U.pickAsset(rel([{ name: z, browser_download_url: base + z, size: 0 }]), repo), null);
    assert.strictEqual(U.pickAsset({}, repo), null);
  });
  await test('lê o SHA256SUMS.txt (com * de modo binário e quebras de linha do Windows)', () => {
    const h = 'c'.repeat(64), txt = 'd'.repeat(64) + '  outro.zip\r\n' + h.toUpperCase() + ' *VOID-HaxBall-Mod-1.2.0-win64.zip\r\n';
    assert.strictEqual(U.parseSums(txt, 'VOID-HaxBall-Mod-1.2.0-win64.zip'), h);
    assert.strictEqual(U.parseSums(txt, 'nao-tem.zip'), '');
    assert.strictEqual(U.parseSums('lixo', 'x'), '');
  });

  console.log('extrator de zip');
  await test('extrai arquivos comprimidos e sem compressão, com pastas, e confere o conteúdo', () => {
    const d = path.join(tmp, 'ok'); const files = U.unzip(makeZip(APP), d);
    assert.deepStrictEqual(files.sort(), ['VOID-HaxBall-Mod.exe', 'locales/pt-BR.pak', 'resources/app.asar']);
    assert.strictEqual(fs.readFileSync(path.join(d, 'resources', 'app.asar'), 'utf8'), 'asar' + 'x'.repeat(5000));
    assert.ok(U.looksLikeApp(d, 'VOID-HaxBall-Mod.exe'));
  });
  await test('aceita "\\" como separador (o Compress-Archive do Windows PowerShell 5.1 grava assim)', () => {
    const d = path.join(tmp, 'bs'); U.unzip(makeZip([{ name: 'resources\\app.asar', data: 'a' }, { name: 'VOID-HaxBall-Mod.exe', data: 'b' }]), d);
    assert.ok(fs.existsSync(path.join(d, 'resources', 'app.asar')));
  });
  await test('recusa caminhos que saem da pasta (../, absolutos, unidade C:)', () => {
    for (const bad of ['../fora.txt', '..\\fora.txt', 'a/../../fora.txt', '/etc/x', 'C:\\Windows\\x.dll', 'C:x', 'a/b:c']) {
      const d = path.join(tmp, 'mal'); fs.rmSync(d, { recursive: true, force: true });
      assert.throws(() => U.unzip(makeZip([{ name: 'ok.txt', data: '1' }, { name: bad, data: 'x' }]), d), /caminho recusado/, bad);
    }
    assert.ok(!fs.existsSync(path.join(tmp, 'fora.txt')));
  });
  await test('para em zip corrompido, cortado ou que não é zip', () => {
    assert.throws(() => U.unzip(makeZip([{ name: 'a.txt', data: 'abc', badCrc: true }]), path.join(tmp, 'c1')), /corrompido/);
    assert.throws(() => U.unzip(makeZip(APP, { cut: 200 }), path.join(tmp, 'c2')), /zip/);
    assert.throws(() => U.unzip(Buffer.from('isso não é um zip'), path.join(tmp, 'c3')), /zip inválido/);
  });
  await test('lê zips de verdade gerados por outra ferramenta (Python zipfile)', () => {
    const { execFileSync } = require('child_process');
    let ok = true; try { execFileSync('python3', ['--version'], { stdio: 'ignore' }); } catch (e) { ok = false; }
    if (!ok) return;                                                  // sem Python nesta máquina: pula
    const z = path.join(tmp, 'py.zip');
    execFileSync('python3', ['-I', '-c', 'import zipfile,sys\nwith zipfile.ZipFile(sys.argv[1],"w",zipfile.ZIP_DEFLATED) as z:\n z.writestr("VOID-HaxBall-Mod.exe","MZ"*1000)\n z.writestr("resources/app.asar","asar")\n z.writestr("locales/","")\n z.writestr("Ação/ç.txt","acentos")', z]);
    const d = path.join(tmp, 'py'); const files = U.unzip(fs.readFileSync(z), d);
    assert.ok(files.includes('Ação/ç.txt') && U.looksLikeApp(d, 'VOID-HaxBall-Mod.exe'));
    assert.strictEqual(fs.readFileSync(path.join(d, 'Ação', 'ç.txt'), 'utf8'), 'acentos');
  });

  console.log('script de instalação');
  await test('todos os caminhos ficam entre aspas simples, inclusive com aspas e acentos no nome', () => {
    const s = U.swapScript({ from: "C:\\Users\\João\\up'date", to: 'C:\\Jogos\\VOID; Remove-Item C:\\', exe: 'C:\\Jogos\\VOID\\VOID-HaxBall-Mod.exe', log: 'C:\\log.txt' });
    assert.ok(s.includes("$from = 'C:\\Users\\João\\up''date'"));
    assert.ok(s.includes("$to = 'C:\\Jogos\\VOID; Remove-Item C:\\'"));
    assert.ok(/robocopy \$from \$to \/E /.test(s) && !/\/PURGE|\/MIR/i.test(s));   // nunca apaga nada da pasta do app
    assert.ok(s.includes('Start-Process -FilePath $exe'));
  });

  // ---------- fluxo completo no main.js, com Electron e GitHub simulados ----------
  console.log('fluxo no app');
  process.env.VOID_TEST = '1';
  const installDir = path.join(tmp, 'Meus Jogos', 'VOID'); fs.mkdirSync(installDir, { recursive: true });
  const exePath = path.join(installDir, 'VOID-HaxBall-Mod.exe'); fs.writeFileSync(exePath, 'old');
  const userData = path.join(tmp, 'userData'); fs.mkdirSync(userData);
  const zip = makeZip(APP), zipName = 'VOID-HaxBall-Mod-99.0.0-win64.zip';
  const gh = { zip, sums: sha(zip) + '  ' + zipName + '\n', status: 200 };
  const routes = (url) => {
    if (url.endsWith('/releases/latest')) return new Response(JSON.stringify({ tag_name: 'v99.0.0', assets: [
      { name: zipName, size: gh.zip.length, browser_download_url: 'https://github.com/' + repo + '/releases/download/v99.0.0/' + zipName },
      { name: 'SHA256SUMS.txt', size: 90, browser_download_url: 'https://github.com/' + repo + '/releases/download/v99.0.0/SHA256SUMS.txt' }] }));
    if (url.endsWith('SHA256SUMS.txt')) return new Response(gh.sums);
    if (url.endsWith(zipName)) return new Response(gh.status === 200 ? gh.zip : 'x', { status: gh.status });
    return new Response('nada', { status: 404 });
  };
  const spawned = [];
  const electron = {
    app: { whenReady: () => ({ then() { } }), on() { }, getPath: () => userData, quit() { electron.quitted = true; }, isPackaged: true,
      setAppUserModelId(id) { electron.aumid = id; }, setToastActivatorCLSID() { } },
    BrowserWindow: function () { }, protocol: { handle() { } }, net: { fetch: async (u) => routes(u) }, shell: { openExternal() { }, writeShortcutLink: (p, op, o) => { electron.links.push({ p, op, o }); return electron.linkOk; } }, Menu: { setApplicationMenu() { } },
    dialog: {}, ipcMain: { handle() { }, on() { } }, session: { defaultSession: {} }, nativeTheme: {}
  };
  const origLoad = Module._load;
  Module._load = function (r, ...a) {
    if (r === 'electron') return electron;
    if (r === 'child_process') return Object.assign({}, origLoad.call(this, r, ...a), { spawn: (cmd, args, o) => { spawned.push({ cmd, args, o }); return { unref() { } }; } });
    return origLoad.call(this, r, ...a);
  };
  const realPlatform = process.platform, realExec = process.execPath;
  Object.defineProperty(process, 'platform', { value: 'win32' }); process.execPath = exePath;
  electron.links = []; electron.linkOk = true;
  const M = require('../src/main.js');

  await test('versão pública aberta pelo .exe: oferece instalar e baixa conferindo o SHA-256', async () => {
    await M.checkUpdate();
    let u = M.getUpdate(); assert.strictEqual(u.version, '99.0.0'); assert.strictEqual(u.install, true); assert.strictEqual(u.phase, 'idle');
    assert.strictEqual(await M.downloadUpdate(), true);
    u = M.getUpdate(); assert.strictEqual(u.phase, 'ready'); assert.strictEqual(u.progress, 100);
    assert.ok(U.looksLikeApp(u.staged, 'VOID-HaxBall-Mod.exe'));
    assert.strictEqual(fs.readFileSync(exePath, 'utf8'), 'old');                 // nada mudou na pasta do app ainda
  });
  await test('instalar: grava o script com BOM, chama o PowerShell escondido e fecha o VOID', async () => {
    assert.strictEqual(M.installUpdate(), true);
    const s = spawned[0]; assert.strictEqual(s.cmd, 'powershell.exe'); assert.ok(s.args.includes('-File') && s.args.includes('Hidden') && s.o.detached);
    const script = fs.readFileSync(s.args[s.args.length - 1], 'utf8');
    assert.ok(script.startsWith('\ufeff') && script.includes("$to = '" + installDir + "'"));
    await new Promise((r) => setTimeout(r, 400)); assert.strictEqual(electron.quitted, true);
  });
  await test('SHA-256 diferente: não instala, apaga o que baixou e cai para "abrir a página"', async () => {
    gh.zip = makeZip(APP.concat([{ name: 'virus.exe', data: 'mal' }]));       // zip trocado no caminho, SHA256SUMS continua o original
    await M.checkUpdate(); assert.strictEqual(await M.downloadUpdate(), false);
    assert.strictEqual(M.getUpdate().phase, 'error'); assert.ok(!fs.existsSync(path.join(userData, 'update')));
    assert.strictEqual(M.installUpdate(), false);
  });
  await test('download falhando ou sem SHA-256 publicado: não oferece instalar', async () => {
    gh.zip = zip; gh.status = 500; await M.checkUpdate(); assert.strictEqual(await M.downloadUpdate(), false);
    gh.status = 200; gh.sums = 'sem hash aqui'; await M.checkUpdate(); assert.strictEqual(M.getUpdate().install, false);
    assert.strictEqual(await M.downloadUpdate(), false);
  });
  await test('versão pessoal (com OP Mode) só avisa, para não instalar a pública por cima', async () => {
    gh.sums = sha(zip) + '  ' + zipName + '\n'; M.setPrivateActive(true);
    await M.checkUpdate(); assert.strictEqual(M.getUpdate().install, false); assert.strictEqual(await M.downloadUpdate(), false);
    M.setPrivateActive(false); await M.checkUpdate(); assert.strictEqual(M.getUpdate().install, true);
  });
  await test('notificações: sem atalho no Menu Iniciar, o VOID não troca o ID do app (a barra de tarefas não perde o ícone)', async () => {
    M.setNotifyForTest({ mention: true });
    electron.app.isPackaged = false; M.setupNotify(); assert.strictEqual(electron.aumid, undefined); assert.strictEqual(electron.links.length, 0);   // npm start
    electron.app.isPackaged = true; electron.linkOk = false; M.setupNotify(); assert.strictEqual(electron.aumid, undefined);                     // atalho falhou
    electron.linkOk = true; M.setupNotify(); assert.strictEqual(electron.aumid, 'com.gabrielvieira.voidhaxballmod');
    const l = electron.links[electron.links.length - 1]; assert.strictEqual(l.o.appUserModelId, electron.aumid); assert.strictEqual(l.o.target, exePath);
    assert.ok(/Start Menu.*VOID HaxBall Mod\.lnk$/.test(l.p.split(path.sep).join('/')));
    M.setNotifyForTest({});
  });
  await test('rodando pelo "npm start" (não empacotado) só avisa', async () => {
    gh.sums = sha(zip) + '  ' + zipName + '\n'; electron.app.isPackaged = false;
    await M.checkUpdate(); assert.strictEqual(M.getUpdate().install, false); assert.strictEqual(M.getUpdate().version, '99.0.0');
    electron.app.isPackaged = true;
  });

  Object.defineProperty(process, 'platform', { value: realPlatform }); process.execPath = realExec; Module._load = origLoad;
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('\n' + passed + ' testes passaram' + (process.exitCode ? ' (HÁ FALHAS)' : '.'));
  process.exit(process.exitCode || 0);
})();
