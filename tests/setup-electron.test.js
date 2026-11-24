// Testes das conferências do instalador do Electron (scripts/setup-electron.js). Rodam com: npm test
// Não baixam nada: usam arquivos falsos numa pasta temporária.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const S = require('../scripts/setup-electron');

let passed = 0;
function test(name, fn) { try { fn(); passed++; console.log('  ok   ' + name); } catch (e) { console.error('  FALHA ' + name + '\n        ' + e.message); process.exitCode = 1; } }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'void-setup-'));

console.log('setup-electron');
test('só considera instalado se o electron.exe existe E a versão é a mesma do pacote', () => {
  const d = path.join(tmp, 'dist'); fs.mkdirSync(d);
  assert.strictEqual(S.isInstalled(d, '45.4.1'), false);
  fs.writeFileSync(path.join(d, 'electron.exe'), 'x');
  assert.strictEqual(S.isInstalled(d, '45.4.1'), false);                 // sem arquivo de versão
  fs.writeFileSync(path.join(d, 'version'), '33.4.11');
  assert.strictEqual(S.isInstalled(d, '45.4.1'), false);                 // Electron antigo esquecido na pasta
  fs.writeFileSync(path.join(d, 'version'), 'v45.4.1\n');
  assert.strictEqual(S.isInstalled(d, '45.4.1'), true);
  assert.strictEqual(S.installedVersion(d), '45.4.1');
});
test('lê o SHA-256 esperado do checksums.json e recusa valores estranhos', () => {
  const p = path.join(tmp, 'pkg'); fs.mkdirSync(p);
  const h = 'a'.repeat(64);
  fs.writeFileSync(path.join(p, 'checksums.json'), JSON.stringify({ 'electron-v45.4.1-win32-x64.zip': h.toUpperCase(), 'outro.zip': 'naoehash' }));
  assert.strictEqual(S.expectedHash(p, 'electron-v45.4.1-win32-x64.zip'), h);
  assert.strictEqual(S.expectedHash(p, 'outro.zip'), '');
  assert.strictEqual(S.expectedHash(p, 'nao-existe.zip'), '');
  assert.strictEqual(S.expectedHash(path.join(tmp, 'sem-pacote'), 'x.zip'), '');
});
test('calcula o SHA-256 do arquivo baixado', () => {
  const f = path.join(tmp, 'z.zip'); fs.writeFileSync(f, 'conteudo');
  assert.strictEqual(S.sha256(f), crypto.createHash('sha256').update('conteudo').digest('hex'));
});
test('entende a versão principal pedida no package.json', () => {
  assert.strictEqual(S.requiredMajor({ devDependencies: { electron: '^45.4.1' } }), '45');
  assert.strictEqual(S.requiredMajor({ devDependencies: { electron: '45.4.1' } }), '45');
  assert.strictEqual(S.requiredMajor({}), '');
  assert.strictEqual(S.requiredMajor(require('../package.json')), '45');
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\n' + passed + ' testes passaram' + (process.exitCode ? ' (HÁ FALHAS)' : '.'));
