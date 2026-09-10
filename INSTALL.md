# Instalação do Fazbrike

## Pré-requisitos

- **Go** (versão 1.19 ou superior)
- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**

## Instalação Rápida

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd fazbrike
```

2. **Execute o script de inicialização:**
```bash
./start.sh
```

## Instalação Manual

### Backend (Go)

1. **Navegue para o diretório do backend:**
```bash
cd backend
```

2. **Instale as dependências:**
```bash
go mod tidy
```

3. **Configure as variáveis de ambiente:**
```bash
cp config.example .env
# Edite o arquivo .env se necessário
```

4. **Execute o servidor:**
```bash
go run main.go
```

O backend estará rodando em `http://localhost:8080`

### Frontend (Next.js)

1. **Navegue para o diretório do frontend:**
```bash
cd frontend
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Execute o servidor de desenvolvimento:**
```bash
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

### Admin (SvelteKit)

1. **Navegue para o diretório do admin:**
```bash
cd admin
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure a URL da API** (padrão: `http://localhost:8080/api`):
```bash
cp .env .env.local
```

4. **Execute o servidor de desenvolvimento:**
```bash
npm run dev
```

O admin estará rodando em `http://localhost:5174`

> Para acessá-lo, o backend deve estar de pé e o usuário deve ter `role=admin`
> (promova no boot com `ADMIN_EMAILS=voce@exemplo.com go run main.go` ou edite a
> collection Usuários no próprio admin).

## Verificação da Instalação

1. **Backend:** Acesse `http://localhost:8080/api/health`
   - Deve retornar: `{"status":"ok"}`

2. **Frontend:** Acesse `http://localhost:3000`
   - Deve exibir a tela de login do Fazbrike

3. **Admin:** Acesse `http://localhost:5174` e entre com uma conta admin
   - Deve exibir o painel estilo PocketBase com as collections Usuários/Itens/Mensagens

## Estrutura de Arquivos

```
fazbrike/
├── backend/                 # API Go
│   ├── admin/              # Registro + handlers genéricos do admin
│   ├── config/             # Configurações
│   ├── handlers/           # Handlers HTTP
│   ├── middleware/         # Middlewares
│   ├── models/             # Modelos de dados
│   ├── main.go             # Arquivo principal
│   └── config.example      # Exemplo de configuração
├── frontend/               # Aplicação Next.js
│   ├── src/
│   │   ├── app/            # App Router
│   │   ├── components/     # Componentes React
│   │   └── contexts/       # Contextos
│   └── package.json
├── admin/                  # Painel admin SvelteKit (estilo PocketBase)
│   ├── src/
│   │   ├── lib/            # API client, auth, componentes
│   │   └── routes/         # /login, /collections/[collection], /settings
│   └── package.json
├── start.sh                # Script de inicialização
└── README.md
```

## Solução de Problemas

### Erro de Porta em Uso
- Backend: Altere a porta no arquivo `.env` (variável `PORT`)
- Frontend: Use `npm run dev -- -p 3001` para usar a porta 3001

### Erro de Dependências
- Backend: Execute `go mod tidy`
- Frontend: Execute `npm install`

### Erro de Banco de Dados
- Verifique se o arquivo `fazbrike.db` foi criado
- Se necessário, delete o arquivo para recriar o banco

## Desenvolvimento

Para desenvolvimento, recomenda-se executar o backend e frontend em terminais separados:

**Terminal 1 (Backend):**
```bash
cd backend
go run main.go
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

## Produção

### Backend
```bash
cd backend
go build -o fazbrike-backend .
./fazbrike-backend
```

### Frontend
```bash
cd frontend
npm run build
npm start
```
