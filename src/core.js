// VOID HaxBall Mod - núcleo injetado no jogo (roda dentro do iframe do HaxBall).
// Aqui ficam: configurações salvas, indicador de mods ativos, comandos de chat, Chat Bubble e a
// personalização visual/sonora (campo liso, mira, volumes, chat e placar). Nada aqui altera a rede do jogo.
// Extensões opcionais se registram por HBMOD.registerCommand / registerBadge / registerStatus / registerReset.
(function () {
  if (window.HBMOD) return;
  var KEY = 'void_mod_v1';
  var settings = { chatBubble: false, badge: true, ext: {} };
  var ui = { accent: '#e0212f', hi: '#ff3b4a', glow: 'rgba(224,33,47,.25)', hidden: false };   // o app atualiza por setUi
  var commands = {}, badges = [], statuses = [], resets = [], infos = [];
  var badgeEl = null, lastName = '';

  function save() { try { window.localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) { } }
  function load() {
    try {
      var o = JSON.parse(window.localStorage.getItem(KEY) || 'null');
      if (o) { settings.chatBubble = !!o.chatBubble; settings.badge = o.badge !== false; settings.ext = o.ext || {}; }
    } catch (e) { }
  }
  // guarda/lê valores de extensões
  function store(k, v) { if (arguments.length > 1) { settings.ext[k] = v; save(); } return settings.ext[k]; }

  // ---- indicador "mods ativos" (canto inferior esquerdo) ----
  function update() {
    try {
      var parts = [];
      badges.forEach(function (fn) { try { var s = fn(); if (s) parts.push(s); } catch (e) { } });
      if (settings.chatBubble) parts.push('bubble');
      if (ui.hidden || !settings.badge || !parts.length) { if (badgeEl) badgeEl.style.display = 'none'; return; }
      if (!badgeEl) {
        badgeEl = document.createElement('div');
        badgeEl.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;pointer-events:none;' +
          'font:600 11px/1 system-ui,Segoe UI,sans-serif;letter-spacing:.04em;padding:5px 9px;border-radius:4px;' +
          'background:rgba(10,10,12,.82);color:#e9e9ec;transition:opacity .2s';
        document.documentElement.appendChild(badgeEl);   // no <html>: o jogo limpa o <body> ao iniciar
      }
      badgeEl.style.borderLeft = '2px solid ' + ui.accent;
      badgeEl.style.boxShadow = '0 0 12px ' + ui.glow;
      badgeEl.textContent = '';
      var tag = document.createElement('span'); tag.textContent = 'VOID '; tag.style.color = ui.hi;
      badgeEl.appendChild(tag);
      badgeEl.appendChild(document.createTextNode(parts.join(' · ')));
      badgeEl.style.display = 'block';
    } catch (e) { }
  }

  // ---- Chat Bubble ----
  // Como o jogo mostra o balão: quando a caixa do chat recebe o evento "focus", o jogo avisa a sala
  // que você está digitando (e só manda de novo quando o estado muda). Para manter o balão ligado,
  // disparamos esse mesmo evento na caixa do chat, SEM colocar o cursor nela: você continua se movendo.
  // Não depende do código interno do jogo, então não quebra quando o jogo renomeia funções.
  function chatInput() {
    var el = document.querySelector('.chatbox-view [data-hook="input"]') || document.querySelector('.chatbox-view input[type="text"]');
    if (el) return el;
    var box = document.querySelector('[class*="chatbox"]');
    return box ? box.querySelector('input') : null;
  }
  var bubbleSent = false;
  function fire(el, type) { try { el.dispatchEvent(new FocusEvent(type)); return true; } catch (e) { return false; } }
  function bubbleTick() {
    var el = chatInput();
    if (!el) { bubbleSent = false; return; }
    var typingForReal = document.activeElement === el;       // se você está digitando de verdade, o jogo já cuida
    if (settings.chatBubble) {
      if (!typingForReal && fire(el, 'focus')) bubbleSent = true;
    } else if (bubbleSent) {
      bubbleSent = false;
      if (!typingForReal) fire(el, 'blur');                  // desliga o balão uma vez ao desativar
    }
  }
  function setChatBubble(on) { settings.chatBubble = !!on; save(); update(); bubbleTick(); return settings.chatBubble; }

  // ---- comandos ----
  function registerCommand(name, fn) { commands[name] = fn; }
  function runCommand(name, args, say) {
    var fn = commands[name];
    if (!fn) return false;
    try { fn(args, say); } catch (e) { try { say('Erro no comando /' + name); } catch (e2) { } }
    return true;
  }
  function sayer(obj, name) { return function (m) { obj[name](m); }; }

  registerCommand('chat_bubble', function (args, say) {
    var v = args[1];
    if (v !== undefined && v !== 'on' && v !== 'off') { say('Uso: /chat_bubble on | off  (sem argumento: alterna)'); return; }
    setChatBubble(v === undefined ? !settings.chatBubble : v === 'on');
    say('Chat bubble ' + (settings.chatBubble ? 'ligado' : 'desligado'));
  });

  registerCommand('mod', function (args, say) {
    var sub = args[1];
    if (sub === 'status') {
      statuses.forEach(function (fn) { try { var l = fn(); if (l) say(l); } catch (e) { } });
      say('Chat bubble: ' + (settings.chatBubble ? 'ligado' : 'desligado') + ' | Indicador: ' + (settings.badge ? 'visível' : 'oculto'));
    } else if (sub === 'reset') {
      resets.forEach(function (fn) { try { fn(); } catch (e) { } });
      settings.badge = true; setChatBubble(false);
      say('Mod resetado para os padrões');
    } else if (sub === 'badge') {
      settings.badge = args[2] !== 'off'; save(); update();
      say('Indicador ' + (settings.badge ? 'visível' : 'oculto'));
    } else {
      say('VOID HaxBall Mod ' + window.HBMOD.version + ' - comandos:');
      say('/chat_bubble on|off  - balão de digitação');
      say('/mod status | reset | badge on|off');
      Object.keys(commands).forEach(function (n) { if (n !== 'mod' && n !== 'chat_bubble') say('/' + n); });
    }
  });

  // ---- informações para o app (histórico de salas e status) ----
  function roomInfo() {
    // o nome da sala só existe na tela do Esc: guardamos o último lido enquanto você está na sala
    var nameEl = document.querySelector('.room-view [data-hook="room-name"]');
    var name = nameEl ? String(nameEl.textContent || '').trim().slice(0, 60) : '', inRoom = !!chatInput();
    if (name) lastName = name; else if (!inRoom) lastName = '';
    // caixa "Disconnected" do jogo: o app usa o motivo para oferecer (ou fazer) a volta à sala
    var drop = document.querySelector('.disconnected-view');
    var why = drop ? (drop.querySelector && drop.querySelector('[data-hook="reason"]')) : null;
    var info = { inRoom: inRoom, name: lastName, bubble: settings.chatBubble, nick: stored('player_name'), avatar: stored('avatar'),
      dropped: drop ? String((why && why.textContent) || 'disconnected').slice(0, 120) : '', snd: customSet.slice() };
    infos.forEach(function (fn) { try { var o = fn(); if (o) for (var k in o) info[k] = o[k]; } catch (e) { } });
    return info;
  }
  function stored(k) { try { return String(window.localStorage.getItem(k) || '').slice(0, 25); } catch (e) { return ''; } }

  // ---- perfil: o jogo guarda apelido e avatar no localStorage e lê os dois ao abrir ----
  function setProfile(p) {
    if (!p || typeof p !== 'object') return false;
    try {
      if (typeof p.name === 'string' && p.name.trim()) window.localStorage.setItem('player_name', p.name.trim().slice(0, 25));
      if (typeof p.avatar === 'string') {
        if (p.avatar) window.localStorage.setItem('avatar', p.avatar); else window.localStorage.removeItem('avatar');
      }
      return true;
    } catch (e) { return false; }
  }

  // ================= personalização (tudo local: só muda o que VOCÊ vê e ouve) =================
  var HEX = /^#[0-9a-f]{6}$/i;
  var game = {
    flat: false, ground: '#3d6b45',                       // campo liso + cor do campo
    lineOn: false, lineColor: '#ffffff',                  // cor das linhas do campo
    ballOn: false, ballColor: '#ffd84a',                  // cor da bola
    cross: false, crossColor: '#ffffff', crossSize: 100,  // mira no seu jogador
    nameSize: 100, hideAvatars: false,                    // nomes dos jogadores e avatares dos outros
    kickLine: false, kickColor: '#ffffff', kickRange: 160, kickExt: 140,   // linha de chute (você -> bola -> além)
    kickRing: false, kickRingColor: '#ffd84a',                             // círculo de alcance do chute
    teamOn: false, teamRed: '#e56e56', teamBlue: '#5689e5',                // cores dos times só na sua tela
    vol: { goal: 100, kick: 100, chat: 100 },             // volumes (0-100); "goal" inclui a torcida
    chatFont: 0, chatOpacity: 100, hideScore: false, hideTimer: false
  };
  var chat = { hideJoin: false, words: [], players: [] }; // filtro do chat (só na sua tela)
  function num(v, min, max, def) { v = Number(v); return isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : def; }
  // Modo gravação: nada do VOID aparece na tela (campo, mira, bola, nomes voltam ao visual original).
  function vis() { return !ui.hidden; }

  // -- Campo, bola, mira, nomes e avatares: o jogo desenha tudo num <canvas>. Em vez de depender dos nomes
  //    internos do jogo (que mudam a cada atualização), observamos as chamadas de desenho do navegador.
  //    Ordem em que o jogo desenha cada quadro: campo -> nomes -> anel do seu jogador -> jogadores -> bola e discos.
  // Linhas do campo: o jogo usa cores escritas como código ("#C7E6BD", "rgba(199,230,189,255)") para as linhas
  // do mapa, e cores escritas por nome ("black", "white") para o contorno dos jogadores e da bola.
  // Então: contorno com cor em código = linha do campo. Vale para qualquer mapa, não só os clássicos.
  function isLineColor(v) { return typeof v === 'string' && (v.charCodeAt(0) === 35 || v.slice(0, 3) === 'rgb'); }
  var drawingOwn = false;
  function hookCanvas() {
    if (typeof CanvasRenderingContext2D === 'undefined' || typeof WeakSet !== 'function') return false;
    var P = CanvasRenderingContext2D.prototype;
    var fs = Object.getOwnPropertyDescriptor(P, 'fillStyle'), ss = Object.getOwnPropertyDescriptor(P, 'strokeStyle');
    if (!fs || !fs.set || !fs.configurable) return false;
    var textures = new WeakSet();     // texturas repetidas do campo (grama, piso do hockey)
    var shirts = new WeakMap();       // "camisa" de cada jogador (listras + avatar) -> cópias para montar variações
    var pendAvatar = null, cand = null, own = null, lastArc = null, ballDone = false, pend = null;
    var lastXY = null, kick = null;   // último círculo traçado; linha de chute esperando o contorno da bola
    var RED = [229, 110, 86], BLUE = [86, 137, 229];   // vermelho e azul padrão do HaxBall (#E56E56 e #5689E5)
    function rgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
    function copyCanvas(src) {
      var cl = document.createElement('canvas'); cl.width = src.width; cl.height = src.height;
      cl.getContext('2d').drawImage(src, 0, 0);
      return cl;
    }
    // cores dos times: troca, ponto a ponto, o vermelho e o azul padrão da camisa pelas cores escolhidas
    function recolor(src) {
      try {
        var cl = copyCanvas(src), cx = cl.getContext('2d'), im = cx.getImageData(0, 0, cl.width, cl.height), d = im.data;
        var r = rgb(game.teamRed), b = rgb(game.teamBlue);
        // Cada ponto da camisa é a cor do time, ou uma mistura dela com o branco do avatar (as bordas das letras).
        // mix() descobre quanto de branco há no ponto (0 a 1) ou devolve -1 se o ponto não é dessa cor.
        var mix = function (i, base) {
          var sum = 0, lo = 2, hi = -1;
          for (var k = 0; k < 3; k++) { var t = (d[i + k] - base[k]) / (255 - base[k]); sum += t; if (t < lo) lo = t; if (t > hi) hi = t; }
          return hi - lo < 0.2 && lo > -0.15 && hi < 0.97 ? Math.max(0, sum / 3) : -1;
        };
        for (var i = 0; i < d.length; i += 4) {
          var t = mix(i, RED), to = r;
          if (t < 0) { t = mix(i, BLUE); to = b; }
          if (t < 0) continue;
          for (var k = 0; k < 3; k++) d[i + k] = Math.round(to[k] + (255 - to[k]) * t);
        }
        cx.putImageData(im, 0, 0);
        return cl;
      } catch (e) { return src; }
    }
    // devolve a camisa certa para a situação: com ou sem avatar, com as cores originais ou as suas
    function shirtFor(info, noAvatar) {
      var slot = noAvatar ? 'p' : 'f', key = game.teamOn ? game.teamRed + game.teamBlue : '';
      if (!noAvatar && !key) return info.orig;
      var c = info.cache[slot];
      if (!c || c.key !== key) {
        var src = noAvatar ? info.plain : info.full;
        c = info.cache[slot] = { key: key, pat: createPattern.call(info.ctx, key ? recolor(src) : src, 'no-repeat') };
      }
      return c.pat;
    }

    // avatar: o jogo escreve o avatar no ponto (32, 44) de um canvas pequeno e logo depois faz dele a camisa.
    // Guardamos uma cópia de como o canvas estava ANTES do texto: é a camisa sem avatar.
    var fillText = P.fillText;
    P.fillText = function (text, x, y) {
      try {
        if (x === 32 && y === 44 && this.canvas && typeof document !== 'undefined') {
          pendAvatar = { c: this, clone: copyCanvas(this.canvas) };
        }
      } catch (e) { pendAvatar = null; }
      return fillText.apply(this, arguments);
    };
    var createPattern = P.createPattern;
    P.createPattern = function (img, rep) {
      var pat = createPattern.apply(this, arguments);
      try {
        if (pat && rep !== 'no-repeat') textures.add(pat);
        else if (pat && pendAvatar && pendAvatar.c === this) shirts.set(pat, { orig: pat, plain: pendAvatar.clone, full: copyCanvas(img), ctx: this, cache: {} });
      } catch (e) { }
      pendAvatar = null;
      return pat;
    };
    Object.defineProperty(P, 'fillStyle', {
      configurable: true, enumerable: fs.enumerable, get: fs.get,
      set: function (v) {
        cand = null;
        if (v && typeof v === 'object' && !ui.hidden) {
          if (game.flat && textures.has(v)) v = game.ground;                       // campo liso
          else if (game.hideAvatars || game.teamOn) {
            var info = shirts.get(v);
            if (info) { v = shirtFor(info, false); if (game.hideAvatars) cand = { c: this, info: info }; }
          }
        }
        fs.set.call(this, v);
      }
    });
    if (ss && ss.set && ss.configurable) {
      Object.defineProperty(P, 'strokeStyle', {
        configurable: true, enumerable: ss.enumerable, get: ss.get,
        set: function (v) { ss.set.call(this, game.lineOn && !ui.hidden && !drawingOwn && isLineColor(v) ? game.lineColor : v); }
      });
    }
    var arc = P.arc, stroke = P.stroke, fill = P.fill, drawImage = P.drawImage;
    P.arc = function (x, y, r) {
      // o jogo desenha um anel branco, quase transparente e de raio 25, em volta do SEU jogador
      if (r === 25 && this.globalAlpha > 0.29 && this.globalAlpha < 0.31) {
        own = { x: x, y: y }; ballDone = false;
        if ((game.cross || game.kickRing) && !ui.hidden) pend = { c: this, x: x, y: y };
      } else if (cand && cand.c === this) {
        // jogador prestes a ser pintado: se não for você, usa a camisa sem avatar
        if (!(own && own.x === x && own.y === y)) fs.set.call(this, shirtFor(cand.info, true));
      }
      cand = null; lastArc = this; lastXY = { x: x, y: y, r: r };
      return arc.apply(this, arguments);
    };
    P.fill = function () {
      if (lastArc === this) {
        lastArc = null;
        // jogadores são pintados com a "camisa" (um objeto); o primeiro disco de cor lisa do quadro é a bola
        var cur = fs.get.call(this);
        if (!ballDone && typeof cur === 'string') {
          ballDone = true;
          // linha de chute: desenhada logo depois do contorno da bola (para não estragar o desenho dela)
          if (game.kickLine && !ui.hidden && own && lastXY) kick = { c: this, ox: own.x, oy: own.y, bx: lastXY.x, by: lastXY.y, br: lastXY.r };
          if (game.ballOn && !ui.hidden) {
            fs.set.call(this, game.ballColor);
            var out = fill.apply(this, arguments);
            fs.set.call(this, cur);
            return out;
          }
        }
      }
      return fill.apply(this, arguments);
    };
    P.stroke = function () {
      lastArc = null;
      var out = stroke.apply(this, arguments);
      if (pend && pend.c === this) {
        var p = pend; pend = null;
        try { if (game.kickRing) drawReach(this, p.x, p.y, arc, stroke); if (game.cross) drawCross(this, p.x, p.y, arc, stroke); } catch (e) { }
      }
      if (kick && kick.c === this) {
        var k = kick; kick = null;
        try { drawKick(this, k, stroke); } catch (e) { }
      }
      return out;
    };
    // nomes: cada nome é um desenho de 160x34 colado embaixo do jogador com metade do tamanho
    P.drawImage = function (img, sx, sy, sw, sh, dx, dy, dw, dh) {
      if (arguments.length === 9 && sw === 160 && sh === 34 && game.nameSize !== 100 && !ui.hidden) {
        var k = game.nameSize / 100;
        return drawImage.call(this, img, sx, sy, sw, sh, dx + dw / 2 - dw * k / 2, dy, dw * k, dh * k);
      }
      return drawImage.apply(this, arguments);
    };
    // cada quadro novo: a próxima bola ainda não foi pintada e a posição do seu jogador é desconhecida
    if (typeof window.requestAnimationFrame === 'function') {
      var raf = window.requestAnimationFrame;
      window.requestAnimationFrame = function (cb) {
        return raf.call(window, function (t) { ballDone = false; own = null; kick = null; return cb(t); });
      };
    }
    return true;
  }
  // Linha de chute: do seu jogador até a bola (traço cheio) e continuando depois dela (tracejado),
  // na direção em que a bola sairia se você chutasse agora. Só aparece com a bola dentro do alcance escolhido.
  function drawKick(c, k, stroke) {
    var dx = k.bx - k.ox, dy = k.by - k.oy, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1 || d > game.kickRange) return;
    var ux = dx / d, uy = dy / d, a = 17, b = d - k.br - 2, e = d + k.br + 2;      // 17 = borda do jogador (raio 15)
    function seg(from, to) { c.beginPath(); c.moveTo(k.ox + ux * from, k.oy + uy * from); c.lineTo(k.ox + ux * to, k.oy + uy * to); stroke.call(c); }
    c.save();
    drawingOwn = true; c.strokeStyle = game.kickColor; drawingOwn = false;
    c.lineWidth = 1.5; c.lineCap = 'round';
    if (c.setLineDash) c.setLineDash([]);
    c.globalAlpha = 0.85;
    if (b > a) seg(a, b);
    if (game.kickExt > 0) {
      if (c.setLineDash) c.setLineDash([6, 6]);
      c.globalAlpha = 0.6;
      seg(e, e + game.kickExt);
    }
    c.restore();
  }
  // Círculo de alcance do chute. No HaxBall o chute pega quando a borda da bola está a menos de 4 px da borda
  // do jogador. O jogador padrão tem raio 15, então o anel fica a 19 px do centro: bola encostou no anel = chute pega.
  var PLAYER_RADIUS = 15, KICK_GAP = 4;
  function drawReach(c, x, y, arc, stroke) {
    c.save();
    drawingOwn = true; c.strokeStyle = game.kickRingColor; drawingOwn = false;
    c.globalAlpha = 0.9; c.lineWidth = 1;
    if (c.setLineDash) c.setLineDash([]);
    c.beginPath();
    arc.call(c, x, y, PLAYER_RADIUS + KICK_GAP, 0, 2 * Math.PI, false);
    stroke.call(c);
    c.restore();
  }
  function drawCross(c, x, y, arc, stroke) {
    var R = 25 * game.crossSize / 100, t = Math.max(4, R * 0.28);
    c.save();
    drawingOwn = true; c.strokeStyle = game.crossColor; drawingOwn = false;      // a cor da mira não é "linha do campo"
    c.globalAlpha = 0.9; c.lineWidth = 1.6; c.lineCap = 'round';
    if (c.setLineDash) c.setLineDash([]);
    c.beginPath();
    arc.call(c, x, y, R, 0, 2 * Math.PI, false);
    c.moveTo(x - R - t, y); c.lineTo(x - R + t, y); c.moveTo(x + R - t, y); c.lineTo(x + R + t, y);
    c.moveTo(x, y - R - t); c.lineTo(x, y - R + t); c.moveTo(x, y + R - t); c.lineTo(x, y + R + t);
    stroke.call(c);
    c.restore();
  }

  // -- Sons: o jogo decodifica os sons sempre nesta ordem ao abrir. Cada som tocado passa por um
  //    "botão de volume" (GainNode) da sua categoria. Um som próprio entra no lugar do original na hora de tocar.
  var SOUND_ORDER = ['chat', 'mention', 'kick', 'goal', 'join', 'leave', 'crowd'];
  var SOUND_CAT = { chat: 'chat', mention: 'chat', join: 'chat', leave: 'chat', kick: 'kick', goal: 'goal', crowd: 'goal' };
  var CUSTOM_SLOTS = { kick: 1, goal: 1, mention: 1 };
  var gainNodes = [], custom = {}, customSet = [], audioCtx = null, rawDecode = null, slotOf = null;
  function hookAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || typeof AudioNode === 'undefined' || typeof WeakMap !== 'function') return false;
    var shared = new WeakMap(), decoded = 0;
    slotOf = new WeakMap();
    rawDecode = AC.prototype.decodeAudioData;
    AC.prototype.decodeAudioData = function (data, ok, err) {
      var name = SOUND_ORDER[decoded++];
      audioCtx = this;
      function tag(buf) { try { if (name && buf) slotOf.set(buf, name); } catch (e) { } }
      var p = rawDecode.call(this, data, function (buf) { tag(buf); if (ok) ok(buf); }, err);
      if (p && p.then) p.then(tag, function () { });
      return p;
    };
    // som próprio: quando o jogo vai tocar o som original, entregamos o seu arquivo no lugar
    if (typeof AudioBufferSourceNode !== 'undefined') {
      var bd = Object.getOwnPropertyDescriptor(AudioBufferSourceNode.prototype, 'buffer');
      if (bd && bd.set && bd.configurable) {
        Object.defineProperty(AudioBufferSourceNode.prototype, 'buffer', {
          configurable: true, enumerable: bd.enumerable, get: bd.get,
          set: function (v) { var slot = v && slotOf.get(v); bd.set.call(this, (slot && custom[slot]) || v); }
        });
      }
    }
    var connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (dest) {
      try {
        var name = SOUND_CAT[this.buffer && slotOf.get(this.buffer)];
        if (name && dest instanceof AudioNode) {
          var byCat = shared.get(dest); if (!byCat) { byCat = {}; shared.set(dest, byCat); }
          var g = byCat[name];
          if (!g) {
            g = byCat[name] = this.context.createGain();
            g.gain.value = game.vol[name] / 100;
            connect.call(g, dest);
            gainNodes.push({ node: g, name: name });
          }
          connect.call(this, g);
          return dest;
        }
      } catch (e) { }
      return connect.apply(this, arguments);
    };
    return true;
  }
  // chamado pelo app: slot = 'kick' | 'goal' | 'mention'; b64 = o arquivo de áudio (ou null para voltar ao original)
  function setSound(slot, b64) {
    if (!CUSTOM_SLOTS[slot]) return false;
    if (customSet.indexOf(slot) === -1) customSet.push(slot);
    if (!b64) { delete custom[slot]; customSet = customSet.filter(function (s) { return s !== slot; }); return true; }
    if (!audioCtx || !rawDecode) { customSet = customSet.filter(function (s) { return s !== slot; }); return false; }   // o jogo ainda não carregou os sons
    try {
      var bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var done = function (buf) { if (buf) { slotOf.set(buf, slot); custom[slot] = buf; } };
      var p = rawDecode.call(audioCtx, bytes.buffer, done, function () { });
      if (p && p.then) p.then(done, function () { });
      return true;
    } catch (e) { return false; }
  }

  // -- Chat e placar: só CSS por cima da página do jogo
  // -- Chat e placar. Duas camadas, porque a página do jogo pode recusar folhas de estilo de fora:
  //    1) uma folha de estilo criada por código (adoptedStyleSheets), com <style> como reserva;
  //    2) uma conferência a cada segundo que acha o placar e o cronômetro pelo TEXTO deles ("2-1", "03:45")
  //       e esconde direto no elemento. Assim funciona mesmo se o jogo trocar os nomes das classes.
  var styleEl = null, sheet = null, hiddenEls = [];
  function applyCss() {
    var css = '';
    if (vis()) {
      if (game.chatFont) css += '.chatbox-view .log,.chatbox-view .log p,.chatbox-view .input input{font-size:' + game.chatFont + 'px!important}';
      if (game.chatOpacity < 100) css += '.chatbox-view{opacity:' + (game.chatOpacity / 100) + '!important}.chatbox-view:hover,.chatbox-view:focus-within{opacity:1!important}';
      if (game.hideScore) css += '.game-state-view .scoreboard{visibility:hidden!important}';
      if (game.hideTimer) css += '.game-timer-view{visibility:hidden!important}';
      if (game.teamOn) css += '.teamicon.red{background-color:' + game.teamRed + '!important}.teamicon.blue{background-color:' + game.teamBlue + '!important}';
    }
    try {
      if (!sheet && typeof CSSStyleSheet === 'function' && document.adoptedStyleSheets) {
        sheet = new CSSStyleSheet();
        document.adoptedStyleSheets = Array.prototype.slice.call(document.adoptedStyleSheets).concat([sheet]);
      }
      if (sheet) sheet.replaceSync(css);
    } catch (e) { sheet = null; }
    try {
      if (!sheet) {
        if (!styleEl) { if (!css) return; styleEl = document.createElement('style'); document.documentElement.appendChild(styleEl); }
        styleEl.textContent = css;
      }
    } catch (e) { }
    hudTick();
  }
  // menor elemento visível cujo texto inteiro bate com o padrão (ex.: "03:45")
  function findByText(re) {
    var out = [], all;
    try { all = document.querySelectorAll('div'); } catch (e) { return out; }
    for (var i = 0; i < all.length; i++) {
      var el = all[i], text = String(el.textContent || '');
      if (text.length > 24 || !re.test(text.replace(/\s+/g, ''))) continue;
      var inner = el.querySelectorAll('div'), nested = false;
      for (var j = 0; j < inner.length && !nested; j++) nested = re.test(String(inner[j].textContent || '').replace(/\s+/g, ''));
      if (!nested) out.push(el);
    }
    return out;
  }
  var TIMER_RE = /^(OVERTIME!)?\d{1,3}:\d{2}$/i, SCORE_RE = /^\d{1,3}-\d{1,3}$/;
  function hudTick() {
    try {
      if (typeof document.querySelectorAll !== 'function') return;
      var want = [];
      if (vis() && game.hideTimer) want = want.concat(Array.prototype.slice.call(document.querySelectorAll('.game-timer-view')), findByText(TIMER_RE));
      if (vis() && game.hideScore) want = want.concat(Array.prototype.slice.call(document.querySelectorAll('.game-state-view .scoreboard')), findByText(SCORE_RE));
      hiddenEls.forEach(function (el) { if (want.indexOf(el) === -1 && el.style) el.style.removeProperty('visibility'); });
      want.forEach(function (el) { if (el.style) el.style.setProperty('visibility', 'hidden', 'important'); });
      hiddenEls = want;
    } catch (e) { }
  }
  // usado pelo app para registrar no log como a tela do jogo está montada (ajuda a corrigir se algo não encaixar)
  function domInfo() {
    try {
      var names = {}, all = document.querySelectorAll('[class]');
      for (var i = 0; i < all.length && i < 600; i++) String(all[i].className && all[i].className.baseVal !== undefined ? all[i].className.baseVal : all[i].className).split(/\s+/).forEach(function (c) { if (c) names[c] = 1; });
      return { classes: Object.keys(names).slice(0, 150).join(' '), sheet: !!sheet, timer: findByText(TIMER_RE).length, score: findByText(SCORE_RE).length };
    } catch (e) { return null; }
  }

  // -- Filtro do chat: cada linha do chat é um <p>. Avisos do jogo têm a classe "notice";
  //    mensagens de jogadores têm o formato "Apelido: mensagem". Esconder é só na SUA tela.
  function filterLine(p) {
    if (!p || p.nodeName !== 'P' || !p.style) return;
    var text = String(p.textContent || ''), hide = false;
    if (/\bnotice\b/.test(String(p.className || ''))) {
      hide = chat.hideJoin && /( has joined| has left)$/.test(text);
    } else if (chat.words.length || chat.players.length) {
      var low = text.toLowerCase(), i = low.indexOf(': ');
      var who = i > 0 ? low.slice(0, i) : '', msg = i > 0 ? low.slice(i + 2) : low;
      hide = (!!who && chat.players.indexOf(who) !== -1) || chat.words.some(function (w) { return msg.indexOf(w) !== -1; });
    }
    p.style.display = hide ? 'none' : '';
  }
  function refilter() {
    try { Array.prototype.forEach.call(document.querySelectorAll('.chatbox-view .log p'), filterLine); } catch (e) { }
  }
  function cleanList(a) {
    if (!Array.isArray(a)) return [];
    return a.map(function (t) { return String(t || '').trim().toLowerCase().slice(0, 30); }).filter(Boolean).slice(0, 30);
  }
  var chatKey = '';
  function setChat(o) {
    if (!o || typeof o !== 'object') return;
    var next = { hideJoin: o.hideJoin === true, words: cleanList(o.words), players: cleanList(o.players) };
    var key = JSON.stringify(next);
    if (key === chatKey) return;
    chatKey = key; chat = next; refilter();
  }
  try {
    if (typeof MutationObserver === 'function') {
      new MutationObserver(function (list) {
        if (!chat.hideJoin && !chat.words.length && !chat.players.length) return;
        for (var i = 0; i < list.length; i++) {
          var added = list[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (n.nodeName === 'P' && n.parentNode && /\blog\b/.test(String(n.parentNode.className || ''))) filterLine(n);
          }
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
  } catch (e) { }

  // chamado pelo app sempre que você mexe na aba Personalizar / Áudio / Chat e HUD
  function setGame(g) {
    if (!g || typeof g !== 'object') return;
    ['flat', 'lineOn', 'ballOn', 'cross', 'hideAvatars', 'hideScore', 'hideTimer', 'kickLine', 'kickRing', 'teamOn'].forEach(function (k) { if (typeof g[k] === 'boolean') game[k] = g[k]; });
    ['ground', 'lineColor', 'ballColor', 'crossColor', 'kickColor', 'kickRingColor', 'teamRed', 'teamBlue'].forEach(function (k) { if (HEX.test(g[k])) game[k] = g[k]; });
    if (g.kickRange != null) game.kickRange = num(g.kickRange, 40, 1000, 160);
    if (g.kickExt != null) game.kickExt = num(g.kickExt, 0, 600, 140);
    if (g.crossSize != null) game.crossSize = num(g.crossSize, 60, 200, 100);
    if (g.nameSize != null) game.nameSize = num(g.nameSize, 60, 200, 100);
    if (g.vol && typeof g.vol === 'object') {
      for (var k in game.vol) if (g.vol[k] != null) game.vol[k] = num(g.vol[k], 0, 100, 100);
      gainNodes.forEach(function (n) { try { n.node.gain.value = game.vol[n.name] / 100; } catch (e) { } });
    }
    if (g.chatFont != null) { var f = num(g.chatFont, 0, 24, 0); game.chatFont = f && f < 10 ? 10 : f; }
    if (g.chatOpacity != null) game.chatOpacity = num(g.chatOpacity, 20, 100, 100);
    applyCss();
  }
  var hooked = { canvas: false, audio: false };
  try { hooked.canvas = hookCanvas(); } catch (e) { }
  try { hooked.audio = hookAudio(); } catch (e) { }


  // chamado pelo app: cor de destaque e modo gravação
  function setUi(o) {
    if (!o || typeof o !== 'object') return;
    if (HEX.test(o.accent)) ui.accent = o.accent;
    if (HEX.test(o.hi)) ui.hi = o.hi;
    if (typeof o.glow === 'string' && /^rgba\([\d.,\s]+\)$/.test(o.glow)) ui.glow = o.glow;
    if (typeof o.hidden === 'boolean') ui.hidden = o.hidden;
    if (o.game) setGame(o.game);
    if (o.chat) setChat(o.chat);
    applyCss();
    update();
  }

  load();
  window.HBMOD = {
    version: '1.0',
    hooks: null,                         // o app preenche com quais patches encaixaram
    store: store, update: update,
    registerCommand: registerCommand, runCommand: runCommand, sayer: sayer,
    registerBadge: function (fn) { badges.push(fn); update(); },
    registerStatus: function (fn) { statuses.push(fn); },
    registerReset: function (fn) { resets.push(fn); },
    registerInfo: function (fn) { infos.push(fn); },
    domInfo: domInfo, setGame: setGame, setChat: setChat, setSound: setSound, setProfile: setProfile, game: function () { return JSON.parse(JSON.stringify(game)); }, hooked: hooked,
    hook: function (name) { var h = window.HBMOD.hooks; return !h || h[name] !== false; },
    chatBubbleOn: function () { return settings.chatBubble; },
    setChatBubble: setChatBubble, roomInfo: roomInfo, setUi: setUi,
    // valores padrão: não alteram nada sem a extensão
    frameToSend: function (f) { return f; },
    fakePingValue: function (p) { return p; },
    fakePingInfo: function (p) { return String(p); }
  };
  update();
  if (typeof setInterval === 'function') setInterval(function () { bubbleTick(); if (hiddenEls.length || game.hideTimer || game.hideScore) hudTick(); }, 1000);
})();
