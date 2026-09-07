export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Project Management & Collaboration Tool API',
    version: '1.0.0',
    description:
      'REST API documentation for Kanban board project management, featuring RBAC, JWT rotation, task workflows, activity logging, and comments.',
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your short-lived access token.',
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'HTTP-only cookie containing the refresh token.',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Aayush Batra' },
          email: { type: 'string', example: 'aayush@example.com' },
          avatarUrl: { type: 'string', nullable: true },
        },
      },
      Board: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string', example: 'To Do' },
          projectId: { type: 'string' },
          orderIndex: { type: 'number', example: 0 },
        },
      },
      ActivityLog: {
        type: 'object',
        properties: {
          user: { type: 'string', example: '6a8abe73ffffd33f9e629f32' },
          action: { type: 'string', example: 'Task created by Aayush' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string', example: 'Implement Swagger UI' },
          description: { type: 'string', example: 'Add complete OpenAPI specification' },
          projectId: { type: 'string' },
          boardId: { type: 'string' },
          status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          assignedTo: { $ref: '#/components/schemas/User', nullable: true },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          orderIndex: { type: 'number', example: 0 },
          activityLogs: {
            type: 'array',
            items: { $ref: '#/components/schemas/ActivityLog' },
          },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          taskId: { type: 'string' },
          author: { $ref: '#/components/schemas/User' },
          content: { type: 'string', example: 'PR has been reviewed and tested.' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Aayush Batra' },
                  email: { type: 'string', example: 'aayush@example.com' },
                  password: { type: 'string', example: 'Password123' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully with access token and cookie' },
          400: { description: 'Validation error / Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in with email & password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'aayush@example.com' },
                  password: { type: 'string', example: 'Password123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Silent refresh token rotation',
        security: [{ CookieAuth: [] }],
        responses: {
          200: { description: 'New access token issued' },
          401: { description: 'Invalid or missing refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Log out and clear session cookie',
        responses: {
          200: { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Current user profile data' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'Get all projects for authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of projects' },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a new project (auto-seeds boards)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Mobile App Revamp' },
                  description: { type: 'string', example: 'Q4 Product Roadmap initiative' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Project created with default Kanban boards' },
        },
      },
    },
    '/projects/{projectId}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project details, members, and boards',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Project metadata with boards array' },
          404: { description: 'Project not found' },
        },
      },
      patch: {
        tags: ['Projects'],
        summary: 'Update project title/description (Admin/Owner)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Project updated successfully' },
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete project and cascade delete boards/tasks/comments (Owner only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Project deleted' },
        },
      },
    },
    '/projects/{projectId}/invite': {
      post: {
        tags: ['Projects'],
        summary: 'Invite a member to the project by email',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', example: 'colleague@example.com' },
                  role: { type: 'string', enum: ['member', 'admin'], default: 'member' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User added to project members' },
          404: { description: 'User with given email not found' },
        },
      },
    },
    '/projects/{projectId}/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'Search, filter, and paginate tasks',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['todo', 'in_progress', 'done'] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] } },
          { name: 'assignedTo', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          200: { description: 'Filtered tasks list with pagination metadata' },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a task in a project board',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'boardId'],
                properties: {
                  title: { type: 'string', example: 'Build authentication' },
                  description: { type: 'string' },
                  boardId: { type: 'string' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
                  status: { type: 'string', enum: ['todo', 'in_progress', 'done'], default: 'todo' },
                  assignedTo: { type: 'string', nullable: true },
                  dueDate: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Task created successfully' },
        },
      },
    },
    '/tasks/{taskId}/status': {
      patch: {
        tags: ['Tasks'],
        summary: 'Update task status and order position (Drag & Drop)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
                  boardId: { type: 'string' },
                  orderIndex: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Task position and status updated' },
        },
      },
    },
    '/tasks/{taskId}': {
      patch: {
        tags: ['Tasks'],
        summary: 'Update task details (Title, description, priority, assignee, due date)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  assignedTo: { type: 'string', nullable: true },
                  dueDate: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Task updated successfully' },
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete task',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Task deleted successfully' },
        },
      },
    },
    '/tasks/{taskId}/comments': {
      get: {
        tags: ['Comments'],
        summary: 'Get all comments for a task',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of task comments' },
        },
      },
      post: {
        tags: ['Comments'],
        summary: 'Add a new comment to a task',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', example: 'Completed code review.' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Comment added and recorded in activity log' },
        },
      },
    },
  },
};