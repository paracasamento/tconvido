# Preparação para Vercel

Data da revisão: 2026-09-29.

## Ajustes aplicados

- Upload de foto de presente limitado a 4 MB para ficar abaixo do limite de payload de Vercel Functions.
- Validação de tamanho adicionada também na interface de criação/edição de presentes.
- Persistência do editor visual separada em `src/lib/invite-builder-server.ts`, evitando que código do Neon atravesse a fronteira client/server.
- Página inicial marcada como `force-dynamic`, evitando congelar a capa do convite no momento do build.
- `npm run check:deploy` agora carrega `.env.local` automaticamente quando o arquivo existe.
- Novo `npm run check:db` valida tabelas essenciais, o `EVENT_SLUG`, o status do evento e o role da conexão.
- `*.tsbuildinfo` adicionado ao `.gitignore` e o artefato gerado foi removido do pacote.

## Validações executadas

- 144 arquivos TypeScript/TSX analisados novamente após o endurecimento do RSVP, sem erros de sintaxe.
- Imports internos verificados: nenhum caminho ausente.
- Dependências externas usadas no código verificadas contra `package.json`: nenhuma dependência não declarada.
- Grafo de componentes `use client` verificado: nenhum módulo de banco/servidor alcançável após a separação do editor.
- `npm run check:deploy` executado com variáveis de teste e aprovado.

## Validação ainda necessária

O ambiente usado nesta revisão não consegue resolver `registry.npmjs.org`, por isso `npm ci`/`npm run build` não puderam ser concluídos aqui. O cache local também não contém todas as dependências.

Antes de publicar, execute em uma máquina com acesso ao npm ou deixe o primeiro Preview da Vercel executar:

```bash
npm ci
npm run check:deploy
npm run check:db
npm run build
```

## Banco Neon — estado atual

A migration `sql/2026-09-26-production-rsvp-finalize.sql` foi aplicada na branch `production` em 2026-09-29 e validada. Ela agora inclui:

- `rsvp_submissions`;
- `rsvp_submission_sessions`;
- uma confirmação por `guest_id`;
- uma sessão ativa por convidado;
- uma sessão RSVP ativa por confirmação;
- grants de runtime.


## Variáveis necessárias na Vercel

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (ou o fallback legado `SUPABASE_SERVICE_ROLE_KEY`)
- `SUPABASE_BUCKET=gift-images`
- `EVENT_SLUG=pedro-leticia-cha-de-panela`
- `APP_SECURITY_SECRET` com pelo menos 32 caracteres
- `ALLOW_DRAFT_GUEST_ACCESS=false`

Opcional:

- `NEXT_PUBLIC_SITE_URL`

Não configurar na Vercel:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Ajuste final de acesso

O acesso permanece com **senha única do evento**. A proteção contra confirmações em nomes diferentes foi movida para a identidade de sessão: login resolve um convidado existente e trava o `guest_id` até o fim da sessão. Não é necessário gerar senhas individuais.
