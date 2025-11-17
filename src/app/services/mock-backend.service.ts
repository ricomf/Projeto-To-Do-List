import { Injectable } from '@angular/core';
import {
  IAuthResponse,
  ILogin,
  IRegister,
  ITask,
  TaskStatus,
  TaskPriority,
  UserRole
} from '../models'; 

/**
 * Mock Backend Service
 * Simula um backend para desenvolvimento sem API real
 */
@Injectable({
  providedIn: 'root'
})
export class MockBackendService {
  private readonly STORAGE_KEY = 'mock_users';
  private readonly TASKS_KEY = 'mock_tasks';

  constructor() {
    this.initializeMockData();
  }

  /**
   * Inicializa dados mock no localStorage
   */
  private initializeMockData() {
    // ✅ CORREÇÃO: Só inicializa se NÃO houver dados salvos
    // Isso permite persistência dos dados cadastrados

    if (!localStorage.getItem(this.STORAGE_KEY)) {
      const defaultUser = {
        id: 'mock-user-123',
        nome: 'Mock Test User',
        email: 'test@mock.com',
        password: 'password', // Senha de teste: "password"
        avatarUrl: null,
        roles: [UserRole.USER],
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        ativo: true
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([defaultUser]));
      console.log('[MockBackend] ✅ Mock data initialized with default user: test@mock.com / password');
    } else {
      const users = this.getUsers();
      console.log(`[MockBackend] ✅ Found ${users.length} existing user(s) in localStorage`);
    }

    if (!localStorage.getItem(this.TASKS_KEY)) {
      localStorage.setItem(this.TASKS_KEY, JSON.stringify(this.getDefaultTasks()));
      console.log('[MockBackend] ✅ Mock tasks initialized');
    }
  }

  /**
   * Simula login
   */
  async login(credentials: ILogin): Promise<IAuthResponse> {
    await this.delay(500);

    const users = this.getUsers();
    const user = users.find(u => u.email === credentials.email);

    // Garante que o usuário existe
    if (!user) {
      console.error(`[MockBackend] Login falhou: Usuário ${credentials.email} não encontrado.`);
      // 🚨 Throw é o que permite ao componente exibir o erro
      throw new Error('Email ou senha inválidos'); 
    }
    
    // Garante que a senha é exatamente igual à string "password"
    if (user.password !== credentials.password) {
      console.error(`[MockBackend] Login falhou: Senha incorreta para ${credentials.email}.`);
      // 🚨 Throw é o que permite ao componente exibir o erro
      throw new Error('Email ou senha inválidos'); 
    }

    console.log(`[MockBackend] ✅ Login bem-sucedido para: ${user.email}`);
    return this.createAuthResponse(user);
  }

  /**
   * Simula registro
   */
  async register(userData: IRegister): Promise<IAuthResponse> {
    await this.delay(500);

    const users = this.getUsers();

    if (users.find(u => u.email === userData.email)) {
      throw new Error('Email já cadastrado');
    }

    if (userData.password !== userData.confirmPassword) {
      throw new Error('As senhas não coincidem');
    }

    const newUser = {
      id: this.generateId(),
      nome: userData.nome,
      email: userData.email,
      password: userData.password,
      avatarUrl: null,
      roles: [UserRole.USER],
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
      ativo: true
    };

    users.push(newUser);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));

    return this.createAuthResponse(newUser);
  }

  /**
   * Cria resposta de autenticação
   */
  private createAuthResponse(user: any): IAuthResponse {
    const token = this.generateToken();
    const refreshToken = this.generateToken();

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        avatarUrl: user.avatarUrl,
        roles: user.roles
      },
      token,
      refreshToken,
      expiresIn: 3600
    };
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: { nome?: string; email?: string; avatarUrl?: string }): Promise<any> {
    await this.delay(300);

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado');
    }

    const user = users[userIndex];

    // Update only provided fields
    if (updates.nome !== undefined) {
      user.nome = updates.nome;
    }

    if (updates.email !== undefined) {
      // Check if email is already taken by another user
      const emailExists = users.some(u => u.id !== userId && u.email === updates.email);
      if (emailExists) {
        throw new Error('Email já está em uso');
      }
      user.email = updates.email;
    }

    if (updates.avatarUrl !== undefined) {
      user.avatarUrl = updates.avatarUrl;
    }

    user.dataAtualizacao = new Date();

    // Save updated users
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));

    console.log('[MockBackend] ✅ User updated successfully');
    return user;
  }

  /**
   * Retorna usuários do localStorage
   */
  private getUsers(): any[] {
    const users = localStorage.getItem(this.STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  }

  /**
   * Gera ID único
   */
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Gera token mock
   */
  private generateToken(): string {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEBtb2NrLmNvbSJ9.S' + Math.random().toString(36).substring(2);
  }

  /**
   * Simula delay de rede
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Tarefas padrão para demonstração
   */
  private getDefaultTasks(): ITask[] {
    return [
      { id: '1', titulo: 'Configurar projeto Ionic', descricao: 'Instalar dependências e configurar ambiente de desenvolvimento', status: TaskStatus.COMPLETED, dataVencimento: new Date('2025-10-10'), dataCriacao: new Date('2025-10-01'), dataAtualizacao: new Date('2025-10-05'), prioridade: TaskPriority.HIGH, userId: 'mock-user-123', tags: ['setup', 'desenvolvimento'], isPublic: false, assignedTo: ['mock-user-123'], completed: true, completedAt: new Date('2025-10-05') },
      { id: '2', titulo: 'Implementar autenticação JWT', descricao: 'Criar sistema de login com tokens JWT e refresh tokens', status: TaskStatus.IN_PROGRESS, dataVencimento: new Date('2025-10-15'), dataCriacao: new Date('2025-10-02'), dataAtualizacao: new Date('2025-10-07'), prioridade: TaskPriority.URGENT, userId: 'mock-user-123', tags: ['backend', 'segurança'], isPublic: false, assignedTo: ['mock-user-123'] },
      { id: '3', titulo: 'Design de UI/UX', descricao: 'Criar mockups e protótipos para as principais telas', status: TaskStatus.TODO, dataVencimento: new Date('2025-10-20'), dataCriacao: new Date('2025-10-03'), dataAtualizacao: new Date('2025-10-03'), prioridade: TaskPriority.MEDIUM, userId: 'mock-user-123', tags: ['design', 'ui/ux'], isPublic: false, assignedTo: ['mock-user-123'] },
      { id: '4', titulo: 'Implementar tema escuro', descricao: 'Adicionar suporte completo para modo escuro', status: TaskStatus.TODO, dataVencimento: new Date('2025-10-25'), dataCriacao: new Date('2025-10-04'), dataAtualizacao: new Date('2025-10-04'), prioridade: TaskPriority.LOW, userId: 'mock-user-123', tags: ['frontend', 'ui'], isPublic: false, assignedTo: ['mock-user-123'] }
    ];
  }
}