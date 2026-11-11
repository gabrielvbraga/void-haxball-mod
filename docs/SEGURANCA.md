# Segurança e proteção do código

## O que foi implementado

| Medida | Onde | O que faz |
|---|---|---|
| Separação código-fonte / distribuição | `src/` → `build/` → `dist/` | A distribuição só contém o necessário. `scripts/verify-build.js` recusa `.env`, `config.json`, logs, testes, docs e `private/`. |
| Empacotamento `.asar` | `scripts/pack.js` | Junta os arquivos em um único pacote (não é criptografia). |
| Varredura de segredos | `scripts/check-secrets.js` | Procura tokens, chaves, senhas, e-mails, telefones e caminhos pessoais nos arquivos e, com `--history`, em **todo o histórico do Git**. |
| `.gitignore` | raiz | Ignora `node_modules`, `build`, `dist`, `.env`, `config.json`, logs, `private/` e cópias do jogo. |
| Módulo privado | pasta `private/` (ignorada pelo Git) | O que não deve ser público nunca entra no repositório. |
| Endurecimento do Electron | `src/main.js` | `sandbox`, `contextIsolation`, sem `nodeIntegration`; navegação só em `haxball.com`; IPC aceita só a página principal do HaxBall; valores recebidos são validados; permissões negadas por padrão. |

Não existem senhas, tokens ou chaves de API neste projeto. Se um dia existirem, use variáveis de ambiente (`.env`, que já está no `.gitignore`) e nunca coloque o valor no código.

## O que NÃO é possível (sem promessas falsas)

- **Código publicado em repositório público pode ser lido, copiado e alterado por qualquer pessoa.** Ofuscar o que está no GitHub não adianta: o código-fonte original está ali.
- **Um `.exe` distribuído pode sofrer engenharia reversa.** Este projeto não usa ofuscação: o código já é público, e ofuscar quebrava o encaixe do mod no jogo. O app roda na máquina de quem baixou, então essa pessoa tem acesso a tudo que ele contém.
- **Um segredo dentro do app não é segredo.** Qualquer chave embutida pode ser extraída.

## Opções reais para proteger sua autoria

1. **Licença.** É a proteção mais forte em repositório público. Sem licença, ninguém pode legalmente reutilizar; com uma licença (por exemplo uma que proíba uso comercial ou exija crédito) você define as regras.
2. **Publicar só o que for seguro.** Mantenha módulos sensíveis fora do Git (é o que a pasta `private/` faz).
3. **Distribuir apenas o binário.** Repositório com README e *Releases* contendo o `.exe`, sem o código-fonte.
4. **Licenciamento com servidor** (chave por usuário, validação online). Exige um servidor seu e, mesmo assim, pode ser contornado; só vale a pena se você pretende vender.

## Se um segredo vazar no Git

Apagar o arquivo em um novo commit **não** remove do histórico. Faça nesta ordem:

1. Revogue/troque a senha, token ou chave imediatamente.
2. Só depois limpe o histórico (`git filter-repo` ou BFG) e force o push.
3. Rode `npm run check:history` para confirmar.
