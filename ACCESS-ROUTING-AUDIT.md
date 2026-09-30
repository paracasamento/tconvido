# Auditoria de acesso e redirecionamento

## Regras de sessão

### Owner
- Cookie: `pl_owner_session`
- Pode acessar `/gestao/*`
- Também pode acessar `/admin/*` sem realizar um segundo login
- Uma sessão de admin nunca concede acesso a `/gestao/*`

### Admin/noiva
- Cookie: `pl_admin_session`
- Pode acessar `/admin/*`
- Não pode acessar `/gestao/*`

### Convidado
- `pl_invite_session`: passou pela tela de acesso do convite
- uma nova autenticação revoga a sessão ativa anterior daquele convidado

## Login já autenticado

- `/admin/login` + admin/owner válido -> `/admin` ou `next`
- `/gestao/login` + owner válido -> `/gestao` ou `next`
- `/acesso` + convite válido -> `/convite` ou `next`

Abrir outra aba do mesmo navegador reutiliza os cookies existentes. Não deve mostrar
o formulário de login novamente quando a sessão correspondente ainda é válida.

## Destino original

Rotas protegidas preservam o destino:
- `/admin/convidados` -> login -> `/admin/convidados`
- `/gestao/editor` -> login -> `/gestao/editor`
- `/presenca` -> acesso -> `/presenca`

O parâmetro `next` aceita apenas rotas internas de cada área para impedir open redirect.

## Fluxo convidado

- Sem invite session -> `/acesso`
- Já passou pelo acesso, mas ainda não tem guest session -> ao tentar presentes,
  vai para `/presenca`, sem pedir a senha do convite outra vez
- Guest session com RSVP pendente -> `/presentes` redireciona para `/presenca`
- RSVP confirmado -> `/presentes`
- Reserva existente -> `/meu-presente` mostra a reserva

## Editor legado

`/admin/editor`:
- owner -> `/gestao/editor`
- admin/noiva -> `/admin`
- sem sessão -> `/gestao/login?next=/gestao/editor`

## Logout

- admin comum -> `/admin/login`
- owner navegando em `/admin` -> volta para `/gestao`
- logout de owner continua independente em `/api/owner/logout`

## Identidade com senha compartilhada

- `pl_invite_session`: guarda `event_id`, nome oficial e `guest_id` resolvido no login.
- `pl_guest_session`: sessão de banco vinculada ao mesmo `guest_id`.
- senha do evento + nome existente identificam a sessão; o RSVP não aceita mudar o nome para outro convidado.
- o índice `guest_sessions_one_active_idx` mantém no máximo uma sessão ativa por convidado.
