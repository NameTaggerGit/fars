@echo off
REM Build production версию локально для тестирования перед деплоем

echo 🔨 Building production version...
echo.

call npm install
call npm run build:api
call npm run build:web

echo.
echo ✅ Build completed!
echo.
echo To test locally:
echo 1. Start API: cd apps\api ^&^& npm run start:prod
echo 2. In another terminal, preview web: cd apps\web ^&^& npm run preview
echo 3. Visit http://localhost:4173
