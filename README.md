<p align="center">
  <img src="assets/banner.png" alt="VOID" width="520">
</p>

<h1 align="center">VOID HaxBall Mod</h1>

<p align="center">
  <b>Versão 1.0</b> · Launcher para HaxBall com interface própria, bloqueio de anúncios e ferramentas de qualidade de vida.
</p>

<p align="center">
  <img src="docs/preview.png" alt="Menu do VOID HaxBall Mod" width="640">
</p>

> Projeto pessoal e independente, **não afiliado ao HaxBall**. Desenvolvido por **Gabriel Vieira**, com auxílio de IA (Claude). Código aberto sob a [licença MIT](LICENSE).

---

## Sumário

- [Recursos](#recursos)
- [Instalação](#instalação)
- [Como usar](#como-usar)
- [Desenvolvimento](#desenvolvimento)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Segurança](#segurança)
- [Solução de problemas](#solução-de-problemas)
- [Avisos](#avisos)
- [Créditos](#créditos)
- [Licença](#licença)

## Recursos

**Interface**
- **Barra de título do VOID**: no lugar da barra branca do Windows, uma faixa na cor do tema com a logo (os botões de minimizar, maximizar e fechar continuam os do sistema). Pode ser desligada em Configurações.
- **Esconder o menu do site** (News / Play / About / Community): o jogo ocupa a janela inteira.
- **Tela de abertura** com a logo enquanto o HaxBall carrega (pode ser desligada em Configurações).
- Menu único com **barra lateral** (Início, Personalizar, Perfil, Áudio, Chat e HUD, Ações rápidas, Configurações, Status), arrastável pelo topo. A posição fica salva.
- **Português e inglês**: botão PT / EN no rodapé da barra lateral.
- **Temas de cor** (vermelho, azul, roxo, verde e branco) com intensidade ajustável, e **imagem de fundo** própria no menu.
- **Exportar / importar** configurações em um arquivo `.json` (perfis, ações rápidas, personalização, filtro do chat e salas favoritas).
- **Discord**: mostra "Jogando" no seu perfil, com a sala (opcional). Veja [abaixo](#discord).
- **Aviso de atualização**: confere a versão mais recente em *Releases* do seu repositório (veja [abaixo](#aviso-de-atualização)).

**Personalização** (tudo local: só muda o que você vê e ouve)
- **Campo liso (Flat Ground)** e **cor do campo (Ground Color)** com seletor de cor; **cor das linhas** e **cor da bola**.
- **Mira no seu jogador**: anel com cruz, com cor e tamanho ajustáveis.
- **Perfis**: apelidos e avatares salvos, troca com um clique.
- **Linha de chute**: uma linha do seu jogador até a bola quando ela está perto, que continua (tracejada) depois dela. Cor, alcance e comprimento ajustáveis.
- **Círculo de alcance do chute**: um anel fino em volta do seu jogador; quando a bola encosta nele, o chute pega.
- **Jogadores**: tamanho dos nomes e opção de esconder os avatares dos outros.
- **Cores dos times na sua tela**: ver o vermelho e o azul com outras cores.
- **Áudio**: volume separado para gol (torcida), chute e chat/avisos, e **som próprio** para chute, gol e menção.
- **Chat e HUD**: tamanho da fonte e opacidade do chat, esconder placar ou cronômetro.
- **Filtro do chat**: esconder avisos de entrou/saiu e silenciar palavras ou jogadores (só na sua tela).
- **Ações rápidas**: botões para os comandos que você usa sempre (`/avatar`, `/extrapolation` etc.).
- **Right Shift** abre e fecha o menu. A tecla pode ser trocada, e o atalho só vale com a tecla pressionada sozinha, então não atrapalha o jogo.
- Ícone VOID no executável, na janela e na barra de tarefas.

**Jogo**
- **Bloqueio de anúncios**, com o jogo ocupando a tela toda.
- **FPS** no canto superior esquerdo e **mods ativos** no canto inferior esquerdo.
- **Modo gravação** (`F4`): fecha o menu e tira da tela tudo que é do VOID (FPS, selo de mods, mira, cores do campo, da bola e das linhas, tamanho dos nomes, ajustes do chat e do placar). Ao desligar, tudo volta como estava.
- **Chat Bubble**: mantém o balão de "digitando" sobre o seu jogador.
- **Salas recentes e favoritas**: as últimas 10 salas visitadas, com nome e horário. A estrela fixa uma sala no topo.
- **Reentrar na sala**: botão para voltar à última sala e opção de voltar sozinho se a conexão cair (até 3 tentativas; nunca após expulsão ou banimento).
- Entrar em sala por **link ou código**, captura de tela, sempre no topo, zoom e tela cheia.
- **Mensagem automática** opcional: uma única mensagem, enviada ao entrar na sala (se ligada) ou com `Alt+1`. Limite de 1 envio a cada 3 s.

**Robustez**
- O mod é aplicado sobre o **jogo oficial atual**. Se o HaxBall mudar e algo não encaixar, aquela parte é ignorada sem quebrar o jogo, e o motivo aparece no painel **Status** e no log.

## Instalação

1. Baixe o `.zip` da versão mais recente em **[Releases](../../releases)**.
2. Extraia a pasta inteira (o `.exe` precisa ficar junto dos outros arquivos).
3. Abra `VOID-HaxBall-Mod.exe`.

> O Windows pode mostrar "O Windows protegeu o computador" porque o executável não é assinado. Clique em **Mais informações → Executar assim mesmo**.

## Como usar

### Atalhos

| Tecla | Ação |
|---|---|
| `Right Shift` | Abre e fecha o menu (configurável) |
| `F2` | Abre e fecha o menu (alternativo) |
| `F3` | Mostra ou esconde o FPS |
| `F4` | Liga ou desliga o modo gravação |
| `F5` | Recarrega o jogo |
| `F11` | Tela cheia |
| `Alt+1` | Envia a mensagem automática |
| `Ctrl+Shift+I` | Ferramentas de desenvolvedor |

### Comandos no chat do jogo

| Comando | O que faz |
|---|---|
| `/mod` | Lista os comandos |
| `/mod status` | Mostra o estado do mod |
| `/mod reset` | Volta tudo ao padrão |
| `/mod badge on` · `/mod badge off` | Mostra ou esconde o selo de mods |
| `/chat_bubble on` · `/chat_bubble off` | Liga ou desliga o Chat Bubble (também há um botão no menu) |

### Como a personalização funciona

Nada disso depende dos nomes internos do jogo (que mudam a cada atualização) nem mexe na comunicação com a sala:

- **Campo liso**: o jogo pinta o campo com texturas repetidas. O VOID anota essas texturas quando o jogo as cria e, com a opção ligada, troca a pintura pela cor escolhida. Vale para os campos com textura (grama, hockey); mapas sem textura continuam com a cor do próprio mapa.
- **Mira**: o HaxBall já desenha um anel branco discreto em volta do seu jogador. A mira é desenhada no mesmo ponto, logo depois dele.
- **Volumes**: cada som tocado passa por um controle de volume da sua categoria antes de chegar ao volume geral do jogo.
- **Perfis**: o apelido e o avatar são gravados onde o jogo os lê ao abrir. Fora de sala, o jogo é recarregado para o apelido valer; dentro de sala, só o avatar muda na hora (comando `/avatar`).
- **Chat e placar**: apenas CSS por cima da página do jogo.

### Aviso de atualização

No `package.json`, preencha o campo `"repository"` com o seu repositório no GitHub, por exemplo `"seu-usuario/void-haxball-mod"`. Com isso o app consulta, ao abrir, a versão mais recente publicada em **Releases** e mostra um aviso na aba **Status** quando houver uma mais nova. Ele só lê a versão: não baixa nem instala nada. Com o campo vazio, a verificação fica desligada.

### Discord

1. Abra <https://discord.com/developers/applications>, clique em **New Application** e dê o nome que deve aparecer no perfil (por exemplo `HaxBall`).
2. Copie o **Application ID** (um número de 17 a 20 dígitos) da página **General Information**.
3. Para a imagem aparecer: em **General Information**, envie `assets/icon.png` em **App Icon**; depois, em **Rich Presence → Art Assets**, clique em **Add Image(s)**, envie o mesmo `assets/icon.png`, dê a ele o nome `void` e salve. O Discord pode levar alguns minutos para liberar a imagem.
4. No VOID: **Configurações → Discord**, cole o ID e ligue **Mostrar "Jogando HaxBall" no perfil**.

Precisa do Discord de computador aberto (a versão de navegador não tem esse recurso). O VOID fala com o Discord só pelo canal local do seu PC; não usa senha nem token. O nome da sala pode ser escondido, e no modo gravação a presença fica desligada.

### Como o Chat Bubble funciona

Quando você clica na caixa do chat, o próprio HaxBall avisa a sala que você está digitando, e o balão aparece sobre o seu jogador. O VOID dispara esse mesmo aviso de foco **sem mover o cursor para o chat**, então você continua controlando o jogador normalmente. O jogo só envia o aviso quando o estado muda (liga uma vez, desliga uma vez), então não há envio repetido.

## Desenvolvimento

**Requisitos:** Windows 10 ou 11, [Node.js](https://nodejs.org) (versão LTS) e [Git](https://git-scm.com/download/win).

```bash
npm install                     # instala as dependências
node scripts/setup-electron.js  # garante que o Electron foi baixado (veja "Solução de problemas")
npm start                       # abre o app
npm test                        # roda os testes
npm run dist                    # gera o .exe em dist/
```

Atalhos para Windows: dois cliques em `Iniciar.bat` (abrir o app) ou `Gerar-EXE.bat` (gerar o `.exe`).

| Script | O que faz |
|---|---|
| `npm start` | Abre o app em modo de desenvolvimento |
| `npm test` | Testes do patcher, do núcleo e do processo principal |
| `npm run check:secrets` | Procura senhas, tokens e dados pessoais nos arquivos |
| `npm run check:history` | O mesmo, incluindo todo o histórico do Git |
| `npm run build` | Copia só o necessário para `build/` |
| `npm run pack` | Monta o `.exe` em `dist/` a partir de `build/` |
| `npm run dist` | Tudo acima, em ordem, parando no primeiro erro |

## Estrutura do projeto

```
src/
  main.js          processo principal: janela, atalhos, segurança, histórico, bloqueio de anúncios
  preload.js       ponte segura entre a página e o processo principal
  ui.js            interface do menu (injetada na página do HaxBall), textos em pt/en
  splash.html      tela de abertura
  discord.js       "Jogando HaxBall" no perfil do Discord (canal local, sem biblioteca externa)
  core.js          núcleo dentro do jogo: comandos, Chat Bubble, selo de mods, campo liso, mira, volumes, chat/placar
  patcher.js       aplica o mod sobre o jogo oficial
assets/            logo e símbolo (.svg), banner e ícone (.png / .ico)
scripts/           build, empacotamento, instalação do Electron, verificações
tests/             testes automáticos
docs/              segurança, publicação e imagem do README
build/  dist/      gerados pelo build (fora do Git)
private/           módulos pessoais (fora do Git, nunca publicados)
```

## Segurança

Resumo (detalhes em [`docs/SEGURANCA.md`](docs/SEGURANCA.md)):

- O projeto **não contém senhas, tokens ou chaves**. `npm run check:secrets` verifica isso a cada build, e `npm run check:history` verifica todo o histórico do Git.
- O app só navega dentro de `haxball.com`. Links externos abrem no navegador padrão.
- A janela roda com `sandbox` e `contextIsolation`, sem `nodeIntegration`. As chamadas internas só são aceitas da página principal do HaxBall, e os valores recebidos são validados.
- Câmera, microfone, localização e notificações são negados.
- Nomes de salas vindos do jogo são exibidos sempre como texto, nunca como HTML.
- O código é **público e não ofuscado**: quem baixar pode ler. A proteção da autoria vem da [licença](#licença).

## Solução de problemas

<details>
<summary><b>"Electron failed to install correctly" / <code>electron.exe não existe</code></b></summary>

O instalador oficial do Electron às vezes para no meio sem avisar. Rode:

```bat
node scripts\setup-electron.js
```

Ele baixa o Electron com o PowerShell e extrai com `Expand-Archive`. Os dois `.bat` já fazem isso sozinhos.
</details>

<details>
<summary><b><code>npm</code> bloqueado no PowerShell</b> ("a execução de scripts foi desabilitada")</summary>

Use o Prompt de Comando (`cmd`), os arquivos `.bat`, ou escreva `npm.cmd` no lugar de `npm`.
</details>

<details>
<summary><b>O jogo fica em "Loading"</b></summary>

Abra o menu e, em **Jogo**, escolha **Original (sem Mod)**. Se carregar, o problema é o mod: clique em **Log** (painel Status) e anexe o `log.txt` ao abrir uma *issue*.
</details>

<details>
<summary><b>O anúncio ainda aparece</b></summary>

Anexe o `log.txt` numa *issue*. Ele lista os elementos da página para ajustar o bloqueio.
</details>

<details>
<summary><b>Uma sala não apareceu em "Salas recentes"</b></summary>

O código da sala é detectado pela conexão que o jogo abre ao entrar. Se isso falhar, a sala só entra no histórico quando você usa o campo **Sala** do menu (link ou código).
</details>

## Avisos

- Use o HaxBall respeitando as regras do site e de cada sala.
- Este repositório não inclui recursos que alterem a comunicação de rede do jogo com o host da sala.
- O código do HaxBall pertence aos seus autores e **não** faz parte deste repositório: o mod é aplicado no computador de quem usa.

## Créditos

Criado e mantido por **Gabriel Vieira**: ideia, direção do projeto, testes no jogo e identidade visual VOID.

O código foi escrito com auxílio de IA ([Claude](https://claude.ai), da Anthropic), com revisão e decisões do autor.

Feito com [Electron](https://www.electronjs.org). O HaxBall é obra dos seus autores e não faz parte deste projeto.

## Licença

Código aberto sob a licença **MIT**: você pode usar, estudar, modificar e redistribuir, desde que mantenha o aviso de direitos autorais de Gabriel Vieira. O texto completo está em [`LICENSE`](LICENSE).

A logo e o nome VOID identificam este projeto: se você publicar uma versão modificada, use outro nome e outra logo.
