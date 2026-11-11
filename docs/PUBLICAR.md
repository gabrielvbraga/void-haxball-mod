# Como publicar o VOID HaxBall Mod no GitHub

Guia completo, do zero até a primeira versão publicada. Todos os comandos são para o **Prompt de Comando (cmd)** do Windows. Copie e cole um bloco de cada vez.

> Por que o `cmd` e não o PowerShell? O PowerShell do seu computador bloqueia o `npm` ("execução de scripts desabilitada"). No `cmd` isso não acontece.

---

## 0. Preparar o computador (só uma vez)

### 0.1 Instalar o Git

Baixe em <https://git-scm.com/download/win> e instale clicando em **Next** até o fim (as opções padrão servem).

Feche e abra o `cmd` de novo e confira:

```bat
git --version
```

### 0.2 Proteger o seu e-mail

Todo commit grava um nome e um e-mail, e eles ficam **públicos** no GitHub. Para não expor o seu e-mail pessoal:

1. No GitHub, vá em **Settings → Emails**.
2. Marque **Keep my email addresses private**.
3. Copie o endereço que aparece no formato `123456+SEUUSUARIO@users.noreply.github.com`.

Configure o Git com esse endereço:

```bat
git config --global user.name "Gabriel Vieira"
git config --global user.email "COLE-AQUI-O-ENDERECO-NOREPLY"
git config --global init.defaultBranch main
```

---

## 1. Organizar a pasta do projeto

A pasta do projeto deve ficar assim:

```
void-haxball-mod\
  .gitattributes     .gitignore     README.md     LICENSE     package.json     package-lock.json
  Iniciar.bat        Gerar-EXE.bat
  assets\  docs\  scripts\  src\  tests\
  private\           <- seus módulos pessoais (o Git ignora)
  node_modules\      <- gerado pelo npm (o Git ignora)
  build\  dist\      <- gerados pelo build (o Git ignora)
```

### O que VAI para o GitHub

| Item | Por quê |
|---|---|
| `src\`, `assets\`, `scripts\`, `tests\`, `docs\` | Código, imagens, ferramentas, testes e documentação |
| `README.md`, `package.json`, `package-lock.json` | Descrição e lista exata de dependências |
| `.gitignore`, `.gitattributes` | Regras do que fica fora e de finais de linha |
| `Iniciar.bat`, `Gerar-EXE.bat` | Atalhos para quem baixar o código |
| `LICENSE` | Licença MIT com o seu nome (passo 3) |

### O que NUNCA vai (o `.gitignore` já bloqueia)

| Item | Por quê |
|---|---|
| `private\` | Seus módulos pessoais |
| `node_modules\` | Gigante; qualquer um recria com `npm install` |
| `build\`, `dist\`, `*.zip` | Gerados; o `.exe` vai em **Releases**, não no código |
| `game-min*.js` | Cópias do código do HaxBall, que não é seu |
| `config.json`, `log.txt`, `.env`, `*.key`, `*.pem` | Configurações locais, logs e segredos |

---

## 2. Conferir antes de publicar

Na pasta do projeto (troque o caminho se o seu for diferente):

```bat
cd /d "%USERPROFILE%\Downloads\void-haxball-mod"
npm install
npm test
npm run check:secrets
```

Os três precisam terminar sem `FALHA` nem `ATENÇÃO`. Se aparecer algo, **não publique**: me mande o print.

---

## 3. Licença e créditos (já prontos)

"Open source" exige uma licença: sem ela, o código fica com todos os direitos reservados, mesmo estando público. O projeto já vem com a licença **MIT** no arquivo `LICENSE`, em nome de **Gabriel Vieira**:

- qualquer pessoa pode usar, estudar, modificar e redistribuir o código;
- em toda cópia, o aviso `Copyright (c) 2026 Gabriel Vieira` precisa continuar lá. É isso que garante o seu crédito.

O seu nome também aparece no `README.md` (seção Créditos), no `package.json` (`"author"`), na aba Status do app e nas propriedades do `.exe`.

Se preferir outra licença, troque o conteúdo do `LICENSE` antes do primeiro commit (e o campo `"license"` do `package.json`):

| Licença | Na prática |
|---|---|
| **MIT** (a atual) | Qualquer um pode usar, modificar e até vender, desde que mantenha o seu nome |
| **GPL-3.0** | Pode usar e modificar, mas quem distribuir uma versão modificada precisa publicar o código também |

### 3.1 Ligar o aviso de atualização

No `package.json`, preencha `"repository"` com o seu usuário do GitHub:

```json
"repository": "SEU-USUARIO/void-haxball-mod",
```

---

## 4. Criar o repositório no GitHub

1. Entre em <https://github.com/new>.
2. **Repository name:** `void-haxball-mod`
3. **Description:** `Launcher para HaxBall com interface VOID, bloqueio de anúncios e ferramentas de qualidade de vida.`
4. Marque **Public**.
5. **Não** marque *Add a README*, *Add .gitignore* nem *Choose a license*. O projeto já tem os três, e criar no site agora causaria conflito no primeiro envio.
6. Clique em **Create repository** e deixe a página aberta.

---

## 5. Primeiro commit e primeiro push

### 5.1 Criar o repositório local

```bat
cd /d "%USERPROFILE%\Downloads\void-haxball-mod"
git init
git add .
```

### 5.2 Conferir o que vai ser enviado (importante)

```bat
git status
```

Na lista precisa aparecer `LICENSE` e **não pode aparecer** `private/`, `node_modules/`, `build/`, `dist/`, `config.json` nem nenhum `game-min`. Para confirmar que a pasta privada está protegida:

```bat
git check-ignore -v private
```

A resposta deve citar o `.gitignore` (algo como `.gitignore:8:private/  private`). Se não aparecer nada, **pare** e me mande o print.

Confira também a lista exata de arquivos:

```bat
git ls-files
```

### 5.3 Commit e envio

Troque `SEU-USUARIO` pelo seu usuário do GitHub:

```bat
git commit -m "VOID HaxBall Mod 1.0"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/void-haxball-mod.git
git push -u origin main
```

No primeiro `push`, o Windows abre uma janela de login do GitHub. Entre na sua conta e autorize; o Git guarda o acesso para as próximas vezes.

### 5.4 Conferir no site

Atualize a página do repositório. Confira que:

- o README aparece com a logo e a imagem do menu;
- ao lado, em **About**, aparece **MIT license** (o GitHub lê o arquivo `LICENSE` sozinho);
- **não existe** pasta `private`, `node_modules`, `build` ou `dist`.

---

## 6. Completar o repositório no site

Na página do repositório, clique na engrenagem ao lado de **About** e adicione tópicos como `haxball`, `electron`, `launcher`, `windows`, `open-source`.

---

## 7. Publicar o executável (Release)

O `.exe` vai em **Releases**, não no código.

### 7.1 Gerar o executável

Dois cliques em `Gerar-EXE.bat` (ou `npm run dist`). Se você tem a pasta `private\`, o `.bat` gera a versão **pessoal** (com OP Mode e ping falso), que **não pode ser publicada**. Para gerar a versão pública mesmo tendo a pasta `private\`:

```bat
npm run dist
```

### 7.2 Compactar

```bat
powershell -NoProfile -Command "Compress-Archive -Force -Path 'dist\VOID HaxBall Mod-win32-x64\*' -DestinationPath 'VOID-HaxBall-Mod-1.0.0-win64.zip'"
```

### 7.3 Publicar

1. No repositório: **Releases → Draft a new release** (ou **Create a new release**).
2. **Choose a tag:** digite `v1.0.0` e clique em **Create new tag**.
3. **Release title:** `VOID HaxBall Mod 1.0`.
4. Na descrição, liste as novidades (exemplo abaixo).
5. Arraste o `VOID-HaxBall-Mod-1.0.0-win64.zip` para a área de anexos.
6. Clique em **Publish release**.

Exemplo de descrição:

```
Novidades
- Primeira versão pública do VOID HaxBall Mod
- Menu com barra lateral, temas de cor e português/inglês
- Bloqueio de anúncios, FPS, modo gravação (F4) e Chat Bubble
- Salas recentes e favoritas, perfis e ações rápidas

Instalação: extraia o zip e abra VOID-HaxBall-Mod.exe.
Código aberto (licença MIT). Desenvolvido por Gabriel Vieira.
```

---

## 8. Publicar atualizações

Toda vez que mudar o projeto:

**1. Suba a versão** no `package.json` (campo `"version"`, por exemplo de `1.0.0` para `1.0.1`).

**2. Teste e confira:**

```bat
npm test
npm run check:secrets
git status
```

**3. Envie** (troque a mensagem pelo que você mudou):

```bat
git add .
git commit -m "Corrige X e adiciona Y"
git push
```

**4. Gere um novo Release** repetindo o passo 7 com a versão nova (tag `v1.0.1`, por exemplo).

Regras de ouro:
- Rode `git status` **antes** de todo `git add .` e confira a lista.
- Nunca use `git add -f` (ele força arquivos que o `.gitignore` bloqueia).
- Uma mudança por commit, com uma mensagem que explique o quê e o porquê.

---

## 9. Se algo sensível for enviado por engano

Apagar o arquivo num commit novo **não** remove do histórico: qualquer um ainda consegue ver as versões antigas.

1. **Primeiro**, se for senha, token ou chave: troque ou revogue imediatamente. Considere que já vazou.
2. Se for a pasta `private\` ou uma cópia do jogo: torne o repositório privado (**Settings → General → Danger Zone → Change visibility**) enquanto resolve.
3. O jeito mais simples de limpar é apagar o repositório no GitHub e criar outro, refazendo o passo 5 numa pasta sem `.git`:

```bat
rmdir /s /q .git
```

4. Antes de tornar público de novo, confirme que o histórico está limpo:

```bat
npm run check:history
```

---

## Resumo rápido

```bat
:: primeira vez
git init
git add .
git status
git commit -m "VOID HaxBall Mod 1.0"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/void-haxball-mod.git
git push -u origin main

:: atualizações
npm test
npm run check:secrets
git status
git add .
git commit -m "Descreva a mudança"
git push
```
