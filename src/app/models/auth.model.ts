export interface ILogin {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface IRegister {
  nome: string;
  email: string;
  password: string;
  confirmPassword: string;
  aceitaTermos: boolean;
}

export interface IAuthResponse {
  user: {
    id: string;
    nome: string;
    email: string;
    avatarUrl?: string;
    roles: string[];
  };
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ITokenPayload {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

export interface IChangePassword {
  senhaAtual: string;
  novaSenha: string;
  confirmaNovaSenha: string;
}

export interface IResetPassword {
  email: string;
}

export interface IResetPasswordConfirm {
  token: string;
  novaSenha: string;
  confirmaNovaSenha: string;
}
