# Chá de Panela — Pedro & Letícia

Aplicação Next.js mobile-first para convite privado, confirmação de presença, lista de presentes e painel dos noivos.

## Stack

- Next.js + React + TypeScript
- Neon PostgreSQL para dados e sessões
- Supabase Storage privado para fotos de presentes
- Autenticação própria com cookies HttpOnly

## Rodar localmente

1. Copie `.env.example` para `.env.local` e preencha as variáveis.
2. Instale as dependências:

```bash
npm install
```

3. Crie/atualize o administrador inicial:

```bash
npm run create-admin
```

4. Inicie:

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Acesso dos convidados



> `APP_SECURITY_SECRET` participa do HMAC dos códigos de convidados. Não altere esse segredo depois que senhas forem distribuídas, a menos que pretenda gerar novas senhas.

## Cadastro de convidados

Em `/admin/convidados` existem três formas:

- um convidado por vez;
- vários nomes separados por vírgula, ponto e vírgula ou quebra de linha;
- importação de `.xlsx`, `.xls` ou `.csv` (coluna `Nome`, ou primeira coluna da planilha).

Nomes idênticos normalizados são ignorados para evitar ambiguidade no login com senha única.

## Supabase Storage

O bucket esperado é `gift-images`, privado. O backend aceita a nova chave secreta via:

```env
SUPABASE_SECRET_KEY=sb_secret_...
```

Também existe fallback para a variável legada `SUPABASE_SERVICE_ROLE_KEY`.

## Banco

O arquivo `sql-guest-access-modes.sql` documenta a extensão do schema usada pelos dois modos de senha. Ela já foi aplicada no Neon conectado durante a implementação.

## Fluxo de acesso em produção

O convite usa **uma senha única para todo o evento**. No login, o convidado informa o nome e a senha compartilhada. O nome precisa existir exatamente na lista de convidados (comparação normalizada, ignorando acentos/maiúsculas). Depois do acesso, a sessão fica vinculada ao `guest_id` encontrado e o RSVP não permite trocar de identidade nem criar outro convidado.

O banco também garante uma confirmação por convidado e apenas uma sessão ativa por convidado.
