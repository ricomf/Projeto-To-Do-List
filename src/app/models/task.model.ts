export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface ITask {
  id: string;
  titulo: string;
  descricao?: string;
  status: TaskStatus;
  dataVencimento?: Date;
  dataCriacao: Date;
  dataAtualizacao: Date;
  dataConclusao?: Date;
  prioridade: TaskPriority;
  userId: string;
  tags: string[];
  isPublic: boolean;
  assignedTo: string[]; // Array de user IDs
  projectId?: string;
  categoryId?: string;
  completed?: boolean;
  completedAt?: Date;
  anexos?: string[];
}

export interface ICreateTaskDto {
  titulo: string;
  descricao?: string;
  dataVencimento?: Date;
  prioridade: TaskPriority;
  tags?: string[];
  isPublic?: boolean;
  assignedTo?: string[];
  projectId?: string;
  categoryId?: string;
}

export interface IUpdateTaskDto {
  titulo?: string;
  descricao?: string;
  status?: TaskStatus;
  dataVencimento?: Date;
  prioridade?: TaskPriority;
  tags?: string[];
  isPublic?: boolean;
  assignedTo?: string[];
  categoryId?: string;
}
