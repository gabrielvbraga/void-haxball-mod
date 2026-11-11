// Gera a pasta build/ (versão de distribuição): copia só o necessário, sem testes, scripts, docs ou configurações.
//   node scripts/build.js            -> versão pública (sem a pasta private/)
//   node scripts/build.js --private  -> inclui private/ (uso pessoal, NÃO publicar)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'build');
const withPrivate = process.argv.includes('--private');

function mk(p) { fs.mkdirSync(p, { recursive: true }); }
function copy(rel) { const f = path.join(out, rel); mk(path.dirname(f)); fs.copyFileSync(path.join(root, rel), f); }

fs.rmSync(out, { recursive: true, force: true }); mk(out);

// package.json enxuto (sem scripts nem devDependencies)
const pkg = require(path.join(root, 'package.json'));
fs.writeFileSync(path.join(out, 'package.json'), JSON.stringify({
  name: pkg.name, productName: pkg.productName, version: pkg.version, description: pkg.description,
  main: 'src/main.js', author: pkg.author, repository: pkg.repository || ''
}, null, 2));

for (const f of ['main.js', 'preload.js', 'patcher.js', 'core.js', 'ui.js', 'discord.js', 'splash.html']) copy('src/' + f);
for (const f of ['icon.ico', 'icon.png']) copy('assets/' + f);

if (withPrivate) {
  const pdir = path.join(root, 'private');
  if (!fs.existsSync(pdir)) { console.error('Pasta private/ não encontrada.'); process.exit(1); }
  for (const f of fs.readdirSync(pdir)) if (/\.js$/.test(f)) copy('private/' + f);
}

console.log('build OK ->', out, withPrivate ? '(COM módulo privado)' : '(versão pública)');
