import { neon } from "@neondatabase/serverless";
import { config } from "./config.js";

const db = neon(config.NEON_DATABASE_URL);

type Task = {
  id: number;
  user_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'done';
  priority: 0 | 1 | 2; // 0 = low, 1 = medium, 2 = high
  created_at: string;
  updated_at: string;
}


let dbInitialized = false;
// Initialize a sample DB schema using Neon
// This is just for demo purposes - you should use a real migration management system
// like Drizzle or Knex that integrates into your deploy pipeline
export const initDb = async () =>{
  if(dbInitialized) return;
  await db.query(`
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
  `);
  dbInitialized = true;
}

export class UserTasksDal {
  constructor(public user_id: string) {}

  getTasks = async () =>{
    const tasks = await db.query(`select * from tasks where user_id = $1`, [this.user_id])
    return tasks as Task[];
  }

  createTask = async (title: string, description: string, status: 'pending' | 'in_progress' | 'done' = 'pending', priority: 0 | 1 | 2 = 0) => {
    const result = await db.query(
      `INSERT INTO tasks (user_id, title, description, status, priority) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [this.user_id, title, description, status, priority]
    );
    return result[0] as Task;
  }

  updateTask = async (taskId: number, updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority'>>) => {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ');
    const result = await db.query(
      `UPDATE tasks 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [taskId, this.user_id, ...values]
    );
    
    if (result.length === 0) {
      throw new Error('Task not found or access denied');
    }
    
    return result[0] as Task;
  }

  deleteTask = async (taskId: number) => {
    const result = await db.query(
      `DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *`,
      [taskId, this.user_id]
    );
    
    if (result.length === 0) {
      throw new Error('Task not found or access denied');
    }
    
    return result[0] as Task;
  }

  static forUser(userId: string): UserTasksDal {
    return new UserTasksDal(userId)
  }
}
