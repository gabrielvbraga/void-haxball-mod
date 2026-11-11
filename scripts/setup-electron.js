// Garante que o Electron está instalado em node_modules/electron/dist.
// O instalador oficial (node_modules/electron/install.js) às vezes para no meio sem avisar.
// Aqui fazemos o mesmo passo a passo que funciona manualmente: baixar o zip oficial com o PowerShell,
// extrair com Expand-Archive e criar o path.txt.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const electronDir = path.join(root, 'node_modules', 'electron');
const distDir = path.join(electronDir, 'dist');
const exe = path.join(distDir, 'electron.exe');

function ok(msg) { console.log(msg); }
function fail(msg) { console.error('\nFALHOU: ' + msg); process.exit(1); }
function ps(command) {
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command], { stdio: 'inherit' });
}
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";       // texto seguro para o PowerShell

function main() {
  if (!fs.existsSync(path.join(electronDir, 'package.json'))) fail('node_modules\\electron não existe. Rode "npm install" antes.');
  if (fs.existsSync(exe)) {
    if (!fs.existsSync(path.join(electronDir, 'path.txt'))) fs.writeFileSync(path.join(electronDir, 'path.txt'), 'electron.exe');
    return ok('Electron OK.');
  }
  if (process.platform !== 'win32') fail('este passo é para Windows.');

  const version = require(path.join(electronDir, 'package.json')).version;
  const url = 'https://github.com/electron/electron/releases/download/v' + version + '/electron-v' + version + '-win32-x64.zip';
  const zip = path.join(os.tmpdir(), 'electron-v' + version + '-win32-x64.zip');

  ok('Baixando o Electron ' + version + ' (~100 MB, pode demorar e ficar parado um tempo)...');
  try {
    ps("$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -Uri " + q(url) + ' -OutFile ' + q(zip));
  } catch (e) { fail('não foi possível baixar ' + url + '. Confira a internet e tente de novo.'); }

  ok('Extraindo...');
  fs.rmSync(distDir, { recursive: true, force: true });
  try {
    ps("$ProgressPreference='SilentlyContinue'; Expand-Archive -Force -LiteralPath " + q(zip) + ' -DestinationPath ' + q(distDir));
  } catch (e) { fail('não foi possível extrair o zip do Electron.'); }

  if (!fs.existsSync(exe)) {
    fail('o electron.exe não apareceu depois da extração. Se o antivírus removeu o arquivo, restaure-o em ' +
      'Segurança do Windows > Proteção contra vírus e ameaças > Histórico de proteção.');
  }
  fs.writeFileSync(path.join(electronDir, 'path.txt'), 'electron.exe');
  try { fs.rmSync(zip, { force: true }); } catch (e) { }
  ok('Electron instalado.');
}

if (require.main === module) main();
module.exports = { main };
