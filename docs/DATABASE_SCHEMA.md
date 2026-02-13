# FARS — Схема базы данных

## Роли и доступ в админку

- **user** — обычный пользователь (по умолчанию).
- **moderator** — может мутить, банить, просматривать медиа пользователей.
- **admin** — полный доступ + аналитика, настройки, whitelist.

Доступ в админ-панель: только пользователи, у которых **роль moderator или admin** И при этом они в **AdminWhitelist** (whitelist). То есть кнопка «Админ-панель» показывается только если пользователь в whitelist и роль допускает.

---

## Сущности

### User
- id, email (unique), passwordHash
- name, username (unique @tag), avatarUrl
- dateOfBirth, bio, nameColor
- role: user | moderator | admin
- emailVerifiedAt (подтверждение email)
- isBanned, bannedUntil, muteUntil
- createdAt, updatedAt

### AdminWhitelist
- id, userId (FK → User, unique)
- addedById (FK → User), addedAt
- Один пользователь может быть в whitelist только один раз. Добавляют только admin.

### RefreshToken
- id, userId (FK), tokenHash, expiresAt, revokedAt
- Для ротации refresh-токенов и отзыва сессий.

### Friendship
- id, userId, friendId, status: pending | accepted | blocked
- createdAt
- Уникальная пара (userId, friendId) без дублей обратной пары (храним где userId < friendId или одна запись на пару с status).

### Chat
- id, type: private | group
- name (для группы), avatarUrl (для группы)
- createdById (FK → User)
- createdAt, updatedAt

### ChatMember
- id, chatId (FK), userId (FK), role: member | admin
- joinedAt
- Unique (chatId, userId)

### Message
- id, chatId (FK), senderId (FK → User)
- content (text), type: text | image | video | document | voice | sticker
- replyToId (FK → Message, nullable)
- status: sending | sent | read | error
- metadata (JSON: размер файла, длительность и т.д.)
- createdAt, updatedAt, deletedAt (soft delete)

### MessageReaction
- id, messageId (FK), userId (FK), emoji (string)
- Unique (messageId, userId) — один пользователь одна реакция на сообщение

### MessageRead
- id, messageId (FK), userId (FK), readAt
- Для статуса «прочитано» (кто когда прочитал)

### Attachment
- id, messageId (FK), url (S3 path), mimeType, filename, size
- createdAt

### StickerPack
- id, name, createdById (FK), isPublic
- createdAt

### Sticker
- id, stickerPackId (FK), url (S3), emoji (подсказка)
- order

### UserStickerPack
- userId (FK), stickerPackId (FK)
- addedAt
- Primary key (userId, stickerPackId)

### ModeratorLog
- id, moderatorId (FK), action: mute | ban | unban | view_media | ...
- targetUserId (FK), details (JSON), createdAt

### (Опционально для аналитики)
- Таблицы или материализованные представления для счётчиков: users_count, messages_count, files_count, online_count (или считаем из Redis).

---

## Индексы (кратко)

- User: email, username, role
- RefreshToken: userId, tokenHash, expiresAt
- Friendship: userId, friendId, status
- ChatMember: chatId, userId
- Message: chatId, createdAt; senderId; status
- MessageReaction: messageId, userId
- ModeratorLog: moderatorId, targetUserId, createdAt
