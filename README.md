# Social Media Backend API

Backend API для социальной сети (Instagram/Twitch/X клон)

## Features

- ✅ User Registration and Authentication (JWT)
- ✅ Profile Management
- ✅ Posts (CRUD)
- ✅ Comments
- ✅ Likes
- ✅ Following / Followers
- ✅ Search (Users, Posts, Hashtags)
- ✅ Image Uploads (Cloudinary)

## Tech Stack

- Node.js + Express
- PostgreSQL
- JWT Authentication
- Cloudinary (images)
- Render (deployment)

## API Endpoints

### Auth

- POST `/api/auth/register` - Регистрация
- POST `/api/auth/login` - Вход
- POST `/api/auth/logout` - Выход

### Users

- GET `/api/users/me` - Мой профиль
- PUT `/api/users/me` - Обновить профиль
- PUT `/api/users/me/avatar` - Загрузить аватар
- GET `/api/users/:userId` - Профиль пользователя
- GET `/api/users/:userId/stats` - Статистика
- GET `/api/users/:userId/posts` - Посты пользователя
- GET `/api/users/:userId/saved` - Сохраненные посты

### Posts

- POST `/api/posts` - Создать пост
- GET `/api/posts/feed` - Лента
- GET `/api/posts/:postId` - Получить пост
- PUT `/api/posts/:postId` - Обновить пост
- DELETE `/api/posts/:postId` - Удалить пост
- POST `/api/posts/:postId/like` - Лайк
- DELETE `/api/posts/:postId/like` - Убрать лайк
- POST `/api/posts/:postId/save` - Сохранить
- DELETE `/api/posts/:postId/save` - Убрать из сохраненных

### Comments

- POST `/api/posts/:postId/comments` - Добавить комментарий
- GET `/api/posts/:postId/comments` - Комментарии к посту
- GET `/api/comments/:commentId` - Получить комментарий
- DELETE `/api/comments/:commentId` - Удалить комментарий
- POST `/api/comments/:commentId/like` - Лайк комментария
- DELETE `/api/comments/:commentId/like` - Убрать лайк

### Follows

- POST `/api/users/:userId/follow` - Подписаться
- DELETE `/api/users/:userId/follow` - Отписаться
- GET `/api/users/:userId/followers` - Подписчики
- GET `/api/users/:userId/following` - Подписки
- GET `/api/users/:userId/follow-status` - Статус подписки

### Search

- GET `/api/search/users?q=username` - Поиск пользователей
- GET `/api/search/posts?q=keyword` - Поиск постов
- GET `/api/search/hashtags?q=tag` - Поиск хэштегов
- GET `/api/hashtags/:tag/posts` - Посты по хэштегу

## Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env` file
4. Run database init: `npm run init-db`
5. Start server: `npm run dev`

## Author

Tilekmat Azhygulov
