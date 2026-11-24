// VOID HaxBall Mod - atualização dentro do app.
// Passo a passo (só na versão pública, aberta pelo .exe):
//   1. checkUpdate (main.js) acha o release mais novo e, nele, o zip do Windows e o SHA-256 dele;
//   2. ao clicar em "Baixar e instalar", o zip é baixado e conferido (tamanho e SHA-256);
//   3. o zip é extraído para uma pasta temporária, com proteção contra caminhos maliciosos ("../");
//   4. ao clicar em "Reiniciar e instalar", um script do PowerShell espera o VOID fechar,
//      copia os arquivos novos por cima da pasta do app e abre o VOID de novo.
// Este arquivo só tem as partes que dá para testar sem o Electron (ver tests/updater.test.js).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ASSET = /^VOID-HaxBall-Mod-(\d+\.\d+\.\d+)-win64\.zip$/;      // mesmo nome que o release sempre usou
const SUMS = 'SHA256SUMS.txt';
const MAX_ZIP = 400 * 1024 * 1024;                                   // trava de segurança: 400 MB
const MAX_FILES = 2000;

// Escolhe, no JSON do release do GitHub, o zip do Windows e de onde vem o SHA-256 dele.
// Só aceita links do próprio repositório (github.com/<repo>/releases/download/...).
function pickAsset(release, repo) {
  if (!release || !Array.isArray(release.assets)) return null;
  const prefix = 'https://github.com/' + repo + '/releases/download/';
  const ok = (a) => a && typeof a.browser_download_url === 'string' && a.browser_download_url.startsWith(prefix);
  const zip = release.assets.find((a) => ok(a) && ASSET.test(String(a.name)));
  if (!zip || !(zip.size > 0) || zip.size > MAX_ZIP) return null;
  const sums = release.assets.find((a) => ok(a) && a.name === SUMS);
  const digest = /^sha256:([0-9a-f]{64})$/i.exec(String(zip.digest || ''));   // o GitHub também publica o SHA-256 de cada arquivo
  return { name: zip.name, url: zip.browser_download_url, size: zip.size, sha256: digest ? digest[1].toLowerCase() : '', sumsUrl: sums ? sums.browser_download_url : '' };
}

// Lê um SHA256SUMS.txt ("<hash>  <arquivo>", formato do sha256sum) e devolve o hash do arquivo pedido.
function parseSums(text, name) {
  for (const line of String(text).split(/\r?\n/)) {
    const m = /^([0-9a-f]{64})\s+\*?(.+?)\s*$/i.exec(line.trim());
    if (m && m[2] === name) return m[1].toLowerCase();
  }
  return '';
}

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

// Caminho seguro dentro de "dest": recusa absolutos, "..", letras de unidade e nomes estranhos.
// (O Compress-Archive do Windows PowerShell 5.1 grava "\" no lugar de "/"; os dois são aceitos.)
function safeJoin(dest, name) {
  const rel = String(name).replace(/\\/g, '/');
  if (!rel || rel.startsWith('/') || /^[a-zA-Z]:/.test(rel) || rel.includes('\0')) return null;
  const parts = rel.split('/').filter((p) => p !== '' && p !== '.');
  if (!parts.length || parts.some((p) => p === '..' || /[<>:"|?*]/.test(p))) return null;
  const full = path.resolve(dest, ...parts);
  const base = path.resolve(dest) + path.sep;
  return full.startsWith(base) ? full : null;
}

// Extrator de .zip pequeno e sem dependências (arquivos "stored" e "deflate", que é o que o
// Compress-Archive gera). Lê o diretório central, confere o CRC de cada arquivo e para no primeiro
// problema. Devolve a lista de arquivos extraídos (caminhos relativos, com "/").
function unzip(buf, dest) {
  const eocd = findEocd(buf);
  if (eocd < 0) throw new Error('zip inválido (fim do arquivo não encontrado)');
  const count = buf.readUInt16LE(eocd + 10), cdSize = buf.readUInt32LE(eocd + 12), cdOff = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || cdOff === 0xffffffff) throw new Error('zip64 não é suportado');
  if (count > MAX_FILES) throw new Error('zip com arquivos demais');
  if (cdOff + cdSize > eocd) throw new Error('zip inválido (diretório central fora do lugar)');
  const out = [];
  let p = cdOff;
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('zip inválido (entrada ' + i + ')');
    const flags = buf.readUInt16LE(p + 8), method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24);
    const nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString(flags & 0x800 ? 'utf8' : 'latin1', p + 46, p + 46 + nlen);
    p += 46 + nlen + xlen + clen;
    if (flags & 1) throw new Error('zip criptografado não é suportado');
    const isDir = /[\\/]$/.test(name);
    const target = safeJoin(dest, isDir ? name.replace(/[\\/]+$/, '') : name);
    if (!target) throw new Error('caminho recusado no zip: ' + name);
    if (isDir) { fs.mkdirSync(target, { recursive: true }); continue; }
    if (buf.readUInt32LE(local) !== 0x04034b50) throw new Error('zip inválido (cabeçalho de ' + name + ')');
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    if (start + csize > buf.length) throw new Error('zip cortado em ' + name);
    const raw = buf.subarray(start, start + csize);
    let data;
    if (method === 0) data = raw;
    else if (method === 8) data = zlib.inflateRawSync(raw, { maxOutputLength: Math.max(usize, 1) });
    else throw new Error('método de compressão não suportado em ' + name);
    if (data.length !== usize || (zlib.crc32 ? zlib.crc32(data) : crc32(data)) !== crc) throw new Error('arquivo corrompido no zip: ' + name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
    out.push(path.relative(dest, target).split(path.sep).join('/'));
  }
  return out;
}
function findEocd(buf) {
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) if (buf.readUInt32LE(i) === 0x06054b50) return i;
  return -1;
}
// CRC-32 para versões do Node sem zlib.crc32
let table = null;
function crc32(data) {
  if (!table) { table = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; } }
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = table[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// O que precisa existir numa versão nova antes de trocar os arquivos.
function looksLikeApp(dir, exeName) {
  return fs.existsSync(path.join(dir, exeName)) &&
    (fs.existsSync(path.join(dir, 'resources', 'app.asar')) || fs.existsSync(path.join(dir, 'resources', 'app', 'package.json')));
}

// Script do PowerShell que faz a troca depois que o VOID fecha. Todos os caminhos vão entre aspas simples
// (com ' dobrado), então nenhum nome de pasta vira comando. Não apaga nada da pasta do app: só copia
// por cima (robocopy /E, sem /PURGE), para não arriscar arquivos que você tenha guardado junto.
function swapScript({ from, to, exe, log }) {
  const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
  return [
    '$ErrorActionPreference = "Stop"',
    '$from = ' + q(from), '$to = ' + q(to), '$exe = ' + q(exe), '$log = ' + q(log),
    'function Note($t) { Add-Content -LiteralPath $log -Value ((Get-Date -Format s) + " " + $t) }',
    'try {',
    '  # espera o VOID (e os processos filhos dele) fecharem, por até 60 s',
    '  for ($i = 0; $i -lt 120; $i++) {',
    '    $running = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $exe })',
    '    if ($running.Count -eq 0) { break }',
    '    Start-Sleep -Milliseconds 500',
    '  }',
    '  if ($running.Count -gt 0) { throw "o VOID não fechou a tempo" }',
    '  Start-Sleep -Milliseconds 500',
    '  & robocopy $from $to /E /R:10 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null',
    '  if ($LASTEXITCODE -ge 8) { throw ("robocopy falhou com o código " + $LASTEXITCODE) }',
    '  Remove-Item -LiteralPath $from -Recurse -Force -ErrorAction SilentlyContinue',
    '  Note "atualização instalada"',
    '} catch {',
    '  Note ("atualização falhou: " + $_)',
    '}',
    'Start-Process -FilePath $exe',
    ''
  ].join('\r\n');
}

module.exports = { ASSET, SUMS, MAX_ZIP, pickAsset, parseSums, sha256, safeJoin, unzip, crc32, looksLikeApp, swapScript };
