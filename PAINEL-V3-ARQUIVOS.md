# Painel v3 — mapa de arquivos

A área dos noivos foi separada para que cada tela e responsabilidade possa ser alterada sem abrir um arquivo gigante.

## Navegação principal do aplicativo

- `src/components/admin/AdminAppChrome.tsx` — decide quando mostrar o “casco” do aplicativo.
- `src/components/admin/AdminTopBar.tsx` — topo da área dos noivos.
- `src/components/admin/AdminBottomNav.tsx` — barra fixa inferior: Início, Convidados, Presentes, Convite e Conta.
- `src/components/admin/AdminPageHeader.tsx` — cabeçalho reutilizável das páginas.
- `src/components/admin/AppModal.tsx` — modal do próprio sistema. Substitui `confirm()` / `alert()` nas ações administrativas principais.
- `src/app/admin/layout.tsx` — aplica a estrutura do aplicativo a todas as páginas `/admin`, exceto login e prévia.

## Lógica das etapas

- `src/lib/admin-setup.ts` — única fonte da lógica que define se cada etapa está concluída, progresso, próxima etapa e contadores.
- `src/components/admin/setup/SetupProgress.tsx` — barra de progresso.
- `src/components/admin/setup/SetupOverview.tsx` — primeira tela quando o convite ainda está em preparação.
- `src/components/admin/setup/SetupStepShell.tsx` — estrutura visual comum das etapas.
- `src/components/admin/setup/ConfiguredHome.tsx` — início depois que o convite já foi publicado/pausado.

## Uma página por etapa

- `src/app/admin/preparar/festa/page.tsx` — Etapa 1: dados da festa.
- `src/app/admin/preparar/convidados/page.tsx` — Etapa 2: convidados.
- `src/app/admin/preparar/presentes/page.tsx` — Etapa 3: presentes.
- `src/app/admin/preparar/acesso/page.tsx` — Etapa 4: forma de acesso.
- `src/app/admin/preparar/revisao/page.tsx` — Etapa 5: revisão e publicação.

Cada etapa pode ser redesenhada isoladamente sem alterar as outras.

## Cadastro de convidados — dividido em peças pequenas

- `src/components/AdminGuestCreate.tsx` — arquivo mínimo que chama o novo módulo.
- `src/components/admin/guests/GuestCreateHub.tsx` — coordena cadastro/importação.
- `src/components/admin/guests/GuestEntryTabs.tsx` — seletor Um por vez / Vários nomes / Planilha.
- `src/components/admin/guests/GuestSingleForm.tsx` — um convidado.
- `src/components/admin/guests/GuestBulkForm.tsx` — vários convidados por texto.
- `src/components/admin/guests/GuestSheetForm.tsx` — planilha.
- `src/components/admin/guests/GuestImportResult.tsx` — resultado do cadastro.
- `src/components/admin/guests/guest-utils.ts` — parsing e exportação CSV.
- `src/components/admin/guests/types.ts` — tipos do módulo.

## Cadastro de presentes — dividido em peças pequenas

- `src/components/AdminGiftCreate.tsx` — arquivo mínimo que chama o módulo.
- `src/components/admin/gifts/GiftCreateHub.tsx` — coordena as três formas de cadastro.
- `src/components/admin/gifts/GiftEntryTabs.tsx` — Um por vez / Vários itens / Planilha.
- `src/components/admin/gifts/GiftSingleForm.tsx` — item com foto e descrição.
- `src/components/admin/gifts/GiftBulkForm.tsx` — vários presentes por texto.
- `src/components/admin/gifts/GiftSheetForm.tsx` — planilha de presentes.
- `src/components/admin/gifts/gift-utils.ts` — parsing da lista.
- `src/app/api/admin/gifts/route.ts` — aceita tanto presente individual quanto criação em massa.

## Telas depois da configuração

- `src/app/admin/page.tsx` — escolhe automaticamente entre onboarding e início já configurado.
- `src/app/admin/convidados/page.tsx` — gestão de convidados.
- `src/app/admin/presentes/page.tsx` — gestão de presentes.
- `src/app/admin/convite/page.tsx` — somente dados/configurações do evento.
- `src/app/admin/configuracoes/page.tsx` — somente conta administrativa.
- `src/app/admin/preview/page.tsx` — prévia em tela cheia.

## Estilo

- `src/app/globals.css` — o bloco `Área dos noivos v3 — app guiado` concentra os estilos novos. Os componentes continuam com classes próprias para permitir separar esse CSS em módulos depois, se desejado.

## Observação importante sobre senhas

A reorganização desta entrega é do painel e do fluxo guiado. O armazenamento recuperável/criptografado das senhas para que a noiva possa consultar as senhas antigas a qualquer momento ainda precisa de uma alteração específica de backend/banco. Não foi feita nesta etapa para não misturar a refatoração visual com uma mudança de segurança e schema.
