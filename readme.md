# TaskFlow — Backend API Service

A scalable, secure RESTful API powering **TaskFlow**, built with **Node.js**, **Express**, and **MongoDB (Mongoose)**. The backend handles authentication with silent token refresh rotation, role-based access control (RBAC), multi-tenant project workspaces, optimistic task reordering, discussion comment sub-documents, and an automated non-destructive activity audit trail.

---

## 🚀 Architectural & Engineering Highlights

* **Resilient Dual-Token Authentication:** In-memory short-lived JWT access tokens paired with `HttpOnly`, `SameSite=None`, `Secure` refresh tokens stored in HTTP cookies to prevent XSS-based credential extraction.
* **Granular Role-Based Access Control (RBAC):** Middleware-enforced permissions (`Owner`, `Admin`, `Member`) isolating administrative capabilities such as project deletion and member invites.
* **Optimistic Reordering Support:** Normalized task schemas with persistent `orderIndex` integers and board-level references for drag-and-drop state syncing.
* **Non-Destructive Activity Logging:** Middleware and model hooks that append immutable log entries on task mutations (status movements, priority escalations, and member allocations).
* **Defensive Data Handling:** Sanitized relational lookups and safe Mongoose population logic preventing runtime crashes on orphaned or deleted member references.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js (v18+)
* **Framework:** Express.js
* **Database:** MongoDB
* **ODM:** Mongoose
* **Security & Auth:** JSON Web Tokens (`jsonwebtoken`), Bcrypt.js, Cookie-Parser, CORS, Helmet
* **Validation:** Custom middleware & Mongoose Schema constraints
* **Development:** Nodemon, Dotenv

---

## 📂 Project Structure

```text
backend/
├── src/
│   ├── config/             # Database connection (db.js / db.ts)
│   ├── controllers/
│   │   ├── authController.js     # Register, login, refresh, logout
│   │   ├── projectController.js  # Project CRUD, member invites, RBAC
│   │   └── taskController.js     # Task CRUD, status/order sync, comments, history
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification & req.user injection
│   │   ├── rbacMiddleware.js     # Role verification (Owner / Admin / Member)
│   │   └── errorMiddleware.js    # Centralized Express error handler
│   ├── models/
│   │   ├── User.js               # User credentials & profile data
│   │   ├── Project.js            # Workspace schema, boards array, member roles
│   │   ├── Board.js              # Kanban column references & metadata
│   │   └── Task.js               # Task model, comments, activityLogs subdocs
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth endpoints
│   │   ├── projectRoutes.js      # /api/projects endpoints
│   │   └── taskRoutes.js         # /api/tasks endpoints
│   ├── utils/                    # Token generation, helpers, and constants
│   ├── app.js                    # Express app configuration & middleware setup
│   └── server.js                 # HTTP listener & database bootstrap
├── .env.example
├── package.json
└── README.md

```

---

## 📡 API Reference Overview

### Authentication (`/api/auth`)

* `POST /api/auth/register` — Register a new user account with hashed password.
* `POST /api/auth/login` — Authenticate credentials; returns access token & sets HttpOnly refresh cookie.
* `POST /api/auth/refresh` — Issue a new short-lived access token via valid refresh cookie.
* `POST /api/auth/logout` — Invalidate session and clear the refresh token cookie.
* `GET /api/auth/me` — Retrieve the authenticated user's profile details.

### Projects & Workspaces (`/api/projects`)

* `GET /api/projects` — Fetch all workspaces where the user is an Owner or Member.
* `POST /api/projects` — Create a new workspace and automatically seed default columns (`To Do`, `In Progress`, `Done`).
* `GET /api/projects/:projectId` — Fetch full workspace details, populated members, and boards.
* `PUT /api/projects/:projectId` — Update project title or description (Owner/Admin only).
* `DELETE /api/projects/:projectId` — Permanently delete workspace and cascade-remove associated tasks (Owner only).
* `POST /api/projects/:projectId/invite` — Add an existing user as a project member with a specified role (`member` or `admin`).

### Tasks & Columns (`/api/tasks`)

* `GET /api/tasks?projectId=ID` — Query tasks with multi-parameter filtering (`status`, `priority`, `assignedTo`, `search`).
* `POST /api/tasks` — Create a new task within a specific column and project.
* `PATCH /api/tasks/:taskId/status` — Fast positional update for drag-and-drop (`boardId`, `status`, `orderIndex`).
* `PUT /api/tasks/:taskId` — Update task details (title, description, priority, due date, assignee).
* `DELETE /api/tasks/:taskId` — Delete a task and remove all associated activity logs.

### Comments & Activity (`/api/tasks/:taskId/comments`)

* `GET /api/tasks/:taskId/comments` — Fetch all discussion comments for a task.
* `POST /api/tasks/:taskId/comments` — Append a new comment and trigger an activity audit entry.
* `PUT /api/tasks/:taskId/comments/:commentId` — Edit comment content (Author only).
* `DELETE /api/tasks/:taskId/comments/:commentId` — Delete a comment (Author or Project Owner only).

---

## ⚙️ Environment Variables

Create a `.env` file in the root backend directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskflow?retryWrites=true&w=majority

# JWT Secrets
JWT_ACCESS_SECRET=your_super_secret_access_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS Allowed Origin
CLIENT_URL=http://localhost:5173

```

---

## 🏁 Getting Started Locally

### Prerequisites

* **Node.js**: v18.0.0 or higher
* **MongoDB**: Local instance running on `mongodb://localhost:27017` or a MongoDB Atlas connection string

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/BatraAayush/task-flow-backend.git
cd taskflow-backend

```


2. **Install dependencies:**
```bash
npm install

```

3. **Start development server:**
```bash
npm run dev

```


4. The API will start listening at `http://localhost:5000`.

---

## 🔒 Security Practices Implemented

* **CORS Credentials Configuration:** Explicitly configured `cors({ origin: CLIENT_URL, credentials: true })` to restrict cross-origin access while permitting secure cookie transmission.
* **Bcrypt Password Salting:** Passwords undergo salting rounds before storage; raw strings are never stored or returned in query results (`select("-password")`).
* **Stateless Token Verification:** Access tokens are verified purely on server CPU cycles via cryptographic signatures, offloading constant database roundtrips on high-frequency API routes.