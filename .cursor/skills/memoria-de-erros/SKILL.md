---
name: memoria-de-erros
description: Registro de erros cometidos neste projeto e regras para NUNCA repeti-los. Leia antes de qualquer mudança de código no Fazbrike.
---

# memoria-de-erros — nunca repetir estes erros

Este skill é a memória de erros do projeto. Sempre que um erro for cometido e corrigido,
registre aqui com: **causa**, **sintoma**, **como corrigir** e uma **regra** imperativa.

## Como usar

1. Leia esta lista inteira antes de tocar no código.
2. Se cometer um erro novo, adicione uma entrada nova no final (formato abaixo).
3. Nunca "consertar" o código sem ler esta lista primeiro.

Formato de cada entrada:

```
## [titulo curto]
- **Causa:** ...
- **Sintoma:** ...
- **Correção:** ...
- **Regra:** NUNCA ...
```

---

## CSS global sobrescreve utilitários Tailwind nos botões
- **Causa:** `globals.css` tinha `a { color: var(--color-primary); }` e
  `a:hover { color: var(--color-accent); }`, que sobrescrevem as classes
  `text-white`/cores do Tailwind aplicadas em botões `<Link>`/`<a>`.
- **Sintoma:** labels em botões escuros (`bg-gray-900`) ficavam ilegíveis
  (escuro sobre escuro) e todos os links ficavam laranja no hover.
- **Correção:** remover as regras de cor globais para links (`a`) do `globals.css`.
  Deixar as cores por conta do Tailwind. Hover global só pode sublinhar.
- **Regra:** NUNCA definir `color` global para `a`/`a:hover` no `globals.css`
  quando os botões usam classes de cor do Tailwind. Sempre conferir
  `grep -rn "a\s*{" globals.css` antes de mexer em temas.

## URL de imagem não resolve caminho relativo do backend
- **Causa:** o banco guardava `image_url = /uploads/x.jpg` (formato antigo), mas o
  backend só serve em `/api/uploads/...`. O frontend concatenava a base sem normalizar.
- **Sintoma:** imagens quebradas nos produtos (404).
- **Correção:** helper único `resolveImageUrl()` em `src/lib/services/api.ts` que
  normaliza `/uploads/...` → `/api/uploads/...` e usa um fallback local.
- **Regra:** NUNCA montar URL de imagem manualmente nos componentes. Sempre usar
  `resolveImageUrl()` (ou o helper central equivalente).

## useSearchParams sem Suspense quebra o prerender/SSR
- **Causa:** `useSearchParams()` chamado em componente renderizado durante
  prerender estático do Next (páginas com `CatalogPage`/`ProductGrid`).
- **Sintoma:** erro no build: "useSearchParams() should be wrapped in a suspense
  boundary at page ..." e build de produção falhando.
- **Correção:** envolver o componente que usa `useSearchParams` em `<Suspense>`,
  ou separar a lógica num filho Suspense.
- **Regra:** NUNCA usar `useSearchParams`/`useParams` sem `<Suspense>` nas páginas
  estáticas do Next App Router. Sempre adicionar o Suspense boundary.

## Erros da API mascarados por mensagem genérica
- **Causa:** `handleError` lia só `responseData.message`, mas o backend Go responde
  `{"error": "..."}`. A mensagem real era descartada.
- **Sintoma:** usuário vê "Erro ao criar anúncio. Tente novamente." sem motivo real.
- **Correção:** ler `responseData.error || responseData.message || ...`, e no
  `catch` das páginas exibir `err.message` real em vez da mensagem fixa.
- **Regra:** NUNCA mostrar mensagem de erro fixa no frontend. Sempre propagar
  `error`/`message` vindos da API para o usuário (e logar no console).

## Upload multipart quebra por Content-Type fixo
- **Causa:** instância axios define `Content-Type: application/json` globalmente;
  no upload de `FormData` o boundary do multipart não era montado pelo navegador.
- **Sintoma:** upload de imagem falha ao publicar anúncio.
- **Correção:** no `uploadFile`, passar `'Content-Type': undefined` para o
  navegador definir o `multipart/form-data` com boundary correto.
- **Regra:** NUNCA enviar `FormData` sem `Content-Type: undefined` (query ao axios).

## Endpoints com espaços quebram a chamada
- **Causa:** strings de endpoint com espaços tipo `` `/ items / ${id} ` ``.
- **Sintoma:** 404 / URL malformada na chamada à API.
- **Correção:** manter endpoints limpos: `/items?id=...`, `/items/${id}`.
- **Regra:** NUNCA escrever endpoints com espaços nas template strings.

## Preço inválido (vírgula/NaN) quebra o bind do Go
- **Causa:** `parseFloat("100,50")` gera valor inesperado; o campo é obrigatório.
- **Sintoma:** erro 400 no `POST /api/items` (json unmarshal/validação).
- **Correção:** validar/normalizar preço no frontend antes de enviar (ex.: aceitar
  vírgula e converter para ponto, ou exigir número válido).
- **Regra:** NUNCA enviar preço sem validar tipo/número antes do request.

## Row com dois rótulos estoura a linha no app (Flutter)
- **Causa:** linha "Lembrar de mim" + "Esqueceu a senha?" montada com `Row` de
  dois `Text` sem `Flexible`, copiando um layout que na web quebra sozinho.
- **Sintoma:** faixa listrada de overflow no card de login em tela estreita
  (visto ao renderizar a tela num golden temporário antes de entregar).
- **Correção:** `Flexible` nos dois lados + `maxLines: 1` e
  `overflow: TextOverflow.ellipsis` nos textos.
- **Regra:** NUNCA colocar dois textos lado a lado num `Row` no app sem
  `Flexible`/`Expanded` + ellipsis — largura de celular e fonte ampliada
  estouram o layout.

## Checklist final (sempre)
- [ ] `cd frontend && npx tsc --noEmit`
- [ ] `cd frontend && npx next build --no-lint`
- [ ] `grep -rn "useSearchParams" src/app` → garantir Suspense
- [ ] `grep -rn "bg-gray-900\|bg-gray-800" src` → garantir `text-white` nos labels
- [ ] nenhum texto em inglês nas telas
- [ ] nenhum endpoint com espaços
- [ ] imagens via `resolveImageUrl`
