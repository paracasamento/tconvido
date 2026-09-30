# Auditoria de segurança — acesso administrativo

## Separação de sessão

- `/admin/*` usa `pl_admin_session`.
- `/gestao/*` usa `pl_owner_session`.
- Uma sessão do painel dos noivos não autoriza o editor.
- A sessão owner expira em 4 horas.
- Cookie owner: `httpOnly`, `sameSite=strict`, `secure` em produção.

## Rotas protegidas

- `/gestao` e `/gestao/editor`: `requireOwner()`.
- `/admin/*` (exceto login): `requireAdmin()`.
- `/api/admin/invite-design`: `getOwnerSession()`; não aceita sessão admin.
- `/api/owner/login`: somente contas com role `owner`.
- `/api/owner/logout`: valida mesma origem.

## Limites do editor

- até 120 elementos por tela;
- até 100 partes internas por elemento;
- config serializado: até 1 MB;
- CSS por campo: até 20 KB;
- texto: até 10 KB;
- href rejeita esquemas não permitidos como `javascript:`.

## Login owner

- máximo de 5 falhas em 15 minutos por IP anonimizado;
- senha: mínimo de 12 caracteres;
- origem/referer obrigatoriamente same-origin.

## Observação operacional

Contas owner antigas e sessões existentes continuam válidas no banco até serem
revogadas/desativadas. A separação de cookie impede que uma sessão antiga de
`/admin` abra `/gestao`, mas recomenda-se revogar sessões antigas e remover
owners que não serão mais utilizados.
