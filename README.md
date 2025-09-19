# Alpic MCP Template

A TypeScript template for building MCP servers using Streamable HTTP transport.

## Overview

This template provides a foundation for creating MCP servers that can communicate with AI assistants and other MCP clients. It includes a simple HTTP server implementation with example tools, resource & prompts to help you get started building your own MCP integrations.

## Prerequisites

- Node.js 22+ (see `.nvmrc` for exact version)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd mcp-server-template
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Configure your environment variables (see [Configuration](#configuration) section below)

## Configuration

This application requires configuration for Stytch authentication and Neon database. Follow these steps to set up your environment:

### Stytch Authentication Setup

1. **Create a Stytch Account**: Go to [https://stytch.com](https://stytch.com) and create an account
2. **Create a New Project**: In the Stytch dashboard, create a new project
3. **Get Your Credentials**: 
   - Navigate to your project dashboard
   - Copy your `Project ID` and `Secret key` from the API Keys section
   - Note your project's domain (e.g., `https://your-project.customers.stytch.dev`)

4. **Configure Environment Variables**:
   ```bash
   STYTCH_PROJECT_ID=project-test-your-project-id-here
   STYTCH_PROJECT_SECRET=secret-test-your-secret-key-here
   STYTCH_DOMAIN=https://your-subdomain.customers.stytch.dev
   ```

### Neon Database Setup

1. **Create a Neon Account**: Go to [https://neon.tech](https://neon.tech) and create an account
2. **Create a New Project**: Create a new project in the Neon console
3. **Create a Database**: 
   - Create a new database in your project
   - Note the connection details provided

4. **Get Your Connection String**:
   - In the Neon dashboard, go to your project's connection details
   - Copy the connection string (it should look like the format below)

5. **Configure Environment Variable**:
   ```bash
   NEON_DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require&channel_binding=require
   ```

### Complete .env File Example

After setting up both services, your `.env` file should look like this:

```bash
# Server Configuration
MCP_HTTP_PORT=3000

# Stytch Authentication Configuration
STYTCH_PROJECT_ID=project-test-12345678-1234-5678-9abc-123456789def
STYTCH_PROJECT_SECRET=secret-test-your-actual-secret-key-here=
STYTCH_DOMAIN=https://your-subdomain.customers.stytch.dev

# Neon Database Configuration
NEON_DATABASE_URL=postgresql://neondb_owner:your-password@your-host.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Database Schema

The application will automatically create the required tables when you first run it. The main table structure:

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, done
  priority INT DEFAULT 0,               -- 0 = low, 1 = medium, 2 = high
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Available Tools

Once configured, the MCP server provides these tools:

- **List tasks**: Retrieve all tasks for the authenticated user
- **Create task**: Create a new task with title, description, and priority
- **Update task**: Update an existing task's properties
- **Delete task**: Remove a task from the database

## Usage

### Development

Start the development server with hot-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000` and automatically restart when you make changes to the source code.

### Production Build

Build the project for production:

```bash
npm run build
```

The compiled JavaScript will be output to the `dist/` directory.

### Running the Inspector

Use the MCP inspector tool to test your server:

```bash
npm run inspector
```

## API Endpoints

- `POST /mcp` - Main MCP communication endpoint
- `GET /mcp` - Returns "Method not allowed" (405)
- `DELETE /mcp` - Returns "Method not allowed" (405)

## Development

### Adding New Tools

To add a new tool, modify `src/server.ts`:

```typescript
server.tool(
  "tool-name",
  "Tool description",
  {
    // Define your parameters using Zod schemas
    param: z.string().describe("Parameter description"),
  },
  async ({ param }): Promise<CallToolResult> => {
    // Your tool implementation
    return {
      content: [
        {
          type: "text",
          text: `Result: ${param}`,
        },
      ],
    };
  },
);
```

### Adding New Prompts

To add a new prompt template, modify `src/server.ts`:

```typescript
server.prompt(
  "prompt-name",
  "Prompt description",
  {
    // Define your parameters using Zod schemas
    param: z.string().describe("Parameter description"),
  },
  async ({ param }): Promise<GetPromptResult> => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Your prompt content with ${param}`,
          },
        },
      ],
    };
  },
);
```

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Express.js Documentation](https://expressjs.com/)
