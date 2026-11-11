// Confere a pasta build/: sintaxe válida, arquivos esperados e nada que não deveria estar lá.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const out = path.join(__dirname, '..', 'build');
const withPrivate = process.argv.includes('--private');
const problems = [];

function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])); }
if (!fs.existsSync(out)) { console.error('build/ não existe. Rode "npm run build" antes.'); process.exit(1); }

const files = walk(out).map((f) => path.relative(out, f).replace(/\\/g, '/'));
for (const need of ['package.json', 'src/main.js', 'src/preload.js', 'src/patcher.js', 'src/core.js', 'src/ui.js', 'src/discord.js', 'src/splash.html', 'assets/icon.ico']) {
  if (!files.includes(need)) problems.push('faltando: ' + need);
}
for (const f of files.filter((x) => x.endsWith('.js'))) {
  try { new vm.Script(fs.readFileSync(path.join(out, f), 'utf8'), { filename: f }); } catch (e) { problems.push('sintaxe inválida em ' + f + ': ' + e.message); }
}
if (!/HBMOD/.test(fs.readFileSync(path.join(out, 'src/core.js'), 'utf8'))) problems.push('src/core.js perdeu o nome HBMOD (a ofuscação quebraria os patches)');
const bad = files.filter((f) => /(^|\/)(\.env|config\.json|log\.txt|.*\.log|.*\.map|node_modules\/.*|tests\/.*|scripts\/.*|docs\/.*|\.git\/.*)$/.test(f));
bad.forEach((f) => problems.push('arquivo que não deveria ir na distribuição: ' + f));
if (!withPrivate && files.some((f) => f.startsWith('private/'))) problems.push('a versão pública contém a pasta private/');
if (!withPrivate && files.some((f) => /game-min\.(frozen|official)\.js/.test(f))) problems.push('a versão pública contém uma cópia do jogo');

if (problems.length) { console.error('Verificação FALHOU:\n - ' + problems.join('\n - ')); process.exit(1); }
console.log('Verificação OK: ' + files.length + ' arquivos em build/ (' + (withPrivate ? 'com módulo privado' : 'versão pública') + ').');
