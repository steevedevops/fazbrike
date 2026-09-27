# AGENTS.md — Instruções para agentes de IA (Fazbrike)

Este arquivo é a **fonte de verdade** para qualquer agente (Cursor, Claude Code, Copilot,
Windsurf, Aider, Codex, etc.). **Leia antes de qualquer mudança.** Em conflito entre
chat e este arquivo, prevalece o que está aqui.

## Identidade do projeto

Marketplace de anúncios (comprar/vender) com:

| Parte | Stack | Pasta |
|-------|--------|--------|
| Loja pública | Next.js 15 + TypeScript + Tailwind | `frontend/` |
| API | Go + Gin + GORM | `backend/` |
| Banco | **PostgreSQL + PostGIS** (não SQLite) | DB `fazbrike` |
| Admin | SvelteKit (CRUD genérico por metadados) | `admin/` |

Credenciais locais padrão do banco (ver `backend/config.example`):

- Host `127.0.0.1`, porta `5437`, user `webmaster`, password `pgsql.dev`, DB `fazbrike`

Texto visível ao usuário: **português**. Identificadores, paths, comandos e termos
técnicos: **inglês**. Visual: minimalista, monocromático (cinza/escuro).

## Ritual obrigatório antes de codificar

1. Ler este `AGENTS.md` (pelo menos erros + admin + verificação).
2. Ler a memória completa em [`.cursor/skills/memoria-de-erros/SKILL.md`](.cursor/skills/memoria-de-erros/SKILL.md).
3. Se a tarefa for schema/SQL/PostGIS: ler [`.cursor/skills/postgresql/SKILL.md`](.cursor/skills/postgresql/SKILL.md) e [`.cursor/skills/postgres-best-practices/SKILL.md`](.cursor/skills/postgres-best-practices/SKILL.md).
4. Se for UI: respeitar monocromático; não copiar paletas “genéricas de IA” (roxo, cream+terracotta).
5. Se for segurança / auth / upload / secrets: usar [`.cursor/skills/vulnerability-scanner/SKILL.md`](.cursor/skills/vulnerability-scanner/SKILL.md).

Skills do repositório ficam em `.cursor/skills/*/SKILL.md`. Em Cursor, invoque-as
explicitamente quando a tarefa bater com a descrição. Em outros agentes, **abra o
arquivo da skill com a ferramenta de leitura** e siga as instruções.

## Escopo de mudança

- Altere só o necessário para a tarefa; sem refatoração oportunista.
- Não edite markdown (README, planos, etc.) a menos que o usuário peça.
- Não faça commit / push / force-push a menos que o usuário peça.
- Não invente APIs ou campos: confira models em `backend/models/` e rotas em `backend/main.go`.

## Erros que NÃO podem se repetir

Detalhes (causa/sintoma/correção) em [`.cursor/skills/memoria-de-erros/SKILL.md`](.cursor/skills/memoria-de-erros/SKILL.md).

1. **CSS global sobrescrevendo Tailwind** — nunca defina `color` global para `a`/`a:hover`
   em `frontend/src/app/globals.css`. Botão escuro (`bg-gray-900` / `bg-ink`) **sem**
   `text-white` (ou equivalente legível) é bug.
2. **URL de imagem** — sempre `resolveImageUrl()` em `frontend/src/lib/services/api.ts`;
   nunca monte URL de imagem manualmente.
3. **useSearchParams** — sempre dentro de `<Suspense>` (quebra prerender/build).
4. **Erros da API** — propague `err.message` (lê `responseData.error`); nunca mensagem
   fixa genérica no lugar do erro real.
5. **Upload multipart** — `'Content-Type': undefined` ao enviar `FormData`.
6. **Endpoints** — nunca espaços nas template strings de URL.
7. **Preço** — validar antes de enviar (vírgula/NaN quebra o Go).
8. **Model sem admin** — todo model novo **deve** ir no `AutoMigrate` **e**
   `admin.Register` (ver seção Admin).
9. **Banco** — não reintroduzir SQLite/`DB_PATH` como padrão; o runtime é Postgres/PostGIS.
10. **Row no app (Flutter)** — dois textos lado a lado exigem `Flexible`/`Expanded`
    + `maxLines: 1` e ellipsis; sem isso a linha estoura em tela de celular.

## Admin — todo módulo/model novo DEVE aparecer no admin

Admin genérico por metadados (`admin/` + `backend/admin/`). Model registrado = collection
CRUD automática.

**Sempre que criar model/módulo de dados:**

1. `AutoMigrate` em `backend/main.go`.
2. `admin.Register(&models.X{})` em `initAdminRegistry()` no mesmo arquivo.
3. (Recomendado) `admin.SetCollectionLabel("x", "Rótulo pt-BR")`.
4. Verificar: `cd backend && go build ./... && go vet ./...` e `GET /api/admin/meta`.

Model sem registro no admin = **incompleto/bug**.

## Dados e PostGIS

- Catálogo: `countries` → `states` → `cities` (IDs alinhados ao seed NinhoHouse).
- Perfil/usuário: `city_id` / `state_id` + `location` geography quando aplicável.
- Índices em FKs são manuais no Postgres — não assuma que o ORM cria.
- Seed de localização: `backend/seed/locations.go` + `backend/seed/sql/locations.sql`
  (idempotente). Configurações chave/valor: model `Configuration`, seed em
  `backend/seed/configurations.go`, leitura via `config.Get` (DB → env → default).

## Segurança (mínimo ao mexer em auth / upload / admin)

- Nunca commititar secrets reais; use env / `configurations` vazias no seed.
- `JWT_SECRET` obrigatório e forte (≥32 chars) em `GIN_MODE=release`; default fraco
  só em dev e com warning.
- CORS: allowlist via `ALLOWED_ORIGINS` (nunca refletir Origin arbitrário com credentials).
- Uploads: só JPEG/PNG/WebP/GIF, sniff de magic bytes, limite `UPLOAD_MAX_MB`.
- Rotas protegidas: `AuthMiddleware` / `AdminMiddleware`; checar ownership em update/delete.
- Respostas públicas de anúncios: não incluir `email`/`role` do vendedor.
- Não logar senhas, JWT ou valores de configuração secretos.
- Preferir fail-closed em erros de auth.

## Verificação obrigatória antes de declarar pronto

Frontend:

```bash
cd frontend && npx tsc --noEmit
cd frontend && npx next build --no-lint
grep -rn "useSearchParams" src/app
grep -rn "bg-gray-900\|bg-gray-800\|bg-ink" src --include="*.tsx"
```

Backend (sempre que alterar Go):

```bash
cd backend && go build ./... && go vet ./...
```

Confirme mentalmente: Suspense em `useSearchParams`, `text-white` em botões escuros,
`resolveImageUrl`, models novos no admin, sem SQLite.

## Como registrar um erro novo

Quando cometer e corrigir um erro:

1. Entrada em [`.cursor/skills/memoria-de-erros/SKILL.md`](.cursor/skills/memoria-de-erros/SKILL.md)
   (formato causa / sintoma / correção / regra).
2. Uma linha neste `AGENTS.md` na seção “Erros que NÃO podem se repetir” (regra imperativa).

Não use a memória de erros como changelog de produto — só falhas concretas + regra
prática para não repetir.

## Mapa rápido de pastas

```
fazbrike/
├── AGENTS.md                 ← você está aqui (todos os agentes)
├── .cursor/skills/           ← skills detalhadas (Cursor e leitura manual)
├── frontend/                 ← Next.js (loja)
├── admin/                    ← SvelteKit (painel)
├── backend/                  ← Go API + GORM + admin registry
│   ├── models/
│   ├── handlers/
│   ├── seed/
│   └── config/
└── start.sh                  ← sobe frontend + backend + admin
```
