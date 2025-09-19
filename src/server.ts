import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { UserTasksDal } from "./dal.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

export const getServer = (): McpServer => {
  const server = new McpServer(
    {
      name: "mcp-server-template",
      version: "0.0.1",
    },
    { capabilities: {} },
  );

  const getTaskDal = (authInfo: AuthInfo | undefined) => {
    if (!authInfo || !authInfo.extra) {
      throw Error("Auth Info missing");
    }
    return UserTasksDal.forUser(authInfo.extra.subject as string);
  };

  server.tool("List tasks", "List all the tasks previously created", async ({ authInfo }): Promise<CallToolResult> => {
    const tasks = await getTaskDal(authInfo).getTasks();

    return {
      content: [
        {
          type: "text",
          text: `Tasks: ${JSON.stringify(tasks)}`,
        },
      ],
    };
  });

  server.tool(
    "Create task",
    "Creates a new task",
    {
      title: z.string().describe("Title of the task"),
      description: z.string().describe("Description of the task"),
      priority: z.enum(['0', '1', '2']).transform(val => Number(val) as 0 | 1 | 2).optional().default('0').describe("Priority of the task. 0 is low, 2 is high."),
    },
    async ({title, description, priority}, { authInfo }): Promise<CallToolResult> => {
      const task = await getTaskDal(authInfo).createTask(title, description, 'pending', priority);

      return {
        content: [
          {
            type: "text",
            text: `Task created successfully: ${JSON.stringify(task)}`,
          },
        ],
      };
    },
  );

  server.tool(
    "Update task",
    "Updates an existing task",
    {
      taskId: z.number().describe("ID of the task to update"),
      title: z.string().optional().describe("New title of the task"),
      description: z.string().optional().describe("New description of the task"),
      status: z.enum(['pending', 'in_progress', 'done']).optional().describe("New status of the task"),
      priority: z.enum(['0', '1', '2']).transform(val => Number(val) as 0 | 1 | 2).optional().describe("New priority of the task. 0 is low, 2 is high."),
    },
    async ({taskId, title, description, status, priority}, { authInfo }): Promise<CallToolResult> => {
      const updates = {title, description, status, priority};
      const task = await getTaskDal(authInfo).updateTask(taskId, updates);

      return {
        content: [
          {
            type: "text",
            text: `Task updated successfully: ${JSON.stringify(task)}`,
          },
        ],
      };
    },
  );

  server.tool(
    "Delete task",
    "Deletes an existing task",
    {
      taskId: z.number().describe("ID of the task to delete"),
    },
    async ({taskId}, { authInfo }): Promise<CallToolResult> => {
      const task = await getTaskDal(authInfo).deleteTask(taskId);

      return {
        content: [
          {
            type: "text",
            text: `Task deleted successfully: ${JSON.stringify(task)}`,
          },
        ],
      };
    },
  );

  return server;
};
