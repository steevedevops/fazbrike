# AGENTS.md — Regras de memória do Fazbrike

Este arquivo é a memória permanente do projeto. **Leia antes de qualquer mudança.**

## Erros que NÃO podem se repetir

Os erros abaixo já foram cometidos e corrigidos. Nunca os repita. Detalhes completos
estão na skill `.reasonix/skills/memoria-de-erros/SKILL.md`.

1. **CSS global sobrescrevendo cores do Tailwind** — nunca defina `color` global para
   `a`/`a:hover` no `globals.css`. Botões escuros (`bg-gray-900`) devem ter `text-white`
   legível. Qualquer botão escuro SEM `text-white` é bug.
2. **URL de imagem** — sempre use `resolveImageUrl()` (helper central em
   `src/lib/services/api.ts`); nunca monte URL de imagem manualmente.
3. **useSearchParams** — sempre dentro de `<Suspense>`, senão quebra o prerender/build.
4. **Erros da API** — nunca mostre mensagem de erro fixa; propague `err.message`
   (que lê `responseData.error`).
5. **Upload multipart** — sempre `'Content-Type': undefined` ao enviar `FormData`.
6. **Endpoints** — nunca com espaços nas template strings.
7. **Preço** — validar antes de enviar (vírgula/NaN quebra o Go).

## Convenções do projeto

- Todo texto visível ao usuário em **português**.
- Identificadores, paths, comandos e termos técnicos permanecem em inglês original.
- Estilo visual: minimalista, monocromático (cinza/escuro), sem gradientes/cores
  chamativas desnecessárias.

## Verificação obrigatória antes de declarar pronto

```bash
cd frontend && npx tsc --noEmit
cd frontend && npx next build --no-lint
grep -rn "useSearchParams" src/app   # garantir Suspense
grep -rn "bg-gray-900\|bg-gray-800" src --include="*.tsx"   # garantir text-white
```

## Como registrar um erro novo

Quando cometer e corrigir um erro, adicione uma entrada:
1. Na skill `.reasonix/skills/memoria-de-erros/SKILL.md` (formato causa/sintoma/correção/regra).
2. Aqui no AGENTS.md (uma linha no resumo + regra imperativa).

## Admin — regra: todo módulo/model novo DEVE ser mapeado no admin

Este projeto tem um **admin genérico dirigido por metadados** (`admin/`, SvelteKit, estilo
do admin do PocketBase). Qualquer model do backend registrado vira automaticamente uma
collection com CRUD completo, sem escrever telas.

**Sempre que um novo model/módulo for criado no backend, você DEVE:**

1. Adicionar o model ao `AutoMigrate` em `backend/main.go`.
2. Registrar a collection chamando `admin.Register(&models.X{})` dentro de
   `initAdminRegistry()` em `backend/main.go`.
3. (Opcional, recomendado) Definir rótulo pt-BR com `admin.SetCollectionLabel("x", "X")`.
4. Verificar: `cd backend && go build ./... && go vet ./...` e conferir a nova collection
   em `GET /api/admin/meta`.

> Um model criado porém **não registrado** é considerado **incompleto/bug** — o recurso não
> aparece no admin. O passo 2 é incondicional: todo feature novo de dados passa pelo registry.

Use a skill `admin-module` (`/admin-module`) para o passo a passo completo.
