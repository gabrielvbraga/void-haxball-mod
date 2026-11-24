// Testes do lançamento automático (scripts/release.js). Rodam com: npm test
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const R = require('../scripts/release');
const U = require('../src/updater');

let passed = 0;
function test(name, fn) { try { fn(); passed++; console.log('  ok   ' + name); } catch (e) { console.error('  FALHA ' + name + '\n        ' + e.message); process.exitCode = 1; } }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'void-rel-test-'));
const changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8');

// zip mínimo (deflate) para os testes
function zip(entries) {
  const loc = [], cen = []; let off = 0;
  for (const [n, d] of entries) {
    const name = Buffer.from(n), data = Buffer.from(d), comp = zlib.deflateRawSync(data), crc = zlib.crc32 ? zlib.crc32(data) : U.crc32(data);
    const l = Buffer.alloc(30); l.writeUInt32LE(0x04034b50, 0); l.writeUInt16LE(8, 8); l.writeUInt32LE(crc, 14); l.writeUInt32LE(comp.length, 18); l.writeUInt32LE(data.length, 22); l.writeUInt16LE(name.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(8, 10); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(off, 42);
    loc.push(l, name, comp); cen.push(c, name); off += 30 + name.length + comp.length;
  }
  const cd = Buffer.concat(cen), e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(entries.length, 8); e.writeUInt16LE(entries.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...loc, cd, e]);
}

console.log('lançamento');
test('título no mesmo padrão dos releases anteriores', () => {
  assert.strictEqual(R.title('1.0.0'), 'VOID HaxBall Mod 1.0');
  assert.strictEqual(R.title('1.1.0'), 'VOID HaxBall Mod 1.1');
  assert.strictEqual(R.title('1.2.0'), 'VOID HaxBall Mod 1.2');
  assert.strictEqual(R.title('1.2.1'), 'VOID HaxBall Mod 1.2.1');
});
test('o texto da 1.1.0 sai igual à descrição que foi publicada à mão', () => {
  assert.strictEqual(R.notes(changelog, '1.1.0'), 'New: Chat Bubble hotkey.\n\n- Pick a key in Chat & HUD > Chat Bubble shortcut\n- Each press turns the bubble on or off\n- It does not fire while you type in chat\n\nInstall: extract the zip and run VOID-HaxBall-Mod.exe.\n');
});
test('a versão do package.json tem seção no CHANGELOG (senão o release falharia)', () => {
  const v = require('../package.json').version;
  assert.ok(R.notes(changelog, v).length > 60, 'falta "## ' + v + '" no CHANGELOG.md');
  assert.strictEqual(R.notes(changelog, '9.9.9'), '');
  assert.ok(!R.notes(changelog, '1.2.0').includes('## 1.1.0'));                // não vaza a seção seguinte
});
test('a tag precisa ser a versão do package.json', () => {
  assert.doesNotThrow(() => R.checkTag('v1.2.0', '1.2.0'));
  assert.throws(() => R.checkTag('v1.2.1', '1.2.0'), /não bate/); assert.throws(() => R.checkTag('1.2.0', '1.2.0'), /não bate/);
});
test('confere o zip como o atualizador lê e gera a linha do SHA256SUMS.txt', () => {
  const f = path.join(tmp, 'VOID-HaxBall-Mod-1.2.0-win64.zip'); fs.writeFileSync(f, zip([['VOID-HaxBall-Mod.exe', 'MZ'], ['resources\\app.asar', 'asar']]));
  const line = R.checkZip(f);
  assert.strictEqual(U.parseSums(line, 'VOID-HaxBall-Mod-1.2.0-win64.zip'), U.sha256(fs.readFileSync(f)));
});
test('recusa zip sem o .exe, com a pasta private/ ou com nome fora do padrão', () => {
  const f = path.join(tmp, 'VOID-HaxBall-Mod-1.2.0-win64.zip');
  fs.writeFileSync(f, zip([['outra/VOID-HaxBall-Mod.exe', 'MZ'], ['outra/resources/app.asar', 'a']])); assert.throws(() => R.checkZip(f), /na raiz/);
  fs.writeFileSync(f, zip([['VOID-HaxBall-Mod.exe', 'MZ'], ['resources/app.asar', 'a'], ['private/netcode-core.js', 'x']])); assert.throws(() => R.checkZip(f), /private/);
  const g = path.join(tmp, 'VOID.zip'); fs.writeFileSync(g, zip([['VOID-HaxBall-Mod.exe', 'MZ']])); assert.throws(() => R.checkZip(g), /nome fora do padrão/);
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\n' + passed + ' testes passaram' + (process.exitCode ? ' (HÁ FALHAS)' : '.'));
