# FARS — Деплой и масштабирование

## Локальная разработка

1. `cp .env.example apps/api/.env` и заполнить `DATABASE_URL`, при необходимости `FRONTEND_URL`, `JWT_*`.
2. Запустить PostgreSQL и Redis: `docker-compose up -d postgres redis`.
3. Миграции: `cd apps/api && npx prisma migrate dev`.
4. Запуск API: `npm run dev:api` (из корня или `cd apps/api && npm run dev`).
5. Запуск Web: `npm run dev:web` (из корня или `cd apps/web && npm run dev`).

## Production (Docker)

- **API**: образ из `apps/api/Dockerfile`. Переменные окружения: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, опционально `REDIS_URL`, `SMTP_*`, `S3_*`.
- **Web**: образ из `apps/web/Dockerfile`. Сборка с `VITE_API_URL` и `VITE_WS_URL` на ваш API (например `https://api.example.com/api` и `https://api.example.com`).
- Перед первым запуском API выполнить миграции (отдельный job или init-контейнер): `npx prisma migrate deploy`.

## Масштабирование

- **API**: несколько реплик за балансировщиком (Nginx/Traefik). Stateless.
- **WebSocket**: Socket.io с Redis Adapter — подключить в `main.ts`: `const io = app.get(IoAdapter).getIo(); io.adapter(require('@socket.io/redis-adapter')(redisClient, redisClient));` (и установить `@socket.io/redis-adapter`).
- **PostgreSQL**: при росте — read replicas, PgBouncer.
- **Файлы**: S3-совместимое хранилище (MinIO, AWS S3), CDN для раздачи.

## Health check

- `GET /api/health` — возвращает `{ status: 'ok', db: 'connected' }` при успехе.
