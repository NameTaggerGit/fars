# Развертывание FARS на Render.com

## Что такое Render?

Render - это облачная платформа для развертывания веб-приложений. Подходит идеально для FARS потому что:

- ✅ Поддерживает Node.js (NestJS)
- ✅ Встроенная PostgreSQL база данных
- ✅ WebSocket поддержка (для Socket.io)
- ✅ Автоматический деплой из GitHub
- ✅ Бесплатный tier (пока потребление маленькое)

## Шаг 1: Подготовка GitHub

1. Загрузи проект на GitHub (если еще не загружен)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/FARS.git
   git push -u origin main
   ```

2. Убедись что `.env` файлы в `.gitignore`:
   ```
   .env
   .env.*.local
   node_modules/
   dist/
   ```

## Шаг 2: Регистрация на Render

1. Перейди на https://render.com
2. Нажми "Sign up with GitHub"
3. Авторизуйся через GitHub
4. Дай Render доступ к твоему репозиторию FARS

## Шаг 3: Развертывание проекта

### Способ 1: Через GitHub Connect (Автоматический) ⭐ РЕКОМЕНДУЕТСЯ

1. На Render нажми "New +" → "Web Service"
2. Выбери репозиторий FARS
3. Заполни данные:
   - **Name**: `fars-api`
   - **Environment**: `Node`
   - **Build Command**: 
     ```
     npm install && npm run build:api && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command**: 
     ```
     npm run start:api
     ```
   - **Plan**: Free (или Starter если нужна надежность)

4. Нажми "Create Web Service"

### Шаг 4: Настройка переменных окружения

После deployment, добавь переменные окружения:

1. В панели Web Service нажми "Environment"
2. Добавь переменные:

   ```
   NODE_ENV = production
   PORT = 3001
   API_PREFIX = api
   
   JWT_ACCESS_SECRET = [сгенерируй случайную строку из 32+ символов]
   JWT_ACCESS_TTL = 15m
   JWT_REFRESH_SECRET = [сгенерируй случайную строку из 32+ символов]
   JWT_REFRESH_TTL = 7d
   
   FRONTEND_URL = https://YOUR_WEB_SERVICE_URL.onrender.com
   ```

3. **DATABASE_URL** - Render автоматически создаст!

### Шаг 5: Развертывание PostgreSQL базы

1. На Render нажми "New +" → "PostgreSQL"
2. Заполни данные:
   - **Name**: `fars-db`
   - **Database**: `fars`
   - **User**: `fars`
   - **Plan**: Free или Starter
3. Нажми "Create Database"

4. После создания, скопируй **Internal Database URL**
5. Добавь её в переменные окружения Web Service как `DATABASE_URL`

### Шаг 6: Развертывание Frontend

1. На Render нажми "New +" → "Static Site"
2. Выбери тот же репозиторий FARS
3. Заполни данные:
   - **Name**: `fars-web`
   - **Build Command**: 
     ```
     npm install && npm run build:web
     ```
   - **Publish directory**: `apps/web/dist`

4. Добавь переменные окружения:
   ```
   VITE_API_URL = https://YOUR_API_SERVICE_URL.onrender.com/api
   VITE_WS_URL = https://YOUR_API_SERVICE_URL.onrender.com
   ```

5. Нажми "Create Static Site"

## Шаг 7: Настройка CORS

В `apps/api/src/main.ts` убедись что CORS настроен правильно:

```typescript
app.enableCors({
  origin: [
    'https://fars-web.onrender.com',
    'http://localhost:5173', // для локальной разработки
  ],
  credentials: true,
});

app.enableWebSocketListener();
```

## Шаг 8: Проверка развертывания

1. Дай Render время на деплой (~5-10 минут)
2. Посети `https://YOUR_API_SERVICE_URL.onrender.com/health` (должен быть зеленый чекbill)
3. Посети `https://fars-web.onrender.com` (должна загрузиться фронтенд)

## Потенциальные проблемы и решения

### ❌ "Build failed"
- Проверь ошибку в "Logs" на Render
- Убедись что все зависимости установлены: `npm install`
- Проверь что `package.json` скрипты корректны

### ❌ "Database connection failed"
- Убедись что DATABASE_URL добавлена в переменные окружения
- Проверь что PostgreSQL база создана на Render
- Дай время на инициализацию базы (1-2 минуты)

### ❌ "WebSocket connection failed"
- Убедись что frontend отправляет правильный WS_URL
- Проверь что `VITE_WS_URL` указывает на правильный API сервис
- На production всегда используй `wss://` вместо `ws://`

### ❌ "Too many database connections"
- Снизь `connection_limit` в DATABASE_URL:
  ```
  postgresql://...?connection_limit=2
  ```

## Способ 2: Через render.yaml (Advanced)

Если хочешь развернуть всё через один файл, используй `render.yaml` который уже заранее создан в проекте.

Просто запушь в GitHub и Render автоматически прочитает конфиг.

## Мониторинг и Обновления

1. **Логи**: В Render можно смотреть логи приложения в реальном времени
2. **Автоматический деплой**: При каждом push в main - автоматическая переразвертывание
3. **Откаты**: Можно откатиться на предыдущую версию через Render панель

## Költség (Стоимость)

- **Web Service (Free)**: 0.50$ / час = ~$3.60 / месяц (не рекомендуется для production)
- **PostgreSQL (Free)**: Включена в free tier
- **Starter Plan (Рекомендуется)**: $7/месяц за Web Service + $15/месяц за PostgreSQL

## Что дальше?

После успешного деплоя:

1. ✅ Регистрация пользователей работает
2. ✅ Чат и сообщения синхронизируются
3. ✅ Звонки работают через WebSocket
4. ✅ Файлы загружаются (если настроено)

Если нужна help - обратись в документацию Render: https://docs.render.com
