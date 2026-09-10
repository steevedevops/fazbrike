#!/bin/bash

# Script para iniciar o projeto Fazbrike (backend + frontend + admin)

echo "🚀 Iniciando o projeto Fazbrike..."

# Verificar se o Go está instalado
if ! command -v go &> /dev/null; then
    echo "❌ Go não está instalado. Por favor, instale o Go primeiro."
    exit 1
fi

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Iniciar o backend em background
echo "🔧 Iniciando o backend..."
cd backend
go mod tidy
go run main.go &
BACKEND_PID=$!

# Aguardar um pouco para o backend inicializar
sleep 3

# Iniciar o frontend
echo "🎨 Iniciando o frontend..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

# Iniciar o admin (painel estilo PocketBase)
echo "🛠️  Iniciando o admin (painel estilo PocketBase)..."
cd ../admin
npm install
npm run dev &
ADMIN_PID=$!

echo "✅ Projeto iniciado com sucesso!"
echo "📱 Frontend: http://localhost:3006"
echo "🛠️  Admin:   http://localhost:5174"
echo "🔧 Backend:  http://localhost:8090"
echo ""
echo "💡 Para acessar o admin, o usuário deve ter role=admin."
echo "   Promova um admin no boot do backend com:"
echo "   ADMIN_EMAILS=voce@exemplo.com"
echo ""
echo "Para parar o projeto, pressione Ctrl+C"

# Função para limpar processos ao sair
cleanup() {
    echo "🛑 Parando o projeto..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    kill $ADMIN_PID 2>/dev/null
    exit 0
}

# Capturar sinal de interrupção
trap cleanup SIGINT

# Manter o script rodando
wait
