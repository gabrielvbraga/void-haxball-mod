// VOID HaxBall Mod - interface (injetada na página principal do haxball.com).
// Um menu só, com barra lateral: cada item da barra abre uma página. Textos em português e inglês.
(function () {
  if (window.top !== window.self || window.__hbui) return;
  var api = window.hbapp;
  if (!api) return;

  var state = null, open = false, hideAds = true, lang = 'pt', page = 'home', editQuick = false;
  var MENU_W = 720, MENU_H = 500;

  // ---------- textos (pt / en) ----------
  var T = {
    'nav.home': ['Início', 'Home'], 'nav.look': ['Personalizar', 'Customize'], 'nav.profile': ['Perfil', 'Profile'],
    'nav.audio': ['Áudio', 'Audio'], 'nav.hud': ['Chat e HUD', 'Chat & HUD'], 'nav.quick': ['Ações rápidas', 'Quick actions'],
    'nav.op': ['OP Mode', 'OP Mode'], 'nav.settings': ['Configurações', 'Settings'], 'nav.status': ['Status', 'Status'],
    'close': ['Fechar', 'Close'],
    'room': ['Sala', 'Room'], 'room.ph': ['Link ou código da sala', 'Room link or code'], 'join': ['Entrar', 'Join'],
    'tools': ['Ferramentas', 'Tools'], 'tool.reload': ['Recarregar', 'Reload'], 'tool.fullscreen': ['Tela cheia', 'Fullscreen'],
    'tool.top': ['Sempre no topo', 'Always on top'], 'tool.shot': ['Captura', 'Screenshot'], 'tool.zoomout': ['Zoom −', 'Zoom −'], 'tool.zoomin': ['Zoom +', 'Zoom +'],
    'recent': ['Salas recentes', 'Recent rooms'], 'clear': ['Limpar', 'Clear'],
    'recent.empty': ['Nenhuma sala ainda. As salas em que você entrar aparecem aqui.', 'No rooms yet. Rooms you join will show up here.'],
    'field': ['Campo', 'Field'], 'flat': ['Campo liso (Flat Ground)', 'Flat ground'],
    'flat.hint': ['Troca a textura do campo por uma cor só.', 'Replaces the field texture with a single color.'],
    'ground': ['Cor do campo (Ground Color)', 'Ground color'],
    'cross': ['Mira', 'Crosshair'], 'cross.on': ['Mira no seu jogador', 'Crosshair on your player'],
    'cross.hint': ['Anel com cruz em volta do seu jogador.', 'A ring with a cross around your player.'],
    'color': ['Cor', 'Color'], 'size': ['Tamanho', 'Size'],
    'theme': ['Interface', 'Interface'], 'accent': ['Intensidade do vermelho', 'Red intensity'],
    'profile.now': ['Em uso agora', 'In use now'], 'profile.none': ['(o jogo ainda não carregou)', '(the game has not loaded yet)'],
    'profile.saved': ['Perfis salvos', 'Saved profiles'], 'profile.empty': ['Nenhum perfil salvo. Crie um abaixo e troque com um clique.', 'No saved profiles. Create one below and switch with one click.'],
    'profile.new': ['Novo perfil', 'New profile'], 'nick.ph': ['Apelido', 'Nickname'], 'avatar.ph': ['Avatar', 'Avatar'],
    'save': ['Salvar', 'Save'], 'use': ['Usar', 'Use'], 'remove': ['Remover', 'Remove'], 'profile.savecur': ['Salvar o atual', 'Save current'],
    'profile.hint': ['O apelido vale a partir da próxima sala. Dentro de uma sala, só o avatar muda na hora.', 'The nickname applies from the next room on. Inside a room only the avatar changes right away.'],
    'vol': ['Volume por tipo de som', 'Volume per sound'], 'vol.goal': ['Gol (torcida)', 'Goal (crowd)'], 'vol.kick': ['Chute', 'Kick'],
    'vol.chat': ['Chat e avisos', 'Chat & notices'],
    'vol.hint': ['Vale junto com o som do próprio jogo: se ele estiver desligado nas opções do HaxBall, nada toca.', 'Works on top of the game’s own sound: if it is off in the HaxBall settings, nothing plays.'],
    'chat': ['Chat', 'Chat'], 'chat.font': ['Tamanho da fonte', 'Font size'], 'chat.opacity': ['Opacidade', 'Opacity'],
    'default': ['padrão', 'default'],
    'hud': ['Placar', 'Scoreboard'], 'hud.score': ['Esconder placar', 'Hide score'], 'hud.timer': ['Esconder cronômetro', 'Hide timer'],
    'overlay': ['Indicadores', 'Overlays'], 'fps': ['Mostrar FPS (F3)', 'Show FPS (F3)'], 'rec': ['Modo gravação (F4)', 'Recording mode (F4)'], 'bubble': ['Chat Bubble', 'Chat Bubble'],
    'quick.hint': ['Um clique envia o comando no chat do jogo.', 'One click sends the command in the game chat.'],
    'quick.empty': ['Nenhuma ação. Clique em Editar para criar.', 'No actions. Click Edit to create one.'],
    'edit': ['Editar', 'Edit'], 'done': ['Concluir', 'Done'], 'quick.new': ['Nova ação', 'New action'],
    'label.ph': ['Nome do botão', 'Button label'], 'cmd.ph': ['Comando, ex.: /avatar 7', 'Command, e.g. /avatar 7'], 'add': ['Adicionar', 'Add'],
    'op.on': ['OP Mode ligado', 'OP Mode on'], 'op.value': ['Valor', 'Value'], 'op.key': ['Tecla de atalho', 'Hotkey'], 'op.nokey': ['Nenhuma', 'None'],
    'op.ping': ['Ping falso', 'Fake ping'], 'op.ping.ph': ['desligado', 'off'],
    'op.ping.hint': ['50 mostra sempre 50 · 20+ soma ao ping real · 15- subtrai · vazio desliga. Só muda o número exibido, não a conexão.', '50 always shows 50 · 20+ adds to the real ping · 15- subtracts · empty turns it off. Only changes the number shown, not your connection.'],
    'op.ping.bad': ['Use um número, com + ou - no final se quiser somar ou subtrair (ex.: 50, 20+, 15-).', 'Use a number, with + or - at the end to add or subtract (e.g. 50, 20+, 15-).'],
    'op.ping.miss': ['O patch do ping falso não encaixou nesta versão do jogo (veja o Log).', 'The fake ping patch did not fit this game version (see the Log).'],
    'op.hint': ['Módulo pessoal: use apenas em salas em que o dono autorizou. Não faz parte da versão pública.', 'Personal module: only use it in rooms whose owner allowed it. Not part of the public build.'],
    'op.wait': ['Disponível quando o jogo terminar de carregar.', 'Available once the game finishes loading.'],
    'op.miss': ['O patch do OP Mode não encaixou nesta versão do jogo (veja o Log).', 'The OP Mode patch did not fit this game version (see the Log).'],
    'game': ['Jogo', 'Game'], 'mode.auto': ['Oficial + Mod (recomendado)', 'Official + Mod (recommended)'], 'mode.frozen': ['Cópia antiga', 'Old copy'], 'mode.original': ['Original (sem Mod)', 'Original (no Mod)'],
    'bar.own': ['Barra de título do VOID', 'VOID title bar'], 'bar.ownhint': ['Troca a barra do Windows por uma na cor do tema. Vale ao reabrir o app.', 'Replaces the Windows bar with one in the theme color. Applies when you reopen the app.'],
    'bar.site': ['Esconder o menu do site (News / Play...)', 'Hide the site menu (News / Play...)'], 'bar.sitehint': ['O jogo ocupa a janela inteira.', 'The game fills the whole window.'],
    'm.restart': ['Feche e abra o VOID para aplicar', 'Close and reopen VOID to apply'],
    'ads': ['Bloquear anúncios', 'Block ads'], 'splash': ['Tela de abertura', 'Splash screen'],
    'bkey': ['Atalho do Chat Bubble', 'Chat Bubble shortcut'], 'bkey.none': ['Nenhum', 'None'], 'bkey.clear': ['Remover', 'Remove'],
    'bkey.hint': ['Aperte a tecla para ligar ou desligar o balão. Não dispara enquanto você digita no chat.', 'Press the key to turn the bubble on or off. It does not fire while you type in chat.'],
    'bkey.same': ['Essa tecla já tem outra função. Escolha outra.', 'That key already does something else. Pick another one.'],
    'm.bubble.on': ['Chat Bubble ligado', 'Chat Bubble on'], 'm.bubble.off': ['Chat Bubble desligado', 'Chat Bubble off'],
    'key': ['Atalho do menu', 'Menu shortcut'], 'key.change': ['Alterar', 'Change'], 'key.press': ['Pressione uma tecla...', 'Press a key...'],
    'auto': ['Mensagem automática', 'Automatic message'], 'auto.ph': ['Uma mensagem (opcional)', 'One message (optional)'],
    'auto.join': ['Enviar ao entrar na sala', 'Send when joining a room'], 'auto.now': ['Enviar agora (Alt+1)', 'Send now (Alt+1)'],
    'language': ['Idioma', 'Language'],
    'st.original': ['Modo original: sem patches.', 'Original mode: no patches.'], 'st.frozen': ['Cópia antiga em uso.', 'Old copy in use.'],
    'st.wait': ['Aguardando o jogo carregar...', 'Waiting for the game to load...'], 'st.patches': ['Patches ativos: ', 'Active patches: '], 'st.none': ['nenhum', 'none'],
    'st.miss': ['Não encaixou: ', 'Did not fit: '], 'st.bubble': ['Chat Bubble: disponível ao entrar numa sala.', 'Chat Bubble: available once you join a room.'],
    'st.by': ['Desenvolvido por Gabriel Vieira', 'Developed by Gabriel Vieira'], 'st.room': ['Sala atual: ', 'Current room: '], 'st.noroom': ['Fora de sala.', 'Not in a room.'],
    'log': ['Log', 'Log'], 'shots': ['Capturas', 'Screenshots'],
    'm.shot.ok': ['Captura salva', 'Screenshot saved'], 'm.shot.fail': ['Falhou ao capturar', 'Screenshot failed'],
    'm.join.bad': ['Link ou código inválido', 'Invalid link or code'], 'm.joining': ['Entrando em ', 'Joining '],
    'm.bubble.fail': ['Chat Bubble indisponível: o jogo ainda não carregou (ou está no modo original)', 'Chat Bubble unavailable: the game has not loaded yet (or is in original mode)'],
    'm.sent': ['Mensagem enviada', 'Message sent'], 'm.sent.fail': ['Entre numa sala (e aguarde 3 s entre envios)', 'Join a room first (and wait 3 s between messages)'],
    'm.key': ['Atalho: ', 'Shortcut: '], 'm.cmd.ok': ['Enviado: ', 'Sent: '], 'm.cmd.fail': ['Entre numa sala para usar as ações', 'Join a room to use actions'],
    'm.profile.reload': ['Perfil aplicado. Recarregando o jogo...', 'Profile applied. Reloading the game...'],
    'm.profile.room': ['Avatar trocado. O apelido vale na próxima sala.', 'Avatar changed. The nickname applies in the next room.'],
    'm.profile.fail': ['O jogo ainda não carregou', 'The game has not loaded yet'], 'm.profile.name': ['Digite um apelido', 'Type a nickname'],
    'm.full': ['Limite de 12 itens', 'Limit of 12 items'], 'm.cmd.need': ['Digite o comando', 'Type the command'],
    'm.hello': ['VOID ativo · {k} abre o menu', 'VOID active · {k} opens the menu'], 'm.op.fail': ['OP Mode indisponível agora', 'OP Mode unavailable right now'],
    'ago.now': ['agora', 'now'],
    'rejoin': ['Reentrar em: ', 'Rejoin: '], 'rejoin.drop': ['A conexão caiu. Reentrar em: ', 'Connection lost. Rejoin: '],
    'rejoin.auto': ['Reentrar sozinho se a conexão cair', 'Rejoin automatically if the connection drops'],
    'rejoin.hint': ['Até 3 tentativas. Não vale para expulsão ou banimento.', 'Up to 3 tries. Never after a kick or ban.'],
    'fav': ['Favoritar', 'Favorite'], 'm.fav.full': ['Limite de 10 favoritas', 'Limit of 10 favorites'],
    'lines': ['Cor das linhas do campo', 'Field line color'], 'ball': ['Cor da bola', 'Ball color'],
    'kick': ['Linha de chute', 'Kick line'], 'kick.on': ['Linha do seu jogador até a bola', 'Line from your player to the ball'],
    'kick.range': ['Aparece com a bola até', 'Shows when the ball is within'], 'kick.ext': ['Continua depois da bola', 'Continues past the ball'], 'kick.off': ['não', 'off'],
    'kick.ring': ['Círculo de alcance do chute', 'Kick reach circle'], 'kick.ringhint': ['A bola encostou no anel: o chute pega.', 'Ball touches the ring: the kick connects.'],
    'teams': ['Times', 'Teams'], 'team.on': ['Trocar as cores dos times', 'Change team colors'],
    'team.hint': ['Só na sua tela. Vale para as cores padrão (vermelho e azul) do HaxBall.', 'Only on your screen. Applies to HaxBall\u2019s default red and blue.'],
    'team.red': ['Time vermelho vira', 'Red team becomes'], 'team.blue': ['Time azul vira', 'Blue team becomes'],
    'dc': ['Discord', 'Discord'], 'dc.on': ['Mostrar "Jogando HaxBall" no perfil', 'Show "Playing HaxBall" on your profile'],
    'dc.room': ['Mostrar o nome da sala', 'Show the room name'], 'dc.id': ['ID do aplicativo', 'Application ID'], 'dc.idph': ['Número de 17 a 20 dígitos', '17 to 20 digit number'],
    'dc.hint': ['Crie um aplicativo em discord.com/developers (o nome dele é o que aparece no perfil) e cole aqui o "Application ID". Precisa do Discord de computador aberto. No modo gravação fica desligado.', 'Create an application at discord.com/developers (its name is what shows on your profile) and paste its "Application ID" here. Needs the desktop Discord app running. Off while recording mode is on.'],
    'dc.off': ['Desligado', 'Off'], 'dc.noid': ['Falta o ID do aplicativo', 'Application ID missing'], 'dc.connecting': ['Conectando...', 'Connecting...'],
    'dc.ok': ['Conectado ao Discord', 'Connected to Discord'], 'dc.nodiscord': ['Discord não encontrado (abra o Discord de computador)', 'Discord not found (open the desktop Discord app)'], 'dc.badid': ['O Discord recusou esse ID', 'Discord rejected this ID'],
    'm.dc.bad': ['ID inválido: são só números (17 a 20 dígitos)', 'Invalid ID: digits only (17 to 20)'],
    'players': ['Jogadores', 'Players'], 'name.size': ['Tamanho dos nomes', 'Name size'],
    'avatars.hide': ['Esconder avatares dos outros', 'Hide other players\u2019 avatars'], 'avatars.hint': ['O seu continua aparecendo.', 'Yours stays visible.'],
    'theme.color': ['Tema', 'Theme'], 'accent2': ['Intensidade da cor', 'Color intensity'],
    'bg': ['Imagem de fundo do menu', 'Menu background image'], 'bg.dim': ['Escurecer a imagem', 'Darken the image'],
    'choose': ['Escolher', 'Choose'], 'bg.none': ['Nenhuma imagem (png, jpg ou webp, até 4 MB)', 'No image (png, jpg or webp, up to 4 MB)'], 'bg.set': ['Imagem aplicada', 'Image applied'],
    'snd': ['Som próprio', 'Custom sounds'], 'snd.kick': ['Chute', 'Kick'], 'snd.goal': ['Gol', 'Goal'], 'snd.mention': ['Menção (quando citam seu apelido)', 'Mention (when your nickname is said)'],
    'snd.orig': ['som original', 'original sound'], 'snd.hint': ['Arquivos ogg, wav ou mp3 de até 1,5 MB. O som novo vale alguns segundos depois de escolher.', 'ogg, wav or mp3 files up to 1.5 MB. The new sound applies a few seconds after you choose it.'],
    'm.file.size': ['Arquivo grande demais', 'File is too large'], 'm.file.type': ['Tipo de arquivo não aceito', 'File type not accepted'], 'm.snd.ok': ['Som trocado', 'Sound replaced'],
    'filter': ['Filtro do chat (só na sua tela)', 'Chat filter (your screen only)'], 'filter.join': ['Esconder avisos de entrou/saiu', 'Hide joined/left notices'],
    'filter.players': ['Silenciar jogadores', 'Mute players'], 'filter.words': ['Esconder mensagens com as palavras', 'Hide messages containing'],
    'filter.pph': ['Apelido exato', 'Exact nickname'], 'filter.wph': ['Palavra', 'Word'],
    'backup': ['Suas configurações', 'Your settings'], 'export': ['Exportar', 'Export'], 'import': ['Importar', 'Import'],
    'backup.hint': ['Um arquivo com perfis, ações rápidas, personalização, filtro do chat e salas favoritas.', 'One file with profiles, quick actions, customization, chat filter and favorite rooms.'],
    'm.export.ok': ['Configurações exportadas', 'Settings exported'], 'm.import.ok': ['Configurações importadas', 'Settings imported'], 'm.import.fail': ['Arquivo inválido', 'Invalid file'],
    'upd': ['Versão nova disponível: ', 'New version available: '], 'upd.get': ['Baixar', 'Download'],
    'st.drop': ['Conexão caiu: ', 'Connection lost: '],
    'sl.game': ['Jogo', 'Game'], 'sl.cmds': ['Comandos de chat', 'Chat commands'], 'sl.room': ['Sala', 'Room'], 'sl.update': ['Atualização', 'Update'],
    'sv.ready': ['Ativo', 'Active'], 'sv.inactive': ['Inativo', 'Inactive'], 'sv.loading': ['Carregando...', 'Loading...'],
    
    'sv.modded': ['Oficial + Mod', 'Official + Mod'], 'sv.original': ['Original, sem Mod', 'Original, no Mod'], 'sv.frozen': ['Cópia antiga', 'Old copy'],
    'sv.noroom': ['Nenhuma', 'None'], 'sv.inaroom': ['Em uma sala', 'In a room'], 'sv.latest': ['Você está na versão mais recente', 'You are on the latest version']
  };
  function t(k) { var v = T[k]; return v ? v[lang === 'en' ? 1 : 0] : k; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- estrutura (Shadow DOM: o CSS do site não interfere) ----------
  var host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;top:0;left:0;z-index:2147483647;';
  var root = host.attachShadow({ mode: 'open' });

  // logo: letras finas com o corte vermelho no O
  function wordmark(cls) {
    return '<svg class="' + cls + '" viewBox="-6 -6 338 132" aria-label="VOID"><g fill="none" stroke="currentColor" stroke-width="9" stroke-miterlimit="8">' +
      '<polyline points="6,10 44,108 82,10"/><circle cx="142" cy="60" r="45.5"/><line x1="222" y1="10" x2="222" y2="110"/><path d="M252 14.5H270a45.5 45.5 0 0 1 0 91H252Z"/></g>' +
      '<line class="slash" x1="112" y1="118" x2="172" y2="2" stroke-width="8"/></svg>';
  }
  var ICON = {
    home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
    look: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>',
    profile: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5"/>',
    audio: '<path d="M4 10v4h3l5 4V6l-5 4zM16 9c1.3 1.6 1.3 4.4 0 6M18.5 6.5c2.7 3 2.7 8 0 11"/>',
    hud: '<path d="M4 5h16v11H9l-5 4z"/>',
    quick: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
    op: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
    settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    status: '<path d="M3 12h4l2.5-6 4 12 2.5-6h5"/>',
    reload: '<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5"/>',
    fullscreen: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    top: '<path d="M12 3v10M8 9l4 4 4-4M5 21h14"/>',
    shot: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    zoomout: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.2-4.2M8.5 11h5"/>',
    zoomin: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.2-4.2M8.5 11h5M11 8.5v5"/>'
  };
  function svg(name, size) {
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + ICON[name] + '</svg>';
  }
  function i18n(k) { return '<span data-i18n="' + k + '"></span>'; }
  function sec(k, extra) { return '<div class="sec">' + i18n(k) + (extra || '') + '</div>'; }
  function sw(id, k, hint) {
    return '<label class="line"><span class="lbl">' + i18n(k) + (hint ? '<small data-i18n="' + hint + '"></small>' : '') + '</span><span class="sw"><input type="checkbox" id="' + id + '"><i></i></span></label>';
  }
  function slider(id, k, min, max, step) {
    return '<div class="line"><span class="lbl">' + i18n(k) + '</span><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + (step || 1) + '"><span class="val" id="' + id + 'v"></span></div>';
  }
  function colorRow(id, k, swatches) {
    return '<div class="line"><span class="lbl">' + i18n(k) + '</span><span class="sws" data-for="' + id + '">' +
      swatches.map(function (c) { return '<button type="button" class="swatch" data-c="' + c + '" style="background:' + c + '" title="' + c + '"></button>'; }).join('') +
      '</span><input type="color" id="' + id + '"></div>';
  }
  function swColor(sw_, color, k) {
    return '<div class="line"><span class="lbl">' + i18n(k) + '</span><input type="color" id="' + color + '"><span class="sw"><input type="checkbox" id="' + sw_ + '"><i></i></span></div>';
  }
  function soundRow(slot) {
    return '<div class="line"><span class="lbl">' + i18n('snd.' + slot) + '<small id="sn-' + slot + '"></small></span><button class="btn ghost sm" type="button" data-snd="' + slot + '" data-i18n="choose"></button><button class="x" type="button" data-sndx="' + slot + '">&times;</button></div>';
  }
  function chipInput(id, k, ph) {
    return '<div class="line"><span class="lbl">' + i18n(k) + '</span><input type="text" id="' + id + '" maxlength="30" data-ph="' + ph + '" spellcheck="false" style="flex:none;width:190px"><button class="btn ghost sm" type="button" id="' + id + 'add">+</button></div><div class="chips" id="' + id + 's"></div>';
  }
  var THEME_SW = { red: '#e0212f', blue: '#2f7de0', purple: '#8b4be0', green: '#27b860', white: '#e8e8ec' };
  function tool(act) { return '<button class="tool" data-act="' + act + '" id="t-' + act + '">' + svg(act, 18) + i18n('tool.' + act) + '</button>'; }

  var CSS = [
    ':host{--red:#e0212f;--hi:#ff3b4a;--rgb:224,33,47;--hrgb:255,59,74;--on:#fff;--line:rgba(255,255,255,.07);--mut:#83858f;--txt:#e8e8ec}',
    '*{box-sizing:border-box}',
    '#wrap{font:13px/1.45 system-ui,"Segoe UI",sans-serif;color:var(--txt);-webkit-font-smoothing:antialiased}',
    // janela
    '.menu{position:fixed;display:flex;width:720px;height:500px;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);background:#0c0c0f;border:1px solid var(--line);border-radius:14px;overflow:hidden;',
    ' box-shadow:0 30px 80px rgba(0,0,0,.7),0 0 0 1px rgba(0,0,0,.6);visibility:hidden;opacity:0;transform:translateY(10px) scale(.985);transition:opacity .2s ease,transform .2s ease,visibility 0s linear .2s}',
    '.open .menu{visibility:visible;opacity:1;transform:none;transition:opacity .2s ease,transform .2s ease}',
    '.menu.dragging{transition:none}',
    // barra lateral
    '.side{flex:none;width:196px;display:flex;flex-direction:column;background:#08080a;border-right:1px solid var(--line)}',
    '.brand{padding:24px 24px 18px;cursor:grab;user-select:none;touch-action:none}',
    '.dragging .brand,.dragging .top{cursor:grabbing}',
    '.wm{display:block;width:104px;height:auto;color:#fff}.slash{stroke:var(--red)}',
    '.brand small{display:block;margin-top:9px;font-size:8.5px;font-weight:600;letter-spacing:.42em;color:var(--mut)}',
    'nav{flex:1;display:flex;flex-direction:column;gap:1px;padding:6px 0;overflow:auto}',
    '.nav{position:relative;display:flex;align-items:center;gap:12px;height:36px;padding:0 24px;border:0;background:none;color:var(--mut);font:500 12.5px system-ui;letter-spacing:.02em;text-align:left;cursor:pointer;transition:color .15s,background .15s}',
    '.nav svg{flex:none;opacity:.85}.nav:hover{color:#fff}',
    '.nav::before{content:"";position:absolute;left:0;top:9px;bottom:9px;width:2px;background:var(--red);transform:scaleY(0);transition:transform .18s ease}',
    '.nav.on{color:#fff;background:linear-gradient(90deg,rgba(var(--rgb),.13),transparent 85%)}.nav.on::before{transform:none}.nav.on svg{color:var(--hi);opacity:1}',
    '.nav[hidden]{display:none}',
    '.foot{display:flex;align-items:center;justify-content:space-between;padding:14px 24px 18px;border-top:1px solid var(--line)}',
    '.lang{display:flex;border:1px solid var(--line);border-radius:6px;overflow:hidden}',
    '.lang button{width:34px;height:24px;border:0;background:none;color:var(--mut);font:600 10px system-ui;letter-spacing:.1em;cursor:pointer;transition:.15s}',
    '.lang button:hover{color:#fff}.lang button.on{background:rgba(255,255,255,.09);color:#fff}',
    '.ver{font-size:10px;letter-spacing:.12em;color:#5d5f68}',
    // conteúdo
    '.content{flex:1;min-width:0;display:flex;flex-direction:column}',
    '.top{flex:none;display:flex;align-items:center;justify-content:space-between;padding:22px 20px 12px 28px;cursor:grab;user-select:none;touch-action:none}',
    '.top h2{margin:0;font:300 17px system-ui;letter-spacing:.2em;text-transform:uppercase;color:#fff}',
    '.x{width:28px;height:28px;border:0;border-radius:7px;background:none;color:var(--mut);font-size:18px;line-height:1;cursor:pointer;transition:.15s}.x:hover{background:rgba(255,255,255,.07);color:#fff}',
    '.pages{flex:1;overflow:auto;padding:0 28px 24px}',
    '.pages::-webkit-scrollbar,nav::-webkit-scrollbar{width:8px}.pages::-webkit-scrollbar-thumb,nav::-webkit-scrollbar-thumb{background:#24252a;border-radius:4px;border:2px solid #0c0c0f}',
    '.page{display:none}.page.on{display:block;animation:in .22s ease}',
    '@keyframes in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',
    '.sec{display:flex;align-items:center;gap:10px;margin:20px 0 8px;font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--mut)}',
    '.sec::after{content:"";flex:1;height:1px;background:var(--line)}.sec:first-child{margin-top:6px}',
    '.sec .link{order:2}',
    '.link{border:0;background:none;padding:0;color:var(--mut);font:600 10px system-ui;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}.link:hover{color:var(--hi)}',
    '.row{display:flex;gap:8px;align-items:center}',
    '.line{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:38px;cursor:default}',
    'label.line{cursor:pointer}',
    '.lbl{flex:1;min-width:0}.lbl small{display:block;margin-top:1px;font-size:11px;color:var(--mut)}',
    '.hint{margin:10px 0 0;font-size:11px;line-height:1.5;color:var(--mut)}',
    'input[type=text],input[type=number],select{flex:1;min-width:0;height:34px;background:rgba(255,255,255,.035);color:#fff;border:1px solid var(--line);border-radius:7px;padding:0 11px;font:inherit;outline:none;transition:border-color .15s,box-shadow .15s}',
    'input[type=text]:focus,input[type=number]:focus,select:focus{border-color:rgba(var(--rgb),.8);box-shadow:0 0 0 3px rgba(var(--rgb),.14)}',
    'input::placeholder{color:#5d5f68}select option{background:#111}',
    'input[type=range]{flex:none;width:200px;margin:0;accent-color:var(--red);cursor:pointer}',
    '.val{flex:none;width:52px;text-align:right;font:500 12px system-ui;color:#fff;font-variant-numeric:tabular-nums}',
    'input[type=color]{flex:none;width:34px;height:26px;padding:0;border:1px solid var(--line);border-radius:6px;background:none;cursor:pointer}',
    'input[type=color]::-webkit-color-swatch-wrapper{padding:2px}input[type=color]::-webkit-color-swatch{border:0;border-radius:4px}',
    '.sws{display:flex;gap:6px}.swatch{width:18px;height:18px;padding:0;border:1px solid rgba(255,255,255,.18);border-radius:50%;cursor:pointer;transition:transform .12s}',
    '.swatch:hover{transform:scale(1.15)}.swatch.on{box-shadow:0 0 0 2px #0c0c0f,0 0 0 3px #fff}',
    '.btn{flex:none;height:34px;padding:0 16px;border:1px solid transparent;border-radius:7px;background:var(--red);color:var(--on);font:600 11px system-ui;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:background .15s,border-color .15s,color .15s}',
    '.btn:hover{background:var(--hi)}.btn:active{transform:translateY(1px)}',
    '.btn.ghost{background:none;border-color:var(--line);color:#cfd0d6}.btn.ghost:hover{border-color:rgba(255,255,255,.25);color:#fff}',
    '.btn.sm{height:28px;padding:0 11px;font-size:10px}',
    '.tools{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}',
    '.tool{display:flex;flex-direction:column;align-items:center;gap:7px;padding:12px 2px 9px;border:1px solid var(--line);border-radius:9px;background:none;color:#b9bac2;font:500 10px system-ui;letter-spacing:.02em;cursor:pointer;transition:.15s}',
    '.tool:hover{border-color:rgba(255,255,255,.22);color:#fff}.tool.on{border-color:rgba(var(--rgb),.7);color:var(--hi);background:rgba(var(--rgb),.08)}',
    '.item{display:flex;align-items:center;gap:12px;width:100%;min-height:40px;padding:6px 10px 6px 12px;margin:0 0 6px;border:1px solid var(--line);border-radius:9px;background:none;color:#ddd;font:500 12.5px system-ui;text-align:left;transition:.15s}',
    'button.item{cursor:pointer}button.item:hover{border-color:rgba(255,255,255,.22);color:#fff}',
    '.item .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.item .m{flex:none;color:var(--mut);font-size:11px}',
    '.av{flex:none;display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#17181c;border:1.5px solid rgba(255,255,255,.75);font:700 12px system-ui;color:#fff}',
    '.item.cur{border-color:rgba(var(--rgb),.5);background:rgba(var(--rgb),.06)}',
    '.empty{padding:4px 0;color:var(--mut);font-size:12px}',
    '.quick{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
    '.q{position:relative;display:flex;flex-direction:column;gap:2px;padding:11px 12px;border:1px solid var(--line);border-radius:9px;background:none;color:#fff;font:600 12px system-ui;text-align:left;cursor:pointer;transition:.15s;min-width:0}',
    '.q:hover{border-color:rgba(var(--rgb),.6);background:rgba(var(--rgb),.07)}.q span,.q code{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.q code{font:500 11px ui-monospace,Consolas,monospace;color:var(--mut)}',
    '.q.del{border-style:dashed}.q.del::after{content:"\\00d7";position:absolute;right:9px;top:5px;font-size:16px;color:var(--hi)}',
    '.sw{position:relative;flex:none;width:36px;height:20px}.sw input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;z-index:1}',
    '.sw i{position:absolute;inset:0;border-radius:10px;background:#25262b;transition:.18s}',
    '.sw i::after{content:"";position:absolute;left:3px;top:3px;width:14px;height:14px;border-radius:50%;background:#8b8d96;transition:.18s}',
    '.sw input:checked+i{background:var(--red)}.sw input:checked+i::after{left:19px;background:var(--on)}',
    '.sw input:focus-visible+i{box-shadow:0 0 0 3px rgba(var(--rgb),.3)}',
    'kbd{display:inline-block;padding:4px 10px;border:1px solid var(--line);border-bottom-width:2px;border-radius:6px;background:rgba(255,255,255,.04);font:600 11px system-ui;color:#fff}',
    '.prev{display:flex;align-items:center;justify-content:center;height:92px;margin:4px 0 2px;border:1px solid var(--line);border-radius:9px;overflow:hidden;transition:background .15s}',
    '.shead{display:flex;align-items:baseline;justify-content:space-between;margin:6px 0 10px}.shead b{font:300 17px system-ui;letter-spacing:.14em;text-transform:uppercase;color:#fff}.shead span{font-size:11px;letter-spacing:.12em;color:var(--mut)}',
    '.srow{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:36px;border-top:1px solid var(--line);font-size:12.5px}.srow>span:first-child{color:#cfd0d6}',
    '.sval{display:flex;align-items:center;gap:8px;min-width:0;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sval i{flex:none;width:6px;height:6px;border-radius:50%;background:#5d5f68}',
    '.sval.ok i{background:#4ade80}.sval.wait i{background:#f5c451}.sval.bad i{background:var(--hi)}.sval.bad{color:var(--hi)}.sval.off,.sval.wait{color:var(--mut)}',
    '.snote{margin-top:10px;font-size:11.5px;color:var(--hi)}.sfoot{margin-top:12px;padding-top:12px;border-top:1px solid var(--line);font-size:11px;letter-spacing:.06em;color:var(--mut)}',
    '.warnbox{margin:0 0 6px;padding:9px 12px;border:1px solid rgba(var(--rgb),.35);border-radius:9px;background:rgba(var(--rgb),.06);font-size:11.5px;line-height:1.5;color:#d6d7dc}',
    '.bgimg,.bgdim{position:absolute;inset:0;pointer-events:none}.bgimg{background-size:cover;background-position:center}.bgdim{background:#0c0c0f}',
    '.side,.content{position:relative;z-index:1}.hasbg .side{background:rgba(8,8,10,.55);backdrop-filter:blur(6px)}',
    '.item.click{cursor:pointer}.item.click:hover{border-color:rgba(255,255,255,.22);color:#fff}',
    '.star{flex:none;width:24px;height:24px;padding:0;border:0;background:none;color:#4c4e57;font-size:15px;line-height:1;cursor:pointer;transition:.15s}.star:hover{color:#fff}.star.on{color:#ffd84a}',
    '.chips{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 8px}.chips:empty{display:none}',
    '.chip{display:inline-flex;align-items:center;gap:7px;height:26px;padding:0 9px 0 11px;border:1px solid var(--line);border-radius:13px;background:rgba(255,255,255,.04);color:#ddd;font:500 11.5px system-ui;cursor:pointer;transition:.15s}',
    '.chip::after{content:"\\00d7";color:var(--mut);font-size:14px}.chip:hover{border-color:rgba(var(--rgb),.6)}.chip:hover::after{color:var(--hi)}',
    '.warnbox .btn{margin-left:8px;vertical-align:middle}',
    '.dot{flex:none;width:6px;height:6px;border-radius:50%;background:var(--hi);margin-left:auto}',
    '[hidden]{display:none!important}',
    '#bar{position:fixed;top:0;left:0;right:0;height:34px;display:flex;align-items:center;gap:12px;padding:0 150px 0 14px;-webkit-app-region:drag;user-select:none;font:600 8.5px system-ui;letter-spacing:.42em;color:rgba(255,255,255,.7);box-shadow:inset 0 -1px 0 rgba(0,0,0,.35)}',
    '.bwm{display:block;height:15px;width:auto;color:#fff}.bwm .slash{stroke:#fff;opacity:.6}',
    '#fps{position:fixed;top:44px;left:10px;display:flex;align-items:center;gap:7px;padding:5px 10px;border-radius:5px;background:rgba(8,8,10,.8);border:1px solid var(--line);font:600 11px/1 system-ui;letter-spacing:.06em;color:#e9e9ec}',
    '#fps i{width:5px;height:5px;border-radius:50%;background:var(--hi)}',
    '#toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,10px);padding:10px 16px;border-radius:8px;background:rgba(8,8,10,.94);border:1px solid var(--line);border-left:2px solid var(--red);font:500 12px system-ui;letter-spacing:.02em;color:#fff;opacity:0;pointer-events:none;transition:.2s}',
    '#toast.show{opacity:1;transform:translate(-50%,0)}',
    '@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}'
  ].join('');

  var GROUND = ['#3d6b45', '#2f5d8a', '#4a4d57', '#6b4a3a', '#1b1c20'];
  var CROSS = ['#ffffff', '#ff3b4a', '#ffd84a', '#5ad1ff', '#6dff8f'];

  var PAGES = {
    home:
      sec('room') + '<div class="row"><input type="text" id="room" data-ph="room.ph" spellcheck="false"><button class="btn" id="join" data-i18n="join"></button></div>' +
      '<div class="row" id="rejoinrow" style="margin-top:8px" hidden><button class="btn ghost" id="rejoin" type="button" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></button></div>' +
      sec('tools') + '<div class="tools">' + ['reload', 'fullscreen', 'top', 'shot', 'zoomout', 'zoomin'].map(tool).join('') + '</div>' +
      sec('recent', '<button class="link" id="hclear" type="button" data-i18n="clear"></button>') + '<div id="hist"></div>',
    look:
      sec('field') + '<div class="prev" id="prev"></div>' + sw('flat', 'flat', 'flat.hint') + colorRow('ground', 'ground', GROUND) +
      swColor('lineOn', 'lineColor', 'lines') + swColor('ballOn', 'ballColor', 'ball') +
      sec('cross') + sw('cross', 'cross.on', 'cross.hint') + colorRow('crossColor', 'color', CROSS) + slider('crossSize', 'size', 60, 200, 5) +
      sec('kick') + swColor('kickLine', 'kickColor', 'kick.on') + slider('kickRange', 'kick.range', 40, 600, 10) + slider('kickExt', 'kick.ext', 0, 400, 10) +
      '<div class="line"><span class="lbl">' + i18n('kick.ring') + '<small data-i18n="kick.ringhint"></small></span><input type="color" id="kickRingColor"><span class="sw"><input type="checkbox" id="kickRing"><i></i></span></div>' +
      sec('players') + slider('nameSize', 'name.size', 60, 200, 5) + sw('hideAvatars', 'avatars.hide', 'avatars.hint') +
      sec('teams') + sw('teamOn', 'team.on', 'team.hint') +
      '<div class="line"><span class="lbl">' + i18n('team.red') + '</span><input type="color" id="teamRed"></div><div class="line"><span class="lbl">' + i18n('team.blue') + '</span><input type="color" id="teamBlue"></div>' +
      sec('theme') + '<div class="line"><span class="lbl">' + i18n('theme.color') + '</span><span class="sws">' +
      Object.keys(THEME_SW).map(function (n) { return '<button type="button" class="swatch" data-theme="' + n + '" style="background:' + THEME_SW[n] + '" title="' + n + '"></button>'; }).join('') + '</span></div>' +
      slider('accent', 'accent2', 0, 100) +
      '<div class="line"><span class="lbl">' + i18n('bg') + '<small id="bgname"></small></span><button class="btn ghost sm" type="button" id="bgpick" data-i18n="choose"></button><button class="x" type="button" id="bgclear">&times;</button></div>' +
      slider('bgDim', 'bg.dim', 0, 95, 5),
    profile:
      sec('profile.now') + '<div class="item cur"><span class="av" id="curav"></span><span class="n" id="curnick"></span><button class="btn ghost sm" id="savecur" data-i18n="profile.savecur"></button></div>' +
      sec('profile.saved') + '<div id="profiles"></div>' +
      sec('profile.new') + '<div class="row"><input type="text" id="pname" maxlength="25" data-ph="nick.ph" spellcheck="false"><input type="text" id="pav" maxlength="4" data-ph="avatar.ph" spellcheck="false" style="flex:none;width:84px;text-align:center"><button class="btn" id="padd" data-i18n="save"></button></div>' +
      '<p class="hint" data-i18n="profile.hint"></p>',
    audio:
      sec('vol') + slider('vgoal', 'vol.goal', 0, 100) + slider('vkick', 'vol.kick', 0, 100) + slider('vchat', 'vol.chat', 0, 100) +
      '<p class="hint" data-i18n="vol.hint"></p>' +
      sec('snd') + soundRow('kick') + soundRow('goal') + soundRow('mention') + '<p class="hint" data-i18n="snd.hint"></p>',
    hud:
      sec('chat') + slider('chatFont', 'chat.font', 9, 24) + slider('chatOpacity', 'chat.opacity', 20, 100, 5) +
      sec('filter') + sw('hideJoin', 'filter.join') + chipInput('fplayer', 'filter.players', 'filter.pph') + chipInput('fword', 'filter.words', 'filter.wph') +
      sec('hud') + sw('hideScore', 'hud.score') + sw('hideTimer', 'hud.timer') +
      sec('overlay') + sw('fpsc', 'fps') + sw('rec', 'rec') + sw('bubble', 'bubble') +
      '<div class="line"><span class="lbl">' + i18n('bkey') + '</span><kbd id="bkey"></kbd><button class="btn ghost sm" id="chbkey" data-i18n="key.change"></button><button class="btn ghost sm" id="rmbkey" data-i18n="bkey.clear"></button></div>' +
      '<p class="hint" data-i18n="bkey.hint"></p>',
    quick:
      sec('nav.quick', '<button class="link" id="qedit" type="button"></button>') + '<div class="quick" id="quick"></div><p class="hint" data-i18n="quick.hint"></p>' +
      '<div id="qform" hidden>' + sec('quick.new') + '<div class="row"><input type="text" id="qlabel" maxlength="22" data-ph="label.ph" spellcheck="false" style="flex:.7"><input type="text" id="qcmd" maxlength="140" data-ph="cmd.ph" spellcheck="false"><button class="btn" id="qadd" data-i18n="add"></button></div></div>',
    op:
      '<p class="warnbox" data-i18n="op.hint"></p><p class="hint" id="opnote"></p>' +
      '<div id="opbody">' + sw('opon', 'op.on') +
      '<div class="line"><span class="lbl">' + i18n('op.value') + '</span><input type="number" id="opval" min="-9999" max="9999" step="1" style="flex:none;width:110px"></div>' +
      '<div class="line"><span class="lbl">' + i18n('op.key') + '</span><select id="opkey" style="flex:none;width:170px"><option value="" data-i18n="op.nokey"></option><option value="ControlLeft">Left Ctrl</option><option value="ControlRight">Right Ctrl</option><option value="AltLeft">Left Alt</option><option value="CapsLock">Caps Lock</option><option value="KeyO">O</option></select></div>' +
      sec('op.ping') + '<div class="line"><span class="lbl">' + i18n('op.ping') + '</span><input type="text" id="opping" maxlength="5" data-ph="op.ping.ph" spellcheck="false" style="flex:none;width:110px"></div>' +
      '<p class="hint" data-i18n="op.ping.hint"></p><p class="hint" id="oppingnote" data-i18n="op.ping.miss" hidden></p></div>',
    settings:
      sec('game') + '<div class="row"><select id="mode"><option value="auto" data-i18n="mode.auto"></option><option value="frozen" id="opt-frozen" data-i18n="mode.frozen"></option><option value="original" data-i18n="mode.original"></option></select></div>' +
      sw('ads', 'ads') + sw('splash', 'splash') + sw('titleBar', 'bar.own', 'bar.ownhint') + sw('hideSite', 'bar.site', 'bar.sitehint') + sw('autoRejoin', 'rejoin.auto', 'rejoin.hint') +
      '<div class="line"><span class="lbl">' + i18n('key') + '</span><kbd id="key"></kbd><button class="btn ghost sm" id="chkey" data-i18n="key.change"></button></div>' +
      sec('auto') + '<div class="row"><input type="text" id="msg" maxlength="140" data-ph="auto.ph" spellcheck="false"><button class="btn ghost" id="sendnow" data-i18n="auto.now"></button></div>' + sw('onjoin', 'auto.join') +
      sec('dc') + sw('dcOn', 'dc.on') + sw('dcRoom', 'dc.room') +
      '<div class="line"><span class="lbl">' + i18n('dc.id') + '<small id="dcstat"></small></span><input type="text" id="dcId" maxlength="20" inputmode="numeric" data-ph="dc.idph" spellcheck="false" style="flex:none;width:210px"></div><p class="hint" data-i18n="dc.hint"></p>' +
      sec('backup') + '<div class="row"><button class="btn ghost" type="button" id="export" data-i18n="export"></button><button class="btn ghost" type="button" id="import" data-i18n="import"></button></div><p class="hint" data-i18n="backup.hint"></p>',
    status:
      '<p class="warnbox" id="upd" hidden><span id="updtxt"></span><button class="btn sm" type="button" id="updopen" data-i18n="upd.get"></button></p>' +
      '<div class="stat" id="stat"></div>' + sec('tools') +
      '<div class="row"><button class="btn ghost" data-act="log" data-i18n="log"></button><button class="btn ghost" data-act="devtools">DevTools</button><button class="btn ghost" data-act="shotfolder" data-i18n="shots"></button></div>'
  };
  var ORDER = ['home', 'look', 'profile', 'audio', 'hud', 'quick', 'op', 'settings', 'status'];

  root.innerHTML = '<style>' + CSS + '</style><div id="wrap">' +
    '<div id="bar" hidden>' + wordmark('bwm') + '<span>HAXBALL MOD</span></div>' +
    '<div id="fps" hidden><i></i><span>0 FPS</span></div><div id="toast"></div>' +
    '<section class="menu" id="menu"><div class="bgimg" id="bgimg" hidden></div><div class="bgdim" id="bgdim" hidden></div><aside class="side"><div class="brand" data-drag>' + wordmark('wm') + '<small>HAXBALL MOD</small></div><nav>' +
    ORDER.map(function (p) { return '<button class="nav" data-go="' + p + '" type="button">' + svg(p, 16) + i18n('nav.' + p) + (p === 'status' ? '<i class="dot" id="upddot" hidden></i>' : '') + '</button>'; }).join('') +
    '</nav><div class="foot"><div class="lang"><button type="button" data-lang="pt">PT</button><button type="button" data-lang="en">EN</button></div><span class="ver" id="ver"></span></div></aside>' +
    '<div class="content"><div class="top" data-drag><h2 id="ptitle"></h2><button class="x" id="close" type="button">&times;</button></div><div class="pages">' +
    ORDER.map(function (p) { return '<div class="page" data-page="' + p + '">' + PAGES[p] + '</div>'; }).join('') +
    '</div></div></section></div>';
  document.documentElement.appendChild(host);

  var $ = function (id) { return root.getElementById(id); };
  var all = function (sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };
  var wrap = $('wrap'), menu = $('menu'), fpsEl = $('fps'), toastEl = $('toast');

  function toast(text, ms) {
    toastEl.textContent = text; toastEl.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 3200);
  }
  function keyLabel(code) {
    var m = { ShiftRight: 'Right Shift', ShiftLeft: 'Left Shift', ControlRight: 'Right Ctrl', AltRight: 'Right Alt', Backquote: '`' };
    if (m[code]) return m[code];
    return String(code || '').replace(/^Key/, '').replace(/^Digit/, '');
  }

  // ---------- idioma e navegação ----------
  function applyLang() {
    all('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    all('[data-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-ph')); });
    all('[data-lang]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-lang') === lang); });
    $('close').title = t('close');
    $('ptitle').textContent = t('nav.' + page);
    $('qedit').textContent = t(editQuick ? 'done' : 'edit');
    histKey = ''; listKey = ''; chipKey = '';
  }
  function go(p) {
    page = p;
    all('.nav').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-go') === p); });
    all('.page').forEach(function (d) { d.classList.toggle('on', d.getAttribute('data-page') === p); });
    $('ptitle').textContent = t('nav.' + p);
    root.querySelector('.pages').scrollTop = 0;
  }
  all('.nav').forEach(function (b) { b.addEventListener('click', function () { go(b.getAttribute('data-go')); }); });
  all('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { lang = b.getAttribute('data-lang'); applyLang(); render(); api.setConfig({ lang: lang }); });
  });
  $('close').addEventListener('click', function () { setOpen(false); });
  // o que for digitado no menu não chega ao jogo
  root.addEventListener('keydown', function (e) { if (e.target && /^(INPUT|SELECT)$/.test(e.target.tagName)) e.stopPropagation(); });

  // ---------- posição e arrastar ----------
  // ---------- barra de título do VOID e menu do site ----------
  // Com a barra do VOID (ou com "esconder o menu do site"), o jogo é preso à janela: começa logo abaixo da
  // barra e ocupa todo o resto. Assim não depende de como a página do HaxBall está montada.
  function barH() { return state && state.bar && state.bar.active ? state.bar.height : 0; }
  var FIT = ['position', 'top', 'left', 'width', 'height', 'z-index', 'border'];
  var fitted = null;
  function gameFrame() {
    var frames = Array.prototype.slice.call(document.querySelectorAll('iframe')).filter(function (f) { var r = f.getBoundingClientRect(); return r.width * r.height > 0; });
    return frames.length ? frames.reduce(function (a, b) { var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return rb.width * rb.height > ra.width * ra.height ? b : a; }) : null;
  }
  function fitGame() {
    if (!state) return;
    var h = barH(), want = h > 0 || !!state.config.hideSite, bar = $('bar');
    bar.hidden = !h;
    if (h) { bar.style.height = h + 'px'; bar.style.background = state.bar.color; }
    $('fps').style.top = (h ? h + 10 : 44) + 'px';
    var g = want ? gameFrame() : null;
    if (fitted && fitted !== g) { FIT.forEach(function (k) { fitted.style.removeProperty(k); }); fitted = null; }
    if (!g) return;
    var css = { position: 'fixed', top: h + 'px', left: '0', width: '100vw', height: 'calc(100vh - ' + h + 'px)', 'z-index': '2147483000', border: '0' };
    FIT.forEach(function (k) { g.style.setProperty(k, css[k], 'important'); });
    fitted = g;
  }
  function clamp(x, y) {
    var w = menu.offsetWidth || MENU_W;
    return { x: Math.round(Math.min(Math.max(8, x), Math.max(8, window.innerWidth - w - 8))), y: Math.round(Math.min(Math.max(8 + barH(), y), Math.max(8 + barH(), window.innerHeight - 60))) };
  }
  function place(x, y) { var p = clamp(x, y); menu.style.left = p.x + 'px'; menu.style.top = p.y + 'px'; return p; }
  function layout() {
    var saved = state && state.config.layout && state.config.layout.menu;
    if (saved) place(saved.x, saved.y);
    else place((window.innerWidth - (menu.offsetWidth || MENU_W)) / 2, (window.innerHeight - (menu.offsetHeight || MENU_H)) / 2);
  }
  all('[data-drag]').forEach(function (head) {
    head.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('button')) return;
      var r = menu.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, raf = 0;
      head.setPointerCapture(e.pointerId);
      menu.classList.add('dragging');
      function move(ev) {
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = 0; place(r.left + ev.clientX - sx, r.top + ev.clientY - sy); });
      }
      function up(ev) {
        head.removeEventListener('pointermove', move); head.removeEventListener('pointerup', up); head.removeEventListener('pointercancel', up);
        try { head.releasePointerCapture(ev.pointerId); } catch (x) { }
        menu.classList.remove('dragging');
        var b = menu.getBoundingClientRect();
        api.setConfig({ layout: { menu: clamp(b.left, b.top) } }).then(refresh);
      }
      head.addEventListener('pointermove', move); head.addEventListener('pointerup', up); head.addEventListener('pointercancel', up);
    });
  });
  window.addEventListener('resize', function () { var b = menu.getBoundingClientRect(); place(b.left, b.top); schedule(); });

  // ---------- cor de destaque ----------
  // intensidade do vermelho: mesma fórmula do main.js (0 = escuro/apagado, 100 = vivo, 72 = original)
  function hslHex(h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return ('0' + Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16)).slice(-2); };
    return '#' + f(0) + f(8) + f(4);
  }
  function rgbOf(hex) { return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); }).join(','); }
  function palette(t, theme) {
    var THEMES = { red: 355, blue: 215, purple: 268, green: 145, white: -1 };
    t = Math.min(100, Math.max(0, Math.round(Number(t) || 0)));
    var hue = THEMES[theme] === undefined ? THEMES.red : THEMES[theme];
    return {
      accent: hue < 0 ? hslHex(0, 0, 56 + t * 0.36) : hslHex(hue, 30 + t * 0.62, 25 + t * 0.34),
      hi: hue < 0 ? hslHex(0, 0, 66 + t * 0.34) : hslHex(hue, 35 + t * 0.62, 34 + t * 0.34),
      on: hue < 0 ? '#111114' : '#ffffff'
    };
  }
  function applyAccent(v) {
    var p = palette(v, state ? state.config.theme : 'red');
    wrap.style.setProperty('--red', p.accent); wrap.style.setProperty('--hi', p.hi); wrap.style.setProperty('--on', p.on);
    wrap.style.setProperty('--rgb', rgbOf(p.accent)); wrap.style.setProperty('--hrgb', rgbOf(p.hi));
    $('accentv').textContent = Math.round(v) + '%';
  }

  // ---------- listas (nomes vêm da sala ou de você: sempre como texto, nunca como HTML) ----------
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function ago(ms) {
    var m = Math.floor((Date.now() - ms) / 60000);
    if (m < 1) return t('ago.now'); if (m < 60) return m + ' min';
    var h = Math.floor(m / 60); return h < 24 ? h + ' h' : Math.floor(h / 24) + ' d';
  }
  var histKey = '', listKey = '';
  function renderHistory() {
    var list = state.config.history || [], box = $('hist');
    var key = JSON.stringify(list) + '|' + Math.floor(Date.now() / 60000);
    if (key === histKey) return;
    histKey = key; box.textContent = '';
    $('hclear').hidden = !list.length;
    if (!list.length) { box.appendChild(el('div', 'empty', t('recent.empty'))); return; }
    // favoritas primeiro; dentro de cada grupo, a mais recente em cima
    list.slice().sort(function (x, y) { return (y.fav ? 1 : 0) - (x.fav ? 1 : 0) || y.at - x.at; }).forEach(function (r) {
      var row = el('div', 'item click'); row.title = r.code;
      var star = el('button', 'star' + (r.fav ? ' on' : ''), r.fav ? '\u2605' : '\u2606'); star.type = 'button'; star.title = t('fav');
      star.addEventListener('click', function (e) {
        e.stopPropagation();
        api.action('history:fav', r.code).then(function (ok) { if (ok === 'full') toast(t('m.fav.full')); histKey = ''; refresh(); });
      });
      row.appendChild(star); row.appendChild(el('span', 'n', r.name || r.code)); row.appendChild(el('span', 'm', r.at ? ago(r.at) : ''));
      row.addEventListener('click', function () {
        api.action('join', r.code).then(function (ok) { toast(ok ? t('m.joining') + (r.name || r.code) : t('m.join.bad')); });
      });
      box.appendChild(row);
    });
  }
  // etiquetas removíveis (filtro do chat)
  var chipKey = '';
  function renderChips() {
    var c = state.config.chat, key = JSON.stringify(c);
    if (key === chipKey) return;
    chipKey = key;
    [['fplayers', 'players'], ['fwords', 'words']].forEach(function (pair) {
      var box = $(pair[0]); box.textContent = '';
      c[pair[1]].forEach(function (w) {
        var b = el('button', 'chip', w); b.type = 'button'; b.title = t('remove');
        b.addEventListener('click', function () { var p = {}; p[pair[1]] = c[pair[1]].filter(function (x) { return x !== w; }); setChat(p); });
        box.appendChild(b);
      });
    });
  }
  function setChat(patch) { return api.setConfig({ chat: patch }).then(refresh); }
  function renderLists() {
    var c = state.config, key = JSON.stringify([c.profiles, c.quick, editQuick]);
    if (key === listKey) return;
    listKey = key;
    var box = $('profiles'); box.textContent = '';
    if (!c.profiles.length) box.appendChild(el('div', 'empty', t('profile.empty')));
    c.profiles.forEach(function (p, i) {
      var row = el('div', 'item');
      row.appendChild(el('span', 'av', p.avatar)); row.appendChild(el('span', 'n', p.name));
      var use = el('button', 'btn sm', t('use')); use.type = 'button';
      use.addEventListener('click', function () {
        api.action('profile', i).then(function (r) { toast(t(r === 'reload' ? 'm.profile.reload' : r === 'room' ? 'm.profile.room' : 'm.profile.fail')); refresh(); });
      });
      var del = el('button', 'x', '×'); del.type = 'button'; del.title = t('remove');
      del.addEventListener('click', function () { saveList('profiles', c.profiles.filter(function (_, j) { return j !== i; })); });
      row.appendChild(use); row.appendChild(del); box.appendChild(row);
    });
    var q = $('quick'); q.textContent = '';
    if (!c.quick.length) { var e = el('div', 'empty', t('quick.empty')); e.style.gridColumn = '1/-1'; q.appendChild(e); }
    c.quick.forEach(function (a, i) {
      var b = el('button', 'q' + (editQuick ? ' del' : '')); b.type = 'button'; b.title = editQuick ? t('remove') : a.cmd;
      b.appendChild(el('span', '', a.label)); b.appendChild(el('code', '', a.cmd));
      b.addEventListener('click', function () {
        if (editQuick) { saveList('quick', c.quick.filter(function (_, j) { return j !== i; })); return; }
        api.action('quick', i).then(function (ok) { toast(ok ? t('m.cmd.ok') + a.cmd : t('m.cmd.fail')); });
      });
      q.appendChild(b);
    });
    $('qform').hidden = !editQuick;
    $('qedit').textContent = t(editQuick ? 'done' : 'edit');
  }
  function saveList(name, list) { var p = {}; p[name] = list; return api.setConfig(p).then(refresh); }

  // ---------- estado ----------
  function joinNames(a) { return a.join(', '); }
  // Status: uma linha por item (nome à esquerda, situação à direita com uma bolinha colorida)
  function renderStatus() {
    var s = state.status, f = state.flags, room = state.room || {}, c = state.config, rows = [];
    function row(label, value, kind) { rows.push('<div class="srow"><span>' + esc(label) + '</span><span class="sval ' + (kind || '') + '"><i></i>' + esc(value) + '</span></div>'); }
    var has = function (n) { return s.applied.indexOf(n) !== -1; };
    var playing = s.mode !== 'original', loaded = s.mode === 'frozen' || s.served;
    // Ativo (verde) ou Inativo. O Inativo fica vermelho só quando o jogo já carregou e aquilo não encaixou.
    function patch(label, fits, waiting) {
      if (playing && loaded && fits) row(label, t('sv.ready'), 'ok');
      else row(label, t('sv.inactive'), playing && loaded && !waiting ? 'bad' : 'off');
    }
    row(t('sl.game'), t(s.mode === 'original' ? 'sv.original' : s.mode === 'frozen' ? 'sv.frozen' : loaded ? 'sv.modded' : 'sv.loading'), s.mode === 'original' ? 'off' : loaded ? 'ok' : 'wait');
    if (f.privateModule) patch('OP Mode', has('OP Mode') || s.mode === 'frozen');
    if (f.privateModule) patch(t('op.ping'), has('Fake Ping') || s.mode === 'frozen');
    patch(t('sl.cmds'), has('Comandos de chat') || s.mode === 'frozen');
    patch('Chat Bubble', !!room.inRoom || has('Chat Bubble'), true);   // só fica ativo dentro de uma sala
    row(t('sl.room'), room.inRoom ? (room.name || t('sv.inaroom')) : (state.dropped ? t('st.drop') + state.dropped : t('sv.noroom')), room.inRoom ? 'ok' : state.dropped ? 'bad' : 'off');
    var dc = c.discord || {}, ds = dc.on ? (state.discord || 'connecting') : 'off';
    row('Discord', t('dc.' + ds), ds === 'ok' ? 'ok' : ds === 'off' ? 'off' : ds === 'connecting' ? 'wait' : 'bad');
    row(t('sl.update'), state.update ? t('upd') + state.update.version : t('sv.latest'), state.update ? 'bad' : 'ok');
    var h = '<div class="shead"><b>VOID HaxBall Mod</b><span>v' + esc(state.version) + '</span></div>' + rows.join('');
    if (s.note) h += '<div class="snote">' + esc(s.note) + '</div>';
    h += '<div class="sfoot">' + t('st.by') + '</div>';
    $('stat').innerHTML = h;
  }

  // prévia do campo e da mira (aba Personalizar)
  function renderPreview(g) {
    var R = 25 * g.crossSize / 100 * 0.62, tk = Math.max(3, R * 0.28), cx = 150, cy = 46;
    var grass = 'repeating-linear-gradient(90deg,#4a7a52 0 26px,#44724c 26px 52px)';
    $('prev').style.background = g.flat ? g.ground : grass;
    var ln = g.lineOn ? esc(g.lineColor) : '#c7e6bd', nm = 9 * g.nameSize / 100;
    var s = '<svg viewBox="0 0 300 92" width="300" height="92" fill="none"><circle cx="150" cy="46" r="34" stroke="' + ln + '" stroke-width="1.5"/><path d="M150 0v92" stroke="' + ln + '" stroke-width="1.5"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="9.5" fill="' + (g.teamOn ? esc(g.teamRed) : '#e56e56') + '" stroke="#000" stroke-width="1.6"/><circle cx="196" cy="60" r="6" fill="' + (g.ballOn ? esc(g.ballColor) : '#fff') + '" stroke="#000" stroke-width="1.4"/>' +
      (g.kickLine ? '<g stroke="' + esc(g.kickColor) + '" stroke-width="1.3" stroke-linecap="round"><path d="M160.2 49.1L189.3 58" opacity=".85"/><path d="M202.7 62L' + (202.7 + g.kickExt * 0.25) + ' ' + (62 + g.kickExt * 0.076) + '" stroke-dasharray="4 4" opacity=".6"/></g>' : '') +
      '<circle cx="84" cy="40" r="9.5" fill="' + (g.teamOn ? esc(g.teamBlue) : '#5689e5') + '" stroke="#000" stroke-width="1.6"/>' + (g.hideAvatars ? '' : '<text x="84" y="43.5" text-anchor="middle" font-size="9" font-weight="900" fill="#fff" font-family="Arial">7</text>') +
      '<text x="84" y="' + (53 + nm) + '" text-anchor="middle" font-size="' + nm + '" fill="#fff" font-family="sans-serif">noonly</text>';
    if (g.kickRing) s += '<circle cx="' + cx + '" cy="' + cy + '" r="12" stroke="' + esc(g.kickRingColor) + '" stroke-width="1"/>';
    if (g.cross) {
      s += '<g stroke="' + esc(g.crossColor) + '" stroke-width="1.4" stroke-linecap="round" opacity=".92"><circle cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>' +
        '<path d="M' + (cx - R - tk) + ' ' + cy + 'h' + 2 * tk + 'M' + (cx + R - tk) + ' ' + cy + 'h' + 2 * tk + 'M' + cx + ' ' + (cy - R - tk) + 'v' + 2 * tk + 'M' + cx + ' ' + (cy + R - tk) + 'v' + 2 * tk + '"/></g>';
    }
    $('prev').innerHTML = s + '</svg>';
  }
  function setVal(id, v, text) { if (root.activeElement !== $(id)) $(id).value = v; $(id + 'v').textContent = text; }
  function markSwatch(id, color) {
    all('.sws[data-for="' + id + '"] .swatch').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-c') === color); });
  }

  function render() {
    if (!state) return;
    var c = state.config, g = c.game, room = state.room || {};
    $('ver').textContent = 'v' + state.version;
    // início
    $('t-top').classList.toggle('on', !!c.alwaysOnTop);
    renderHistory();
    // personalizar
    ['flat', 'cross', 'lineOn', 'ballOn', 'hideAvatars', 'kickLine', 'kickRing', 'teamOn'].forEach(function (k) { $(k).checked = g[k]; });
    setVal('kickRange', g.kickRange, g.kickRange + ' px'); setVal('kickExt', g.kickExt, g.kickExt ? g.kickExt + ' px' : t('kick.off'));
    ['ground', 'crossColor', 'lineColor', 'ballColor', 'kickColor', 'kickRingColor', 'teamRed', 'teamBlue'].forEach(function (k) { if (root.activeElement !== $(k)) $(k).value = g[k]; });
    setVal('nameSize', g.nameSize, g.nameSize + '%');
    all('[data-theme]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-theme') === c.theme); });
    $('bgname').textContent = c.bg.file ? t('bg.set') : t('bg.none'); $('bgclear').hidden = !c.bg.file;
    setVal('bgDim', c.bg.dim, c.bg.dim + '%'); $('bgdim').style.opacity = c.bg.dim / 100;
    loadBg();
    // início: voltar à última sala
    $('rejoinrow').hidden = !state.lastRoom;
    $('rejoin').textContent = t(state.dropped && state.canRejoin ? 'rejoin.drop' : 'rejoin') + state.lastRoom;
    $('rejoin').classList.toggle('ghost', !(state.dropped && state.canRejoin));
    markSwatch('ground', g.ground); markSwatch('crossColor', g.crossColor);
    setVal('crossSize', g.crossSize, g.crossSize + '%');
    if (root.activeElement !== $('accent')) { $('accent').value = c.accent; applyAccent(c.accent); }
    renderPreview(g);
    // perfil
    $('curnick').textContent = room.nick || t('profile.none'); $('curav').textContent = room.avatar || '';
    $('savecur').hidden = !room.nick;
    renderLists();
    // áudio
    ['goal', 'kick', 'chat'].forEach(function (k) { setVal('v' + k, g.vol[k], g.vol[k] + '%'); });
    ['kick', 'goal', 'mention'].forEach(function (k) {
      var sd = c.sounds[k]; $('sn-' + k).textContent = sd ? sd.name : t('snd.orig');
      root.querySelector('[data-sndx="' + k + '"]').hidden = !sd;
    });
    $('hideJoin').checked = c.chat.hideJoin; renderChips();
    // chat e hud
    setVal('chatFont', g.chatFont || 9, g.chatFont ? g.chatFont + ' px' : t('default'));
    setVal('chatOpacity', g.chatOpacity, g.chatOpacity + '%');
    $('hideScore').checked = g.hideScore; $('hideTimer').checked = g.hideTimer;
    $('fpsc').checked = c.fps; fpsEl.hidden = !c.fps || !!c.recording;
    $('rec').checked = !!c.recording;
    $('bubble').checked = !!room.bubble;
    // OP Mode (só existe com o módulo pessoal)
    var hasOp = !!state.flags.privateModule;
    root.querySelector('.nav[data-go="op"]').hidden = !hasOp;
    if (!hasOp && page === 'op') go('home');
    if (hasOp) {
      var op = room.op, fit = state.status.applied.indexOf('OP Mode') !== -1;
      $('opbody').hidden = !op;
      $('opnote').hidden = !!op && fit;
      $('opnote').textContent = !op ? t('op.wait') : (fit ? '' : t('op.miss'));
      if (op) {
        $('opon').checked = op.on;
        if (root.activeElement !== $('opval')) $('opval').value = op.value;
        if (root.activeElement !== $('opkey')) $('opkey').value = op.key || '';
        if (root.activeElement !== $('opping')) $('opping').value = op.ping || '';
        $('oppingnote').hidden = state.status.applied.indexOf('Fake Ping') !== -1;
      }
    }
    // configurações
    $('opt-frozen').hidden = !state.flags.frozen;
    $('mode').value = c.mode;
    $('ads').checked = c.hideAds; hideAds = c.hideAds;
    $('splash').checked = c.splash !== false; $('autoRejoin').checked = !!c.autoRejoin;
    $('titleBar').checked = c.titleBar !== false; $('hideSite').checked = c.hideSite !== false || barH() > 0; $('hideSite').disabled = barH() > 0;
    fitGame();
    var dc = c.discord || {};
    $('dcOn').checked = !!dc.on; $('dcRoom').checked = dc.room !== false;
    if (root.activeElement !== $('dcId')) $('dcId').value = dc.appId || '';
    $('dcstat').textContent = t('dc.' + (dc.on ? (state.discord || 'connecting') : 'off'));
    $('upd').hidden = $('upddot').hidden = !state.update;
    if (state.update) $('updtxt').textContent = t('upd') + state.update.version;
    $('key').textContent = state.capturing && state.capturing !== 'bubble' ? t('key.press') : keyLabel(c.toggleKey);
    $('bkey').textContent = state.capturing === 'bubble' ? t('key.press') : c.bubbleKey ? keyLabel(c.bubbleKey) : t('bkey.none');
    $('rmbkey').hidden = !c.bubbleKey;
    if (root.activeElement !== $('msg')) $('msg').value = c.autoMsg.text;
    $('onjoin').checked = !!c.autoMsg.onJoin;
    renderStatus();
  }
  function refresh() {
    return api.getState().then(function (st) {
      if (!st) return;
      var first = !state, wasRec = state && state.config.recording; state = st;
      if (first || st.config.lang !== lang) { lang = st.config.lang === 'en' ? 'en' : 'pt'; applyLang(); }
      if (st.config.recording && !wasRec && !first && open) setOpen(false);     // modo gravação: o menu sai da tela
      applyAccent(root.activeElement === $('accent') ? $('accent').value : st.config.accent);
      render();
    });
  }

  // ---------- ações ----------
  all('[data-act]').forEach(function (b) {
    b.addEventListener('click', function () {
      var act = b.getAttribute('data-act');
      api.action(act).then(function (r) { if (act === 'shot') toast(t(r ? 'm.shot.ok' : 'm.shot.fail')); refresh(); });
    });
  });
  $('join').addEventListener('click', function () { api.action('join', $('room').value).then(function (ok) { if (!ok) toast(t('m.join.bad')); }); });
  $('room').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('join').click(); });
  $('hclear').addEventListener('click', function () { api.action('history:clear').then(function () { histKey = ''; refresh(); }); });

  // personalização: cada controle manda só o pedaço que mudou; o app valida, salva e repassa ao jogo
  var gameTimer = null, gamePending = {};
  function setGame(patch, now) {
    for (var k in patch) {
      if (k === 'vol') gamePending.vol = Object.assign(gamePending.vol || {}, patch.vol); else gamePending[k] = patch[k];
      if (state) { if (k === 'vol') Object.assign(state.config.game.vol, patch.vol); else state.config.game[k] = patch[k]; }
    }
    if (state) render();
    clearTimeout(gameTimer);
    gameTimer = setTimeout(function () { var p = gamePending; gamePending = {}; api.setConfig({ game: p }).then(refresh); }, now ? 0 : 90);
  }
  ['flat', 'cross', 'hideScore', 'hideTimer', 'lineOn', 'ballOn', 'hideAvatars', 'kickLine', 'kickRing', 'teamOn'].forEach(function (id) {
    $(id).addEventListener('change', function () { var p = {}; p[id] = $(id).checked; setGame(p, true); });
  });
  ['ground', 'crossColor', 'lineColor', 'ballColor', 'kickColor', 'kickRingColor', 'teamRed', 'teamBlue'].forEach(function (id) {
    $(id).addEventListener('input', function () { var p = {}; p[id] = $(id).value; setGame(p); });
  });
  all('.swatch[data-c]').forEach(function (b) {
    b.addEventListener('click', function () { var p = {}; p[b.parentNode.getAttribute('data-for')] = b.getAttribute('data-c'); setGame(p, true); });
  });
  $('crossSize').addEventListener('input', function () { setGame({ crossSize: Number($('crossSize').value) }); });
  $('nameSize').addEventListener('input', function () { setGame({ nameSize: Number($('nameSize').value) }); });
  $('kickRange').addEventListener('input', function () { setGame({ kickRange: Number($('kickRange').value) }); });
  $('kickExt').addEventListener('input', function () { setGame({ kickExt: Number($('kickExt').value) }); });
  // Discord
  function setDiscord(p) { return api.setConfig({ discord: p }).then(refresh); }
  $('dcOn').addEventListener('change', function () { setDiscord({ on: $('dcOn').checked }); });
  $('dcRoom').addEventListener('change', function () { setDiscord({ room: $('dcRoom').checked }); });
  $('dcId').addEventListener('change', function () {
    var id = $('dcId').value.trim();
    if (id && !/^\d{17,20}$/.test(id)) { toast(t('m.dc.bad')); return; }
    setDiscord({ appId: id });
  });
  all('[data-theme]').forEach(function (b) {
    b.addEventListener('click', function () { var n = b.getAttribute('data-theme'); state.config.theme = n; applyAccent(state.config.accent); api.setConfig({ theme: n }).then(refresh); });
  });
  // imagem de fundo do menu: o arquivo é escolhido numa janela do Windows e copiado para a pasta de dados do app
  var bgRev = -1;
  function loadBg() {
    if (state.bgRev === bgRev) return;
    bgRev = state.bgRev;
    if (!bgRev) { $('bgimg').hidden = $('bgdim').hidden = true; menu.classList.remove('hasbg'); return; }
    api.action('bg:get').then(function (uri) {
      if (!uri) return;
      $('bgimg').style.backgroundImage = 'url("' + uri + '")';
      $('bgimg').hidden = $('bgdim').hidden = false; menu.classList.add('hasbg');
    });
  }
  function fileMsg(r, okKey) { if (r === true) toast(t(okKey)); else if (r === 'size') toast(t('m.file.size')); else if (r === 'type') toast(t('m.file.type')); }
  $('bgpick').addEventListener('click', function () { api.action('bg:pick').then(function (r) { fileMsg(r, 'bg.set'); refresh(); }); });
  $('bgclear').addEventListener('click', function () { api.action('bg:clear').then(refresh); });
  $('bgDim').addEventListener('input', function () { $('bgdim').style.opacity = $('bgDim').value / 100; $('bgDimv').textContent = $('bgDim').value + '%'; });
  $('bgDim').addEventListener('change', function () { api.setConfig({ bg: { dim: Number($('bgDim').value) } }).then(refresh); });
  // sons próprios
  all('[data-snd]').forEach(function (b) {
    b.addEventListener('click', function () { api.action('sound:pick', b.getAttribute('data-snd')).then(function (r) { fileMsg(r, 'm.snd.ok'); refresh(); }); });
  });
  all('[data-sndx]').forEach(function (b) {
    b.addEventListener('click', function () { api.action('sound:clear', b.getAttribute('data-sndx')).then(refresh); });
  });
  // filtro do chat
  $('hideJoin').addEventListener('change', function () { setChat({ hideJoin: $('hideJoin').checked }); });
  [['fplayer', 'players'], ['fword', 'words']].forEach(function (pair) {
    function add() {
      var v = $(pair[0]).value.trim().toLowerCase(); if (!v) return;
      var list = state.config.chat[pair[1]];
      if (list.length >= 30) { toast(t('m.full').replace('12', '30')); return; }
      var p = {}; p[pair[1]] = list.concat([v]); $(pair[0]).value = ''; setChat(p);
    }
    $(pair[0] + 'add').addEventListener('click', add);
    $(pair[0]).addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });
  });
  // voltar à sala, exportar / importar, atualização
  $('rejoin').addEventListener('click', function () { api.action('rejoin').then(function (ok) { toast(ok ? t('m.joining') + state.lastRoom : t('m.join.bad')); }); });
  $('autoRejoin').addEventListener('change', function () { api.setConfig({ autoRejoin: $('autoRejoin').checked }).then(refresh); });
  $('export').addEventListener('click', function () { api.action('export').then(function (r) { if (r === true) toast(t('m.export.ok')); }); });
  $('import').addEventListener('click', function () {
    api.action('import').then(function (r) { if (r === true) { toast(t('m.import.ok')); histKey = listKey = chipKey = ''; refresh(); } else if (r === false) toast(t('m.import.fail')); });
  });
  $('updopen').addEventListener('click', function () { api.action('update:open'); });
  $('chatOpacity').addEventListener('input', function () { setGame({ chatOpacity: Number($('chatOpacity').value) }); });
  $('chatFont').addEventListener('input', function () { var v = Number($('chatFont').value); setGame({ chatFont: v < 10 ? 0 : v }); });   // 9 = tamanho do jogo
  ['goal', 'kick', 'chat'].forEach(function (k) {
    $('v' + k).addEventListener('input', function () { var v = {}; v[k] = Number($('v' + k).value); setGame({ vol: v }); });
  });
  $('accent').addEventListener('input', function () { applyAccent($('accent').value); });
  $('accent').addEventListener('change', function () { api.setConfig({ accent: Number($('accent').value) }).then(refresh); });
  $('rec').addEventListener('change', function () { if ($('rec').checked) setOpen(false); });

  // perfis
  function addProfile(name, avatar) {
    name = String(name || '').trim();
    if (!name) { toast(t('m.profile.name')); return; }
    var list = state.config.profiles.filter(function (p) { return p.name !== name; });
    if (list.length >= 12) { toast(t('m.full')); return; }
    saveList('profiles', list.concat([{ name: name, avatar: String(avatar || '') }])).then(function () { $('pname').value = ''; $('pav').value = ''; });
  }
  $('padd').addEventListener('click', function () { addProfile($('pname').value, $('pav').value); });
  $('pname').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('padd').click(); });
  $('savecur').addEventListener('click', function () { addProfile(state.room.nick, state.room.avatar); });

  // ações rápidas
  $('qedit').addEventListener('click', function () { editQuick = !editQuick; renderLists(); });
  $('qadd').addEventListener('click', function () {
    var cmd = $('qcmd').value.trim(), label = $('qlabel').value.trim();
    if (!cmd) { toast(t('m.cmd.need')); return; }
    if (state.config.quick.length >= 12) { toast(t('m.full')); return; }
    saveList('quick', state.config.quick.concat([{ label: label, cmd: cmd }])).then(function () { $('qcmd').value = ''; $('qlabel').value = ''; });
  });
  $('qcmd').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('qadd').click(); });

  // OP Mode (módulo pessoal)
  function op(patch) { api.action('op', patch).then(function (ok) { if (!ok) toast(t('m.op.fail')); refresh(); }); }
  $('opon').addEventListener('change', function () { op({ on: $('opon').checked }); });
  $('opval').addEventListener('change', function () { op({ value: Number($('opval').value) }); });
  $('opkey').addEventListener('change', function () { op({ key: $('opkey').value }); });
  $('opping').addEventListener('change', function () {
    var v = $('opping').value.trim().toLowerCase(); if (v === 'off') v = '';
    if (!/^(\d{1,4}[+-]?)?$/.test(v)) { toast(t('op.ping.bad')); refresh(); return; }
    op({ ping: v });
  });
  $('opping').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('opping').blur(); });

  // chat e hud / configurações
  $('fpsc').addEventListener('change', function () { api.setConfig({ fps: $('fpsc').checked }).then(refresh); });
  $('rec').addEventListener('change', function () { api.setConfig({ recording: $('rec').checked }).then(refresh); });
  $('bubble').addEventListener('change', function () {
    var on = $('bubble').checked;
    api.action('bubble', on).then(function (ok) {
      if (!ok) { $('bubble').checked = !on; toast(t('m.bubble.fail')); }
      refresh();
    });
  });
  $('mode').addEventListener('change', function () { api.setConfig({ mode: $('mode').value }); });
  $('ads').addEventListener('change', function () { api.setConfig({ hideAds: $('ads').checked }).then(function () { refresh().then(cleanAds); }); });
  $('splash').addEventListener('change', function () { api.setConfig({ splash: $('splash').checked }).then(refresh); });
  $('titleBar').addEventListener('change', function () { api.setConfig({ titleBar: $('titleBar').checked }).then(refresh).then(function () { if (state.bar.restart) toast(t('m.restart'), 5000); }); });
  $('hideSite').addEventListener('change', function () { api.setConfig({ hideSite: $('hideSite').checked }).then(refresh); });
  function saveMsg() { return api.setConfig({ autoMsg: { text: $('msg').value, onJoin: $('onjoin').checked } }).then(refresh); }
  $('msg').addEventListener('change', saveMsg);
  $('onjoin').addEventListener('change', saveMsg);
  $('sendnow').addEventListener('click', function () {
    saveMsg().then(function () { return api.action('chat'); }).then(function (ok) { toast(t(ok ? 'm.sent' : 'm.sent.fail')); });
  });
  $('chbkey').addEventListener('click', function () {          // escolhe a tecla do Chat Bubble (Esc cancela)
    var before = state.config.bubbleKey || '';
    api.action('captureKey', 'bubble').then(function () {
      var n = 0, timer = setInterval(function () {
        refresh().then(function () {
          if (state.capturing && ++n <= 16) return;
          clearInterval(timer);
          if (state.capturing) return;
          var now = state.config.bubbleKey || '';
          toast(now && now !== before ? t('m.key') + keyLabel(now) : t('bkey.same'));
        });
      }, 500);
      refresh();
    });
  });
  $('rmbkey').addEventListener('click', function () { api.setConfig({ bubbleKey: '' }).then(refresh); });
  $('chkey').addEventListener('click', function () {
    api.action('captureKey').then(function () {
      var n = 0, timer = setInterval(function () {
        refresh().then(function () { if (!state.capturing || ++n > 16) { clearInterval(timer); if (!state.capturing) toast(t('m.key') + keyLabel(state.config.toggleKey)); } });
      }, 500);
      refresh();
    });
  });

  // ---------- abrir / fechar ----------
  function setOpen(v) {
    open = v; wrap.classList.toggle('open', open);
    if (open) refresh().then(layout);
  }
  function toggle() { setOpen(!open); }
  setInterval(function () { if (open) refresh(); }, 3000);

  // ---------- FPS ----------
  var frames = 0, last = performance.now();
  (function loop(now) {
    frames++;
    if (now - last >= 1000) { fpsEl.lastChild.textContent = Math.round(frames * 1000 / (now - last)) + ' FPS'; frames = 0; last = now; }
    requestAnimationFrame(loop);
  })(performance.now());

  // ---------- anúncios ----------
  function rect(el) { return el.getBoundingClientRect(); }
  function area(el) { var r = rect(el); return r.width * r.height; }
  function hide(el) { el.style.setProperty('display', 'none', 'important'); }

  function cleanAds() {
    if (!hideAds) return;
    var frames = Array.prototype.slice.call(document.querySelectorAll('iframe')).filter(function (f) { return area(f) > 0; });
    if (!frames.length) return;
    var game = frames.reduce(function (a, b) { return area(b) > area(a) ? b : a; });   // o maior iframe é o jogo
    frames.forEach(function (f) {
      if (f === game || rect(f).width > 450) return;
      hide(f);
      var box = f.parentElement;
      if (box && box !== document.body && box !== document.documentElement && !box.contains(game) && box.querySelectorAll('iframe').length <= 1) hide(box);
    });
    var gr = rect(game);
    if (gr.right < window.innerWidth - 80) {                 // anúncio que não é iframe: olha a coluna à direita do jogo
      var x = Math.min(window.innerWidth - 20, gr.right + 40), y = gr.top + 120;
      document.elementsFromPoint(x, y).forEach(function (el) {
        if (el === document.documentElement || el === document.body || el === host) return;
        if (el.contains(game) || game.contains(el)) return;
        hide(el);
      });
    }
    game.style.setProperty('width', '100%', 'important');
    if (game.parentElement && game.parentElement !== document.body) game.parentElement.style.setProperty('width', '100%', 'important');
  }
  var timer = null;
  function schedule() { if (!timer) timer = setTimeout(function () { timer = null; cleanAds(); fitGame(); }, 200); }
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', function () { cleanAds(); setTimeout(diag, 4000); });
  function diag() {                                           // registra no log o que existe na página
    try {
      api.log('iframes: ' + JSON.stringify(Array.prototype.map.call(document.querySelectorAll('iframe'), function (f) {
        var r = rect(f); return { src: (f.src || '').slice(0, 90), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), vis: getComputedStyle(f).display !== 'none' };
      })));
    } catch (e) { }
  }

  // chamado pelo app quando a tecla do Chat Bubble é apertada
  function bubbleKeyed(ok, on) { toast(ok ? t(on ? 'm.bubble.on' : 'm.bubble.off') : t('m.bubble.fail'), 1800); refresh(); }
  window.__hbui = { toggle: toggle, refresh: refresh, go: go, bubble: bubbleKeyed, toggleFps: function () { api.setConfig({ fps: !state.config.fps }).then(refresh); } };
  go('home');
  refresh().then(function () {
    cleanAds(); layout();
    if (state && !state.config.recording) toast(t('m.hello').replace('{k}', keyLabel(state.config.toggleKey)), 4200);
  });
})();
