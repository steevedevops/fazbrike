# Fazbrike API (Go + Gin + GORM)
# Build context: raiz do repo (ver docker/docker-compose.yml)

FROM golang:1.25-bookworm AS build
WORKDIR /src

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/fazbrike-backend .

FROM debian:bookworm-slim
LABEL description='Fazbrike API' version='1.0.0' org.opencontainers.image.authors="steevedevops@gmail.com"

ENV DEBIAN_FRONTEND=noninteractive

# Timezone Brasil
ENV TZ=America/Sao_Paulo

# postgresql-client-18: pg_dump/pg_restore do backup no admin (mesma major do postgis:18)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates wget gnupg tzdata curl \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client-18 \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/fazbrike/backend

COPY --from=build /out/fazbrike-backend ./fazbrike-backend
# Seed de localização lido do disco (seed/sql + seed/data relativo ao WORKDIR)
COPY backend/seed/sql ./seed/sql
COPY backend/seed/data ./seed/data

RUN mkdir -p uploads

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -sf http://127.0.0.1:8080/api/health >/dev/null || exit 1

CMD ["./fazbrike-backend"]
