export interface ICategory {
  id: string;
  nome: string;
  icon: string;
  cor?: string;
  descricao?: string;
  userId?: string; // null para categorias globais
  dataCriacao: Date;
}

export interface ICreateCategoryDto {
  nome: string;
  icon: string;
  cor?: string;
  descricao?: string;
}
