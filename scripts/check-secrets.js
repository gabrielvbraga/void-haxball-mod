// Procura segredos e dados pessoais nos arquivos do projeto (e, com --history, em todo o histórico do Git).
//   npm run check:secrets      -> arquivos atuais
//   npm run check:history      -> arquivos atuais + histórico do Git
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'private']);
const SKIP_EXT = /\.(webp|png|ico|jpg|jpeg|gif|zip|exe|dll|asar)$/i;
const SELF = path.join('scripts', 'check-secrets.js');
// arquivos de lock são gerados pelo npm e têm textos como "pacote@1.2.3": neles só valem as regras de chaves/tokens
const LOCK = /(^|[\\/])(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml)$/;
const PERSONAL = new Set(['e-mail pessoal', 'telefone brasileiro', 'caminho de usuário do Windows', 'caminho de usuário do Linux/Mac']);

const RULES = [
  ['token do GitHub', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['token do GitHub (fine-grained)', /\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
  ['chave AWS', /\bAKIA[0-9A-Z]{16}\b/],
  ['chave de API do Google', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['token do Slack', /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/],
  ['chave de API (sk-)', /\bsk-[A-Za-z0-9]{32,}\b/],
  ['chave privada', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['senha/token/chave no código', /\b(?:password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*['"][^'"\s]{8,}['"]/i],
  ['e-mail pessoal', /\b[A-Za-z0-9._%+-]+@(?!example\.|users\.noreply\.github\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/],
  ['telefone brasileiro', /\(?\b\d{2}\)?\s?9\d{4}[-\s]?\d{4}\b/],
  ['caminho de usuário do Windows', /[A-Za-z]:\\Users\\(?!<|%|Public|Default)[^\\\s"']+/],
  ['caminho de usuário do Linux/Mac', /\/(?:home|Users)\/(?!runner\b|user\b)[a-z][\w.-]+\//]
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(path.join(dir, e.name));
    return [path.join(dir, e.name)];
  });
}

const findings = [];
function scanText(label, text, onlyKeys) {
  text.split('\n').forEach((line, i) => {
    for (const [name, re] of RULES) if (!(onlyKeys && PERSONAL.has(name)) && re.test(line)) findings.push(`${label}:${i + 1}  ${name}  ->  ${line.trim().slice(0, 90)}`);
  });
}

for (const f of walk(root)) {
  const rel = path.relative(root, f);
  if (rel === SELF || SKIP_EXT.test(f) || fs.statSync(f).size > 2e6) continue;
  scanText(rel, fs.readFileSync(f, 'utf8'), LOCK.test(rel));
}

// .gitignore precisa proteger o essencial
const gi = fs.existsSync(path.join(root, '.gitignore')) ? fs.readFileSync(path.join(root, '.gitignore'), 'utf8') : '';
for (const need of ['node_modules/', 'private/', '.env', 'dist/', 'build/']) if (!gi.includes(need)) findings.push(`.gitignore: faltando "${need}"`);

const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 29, stdio: ['ignore', 'pipe', 'ignore'] });
let inRepo = false;
try { git(['rev-parse', '--git-dir']); inRepo = true; } catch (e) { }

if (inRepo) {
  const tracked = git(['ls-files']).split('\n').filter(Boolean);
  tracked.filter((f) => /^private\/|(^|\/)\.env$|config\.json$|game-min[^/]*\.js$/.test(f)).forEach((f) => findings.push(`arquivo privado versionado: ${f}`));
  if (process.argv.includes('--history')) {
    const log = git(['log', '--all', '-p', '--no-color']);
    scanText('histórico', log.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1)).join('\n'));
    const ever = git(['log', '--all', '--name-only', '--pretty=format:']).split('\n').filter((f) => /^private\/|(^|\/)\.env$|game-min[^/]*\.js$/.test(f));
    [...new Set(ever)].forEach((f) => findings.push(`histórico: o arquivo privado "${f}" já foi commitado alguma vez`));
  }
} else if (process.argv.includes('--history')) {
  console.log('(sem repositório Git aqui: histórico não verificado)');
}

if (findings.length) {
  console.error('ATENÇÃO - possíveis segredos/dados privados encontrados:\n  ' + findings.join('\n  '));
  console.error('\nSe algo já foi commitado, trocar a senha/chave é obrigatório (apagar o commit não basta).');
  process.exit(1);
}
console.log('Nenhum segredo ou dado pessoal encontrado' + (inRepo ? ' (Git verificado).' : '.'));
