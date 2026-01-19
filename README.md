# Todoist Backend

Backend API for Todoist clone with SQLite and JWT authentication.

## Tech Stack
- Node.js + Express
- SQLite (sql.js)
- JWT Authentication
- bcrypt for password hashing

## API Endpoints

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Tasks (protected)
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Environment Variables
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS
