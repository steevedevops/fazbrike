# Fazbrike — Docker produção
# Antes do primeiro up: docker network create fazbrike && cp .env.example .env (preencher)

build:
	docker compose -f docker-compose.yml -p fazbrike build --no-cache

logs:
	docker logs -f fazbrike-backend-1 --tail=100

restart:
	docker compose -f docker-compose.yml -p fazbrike restart

up:
	docker compose -f docker-compose.yml -p fazbrike down && \
	docker compose -f docker-compose.yml -p fazbrike up -d && \
	docker logs -f fazbrike-backend-1 --tail=100

upnew:
	docker compose -f docker-compose.yml -p fazbrike up -d

sitelogs:
	docker logs -f fazbrike-site-1 --tail=100

adminlogs:
	docker logs -f fazbrike-admin-1 --tail=100

dblogs:
	docker compose -f docker-compose.yml -p fazbrike logs -f database

down:
	docker compose -f docker-compose.yml -p fazbrike down

prune:
	docker system prune

opennginx:
	sudo vi /etc/nginx/sites-available/api.fazbrike.com.br

opensite:
	sudo vi /etc/nginx/sites-available/fazbrike.com.br

openadmin:
	sudo vi /etc/nginx/sites-available/admin.fazbrike.com.br

restartnginx:
	sudo systemctl restart nginx
	sudo systemctl status nginx

reloadnginx:
	sudo systemctl reload nginx

tnginx:
	sudo nginx -t

logsnginx:
	sudo tail -f /var/log/nginx/error.log
