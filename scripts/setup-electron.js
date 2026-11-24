// Garante que o Electron certo está instalado em node_modules/electron/dist.
// Desde o Electron 42, o "npm install" não baixa mais o Electron: ele só seria baixado na primeira vez
// que o app abrisse. Aqui baixamos na hora, com o mesmo passo a passo que funciona manualmente
// (baixar o zip oficial com o PowerShell e extrair com Expand-Archive) e com duas conferências:
//   1. a versão em dist/ precisa ser a mesma do package.json (senão, um Electron antigo esquecido
//      na pasta seria usado sem ninguém perceber);
//   2. o zip baixado precisa ter o mesmo SHA-256 publicado pelo próprio Electron (arquivo
//      checksums.json, que vem no pacote do npm). Se não bater, o arquivo é apagado e nada é instalado.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
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

// versão gravada pelo Electron em dist/version (pode vir como "45.4.1" ou "v45.4.1")
function installedVersion(dir) {
  try { return fs.readFileSync(path.join(dir, 'version'), 'utf8').trim().replace(/^v/i, ''); } catch (e) { return ''; }
}
function isInstalled(dir, version) {
  return fs.existsSync(path.join(dir, 'electron.exe')) && installedVersion(dir) === version;
}

// SHA-256 esperado do zip, lido do checksums.json do pacote (formato: { "nome-do-arquivo.zip": "hash" })
function expectedHash(pkgDir, zipName) {
  try {
    const sums = JSON.parse(fs.readFileSync(path.join(pkgDir, 'checksums.json'), 'utf8'));
    const h = String(sums[zipName] || '').toLowerCase();
    return /^[0-9a-f]{64}$/.test(h) ? h : '';
  } catch (e) { return ''; }
}
function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

// versão principal pedida no package.json do projeto ("^45.4.1" -> "45")
function requiredMajor(pkg) {
  const m = /(\d+)/.exec(String((pkg.devDependencies || {}).electron || ''));
  return m ? m[1] : '';
}

function main() {
  if (!fs.existsSync(path.join(electronDir, 'package.json'))) fail('node_modules\\electron não existe. Rode "npm install" antes.');
  const version = require(path.join(electronDir, 'package.json')).version;
  const wanted = requiredMajor(require(path.join(root, 'package.json')));
  if (wanted && String(version).split('.')[0] !== wanted) {
    fail('o package.json pede o Electron ' + wanted + ', mas o instalado em node_modules é o ' + version + '. Rode "npm install" e tente de novo.');
  }

  if (isInstalled(distDir, version)) {
    fs.writeFileSync(path.join(electronDir, 'path.txt'), 'electron.exe');
    return ok('Electron ' + version + ' OK.');
  }
  if (process.platform !== 'win32') fail('este passo é para Windows.');
  const old = installedVersion(distDir);
  if (old) ok('Electron ' + old + ' encontrado; trocando pelo ' + version + '.');

  const zipName = 'electron-v' + version + '-win32-x64.zip';
  const url = 'https://github.com/electron/electron/releases/download/v' + version + '/' + zipName;
  const zip = path.join(os.tmpdir(), zipName);
  const want = expectedHash(electronDir, zipName);
  if (!want) fail('não achei o SHA-256 do ' + zipName + ' em node_modules\\electron\\checksums.json. Rode "npm install" de novo.');

  ok('Baixando o Electron ' + version + ' (~110 MB, pode demorar e ficar parado um tempo)...');
  try {
    ps("$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -Uri " + q(url) + ' -OutFile ' + q(zip));
  } catch (e) { fail('não foi possível baixar ' + url + '. Confira a internet e tente de novo.'); }

  ok('Conferindo o arquivo (SHA-256)...');
  const got = sha256(zip);
  if (got !== want) {
    try { fs.rmSync(zip, { force: true }); } catch (e) { }
    fail('o arquivo baixado não é o original do Electron (SHA-256 diferente). Nada foi instalado; tente de novo.\n' +
      '  esperado: ' + want + '\n  recebido: ' + got);
  }

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
  ok('Electron ' + version + ' instalado.');
}

if (require.main === module) main();
module.exports = { main, installedVersion, isInstalled, expectedHash, sha256, requiredMajor };
