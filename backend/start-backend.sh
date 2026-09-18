#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
PORT="${PORT:-8080}"

is_healthy() {
  curl -sf --max-time 2 "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1
}

if is_healthy; then
  echo "Backend already healthy on :$PORT"
  curl -s "http://127.0.0.1:$PORT/api/health"; echo
  exit 0
fi

# Porta ocupada mas sem health → processo zumbi/errado; reinicia
if lsof -ti ":$PORT" >/dev/null 2>&1; then
  echo "Port :$PORT in use but unhealthy — restarting"
  lsof -ti ":$PORT" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

go build -o fazbrike-backend .
PORT="$PORT" nohup ./fazbrike-backend >> /tmp/fazbrike-backend.log 2>&1 &
disown
echo "Backend started on :$PORT (pid $!)"

for i in 1 2 3 4 5 6 7 8 9 10; do
  if is_healthy; then
    curl -s "http://127.0.0.1:$PORT/api/health"; echo
    exit 0
  fi
  sleep 1
done

echo "Backend failed to become healthy on :$PORT — see /tmp/fazbrike-backend.log"
tail -30 /tmp/fazbrike-backend.log || true
exit 1
