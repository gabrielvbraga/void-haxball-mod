// Ajudantes do lançamento automático (.github/workflows/release.yml). Também dá para rodar à mão:
//   node scripts/release.js check v1.2.0              confere se a tag é a mesma versão do package.json
//   node scripts/release.js notes 1.2.0 notas.md      título do release + texto tirado do CHANGELOG.md
//   node scripts/release.js assets arquivo.zip        confere o zip (como o atualizador vai ler) e gera SHA256SUMS.txt
const fs = require('fs');
const os = require('os');
const path = require('path');
const U = require('../src/updater');

const root = path.join(__dirname, '..');
const pkg = () => JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const INSTALL = 'Install: extract the zip and run VOID-HaxBall-Mod.exe.';

// mesmo padrão dos releases feitos à mão: "VOID HaxBall Mod 1.1" para 1.1.0, "VOID HaxBall Mod 1.2.1" para 1.2.1
function title(version) {
  const [a, b, c] = String(version).split('.');
  return 'VOID HaxBall Mod ' + (c === '0' ? a + '.' + b : version);
}
// pega no CHANGELOG.md o trecho entre "## 1.2.0" e o próximo "## "
function notes(changelog, version) {
  const lines = String(changelog).split(/\r?\n/), esc = version.replace(/\./g, '\\.');
  const start = lines.findIndex((l) => new RegExp('^##\\s+\\[?v?' + esc + '\\]?(\\s|$)').test(l));
  if (start < 0) return '';
  let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  if (end < 0) end = lines.length;
  const body = lines.slice(start + 1, end).join('\n').trim();
  return body ? body + '\n\n' + INSTALL + '\n' : '';
}
function checkTag(tag, version) {
  if (tag !== 'v' + version) throw new Error('a tag ' + tag + ' não bate com a versão do package.json (' + version + '). Use a tag v' + version + '.');
}
// confere o zip do jeito que o atualizador do app vai ler e devolve a linha do SHA256SUMS.txt
function checkZip(file) {
  const name = path.basename(file);
  if (!U.ASSET.test(name)) throw new Error('nome fora do padrão: ' + name + ' (esperado VOID-HaxBall-Mod-X.Y.Z-win64.zip)');
  const buf = fs.readFileSync(file), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'void-rel-'));
  try {
    const files = U.unzip(buf, dir);
    if (!U.looksLikeApp(dir, 'VOID-HaxBall-Mod.exe')) throw new Error('o zip não tem o VOID-HaxBall-Mod.exe e o resources/app.asar na raiz');
    if (files.some((f) => /^private\//.test(f))) throw new Error('o zip tem a pasta private/ (versão pessoal)');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  return U.sha256(buf) + '  ' + name + '\n';
}

function main(argv) {
  const [cmd, a, b] = argv;
  if (cmd === 'check') { checkTag(a, pkg().version); console.log('tag ' + a + ' OK'); return; }
  if (cmd === 'notes') {
    const text = notes(fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8'), a);
    if (!text) throw new Error('o CHANGELOG.md não tem a seção "## ' + a + '"');
    fs.writeFileSync(b, text); console.log(title(a)); return;
  }
  if (cmd === 'assets') {
    const line = checkZip(a);
    fs.writeFileSync(path.join(path.dirname(a), U.SUMS), line); process.stdout.write(line); return;
  }
  throw new Error('uso: node scripts/release.js check|notes|assets ...');
}

if (require.main === module) { try { main(process.argv.slice(2)); } catch (e) { console.error('FALHOU: ' + e.message); process.exit(1); } }
module.exports = { title, notes, checkTag, checkZip };
