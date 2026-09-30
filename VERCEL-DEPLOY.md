# Publicação no Vercel — Pedro & Letícia

## 1. Bloqueador antes do deploy

O banco principal ainda precisa das tabelas do novo RSVP:

- `rsvp_submissions`
- `rsvp_submission_sessions`

Aplicar:

`sql/2026-09-26-production-rsvp-finalize.sql`

A migration também concede ao role `app_runtime` os privilégios necessários de runtime.

A migration de cores é idempotente:

`sql/2026-09-26-production-gift-colors-finalize.sql`

## 2. Repositório

Subir o projeto para GitHub/GitLab/Bitbucket sem:

- `.env`
- `.env.local`
- `node_modules`
- `.next`

O `.gitignore` atual já cobre esses itens.

## 3. Criar o projeto na Vercel

- Importar o repositório.
- Framework Preset: Next.js.
- Root Directory: raiz do projeto.
- Build Command: `npm run build` (auto).
- Output Directory: padrão `.next`.
- Node.js: 22.x, também fixado em `package.json`.

Não é necessário `vercel.json` para este projeto.

## 4. Environment Variables

Adicionar em Settings > Environment Variables:

Required:

- `DATABASE_URL`
  - usar a connection string do role restrito `app_runtime`
  - preferir a conexão pooled do Neon
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_BUCKET=gift-images`
- `EVENT_SLUG=pedro-leticia-cha-de-panela`
- `APP_SECURITY_SECRET`
  - gerar um segredo longo, por exemplo 32+ bytes aleatórios
- `ALLOW_DRAFT_GUEST_ACCESS=false`

Opcional:

- `NEXT_PUBLIC_SITE_URL=https://SEU-DOMINIO`
  - o código atual não depende dela para autenticação, mas pode ser mantida como metadado do projeto.

Não colocar na Vercel:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

As contas administrativas já vivem no banco.

Depois de alterar environment variables, fazer redeploy.

## 5. Supabase Storage

Confirmar:

- bucket: `gift-images`
- privado
- imagens JPEG/PNG/WebP
- service secret somente no servidor/Vercel
- nunca expor `SUPABASE_SECRET_KEY` como `NEXT_PUBLIC_*`

## 6. Estado de produção do evento

Antes de convidar pessoas:

- `events.status = active`
- `guest_access_mode` configurado
- acesso do evento testado em aba anônima
- pelo menos um convidado
- pelo menos um presente

## 7. Primeiro deploy: teste com URL vercel.app

Antes de apontar domínio próprio, testar:

### Convidado novo
1. `/acesso`
2. entrar com nome + acesso
3. `/convite`
4. confirmar presença
5. voltar para `/convite`
6. botão deve ser `PRESENÇA CONFIRMADA`
7. ir a `/presentes`
8. reservar presente
9. voltar ao convite
10. botão deve levar a `VER MEU PRESENTE`
11. liberar presente
12. escolher outro

### Sessão
- abrir outra aba no mesmo navegador:
  - `/acesso` não deve pedir login de novo
  - `/admin/login` não deve pedir login se admin já está autenticado
  - `/gestao/login` não deve pedir login se owner já está autenticado

### Noiva
- login `/admin`
- convidados
- presentes
- confirmações para verificar
- cores globais dos presentes
- pausar/reabrir convite

### Owner
- `/gestao`
- `/gestao/editor`
- salvar alteração
- atualizar a página
- confirmar que a alteração persistiu
- abrir `/admin` sem login adicional
- confirmar que admin não consegue abrir `/gestao`

## 8. Preview deployments

Preview deployments são úteis para build/UI, mas cuidado:
se Preview usar a mesma `DATABASE_URL` de produção, testes alteram dados reais.

Para preview:
- preferir banco/branch separado;
- ou não executar testes destrutivos/fluxos reais no Preview.

## 9. Domínio

Depois da URL `*.vercel.app` passar nos testes:

1. Vercel > Project > Settings > Domains
2. adicionar domínio/subdomínio final
3. ajustar DNS conforme a Vercel indicar
4. atualizar `NEXT_PUBLIC_SITE_URL`, se estiver sendo usado
5. redeploy
6. repetir teste de cookies/login no domínio final

## 10. Comandos úteis

Validar variáveis localmente (o comando carrega `.env.local` automaticamente, se existir):

```bash
npm run check:deploy
```

Depois de instalar as dependências, validar o schema e o evento no banco:

```bash
npm ci
npm run check:db
```

Build de produção:

```bash
npm run build
```

A publicação não deve ser considerada pronta enquanto `npm run build` não terminar sem erro.
