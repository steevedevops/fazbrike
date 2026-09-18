# Fazbrike

Uma plataforma onde as pessoas podem criar contas para publicar e pesquisar itens.

## 🚀 Tecnologias

### Frontend
- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Context API** - Gerenciamento de estado

### Backend
- **Go** - Linguagem de programação
- **Gin** - Framework web
- **GORM** - ORM para banco de dados
- **SQLite** - Banco de dados
- **JWT** - Autenticação

## 📁 Estrutura do Projeto

```
fazbrike/
├── frontend/          # Aplicação Next.js (loja pública)
│   ├── src/
│   │   ├── app/       # App Router do Next.js
│   │   ├── components/ # Componentes React
│   │   └── contexts/   # Contextos (Auth)
│   └── package.json
├── admin/             # Painel admin (SvelteKit SPA, estilo PocketBase)
│   ├── src/
│   │   ├── lib/        # API client, auth, componentes do admin
│   │   └── routes/     # /login, /collections/[collection], /settings
│   └── package.json
├── backend/           # API Go
│   ├── admin/         # Registro + handlers genéricos do admin (reflection)
│   ├── handlers/      # Handlers HTTP
│   ├── middleware/    # Middlewares (Auth, Admin)
│   ├── models/        # Modelos de dados (User, Item, Message)
│   └── main.go        # Arquivo principal (+ initAdminRegistry)
└── README.md
```

## 🛠️ Instalação e Execução

### Backend (Go)

1. Navegue para o diretório do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
go mod tidy
```

3. Execute o servidor:
```bash
go run main.go
```

O servidor estará rodando em `http://localhost:8080`

### Frontend (Next.js)

1. Navegue para o diretório do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

### Admin (SvelteKit — painel estilo PocketBase)

O painel admin gerencia **todos os models do backend automaticamente** (estilo Django,
dirigido por metadados via reflection).

1. Navegue para o diretório do admin:
```bash
cd admin
```

2. Instale as dependências:
```bash
npm install
```

3. Configure a URL da API (padrão já aponta para o backend local):
```bash
cp .env .env.local   # ajuste PUBLIC_API_URL se necessário
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```
Painel acessível em `http://localhost:5174`

5. Login de admin: para promover um usuário a admin, suba o backend com a env
`ADMIN_EMAILS` (no boot os usuários listados viram `admin`):
```bash
cd backend
ADMIN_EMAILS=voce@exemplo.com go run main.go
```
Depois entre no admin com esse usuário. (Também é possível promover pela própria
UI: coleção **Usuários → editar → role = admin**.)

### Como adicionar um novo módulo no admin

Ao criar um novo model em `backend/models/`:
1. Adicione ao `AutoMigrate` no `main.go`;
2. Registre em `initAdminRegistry()` com `admin.Register(&models.X{})` (e opcionalmente
   `admin.SetCollectionLabel("x", "X")`);
3. Pronto — o CRUD da coleção aparece no admin automaticamente.

> Ver a skill do projeto **admin-module** (`/admin-module`) e o `AGENTS.md` para a regra completa.

## 🔐 Funcionalidades Implementadas

### Autenticação
- ✅ Registro de usuários
- ✅ Login de usuários
- ✅ Autenticação JWT
- ✅ Proteção de rotas
- ✅ Persistência de sessão
- ✅ Papel `admin` (via JWT claim + env `ADMIN_EMAILS`)

### Admin (painel estilo PocketBase)
- ✅ Sidebar escura com navegação das collections
- ✅ Listagem com busca, ordenação e paginação
- ✅ Criar, editar e excluir registros (formulário automático via reflection)
- ✅ Dashboard com contagem por collection
- ✅ Proteção: apenas usuários com `role=admin`
- ✅ Skill `admin-module` + regra no `AGENTS.md` para novos módulos

### Interface
- ✅ Tela de login
- ✅ Tela de registro
- ✅ Dashboard inicial
- ✅ Design responsivo
- ✅ Tema roxo personalizado

## 🎨 Design

O projeto utiliza a cor roxa como cor primária, com uma paleta de cores que vai do roxo claro ao escuro:

- **Primary 50**: #f3e8ff
- **Primary 500**: #9333ea (cor principal)
- **Primary 600**: #7c3aed
- **Primary 700**: #6d28d9

## 📝 Próximos Passos

- [x] CRUD de itens (criar, listar, detalhe, editar, excluir)
- [x] Sistema de busca e filtros (preço, categoria, localização, condição)
- [x] Upload de imagens
- [x] Chat entre usuários (inbox + badge de não lidas)
- [ ] Sistema de avaliações / reputação do vendedor
- [ ] Notificações em tempo real (WebSocket/SSE)
- [ ] Favoritos / salvos
- [ ] Marcar anúncio como vendido
- [ ] Múltiplas fotos por anúncio

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
