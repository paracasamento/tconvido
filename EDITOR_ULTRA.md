# Editor Visual Ultra — alterações

Esta versão amplia o construtor visual sem alterar a estrutura do banco.

## Edição de partes internas
Os slots funcionais agora expõem partes individuais no editor:

### Login
- Formulário
- Label nome
- Campo nome
- Ícone nome
- Texto/placeholder nome
- Label código
- Campo código
- Ícone código
- Texto/placeholder código
- Botão abrir
- Texto do botão
- Ícone do botão
- Mensagem de erro

### RSVP
- Container
- Botão sim
- Texto botão sim
- Botão não
- Texto botão não
- Mensagem de erro
- Observação
- Card/título/texto de status

### Presentes
- Grade
- Card
- Área da imagem
- Imagem
- Status
- Título
- Descrição
- Botão
- Aviso, ícone, texto e link

## Controles disponíveis por parte
- texto/rótulo
- fonte, tamanho, peso, line-height, tracking e alinhamento
- cor e opacidade
- background por cor ou imagem
- largura e altura CSS
- padding e margin independentes por lado
- borda, raio e sombra
- display/gap
- CSS Normal, Hover, Focus e Active isolado por parte

## Backgrounds
Tela, camada e partes internas podem receber imagem. O editor aceita upload local e converte a imagem para WebP redimensionado antes de armazenar no JSON.

Tela também aceita overlay e gradiente.

## Novos elementos
- Texto
- Imagem
- Botão/link
- Container visual

## CSS avançado
CSS é escopado pelo ID da camada/parte para não vazar para outras áreas do convite.

## Banco
Nenhuma migration nova é necessária. Tudo continua salvo no JSONB de `invite_visual_designs.config`.

## Observação
A rota do editor aceita configurações de até 4 MB para comportar backgrounds incorporados.
