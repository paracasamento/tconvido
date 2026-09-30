# Auditoria de fluxo — convite Pedro & Letícia

## Estados principais do convidado

1. Acessou o convite, ainda não confirmou
   - Convite: botão `CONFIRMAR PRESENÇA`
   - Presentes: bloqueados até confirmação

2. Confirmou presença
   - Convite: botão `PRESENÇA CONFIRMADA`
   - Convite: botão de presentes vira `ESCOLHER PRESENTE`
   - Presença: abre diretamente o cenário de sucesso
   - Estado persiste por sessão RSVP e também pela identidade de convidado quando conhecida

3. Identidade do RSVP
   - O nome informado no acesso precisa corresponder ao dono da senha
   - A confirmação nunca cria um novo convidado nem troca para outro `guest_id`
   - Reconfirmar atualiza o mesmo registro de RSVP

5. Presente escolhido
   - Convite: `VER MEU PRESENTE`
   - Lista: reserva aparece em primeiro lugar e como `reservado por você`
   - Aviso flutuante oferece `Ver` e `Liberar`
   - `/meu-presente`: permite consultar ou liberar
   - Uma segunda reserva é impedida enquanto a primeira estiver ativa

6. Presente liberado
   - Volta a ficar disponível
   - Convidado pode escolher outro

7. Evento pausado/encerrado
   - Novos acessos continuam bloqueados
   - RSVP e novas reservas também ficam bloqueados para sessões antigas

## Noiva — primeiro uso

A publicação depende de:
- dados da festa;
- modo de acesso configurado;
- pelo menos um convidado;
- pelo menos um presente;
- códigos individuais prontos quando esse modo for usado.

Depois da publicação, a noiva pode:
- editar dados da festa;
- adicionar/remover convidados;
- adicionar/editar presentes;
- ver confirmações;
- revisar nomes aproximados/não vinculados;
- pausar ou reabrir o convite.

## Regras de integridade

- presente reservado não pode ser removido pela noiva;
- excluir convidado libera sua reserva e revoga acesso;
- convidado só pode ter uma reserva ativa;
- presente só pode ter uma reserva ativa;
- retry da mesma reserva é idempotente;
- confirmações repetidas da mesma identidade atualizam o registro em vez de gerar duplicação;
- uma credencial individual nunca pode confirmar outro convidado;
- existe no máximo uma sessão ativa por convidado;
- revisão de identidade transfere sessão/reserva quando necessário;
- conflito de duas reservas diferentes impede merge automático.

## Regra de identidade do RSVP

1. O convidado informa nome + senha única do evento.
2. O servidor valida a senha e exige correspondência exata do nome na lista.
3. A sessão é criada com o `guest_id` correspondente.
4. A confirmação usa exclusivamente esse `guest_id`; o campo de nome é somente leitura.
5. O banco mantém uma única submissão por `(event_id, guest_id)`.
