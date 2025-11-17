import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { ITask, TaskStatus, TaskPriority, DatabaseError } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SQLiteTaskService {
  constructor(private db: DatabaseService) {}

  async getTasks(userId: string, projectId?: string): Promise<ITask[]> {
    try {
      let sql = 'SELECT * FROM tasks WHERE user_id = ?';
      const params: any[] = [userId];

      if (projectId) {
        sql += ' AND project_id = ?';
        params.push(projectId);
      }

      sql += ' ORDER BY data_criacao DESC';

      const result = await this.db.query(sql, params);

      if (!result.values || result.values.length === 0) {
        return [];
      }

      return result.values.map((row: any) => this.mapRowToTask(row));
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  async getTaskById(taskId: string): Promise<ITask | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM tasks WHERE id = ?',
        [taskId]
      );

      if (!result.values || result.values.length === 0) {
        return null;
      }

      return this.mapRowToTask(result.values[0]);
    } catch (error) {
      console.error('Error getting task:', error);
      return null;
    }
  }

  async createTask(task: Partial<ITask>, userId: string): Promise<ITask> {
    try {
      console.log('[SQLiteTaskService] ========== CREATE TASK IN SQLITE START ==========');
      console.log('[SQLiteTaskService] Input task:', JSON.stringify(task, null, 2));
      console.log('[SQLiteTaskService] User ID:', userId);

      // Validate required fields
      if (!task.titulo || task.titulo.trim() === '') {
        console.error('[SQLiteTaskService] ❌ Validation failed: Título vazio');
        throw new DatabaseError('Título da tarefa é obrigatório');
      }

      if (!userId) {
        console.error('[SQLiteTaskService] ❌ Validation failed: User ID missing');
        throw new DatabaseError('Usuário não identificado');
      }

      console.log('[SQLiteTaskService] Validation passed, generating task ID...');
      const taskId = this.db.generateId();
      console.log('[SQLiteTaskService] Generated task ID:', taskId);

      const now = this.db.dateToSQL(new Date());
      console.log('[SQLiteTaskService] Current timestamp:', now);

      const sql = `INSERT INTO tasks (
        id, titulo, descricao, status, prioridade,
        data_criacao, data_atualizacao, data_vencimento,
        user_id, project_id, category_id, tags, anexos,
        is_public, assigned_to
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const params = [
        taskId,
        task.titulo,
        task.descricao || null,
        task.status || TaskStatus.TODO,
        task.prioridade || TaskPriority.MEDIUM,
        now,
        now,
        task.dataVencimento ? this.db.dateToSQL(new Date(task.dataVencimento)) : null,
        userId,
        task.projectId || null,
        task.categoryId || null,
        task.tags ? JSON.stringify(task.tags) : '[]',
        task.anexos ? JSON.stringify(task.anexos) : '[]',
        task.isPublic ? 1 : 0,
        task.assignedTo ? JSON.stringify(task.assignedTo) : '[]'
      ];

      console.log('[SQLiteTaskService] SQL params:', JSON.stringify(params, null, 2));
      console.log('[SQLiteTaskService] Executing INSERT query...');

      await this.db.run(sql, params);
      console.log('[SQLiteTaskService] ✅ INSERT completed successfully');

      console.log('[SQLiteTaskService] Retrieving created task...');
      const createdTask = await this.getTaskById(taskId);

      if (!createdTask) {
        console.error('[SQLiteTaskService] ❌ Failed to retrieve created task');
        throw new DatabaseError('Falha ao recuperar tarefa criada');
      }

      console.log('[SQLiteTaskService] ✅ Task retrieved successfully');
      console.log('[SQLiteTaskService] Created task:', JSON.stringify(createdTask, null, 2));
      console.log('[SQLiteTaskService] ========== CREATE TASK IN SQLITE END ==========');
      return createdTask;
    } catch (error) {
      console.error('[SQLiteTaskService] ========== CREATE TASK IN SQLITE FAILED ==========');
      console.error('[SQLiteTaskService] ❌ Error:', error);
      console.error('[SQLiteTaskService] Error type:', error?.constructor?.name);
      console.error('[SQLiteTaskService] Error message:', (error as any)?.message);
      console.error('[SQLiteTaskService] Error stack:', (error as any)?.stack);

      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        'Erro ao criar tarefa no banco de dados',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  async updateTask(taskId: string, updates: Partial<ITask>): Promise<ITask> {
    try {
      const now = this.db.dateToSQL(new Date());
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.titulo !== undefined) {
        fields.push('titulo = ?');
        values.push(updates.titulo);
      }
      if (updates.descricao !== undefined) {
        fields.push('descricao = ?');
        values.push(updates.descricao);
      }
      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);

        // Set data_conclusao if status is COMPLETED
        if (updates.status === TaskStatus.COMPLETED) {
          fields.push('data_conclusao = ?');
          values.push(now);
        } else {
          fields.push('data_conclusao = ?');
          values.push(null);
        }
      }
      if (updates.prioridade !== undefined) {
        fields.push('prioridade = ?');
        values.push(updates.prioridade);
      }
      if (updates.dataVencimento !== undefined) {
        fields.push('data_vencimento = ?');
        values.push(updates.dataVencimento ? this.db.dateToSQL(new Date(updates.dataVencimento)) : null);
      }
      if (updates.projectId !== undefined) {
        fields.push('project_id = ?');
        values.push(updates.projectId);
      }
      if (updates.categoryId !== undefined) {
        fields.push('category_id = ?');
        values.push(updates.categoryId);
      }
      if (updates.tags !== undefined) {
        fields.push('tags = ?');
        values.push(updates.tags ? JSON.stringify(updates.tags) : null);
      }
      if (updates.anexos !== undefined) {
        fields.push('anexos = ?');
        values.push(updates.anexos ? JSON.stringify(updates.anexos) : null);
      }

      fields.push('data_atualizacao = ?');
      values.push(now);

      values.push(taskId);

      const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
      await this.db.run(sql, values);

      const updatedTask = await this.getTaskById(taskId);
      return updatedTask!;
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Erro ao atualizar tarefa');
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.db.run('DELETE FROM tasks WHERE id = ?', [taskId]);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Erro ao deletar tarefa');
    }
  }

  async getTasksByStatus(userId: string, status: TaskStatus): Promise<ITask[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM tasks WHERE user_id = ? AND status = ? ORDER BY data_criacao DESC',
        [userId, status]
      );

      if (!result.values || result.values.length === 0) {
        return [];
      }

      return result.values.map((row: any) => this.mapRowToTask(row));
    } catch (error) {
      console.error('Error getting tasks by status:', error);
      return [];
    }
  }

  async getTasksByPriority(userId: string, priority: TaskPriority): Promise<ITask[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM tasks WHERE user_id = ? AND prioridade = ? ORDER BY data_criacao DESC',
        [userId, priority]
      );

      if (!result.values || result.values.length === 0) {
        return [];
      }

      return result.values.map((row: any) => this.mapRowToTask(row));
    } catch (error) {
      console.error('Error getting tasks by priority:', error);
      return [];
    }
  }

  async searchTasks(userId: string, query: string): Promise<ITask[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM tasks
         WHERE user_id = ?
         AND (titulo LIKE ? OR descricao LIKE ?)
         ORDER BY data_criacao DESC`,
        [userId, `%${query}%`, `%${query}%`]
      );

      if (!result.values || result.values.length === 0) {
        return [];
      }

      return result.values.map((row: any) => this.mapRowToTask(row));
    } catch (error) {
      console.error('Error searching tasks:', error);
      return [];
    }
  }

  private mapRowToTask(row: any): ITask {
    return {
      id: row.id,
      titulo: row.titulo,
      descricao: row.descricao,
      status: row.status as TaskStatus,
      prioridade: row.prioridade as TaskPriority,
      dataCriacao: this.db.sqlToDate(row.data_criacao),
      dataAtualizacao: this.db.sqlToDate(row.data_atualizacao),
      dataVencimento: row.data_vencimento ? this.db.sqlToDate(row.data_vencimento) : undefined,
      dataConclusao: row.data_conclusao ? this.db.sqlToDate(row.data_conclusao) : undefined,
      userId: row.user_id,
      projectId: row.project_id,
      categoryId: row.category_id,
      tags: row.tags ? JSON.parse(row.tags) : [],
      isPublic: row.is_public === 1,
      assignedTo: row.assigned_to ? JSON.parse(row.assigned_to) : [],
      anexos: row.anexos ? JSON.parse(row.anexos) : []
    };
  }
}
