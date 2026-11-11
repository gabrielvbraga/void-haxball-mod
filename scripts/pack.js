// Monta o .exe para Windows a partir de build/ (resultado em dist/).
// Não baixa nem descompacta nada: usa o Electron que já está em node_modules/electron/dist.
// (O empacotador oficial usa um descompactador que trava sem avisar em algumas versões do Node.)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const buildDir = path.join(root, 'build');
const electronDist = path.join(root, 'node_modules', 'electron', 'dist');
const outDir = path.join(root, 'dist', 'VOID HaxBall Mod-win32-x64');
const exeName = 'VOID-HaxBall-Mod.exe';

function fail(msg) { console.error('\nFALHOU: ' + msg); process.exit(1); }
function optional(name) { try { return require(name); } catch (e) { return null; } }

async function main() {
  if (!fs.existsSync(path.join(buildDir, 'package.json'))) fail('build/ não existe. Rode "npm run build" antes.');
  if (!fs.existsSync(path.join(electronDist, 'electron.exe'))) {
    fail('node_modules\\electron\\dist\\electron.exe não existe. Rode "node node_modules\\electron\\install.js" ' +
      '(ou veja "Electron failed to install correctly" no README).');
  }

  console.log('1/4 copiando o Electron...');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(outDir), { recursive: true });
  fs.cpSync(electronDist, outDir, { recursive: true });
  fs.rmSync(path.join(outDir, 'resources', 'default_app.asar'), { force: true });

  console.log('2/4 colocando o app dentro...');
  const resources = path.join(outDir, 'resources');
  const asarMod = optional('@electron/asar');
  const createPackage = asarMod && (asarMod.createPackage || (asarMod.default && asarMod.default.createPackage));
  if (createPackage) {
    await createPackage(buildDir, path.join(resources, 'app.asar'));
  } else {
    console.log('    (@electron/asar não encontrado: usando a pasta resources\\app, funciona igual)');
    fs.cpSync(buildDir, path.join(resources, 'app'), { recursive: true });
  }

  console.log('3/4 renomeando o executável...');
  const exe = path.join(outDir, exeName);
  fs.renameSync(path.join(outDir, 'electron.exe'), exe);

  console.log('4/4 aplicando ícone e informações do arquivo...');
  const rc = optional('rcedit');
  const rcedit = rc && (typeof rc === 'function' ? rc : rc.rcedit || rc.default);
  if (!rcedit) {
    console.log('    AVISO: "rcedit" não encontrado; o .exe funciona, mas fica com o ícone do Electron.');
  } else {
    try {
      await rcedit(exe, {
        icon: path.join(root, 'assets', 'icon.ico'),
        'file-version': pkg.version, 'product-version': pkg.version,
        'version-string': { ProductName: 'VOID HaxBall Mod', FileDescription: 'VOID HaxBall Mod', CompanyName: 'Gabriel Vieira', LegalCopyright: 'Copyright (c) 2026 Gabriel Vieira - Licença MIT', OriginalFilename: exeName }
      });
    } catch (e) {
      console.log('    AVISO: não foi possível aplicar o ícone (' + e.message + '). O .exe funciona com o ícone padrão.');
    }
  }

  if (!fs.existsSync(exe)) fail('o executável não foi criado.');
  console.log('\nPronto! ' + exe);
  console.log('A pasta inteira precisa ficar junta. Crie um atalho do .exe na área de trabalho.');
}

main().catch((e) => fail(e.stack || e.message));
