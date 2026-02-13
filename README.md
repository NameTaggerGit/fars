# FARS Messenger

Браузерный мессенджер с современной архитектурой (React + NestJS + PostgreSQL + Redis + WebSocket).

## Структура

- `apps/web` — frontend (React, Vite, TypeScript, Tailwind, Zustand)
- `apps/api` — backend (NestJS, Prisma, PostgreSQL, Redis, Socket.io)
- `docs/` — архитектура, стек, структура проекта

## Быстрый старт

1. Скопировать `.env.example` в `apps/api/.env` и при необходимости в `apps/web/.env`. В `apps/api/.env` проверьте **DATABASE_URL** (см. ниже).
2. **Запустить PostgreSQL** — без этого API выдаст `Can't reach database server at localhost:5432`. Из корня проекта (нужен [Docker Desktop](https://www.docker.com/products/docker-desktop/)):

```bash
docker compose up -d postgres
```

(В новых версиях Docker используется `docker compose` через пробел, не `docker-compose`. Опционально: `redis` — `docker compose up -d postgres redis`.)

Убедитесь, что в `apps/api/.env` указано:
`DATABASE_URL=postgresql://fars:fars@localhost:5432/fars` (логин/пароль как в `docker-compose.yml`).

3. Установить зависимости и применить миграции:

```bash
npm install
cd apps/api && npm install && npx prisma migrate dev
```

4. Запуск в разработке (нужны **оба** процесса):

```bash
# Терминал 1 — сначала запустите API
cd apps/api && npm run dev

# Терминал 2 — затем запустите фронтенд
cd apps/web && npm run dev
```

Или из корня: `npm run dev:api` и в другом терминале `npm run dev:web`.

- **API** должен быть доступен на http://localhost:3001 (иначе при регистрации/логине будет ошибка `ECONNREFUSED` в прокси Vite).
- **Web**: http://localhost:5173  

### Ошибка «Can't reach database server at localhost:5432»

Значит, PostgreSQL не запущен или недоступен. Сделайте:
1. Запустите контейнер: из корня проекта выполните `docker compose up -d postgres` (или `docker-compose`, если установлена старая версия).
2. Проверьте, что порт 5432 свободен и контейнер работает: `docker compose ps`.
3. В `apps/api/.env` должна быть строка: `DATABASE_URL=postgresql://fars:fars@localhost:5432/fars`.

Если PostgreSQL установлен отдельно (не в Docker), укажите в DATABASE_URL свои хост, порт, пользователя и пароль.

## Документация

- [Архитектура](docs/ARCHITECTURE.md)
- [Технологический стек](docs/TECH_STACK.md)
- [Структура проекта](docs/PROJECT_STRUCTURE.md)
