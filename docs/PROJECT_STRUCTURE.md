# FARS — Структура проекта

Монорепо: frontend и backend в одной папке для удобства разработки. При необходимости можно разнести по разным репозиториям.

```
FARS/
├── apps/
│   ├── web/                    # Frontend (React + Vite)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── api/            # HTTP-клиент, эндпоинты
│   │   │   ├── components/     # UI-компоненты
│   │   │   ├── features/       # Фичи (auth, chats, profile, admin)
│   │   │   ├── hooks/
│   │   │   ├── layouts/
│   │   │   ├── pages/
│   │   │   ├── store/          # Zustand
│   │   │   ├── styles/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── api/                    # Backend (NestJS)
│       ├── src/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── chats/
│       │   ├── messages/
│       │   ├── files/
│       │   ├── moderation/
│       │   ├── admin/
│       │   ├── common/         # guards, decorators, filters
│       │   ├── prisma/
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── package.json
│       ├── tsconfig.json
│       └── nest-cli.json
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   └── PROJECT_STRUCTURE.md
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## Frontend (apps/web)

- **api/** — базовый HTTP-клиент (axios/fetch), типы ответов.
- **components/** — переиспользуемые UI (Button, Input, Modal, Avatar).
- **features/** — логика по доменам: auth (логин, регистрация), chats (список, окно чата), profile, settings, admin.
- **store/** — Zustand: user, theme, sidebar state.
- **pages/** — страницы-обёртки под роуты (LoginPage, ChatPage, SettingsPage, AdminPage).

## Backend (apps/api)

- **auth/** — регистрация, логин, refresh, подтверждение email, сброс пароля.
- **users/** — CRUD профиля, смена аватара, тега, настроек.
- **chats/** — создание чатов, участники, список чатов пользователя.
- **messages/** — отправка, получение, реакции, пересылка, удаление.
- **files/** — загрузка, превью, привязка к сообщениям.
- **moderation/** — мут, бан, разбан, просмотр медиа пользователя.
- **admin/** — аналитика, логи модераторов, whitelist.
- **common/** — JwtAuthGuard, RolesGuard, WhitelistGuard, декораторы (@Roles, @CurrentUser).

Дальше: **схема БД** (Prisma).
