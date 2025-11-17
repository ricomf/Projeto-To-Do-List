import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { DatabaseService } from './database.service';
import { IProject, ICreateProjectDto, IUpdateProjectDto, ProjectStatus, IProjectMember } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class SqliteProjectService {
  private projectsSubject = new BehaviorSubject<IProject[]>([]);
  public projects$ = this.projectsSubject.asObservable();
  private platform: string;
  private readonly STORAGE_KEY = 'projects_data';

  constructor(private dbService: DatabaseService) {
    this.platform = Capacitor.getPlatform();
    console.log('[SqliteProjectService] Initialized on platform:', this.platform);
    this.loadProjects();
  }

  async loadProjects(userId?: string): Promise<void> {
    console.log('[SqliteProjectService] loadProjects called, platform:', this.platform, 'userId:', userId);

    if (this.platform === 'web') {
      console.log('[SqliteProjectService] Loading projects from localStorage');
      this.loadProjectsFromLocalStorage(userId);
      return;
    }

    try {
      console.log('[SqliteProjectService] Attempting to get database connection for loading projects...');
      const db = await this.dbService.getDb();
      console.log('[SqliteProjectService] Database connection obtained for loading projects');

      let query = `
        SELECT
          p.id,
          p.nome,
          p.descricao,
          p.cor,
          p.criado_por as ownerId,
          p.status,
          p.data_criacao as dataCriacao,
          p.data_atualizacao as dataAtualizacao
        FROM projects p
      `;

      if (userId) {
        query += `
          LEFT JOIN project_members pm ON p.id = pm.project_id
          WHERE p.criado_por = ? OR pm.user_id = ?
          GROUP BY p.id
        `;
      }

      console.log('[SqliteProjectService] Executing query:', query);
      const result = userId
        ? await db.query(query, [userId, userId])
        : await db.query(query);

      console.log('[SqliteProjectService] Query result:', result);

      if (result?.values) {
        console.log('[SqliteProjectService] Found', result.values.length, 'projects');
        const projects: IProject[] = await Promise.all(
          result.values.map(async (row: any) => {
            const members = await this.getProjectMembers(row.id);
            const tasks = await this.getProjectTasks(row.id);

            return {
              id: row.id,
              nome: row.nome,
              descricao: row.descricao,
              cor: row.cor,
              icon: 'briefcase',
              ownerId: row.ownerId,
              status: row.status as ProjectStatus,
              dataCriacao: row.dataCriacao,
              dataAtualizacao: row.dataAtualizacao,
              members,
              tasks
            };
          })
        );

        console.log('[SqliteProjectService] Projects loaded:', projects);
        this.projectsSubject.next(projects);
      } else {
        console.log('[SqliteProjectService] No projects found in result');
        this.projectsSubject.next([]);
      }
    } catch (error) {
      console.error('[SqliteProjectService] ❌ Error loading projects from SQLite:', error);
      console.error('[SqliteProjectService] Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });

      // Fallback to localStorage if SQLite fails
      console.log('[SqliteProjectService] 🔄 Falling back to localStorage for loading...');
      this.loadProjectsFromLocalStorage(userId);
    }
  }

  private loadProjectsFromLocalStorage(userId?: string): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      let projects: IProject[] = stored ? JSON.parse(stored) : [];

      if (userId) {
        projects = projects.filter(p =>
          p.ownerId === userId ||
          p.members?.some(m => m.userId === userId)
        );
      }

      // Carrega as tarefas do localStorage para cada projeto
      const tasksStorage = localStorage.getItem('user_tasks');
      if (tasksStorage) {
        const allTasks = JSON.parse(tasksStorage);
        projects = projects.map(project => ({
          ...project,
          tasks: allTasks
            .filter((task: any) => task.projectId === project.id)
            .map((task: any) => task.id)
        }));
      }

      this.projectsSubject.next(projects);
    } catch (error) {
      console.error('[SqliteProjectService] Error loading from localStorage:', error);
      this.projectsSubject.next([]);
    }
  }

  private saveProjectsToLocalStorage(projects: IProject[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('[SqliteProjectService] Error saving to localStorage:', error);
    }
  }

  private async getProjectMembers(projectId: string): Promise<IProjectMember[]> {
    try {
      const db = await this.dbService.getDb();
      const result = await db.query(`
        SELECT
          pm.user_id as userId,
          u.nome,
          u.email,
          u.avatar_url as avatarUrl,
          pm.role,
          pm.adicionado_em as dataEntrada
        FROM project_members pm
        LEFT JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = ?
      `, [projectId]);

      if (result?.values) {
        return result.values.map((row: any) => ({
          userId: row.userId,
          nome: row.nome || 'Usuário',
          email: row.email || '',
          avatarUrl: row.avatarUrl,
          role: row.role,
          dataEntrada: row.dataEntrada
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading project members:', error);
      return [];
    }
  }

  private async getProjectTasks(projectId: string): Promise<string[]> {
    try {
      const db = await this.dbService.getDb();
      const result = await db.query(`
        SELECT id FROM tasks WHERE project_id = ?
      `, [projectId]);

      if (result?.values) {
        return result.values.map((row: any) => row.id);
      }
      return [];
    } catch (error) {
      console.error('Error loading project tasks:', error);
      return [];
    }
  }

  getProjects(): Observable<IProject[]> {
    return this.projects$;
  }

  getProjectById(id: string): IProject | undefined {
    return this.projectsSubject.value.find(p => p.id === id);
  }

  async createProject(dto: ICreateProjectDto, userId: string): Promise<IProject | null> {
    console.log('[SqliteProjectService] Creating project with dto:', dto, 'userId:', userId);
    console.log('[SqliteProjectService] Platform:', this.platform);

    if (this.platform === 'web') {
      return this.createProjectInLocalStorage(dto, userId);
    }

    try {
      console.log('[SqliteProjectService] Attempting to get database connection...');
      const db = await this.dbService.getDb();
      console.log('[SqliteProjectService] Database connection obtained successfully');

      const now = new Date().toISOString();
      const projectId = this.generateId();
      console.log('[SqliteProjectService] Generated project ID:', projectId);

      const query = `
        INSERT INTO projects (
          id, nome, descricao, cor, is_public, criado_por,
          status, data_criacao, data_atualizacao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        projectId,
        dto.nome,
        dto.descricao || '',
        dto.cor || '#3880ff',
        0, // isPublic removed, keeping 0 for database compatibility
        userId,
        ProjectStatus.ACTIVE,
        now,
        now
      ];

      console.log('[SqliteProjectService] Executing insert with values:', values);
      await db.run(query, values);
      console.log('[SqliteProjectService] Project inserted successfully');

      // Add owner as first member
      console.log('[SqliteProjectService] Adding owner as member');
      await this.addMemberToProject(projectId, {
        userId,
        nome: 'Você',
        email: '',
        role: 'OWNER'
      });

      console.log('[SqliteProjectService] Saving to store');
      await this.dbService.saveToStore();

      console.log('[SqliteProjectService] Reloading projects');
      await this.loadProjects();

      const createdProject = this.getProjectById(projectId);
      console.log('[SqliteProjectService] Created project:', createdProject);
      return createdProject || null;
    } catch (error) {
      console.error('[SqliteProjectService] ❌ Error creating project in SQLite:', error);
      console.error('[SqliteProjectService] Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });

      // Fallback to localStorage if SQLite fails
      console.log('[SqliteProjectService] 🔄 Falling back to localStorage...');
      try {
        const project = this.createProjectInLocalStorage(dto, userId);
        console.log('[SqliteProjectService] ✅ Project created in localStorage fallback:', project);
        return project;
      } catch (fallbackError) {
        console.error('[SqliteProjectService] ❌ Fallback to localStorage also failed:', fallbackError);
        return null;
      }
    }
  }

  private createProjectInLocalStorage(dto: ICreateProjectDto, userId: string): IProject {
    console.log('[SqliteProjectService] Creating project in localStorage');
    const now = new Date().toISOString();
    const projectId = this.generateId();

    const newProject: IProject = {
      id: projectId,
      nome: dto.nome,
      descricao: dto.descricao,
      cor: dto.cor || '#3880ff',
      icon: 'briefcase',
      status: ProjectStatus.ACTIVE,
      ownerId: userId,
      dataCriacao: now,
      dataAtualizacao: now,
      tasks: [],
      members: [{
        userId: userId,
        nome: 'Você',
        email: '',
        role: 'OWNER',
        dataEntrada: now
      }]
    };

    const allProjects = this.getAllProjectsFromLocalStorage();
    allProjects.push(newProject);
    this.saveProjectsToLocalStorage(allProjects);
    this.projectsSubject.next(allProjects);

    console.log('[SqliteProjectService] Project created in localStorage:', newProject);
    return newProject;
  }

  private getAllProjectsFromLocalStorage(): IProject[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[SqliteProjectService] Error reading from localStorage:', error);
      return [];
    }
  }

  async updateProject(id: string, dto: IUpdateProjectDto): Promise<IProject | null> {
    if (this.platform === 'web') {
      return this.updateProjectInLocalStorage(id, dto);
    }

    try {
      const db = await this.dbService.getDb();
      const now = new Date().toISOString();

      const updates: string[] = [];
      const values: any[] = [];

      if (dto.nome !== undefined) {
        updates.push('nome = ?');
        values.push(dto.nome);
      }
      if (dto.descricao !== undefined) {
        updates.push('descricao = ?');
        values.push(dto.descricao);
      }
      if (dto.cor !== undefined) {
        updates.push('cor = ?');
        values.push(dto.cor);
      }
      if (dto.status !== undefined) {
        updates.push('status = ?');
        values.push(dto.status);
      }

      if (updates.length === 0) {
        return this.getProjectById(id) || null;
      }

      updates.push('data_atualizacao = ?');
      values.push(now);
      values.push(id);

      const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`;
      await db.run(query, values);
      await this.dbService.saveToStore();
      await this.loadProjects();

      return this.getProjectById(id) || null;
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }

  private updateProjectInLocalStorage(id: string, dto: IUpdateProjectDto): IProject | null {
    const allProjects = this.getAllProjectsFromLocalStorage();
    const index = allProjects.findIndex(p => p.id === id);

    if (index === -1) {
      return null;
    }

    const now = new Date().toISOString();
    allProjects[index] = {
      ...allProjects[index],
      ...dto,
      dataAtualizacao: now
    };

    this.saveProjectsToLocalStorage(allProjects);

    // Recarregar projetos para atualizar as tarefas
    this.loadProjectsFromLocalStorage();

    return this.projectsSubject.value.find(p => p.id === id) || null;
  }

  async deleteProject(id: string): Promise<boolean> {
    if (this.platform === 'web') {
      return this.deleteProjectInLocalStorage(id);
    }

    try {
      const db = await this.dbService.getDb();
      await db.run('DELETE FROM projects WHERE id = ?', [id]);
      await this.dbService.saveToStore();
      await this.loadProjects();
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  private deleteProjectInLocalStorage(id: string): boolean {
    const allProjects = this.getAllProjectsFromLocalStorage();
    const filtered = allProjects.filter(p => p.id !== id);

    if (filtered.length === allProjects.length) {
      return false;
    }

    this.saveProjectsToLocalStorage(filtered);
    this.projectsSubject.next(filtered);
    return true;
  }

  async archiveProject(id: string): Promise<IProject | null> {
    return this.updateProject(id, { status: ProjectStatus.ARCHIVED });
  }

  async completeProject(id: string): Promise<IProject | null> {
    return this.updateProject(id, { status: ProjectStatus.COMPLETED });
  }

  async addMemberToProject(projectId: string, member: { userId: string; nome: string; email: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' }): Promise<boolean> {
    if (this.platform === 'web') {
      // Para web/localStorage, os membros já são adicionados no createProjectInLocalStorage
      console.log('[SqliteProjectService] Skipping addMemberToProject on web platform (handled in localStorage)');
      return true;
    }

    try {
      const db = await this.dbService.getDb();
      const memberId = this.generateId();
      const now = new Date().toISOString();

      const query = `
        INSERT INTO project_members (id, project_id, user_id, role, adicionado_em)
        VALUES (?, ?, ?, ?, ?)
      `;

      await db.run(query, [memberId, projectId, member.userId, member.role, now]);
      await this.dbService.saveToStore();
      await this.loadProjects();
      return true;
    } catch (error) {
      console.error('[SqliteProjectService] ❌ Error adding member:', error);
      console.error('[SqliteProjectService] Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message
      });
      return false;
    }
  }

  async removeMemberFromProject(projectId: string, userId: string): Promise<boolean> {
    try {
      const project = this.getProjectById(projectId);
      if (!project || project.ownerId === userId) {
        return false; // Cannot remove owner
      }

      const db = await this.dbService.getDb();
      await db.run('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
      await this.dbService.saveToStore();
      await this.loadProjects();
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  }

  async addTaskToProject(projectId: string, taskId: string): Promise<boolean> {
    if (this.platform === 'web') {
      // No localStorage, as tarefas já têm projectId associado
      // Apenas recarrega os projetos para atualizar o contador
      this.loadProjectsFromLocalStorage();
      return true;
    }

    try {
      const db = await this.dbService.getDb();
      await db.run('UPDATE tasks SET project_id = ? WHERE id = ?', [projectId, taskId]);
      await this.dbService.saveToStore();
      await this.loadProjects();
      return true;
    } catch (error) {
      console.error('Error adding task to project:', error);
      return false;
    }
  }

  async removeTaskFromProject(taskId: string): Promise<boolean> {
    if (this.platform === 'web') {
      // No localStorage, as tarefas já têm projectId associado
      // Apenas recarrega os projetos para atualizar o contador
      this.loadProjectsFromLocalStorage();
      return true;
    }

    try {
      const db = await this.dbService.getDb();
      await db.run('UPDATE tasks SET project_id = NULL WHERE id = ?', [taskId]);
      await this.dbService.saveToStore();
      await this.loadProjects();
      return true;
    } catch (error) {
      console.error('Error removing task from project:', error);
      return false;
    }
  }

  /**
   * Atualiza a lista de projetos (útil quando tarefas são criadas/removidas)
   */
  public refreshProjects(userId?: string): void {
    if (this.platform === 'web') {
      this.loadProjectsFromLocalStorage(userId);
    } else {
      this.loadProjects(userId);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
