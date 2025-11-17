export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

export interface IUser {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  dataNascimento?: Date;
  bio?: string;
  avatarUrl?: string;
  roles: UserRole[];
  dataCriacao: Date;
  dataAtualizacao: Date;
  ativo: boolean;
  preferencias?: IUserPreferences;
}

export interface IUserProfile extends IUser {
  telefone?: string;
  bio?: string;
  preferencias?: IUserPreferences;
}

export interface IUserPreferences {
  notificacoesEmail: boolean;
  notificacoesPush: boolean;
  tema: 'light' | 'dark' | 'auto';
  idioma: string;
}
