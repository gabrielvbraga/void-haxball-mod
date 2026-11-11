// Aplica o mod em cima do game-min.js OFICIAL (o atual do site).
// O jogo renomeia funções a cada atualização, então os patches procuram a ESTRUTURA do código.
// Cada patch só é aplicado se achar exatamente 1 trecho; senão é ignorado e o motivo vai para o log.
const ID = '[\\w$]+';
const SEP = '[;,]\\s*';

function patchOfficial(src, coreJs, extras = []) {
  const applied = [], skipped = [], diag = [];
  let out = src;

  const count = (re) => (out.match(new RegExp(re.source, re.flags.replace('g', '') + 'g')) || []).length;

  // tenta cada regex (da mais específica à mais ampla); aplica na primeira que achar exatamente 1 trecho
  function apply(name, regexes, build) {
    const counts = [];
    for (const re of regexes) {
      const n = count(re);
      counts.push(n);
      if (n === 1) {
        out = out.replace(re, (...a) => build(a[a.length - 1]));
        applied.push(name);
        return true;
      }
    }
    skipped.push(name + ' (achados: ' + counts.join('/') + ')');
    return false;
  }

  function context(label, re, max) {
    const g = new RegExp(re.source, re.flags.replace('g', '') + 'g');
    let m, n = 0;
    while ((m = g.exec(out)) && n++ < max) {
      diag.push(label + ': ' + out.slice(Math.max(0, m.index - 160), m.index + m[0].length + 160).replace(/\s+/g, ' '));
    }
  }

  const helpers = { apply, context, ID, SEP };

  // 1) Comandos de chat: qualquer comando desconhecido passa por HBMOD.runCommand antes do erro padrão
  const argsM = out.match(new RegExp(`case\\s*"extrapolation"\\s*:\\s*2\\s*==\\s*(${ID})\\.length`));
  if (!argsM) {
    skipped.push('Comandos de chat (variável de argumentos não achada)');
  } else {
    const A = argsM[1];
    apply('Comandos de chat', [
      new RegExp(`default:\\s*this\\.(?<say>${ID})\\('Unrecognized command: "'\\s*\\+\\s*(?<cmd>${ID})\\s*\\+\\s*'"'\\)`)
    ], (g) => `default:if(HBMOD.runCommand(${g.cmd},${A},HBMOD.sayer(this,"${g.say}")))break;` +
      `this.${g.say}('Unrecognized command: "'+${g.cmd}+'"')`);
  }

  // 2) Chat Bubble (indicador de digitação): força o estado quando ligado.
  //    Forma:  var b = this; this.X = a; null == this.Y && (this.Y = window.setTimeout(...
  const bubbleTail = `;\\s*null\\s*==\\s*this\\.(?<t>${ID})\\s*&&\\s*\\(this\\.\\k<t>\\s*=\\s*window\\.setTimeout`;
  const okBubble = apply('Chat Bubble', [
    new RegExp(`(?<head>var\\s+${ID}\\s*=\\s*this;\\s*this\\.${ID}\\s*=\\s*)(?<v>${ID})(?<tail>${bubbleTail})`),
    new RegExp(`(?<head>this\\.${ID}\\s*=\\s*)(?<v>${ID})(?<tail>${bubbleTail})`)
  ], (g) => g.head + 'HBMOD.chatBubbleOn()||' + g.v + g.tail);
  if (!okBubble) {
    context('candidato bubble', new RegExp(`null\\s*==\\s*this\\.${ID}\\s*&&\\s*\\(this\\.${ID}\\s*=\\s*window\\.setTimeout`), 6);
  }

  // 3) extensões opcionais (módulo privado, se existir)
  for (const fn of extras) { try { fn(helpers); } catch (e) { skipped.push('extensão (' + e.message + ')'); } }

  const hooks = 'HBMOD.hooks = ' + JSON.stringify({
    op: applied.some((a) => a.indexOf('OP Mode') === 0),
    ping: applied.some((a) => a.indexOf('Fake Ping') === 0),
    bubble: applied.includes('Chat Bubble')
  }) + ';';
  return { code: coreJs + '\n' + hooks + '\n' + out, applied, skipped, diag, patched: applied.length > 0 };
}

module.exports = { patchOfficial };
