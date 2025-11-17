export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
  ON_HOLD = 'ON_HOLD'
}

export interface IProjectMember {
  userId: string;
  nome: string;
  email: string;
  avatarUrl?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  dataEntrada: Date | string;
}

export interface IProject {
  id: string;
  nome: string;
  descricao?: string;
  status: ProjectStatus;
  dataCriacao: Date | string;
  dataAtualizacao: Date | string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
  ownerId: string;
  tasks?: string[];  // Array of task IDs
  members?: IProjectMember[];
  cor?: string;
  icon?: string;
}

export interface ICreateProjectDto {
  nome: string;
  descricao?: string;
  dataInicio?: Date;
  dataFim?: Date;
  cor?: string;
  icon?: string;
  members?: string[]; // Array de user IDs
}

export interface IUpdateProjectDto {
  nome?: string;
  descricao?: string;
  status?: ProjectStatus;
  dataInicio?: Date;
  dataFim?: Date;
  cor?: string;
  icon?: string;
}

export interface IProjectInvite {
  projectId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}
