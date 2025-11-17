import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { ITask, ICreateTaskDto, IUpdateTaskDto, TaskStatus } from '../models';
import { SqliteProjectService } from './sqlite-project.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSubject = new BehaviorSubject<ITask[]>([]);
  public tasks$ = this.tasksSubject.asObservable();
  private readonly TASKS_STORAGE_KEY = 'user_tasks'; // localStorage key
  private projectService?: SqliteProjectService; // lazy loaded para evitar dependência circular

  constructor(
    private authService: AuthService,
    private injector: Injector
  ) {
    console.log('[TaskService] Initialized');
    this.initializeTaskService();
    this.loadTasksFromStorage(); // Carrega tarefas do localStorage

    // Recarrega tarefas quando o usuário faz login/logout
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        console.log('[TaskService] User logged in, reloading tasks...');
        this.refreshUserTasks();
      } else {
        console.log('[TaskService] User logged out, clearing tasks...');
        this.tasksSubject.next([]);
      }
    });
  }

  /**
   * Initialize task service - USA LOCALSTORAGE EM TODAS AS PLATAFORMAS
   */
  private async initializeTaskService(): Promise<void> {
    const platform = (window as any).Capacitor?.getPlatform() || 'web';

    // FORÇAR USO DE LOCALSTORAGE EM TODAS AS PLATAFORMAS
    // Isso garante que as tarefas sejam salvas de forma confiável
    console.log('[TaskService] Platform detected:', platform);
    console.log('[TaskService] ✅ Using localStorage for ALL platforms (reliable persistence)');

    // Ainda espera a inicialização do auth service
    if (platform !== 'web') {
      try {
        console.log('[TaskService] Waiting for auth initialization...');
        await this.authService.waitForInit();
        console.log('[TaskService] Auth initialization complete');
      } catch (error) {
        console.warn('[TaskService] Auth initialization warning:', error);
      }
    }
  }

  /**
   * Wait for initialization before operations
   */
  private async ensureInitialized(): Promise<void> {
    // Wait for auth service initialization
    await this.authService.waitForInit();
  }

  /**
   * Obtém o ProjectService (lazy loading para evitar dependência circular)
   */
  private getProjectService(): SqliteProjectService | undefined {
    if (!this.projectService) {
      try {
        // Importa dinamicamente para evitar dependência circular
        this.projectService = this.injector.get(SqliteProjectService);
      } catch (error) {
        console.warn('[TaskService] Could not get SqliteProjectService:', error);
        return undefined;
      }
    }
    return this.projectService;
  }

  /**
   * Atualiza os contadores de tarefas nos projetos
   */
  private refreshProjectCounts(): void {
    try {
      const projectService = this.getProjectService();
      if (projectService && projectService.refreshProjects) {
        const userId = this.authService.getCurrentUserId();
        projectService.refreshProjects(userId || undefined);
      }
    } catch (error) {
      console.warn('[TaskService] Could not refresh project counts:', error);
    }
  }

  /**
   * Recarrega tarefas do usuário atual (chamar após login)
   */
  public refreshUserTasks(): void {
    console.log('[TaskService] Refreshing tasks for current user...');
    this.loadTasksFromStorage();
  }

  /**
   * Carrega tarefas do localStorage (apenas do usuário atual)
   */
  private loadTasksFromStorage(): void {
    try {
      const userId = this.authService.currentUserValue?.id;
      const storedTasks = localStorage.getItem(this.TASKS_STORAGE_KEY);

      if (storedTasks) {
        let tasks = JSON.parse(storedTasks);

        // Filtra apenas tarefas do usuário logado
        if (userId) {
          tasks = tasks.filter((task: ITask) => task.userId === userId);
          console.log(`[TaskService] ✅ Loaded ${tasks.length} tasks for user ${userId}`);
        } else {
          tasks = [];
          console.log('[TaskService] ⚠️ No user logged in, loading empty tasks');
        }

        this.tasksSubject.next(tasks);
      } else {
        console.log('[TaskService] No tasks found in localStorage');
        this.tasksSubject.next([]);
      }
    } catch (error) {
      console.error('[TaskService] Error loading tasks from localStorage:', error);
      this.tasksSubject.next([]);
    }
  }

  /**
   * Salva tarefas no localStorage
   */
  private saveTasksToStorage(tasks: ITask[]): void {
    try {
      localStorage.setItem(this.TASKS_STORAGE_KEY, JSON.stringify(tasks));
      console.log(`[TaskService] ✅ Saved ${tasks.length} tasks to localStorage`);
    } catch (error) {
      console.error('[TaskService] Error saving tasks to localStorage:', error);
    }
  }

  /**
   * Get all tasks for current user
   */
  async getTasks(): Promise<ITask[]> {
    try {
      console.log('[TaskService] getTasks() called');

      // CRITICAL: Wait for initialization
      await this.ensureInitialized();

      const userId = this.authService.currentUserValue?.id;
      console.log('[TaskService] User ID:', userId);

      if (!userId) {
        console.log('[TaskService] ⚠️ No userId, returning empty tasks');
        return [];
      }

      console.log('[TaskService] Using localStorage for tasks');

      // Carrega do localStorage
      const storedTasks = localStorage.getItem(this.TASKS_STORAGE_KEY);
      let tasks: ITask[] = [];

      if (storedTasks) {
        tasks = JSON.parse(storedTasks);
      }

      // Filtra apenas as tarefas do usuário atual
      tasks = tasks.filter(task => task.userId === userId);
      console.log('[TaskService] ✅ Got', tasks.length, 'tasks from localStorage');

      this.tasksSubject.next(tasks);
      console.log('[TaskService] Tasks updated in subject. Total:', tasks.length);
      return tasks;
    } catch (error) {
      console.error('[TaskService] ❌ Error fetching tasks:', error);
      console.error('[TaskService] Error details:', JSON.stringify(error));
      return [];
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<ITask | null> {
    try {
      const allStoredTasks = localStorage.getItem(this.TASKS_STORAGE_KEY);
      if (allStoredTasks) {
        const tasks: ITask[] = JSON.parse(allStoredTasks);
        return tasks.find(t => t.id === id) || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    }
  }

  /**
   * Get task by ID (accepts number or string)
   */
  async getTask(id: number | string): Promise<ITask | null> {
    try {
      const taskId = id.toString();
      const allStoredTasks = localStorage.getItem(this.TASKS_STORAGE_KEY);
      if (allStoredTasks) {
        const tasks: ITask[] = JSON.parse(allStoredTasks);
        const task = tasks.find(t => t.id === taskId || t.id === id);
        console.log('[TaskService] getTask:', id, 'found:', task ? 'yes' : 'no');
        return task || null;
      }
      return null;
    } catch (error) {
      console.error('[TaskService] Error fetching task:', error);
      return null;
    }
  }

  /**
   * Create new task
   */
  async createTask(taskData: ICreateTaskDto): Promise<ITask> {
    try {
      console.log('[TaskService] ========== CREATE TASK START ==========');
      console.log('[TaskService] taskData:', JSON.stringify(taskData, null, 2));

      // CRITICAL: Ensure database is initialized
      console.log('[TaskService] Ensuring initialization...');
      await this.ensureInitialized();
      console.log('[TaskService] Initialization complete');

      const userId = this.authService.currentUserValue?.id;
      console.log('[TaskService] - userId:', userId);

      if (!userId) {
        console.error('[TaskService] ❌ ERROR: Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      console.log('[TaskService] ➡️  Creating task in localStorage...');
      const newTask = this.createMockTask(taskData, userId);
      console.log('[TaskService] ✅ Task created successfully!');
      console.log('[TaskService] Task ID:', newTask.id);
      console.log('[TaskService] Task ProjectId:', newTask.projectId);

      // Update local tasks list
      const currentTasks = this.tasksSubject.value;
      const updatedTasks = [...currentTasks, newTask];
      this.tasksSubject.next(updatedTasks);

      // Pega todas as tarefas do localStorage (de todos os usuários)
      const allStoredTasks = localStorage.getItem(this.TASKS_STORAGE_KEY);
      let allTasks: ITask[] = allStoredTasks ? JSON.parse(allStoredTasks) : [];

      // Adiciona a nova tarefa
      allTasks.push(newTask);

      // Salva de volta
      this.saveTasksToStorage(allTasks);

      // Atualiza os contadores de tarefas nos projetos
      this.refreshProjectCounts();

      console.log('[TaskService] Task list updated. Total tasks:', updatedTasks.length);
      console.log('[TaskService] ========== CREATE TASK END ==========');

      return newTask;
    } catch (error) {
      console.error('[TaskService] ========== CREATE TASK FAILED ==========');
      console.error('[TaskService] ❌ Error:', error);
      console.error('[TaskService] Error message:', (error as any)?.message);
      console.error('[TaskService] Error stack:', (error as any)?.stack);
      throw error;
    }
  }

  /**
   * Create a mock task (localStorage version)
   */
  private createMockTask(taskData: ICreateTaskDto, userId: string): ITask {
    const now = new Date();
    return {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11),
      titulo: taskData.titulo,
      descricao: taskData.descricao || '',
      status: TaskStatus.TODO,
      prioridade: taskData.prioridade || 'medium' as any,
      dataCriacao: now,
      dataAtualizacao: now,
      dataVencimento: taskData.dataVencimento,
      userId: userId,
      projectId: taskData.projectId,
      categoryId: taskData.categoryId,
      tags: taskData.tags || [],
      isPublic: false,
      assignedTo: [],
      anexos: []
    };
  }

  /**
   * Update existing task
   */
  async updateTask(id: string, updates: IUpdateTaskDto): Promise<ITask> {
    try {
      // Atualiza no localStorage
      const allStoredTasks = localStorage.getItem(this.TASKS_STORAGE_KEY);
      let allTasks: ITask[] = allStoredTasks ? JSON.parse(allStoredTasks) : [];

      const index = allTasks.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error('Task not found');
      }

      const updatedTask = { ...allTasks[index], ...updates, dataAtualizacao: new Date() };
      allTasks[index] = updatedTask;
      this.saveTasksToStorage(allTasks);

      // Update local tasks list
      const currentTasks = this.tasksSubject.value;
      const currentIndex = currentTasks.findIndex(t => t.id === id);
      if (currentIndex !== -1) {
        currentTasks[currentIndex] = updatedTask;
        this.tasksSubject.next([...currentTasks]);
      } else {
        // Recarrega do storage se não encontrar na memória
        this.loadTasksFromStorage();
      }

      // Atualiza os contadores de tarefas nos projetos se o projectId mudou
      if ((updates as any).projectId !== undefined) {
        this.refreshProjectCounts();
      }

      return updatedTask;
    } catch (error) {
      console.error('[TaskService] Error updating task:', error);
      throw error;
    }
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<void> {
    try {
      // Remove do localStorage
      const allStoredTasks = localStorage.getItem(this.TASKS_STORAGE_KEY);
      let allTasks: ITask[] = allStoredTasks ? JSON.parse(allStoredTasks) : [];

      allTasks = allTasks.filter(t => t.id !== id);
      this.saveTasksToStorage(allTasks);

      // Update local tasks list
      const currentTasks = this.tasksSubject.value;
      this.tasksSubject.next(currentTasks.filter(t => t.id !== id));

      // Atualiza os contadores de tarefas nos projetos
      this.refreshProjectCounts();
    } catch (error) {
      console.error('[TaskService] Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Get tasks by project ID
   */
  async getTasksByProject(projectId: string): Promise<ITask[]> {
    try {
      const allStoredTasks = localStorage.getItem(this.TASKS_STORAGE_KEY);
      if (allStoredTasks) {
        const tasks: ITask[] = JSON.parse(allStoredTasks);
        return tasks.filter(t => t.projectId === projectId);
      }
      return [];
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      return [];
    }
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): ITask[] {
    return this.tasksSubject.value.filter(task => task.status === status);
  }

  /**
   * Search tasks
   */
  searchTasks(query: string): ITask[] {
    const lowerQuery = query.toLowerCase();
    return this.tasksSubject.value.filter(task =>
      task.titulo.toLowerCase().includes(lowerQuery) ||
      task.descricao?.toLowerCase().includes(lowerQuery) ||
      task.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

}
