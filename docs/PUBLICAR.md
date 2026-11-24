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

## 7. Publicar uma versão nova (Release automático)

Desde a 1.2.0, o `.exe` é gerado e publicado pelo próprio GitHub (arquivo `.github/workflows/release.yml`). Você não gera zip nem arrasta arquivo: só escreve as novidades, sobe a versão e cria a tag.

**1. Escreva as novidades** no `CHANGELOG.md`, numa seção nova no topo (em inglês, como as outras). Esse texto vira a descrição do release:

```
## 1.2.1

Fixed: (o que mudou)

- (um item por linha)
```

**2. Suba a versão** (troque `1.2.1` pela versão nova):

```bat
npm version 1.2.1 --no-git-tag-version
```

**3. Teste e confira:**

```bat
npm test
npm run check:secrets
git status
```

**4. Envie o código e a tag:**

```bat
git add .
git commit -m "VOID HaxBall Mod 1.2.1"
git push
git tag v1.2.1
git push origin v1.2.1
```

**5. Acompanhe** em **Actions** no repositório (leva uns 10 minutos). Quando ficar verde, o release aparece em **Releases** com:

- título `VOID HaxBall Mod 1.2.1` (para versões terminadas em `.0`, só `1.2`, como antes);
- o texto da seção do `CHANGELOG.md`, mais a linha de instalação;
- o `VOID-HaxBall-Mod-1.2.1-win64.zip` (o GitHub mostra o SHA-256 dele, que o atualizador do app usa para conferir o download).

Se ficar vermelho, nada é publicado. Abra o passo que falhou: os motivos mais comuns são a tag diferente da versão do `package.json` e a falta da seção no `CHANGELOG.md`.

A versão publicada é sempre a **pública**: a pasta `private\` não existe no GitHub, então o OP Mode e o ping falso nunca entram no release. Para gerar a sua versão pessoal no seu PC, continue usando o `Gerar-EXE.bat`.

### 7.1 Errei a tag

Apague a tag e o release (se chegou a ser criado) e crie de novo:

```bat
git tag -d v1.2.1
git push origin :refs/tags/v1.2.1
```

No site, apague o release em **Releases** (botão **Delete**), se ele existir.

---

## 8. Regras de ouro

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

:: versão nova (depois de escrever o CHANGELOG.md)
npm version 1.2.1 --no-git-tag-version
npm test
npm run check:secrets
git status
git add .
git commit -m "VOID HaxBall Mod 1.2.1"
git push
git tag v1.2.1
git push origin v1.2.1
```
