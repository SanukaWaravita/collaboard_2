const schemas = {
  RegisterRequest: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: {
        type: "string",
        example: "Sanuka Waravita",
      },
      email: {
        type: "string",
        format: "email",
        example: "sanuka@example.com",
      },
      password: {
        type: "string",
        format: "password",
        minLength: 8,
        example: "CollaBoard2026!",
      },
    },
  },

  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
      },
      password: {
        type: "string",
        format: "password",
      },
    },
  },

  WorkspaceCreate: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        example: "CollaBoard Team",
      },
      slug: {
        type: "string",
        example: "collaboard-team",
      },
    },
  },

  WorkspaceUpdate: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
      },
    },
  },

  ProjectCreate: {
    type: "object",
    required: ["name"],
    properties: {
      workspaceId: {
        type: "string",
      },
      name: {
        type: "string",
        example: "Assignment 02",
      },
      description: {
        type: "string",
      },
      projectKey: {
        type: "string",
        example: "A02",
      },
      visibility: {
        type: "string",
        enum: ["open", "private"],
        default: "private",
      },
    },
  },

  ProjectUpdate: {
    type: "object",
    properties: {
      name: {
        type: "string",
      },
      description: {
        type: "string",
      },
      visibility: {
        type: "string",
        enum: ["open", "private"],
      },
    },
  },

  WorkspaceRoleUpdate: {
    type: "object",
    required: ["role"],
    properties: {
      role: {
        type: "string",
        enum: ["ADMIN", "MEMBER", "GUEST"],
      },
    },
  },

  ProjectRoleUpdate: {
    type: "object",
    required: ["role"],
    properties: {
      role: {
        type: "string",
        enum: ["CONTRIBUTOR", "REVIEWER"],
      },
    },
  },

  OwnershipTransfer: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: {
        type: "string",
      },
    },
  },

  ProjectInvitationCreate: {
    type: "object",
    required: ["email"],
    properties: {
      email: {
        type: "string",
        format: "email",
      },
      role: {
        type: "string",
        enum: ["CONTRIBUTOR", "REVIEWER"],
        default: "REVIEWER",
      },
      memberType: {
        type: "string",
        enum: ["INTERNAL", "GUEST"],
        default: "INTERNAL",
      },
    },
  },

  WorkspaceInvitationCreate: {
    type: "object",
    required: ["email"],
    properties: {
      email: {
        type: "string",
        format: "email",
      },
      memberType: {
        type: "string",
        enum: ["INTERNAL", "GUEST"],
        default: "INTERNAL",
      },
      projects: {
        type: "array",
        items: {
          type: "object",
          required: ["projectId", "role"],
          properties: {
            projectId: {
              type: "string",
            },
            role: {
              type: "string",
              enum: ["CONTRIBUTOR", "REVIEWER"],
            },
          },
        },
      },
    },
  },

  WorkflowStatusCreate: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        example: "In review",
      },
      color: {
        type: "string",
        example: "#64748b",
      },
    },
  },

  WorkflowStatusUpdate: {
    type: "object",
    properties: {
      name: {
        type: "string",
      },
      color: {
        type: "string",
      },
    },
  },

  WorkflowStatusOrder: {
    type: "object",
    required: ["statusIds"],
    properties: {
      statusIds: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
  },

  WorkflowStatusDelete: {
    type: "object",
    properties: {
      replacementStatusId: {
        type: "string",
      },
    },
  },

  TaskCreate: {
    type: "object",
    required: ["title", "status"],
    properties: {
      title: {
        type: "string",
        example: "Document the REST API",
      },
      description: {
        type: "string",
      },
      status: {
        type: "string",
      },
      dueDate: {
        type: "string",
        format: "date-time",
        nullable: true,
      },
      assigneeIds: {
        type: "array",
        items: {
          type: "string",
        },
      },
      reporterId: {
        type: "string",
      },
    },
  },

  TaskUpdate: {
    type: "object",
    properties: {
      title: {
        type: "string",
      },
      description: {
        type: "string",
      },
      status: {
        type: "string",
      },
      dueDate: {
        type: "string",
        format: "date-time",
        nullable: true,
      },
      assigneeIds: {
        type: "array",
        items: {
          type: "string",
        },
      },
      reporterId: {
        type: "string",
      },
      version: {
        type: "integer",
        minimum: 1,
      },
    },
  },

  Error: {
    type: "object",
    required: ["message"],
    properties: {
      message: {
        type: "string",
        example: "Request could not be completed",
      },
    },
  },
};

const routeDefinitions = [
  ["get", "/health", "Health", "Check API and database health", null, 200, true],

  ["post", "/auth/register", "Authentication", "Register a user", "RegisterRequest", 201, true],
  ["post", "/auth/login", "Authentication", "Log in and receive a JWT", "LoginRequest", 200, true],

  ["get", "/workspaces", "Workspaces", "List accessible workspaces"],
  ["post", "/workspaces", "Workspaces", "Create a workspace", "WorkspaceCreate", 201],
  ["get", "/workspaces/{workspaceId}", "Workspaces", "Get a workspace"],
  ["patch", "/workspaces/{workspaceId}", "Workspaces", "Update a workspace", "WorkspaceUpdate"],
  ["delete", "/workspaces/{workspaceId}", "Workspaces", "Delete a workspace"],

  ["get", "/workspaces/{workspaceId}/projects", "Projects", "List workspace projects"],
  ["post", "/workspaces/{workspaceId}/projects", "Projects", "Create a workspace project", "ProjectCreate", 201],

  ["get", "/workspaces/{workspaceId}/members", "Workspace Access", "List workspace members"],
  ["patch", "/workspaces/{workspaceId}/members/{userId}", "Workspace Access", "Update a workspace member role", "WorkspaceRoleUpdate"],
  ["delete", "/workspaces/{workspaceId}/members/{userId}", "Workspace Access", "Remove a workspace member"],
  ["put", "/workspaces/{workspaceId}/members/{userId}/projects/{projectId}", "Workspace Access", "Grant project access", "ProjectRoleUpdate"],
  ["delete", "/workspaces/{workspaceId}/members/{userId}/projects/{projectId}", "Workspace Access", "Remove project access"],
  ["post", "/workspaces/{workspaceId}/invitations", "Invitations", "Invite workspace or project members", "WorkspaceInvitationCreate", 201],
  ["delete", "/workspaces/{workspaceId}/invitations/{invitationId}", "Invitations", "Cancel a workspace invitation"],

  ["get", "/projects", "Projects", "List accessible projects"],
  ["post", "/projects", "Projects", "Create a project", "ProjectCreate", 201],
  ["get", "/projects/{projectId}", "Projects", "Get a project"],
  ["patch", "/projects/{projectId}", "Projects", "Update a project", "ProjectUpdate"],
  ["delete", "/projects/{projectId}", "Projects", "Delete a project"],

  ["get", "/projects/{projectId}/members", "Project Access", "List project members"],
  ["patch", "/projects/{projectId}/members/{userId}", "Project Access", "Update a project member role", "ProjectRoleUpdate"],
  ["delete", "/projects/{projectId}/members/{userId}", "Project Access", "Remove a project member"],
  ["post", "/projects/{projectId}/transfer-ownership", "Project Access", "Transfer project ownership", "OwnershipTransfer"],

  ["get", "/projects/{projectId}/invitations", "Invitations", "List project invitations"],
  ["post", "/projects/{projectId}/invitations", "Invitations", "Invite a project member", "ProjectInvitationCreate", 201],
  ["delete", "/projects/{projectId}/invitations/{invitationId}", "Invitations", "Cancel a project invitation"],

  ["get", "/projects/{projectId}/statuses", "Workflow Statuses", "List workflow statuses"],
  ["post", "/projects/{projectId}/statuses", "Workflow Statuses", "Create a workflow status", "WorkflowStatusCreate", 201],
  ["put", "/projects/{projectId}/statuses/order", "Workflow Statuses", "Reorder workflow statuses", "WorkflowStatusOrder"],
  ["patch", "/projects/{projectId}/statuses/{statusId}", "Workflow Statuses", "Update a workflow status", "WorkflowStatusUpdate"],
  ["delete", "/projects/{projectId}/statuses/{statusId}", "Workflow Statuses", "Delete a workflow status", "WorkflowStatusDelete"],

  ["post", "/projects/{projectId}/tasks", "Tasks", "Create a task", "TaskCreate", 201],
  ["get", "/tasks/{taskId}", "Tasks", "Get a task"],
  ["patch", "/tasks/{taskId}", "Tasks", "Update a task", "TaskUpdate"],
  ["delete", "/tasks/{taskId}", "Tasks", "Delete a task"],

  ["get", "/invitations", "Invitations", "List invitations for the authenticated user"],
  ["post", "/invitations/{invitationId}/accept", "Invitations", "Accept an invitation"],
  ["post", "/invitations/{invitationId}/decline", "Invitations", "Decline an invitation"],
];

function errorResponse(description) {
  return {
    description,
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/Error",
        },
      },
    },
  };
}

function buildOperation({
  method,
  path,
  tag,
  summary,
  bodySchema,
  successStatus,
  isPublic,
}) {
  const parameters = [
    ...path.matchAll(/\{([^}]+)\}/g),
  ].map((match) => ({
    name: match[1],
    in: "path",
    required: true,
    schema: {
      type: "string",
    },
  }));

  const operation = {
    operationId: `${method}_${path}`
      .replace(/[{}]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_"),
    tags: [tag],
    summary,
    parameters,
    responses: {
      [String(successStatus)]: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
      },
      400: errorResponse("Invalid request"),
      404: errorResponse("Resource not found"),
      409: errorResponse("Request conflicts with existing data"),
    },
  };

  if (isPublic) {
    operation.security = [];
  } else {
    operation.responses[401] =
      errorResponse("Authentication required");
    operation.responses[403] =
      errorResponse("Insufficient permission");
  }

  if (bodySchema) {
    operation.requestBody = {
      required: method !== "delete",
      content: {
        "application/json": {
          schema: {
            $ref: `#/components/schemas/${bodySchema}`,
          },
        },
      },
    };
  }

  return operation;
}

const paths = {};

for (const [
  method,
  path,
  tag,
  summary,
  bodySchema = null,
  successStatus = 200,
  isPublic = false,
] of routeDefinitions) {
  paths[path] ??= {};

  paths[path][method] = buildOperation({
    method,
    path,
    tag,
    summary,
    bodySchema,
    successStatus,
    isPublic,
  });
}

const openApiDocument = {
  openapi: "3.0.3",

  info: {
    title: "CollaBoard REST API",
    version: "1.0.0",
    description:
      "Interactive API contract for CollaBoard Assignment 02. Protected endpoints require a JWT bearer token.",
  },

  servers: [
    {
      url: "https://collaboard-team-api.onrender.com/api",
      description: "Production",
    },
    {
      url: "http://localhost:5000/api",
      description: "Local development",
    },
  ],

  security: [
    {
      bearerAuth: [],
    },
  ],

  tags: [
    { name: "Health" },
    { name: "Authentication" },
    { name: "Workspaces" },
    { name: "Workspace Access" },
    { name: "Projects" },
    { name: "Project Access" },
    { name: "Invitations" },
    { name: "Workflow Statuses" },
    { name: "Tasks" },
  ],

  paths,

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Paste the raw JWT returned by register or login.",
      },
    },

    schemas,
  },
};

export default openApiDocument;