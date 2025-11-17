import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IProject, ICreateProjectDto, IUpdateProjectDto, ProjectStatus } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private projectsSubject = new BehaviorSubject<IProject[]>([]);
  public projects$ = this.projectsSubject.asObservable();

  constructor() {
    this.loadProjects();
  }

  private loadProjects(): void {
    const stored = localStorage.getItem('projects');
    if (stored) {
      this.projectsSubject.next(JSON.parse(stored));
    }
  }

  private saveProjects(projects: IProject[]): void {
    localStorage.setItem('projects', JSON.stringify(projects));
    this.projectsSubject.next(projects);
  }

  getProjects(): Observable<IProject[]> {
    return this.projects$;
  }

  getProjectById(id: string): IProject | undefined {
    return this.projectsSubject.value.find(p => p.id === id);
  }

  getProjectsByUserId(userId: string): IProject[] {
    return this.projectsSubject.value.filter(p =>
      p.ownerId === userId ||
      p.members?.some(m => m.userId === userId)
    );
  }

  createProject(dto: ICreateProjectDto, userId: string): IProject {
    const now = new Date().toISOString();
    const newProject: IProject = {
      id: this.generateId(),
      nome: dto.nome,
      descricao: dto.descricao,
      cor: dto.cor || '#3880ff',
      icon: dto.icon || 'briefcase',
      status: ProjectStatus.ACTIVE,
      ownerId: userId,
      dataCriacao: now,
      dataAtualizacao: now,
      dataInicio: dto.dataInicio,
      dataFim: dto.dataFim,
      tasks: [],
      members: [{
        userId: userId,
        nome: 'Você',
        email: '',
        role: 'OWNER',
        dataEntrada: now
      }]
    };

    const projects = [...this.projectsSubject.value, newProject];
    this.saveProjects(projects);
    return newProject;
  }

  updateProject(id: string, dto: IUpdateProjectDto): IProject | null {
    const projects = this.projectsSubject.value;
    const index = projects.findIndex(p => p.id === id);

    if (index === -1) {
      return null;
    }

    const updatedProject: IProject = {
      ...projects[index],
      ...dto,
      dataAtualizacao: new Date().toISOString()
    };

    projects[index] = updatedProject;
    this.saveProjects(projects);
    return updatedProject;
  }

  deleteProject(id: string): boolean {
    const projects = this.projectsSubject.value.filter(p => p.id !== id);
    if (projects.length === this.projectsSubject.value.length) {
      return false;
    }
    this.saveProjects(projects);
    return true;
  }

  archiveProject(id: string): IProject | null {
    return this.updateProject(id, { status: ProjectStatus.ARCHIVED });
  }

  completeProject(id: string): IProject | null {
    return this.updateProject(id, { status: ProjectStatus.COMPLETED });
  }

  addMember(projectId: string, member: { userId: string; nome: string; email: string; role: 'ADMIN' | 'MEMBER' | 'VIEWER' }): boolean {
    const project = this.getProjectById(projectId);
    if (!project) {
      return false;
    }

    const memberExists = project.members?.some(m => m.userId === member.userId);
    if (memberExists) {
      return false;
    }

    const newMember = {
      ...member,
      dataEntrada: new Date().toISOString()
    };

    const updatedMembers = [...(project.members || []), newMember];
    this.updateProject(projectId, { members: updatedMembers });
    return true;
  }

  removeMember(projectId: string, userId: string): boolean {
    const project = this.getProjectById(projectId);
    if (!project || project.ownerId === userId) {
      return false; // Cannot remove owner
    }

    const updatedMembers = project.members?.filter(m => m.userId !== userId) || [];
    this.updateProject(projectId, { members: updatedMembers });
    return true;
  }

  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Task-related methods
  addTaskToProject(projectId: string, taskId: string): boolean {
    const project = this.getProjectById(projectId);
    if (!project) {
      return false;
    }

    const tasks = project.tasks || [];
    if (tasks.includes(taskId)) {
      return false;
    }

    this.updateProject(projectId, { tasks: [...tasks, taskId] });
    return true;
  }

  removeTaskFromProject(projectId: string, taskId: string): boolean {
    const project = this.getProjectById(projectId);
    if (!project) {
      return false;
    }

    const tasks = (project.tasks || []).filter(t => t !== taskId);
    this.updateProject(projectId, { tasks });
    return true;
  }
}
