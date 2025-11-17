/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly timestamp: Date;
  public code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      isOperational: this.isOperational,
      stack: this.stack
    };
  }
}

/**
 * Authentication related errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Erro de autenticação', code: string = 'AUTH_ERROR') {
    super(message, code, true);
  }
}

/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends AuthenticationError {
  constructor(message: string = 'Credenciais inválidas') {
    super(message, 'INVALID_CREDENTIALS');
  }
}

/**
 * Token expired error
 */
export class TokenExpiredError extends AuthenticationError {
  constructor(message: string = 'Token expirado') {
    super(message, 'TOKEN_EXPIRED');
  }
}

/**
 * Unauthorized access error
 */
export class UnauthorizedError extends AuthenticationError {
  constructor(message: string = 'Acesso não autorizado') {
    super(message, 'UNAUTHORIZED');
  }
}

/**
 * Validation related errors
 */
export class ValidationError extends AppError {
  public readonly fields?: { [key: string]: string[] };

  constructor(message: string = 'Erro de validação', fields?: { [key: string]: string[] }) {
    super(message, 'VALIDATION_ERROR', true);
    this.fields = fields;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      fields: this.fields
    };
  }
}

/**
 * Network related errors
 */
export class NetworkError extends AppError {
  public readonly statusCode?: number;
  public readonly url?: string;

  constructor(
    message: string = 'Erro de rede',
    statusCode?: number,
    url?: string,
    code: string = 'NETWORK_ERROR'
  ) {
    super(message, code, true);
    this.statusCode = statusCode;
    this.url = url;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      url: this.url
    };
  }
}

/**
 * HTTP request timeout
 */
export class TimeoutError extends NetworkError {
  constructor(message: string = 'Tempo de requisição esgotado', url?: string) {
    super(message, 408, url, 'TIMEOUT_ERROR');
  }
}

/**
 * Server error (5xx)
 */
export class ServerError extends NetworkError {
  constructor(message: string = 'Erro do servidor', statusCode: number = 500, url?: string) {
    super(message, statusCode, url, 'SERVER_ERROR');
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends NetworkError {
  constructor(message: string = 'Recurso não encontrado', url?: string) {
    super(message, 404, url, 'NOT_FOUND');
  }
}

/**
 * Database related errors
 */
export class DatabaseError extends AppError {
  public readonly query?: string;

  constructor(message: string = 'Erro no banco de dados', query?: string) {
    super(message, 'DATABASE_ERROR', true);
    this.query = query;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      query: this.query
    };
  }
}

/**
 * Business logic errors
 */
export class BusinessError extends AppError {
  constructor(message: string, code: string = 'BUSINESS_ERROR') {
    super(message, code, true);
  }
}

/**
 * Resource conflict error (e.g., duplicate entry)
 */
export class ConflictError extends BusinessError {
  constructor(message: string = 'Recurso já existe') {
    super(message, 'CONFLICT_ERROR');
  }
}

/**
 * Resource not found in business logic
 */
export class ResourceNotFoundError extends BusinessError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 'RESOURCE_NOT_FOUND');
  }
}

/**
 * Permission denied error
 */
export class PermissionDeniedError extends BusinessError {
  constructor(message: string = 'Permissão negada') {
    super(message, 'PERMISSION_DENIED');
  }
}

/**
 * Storage related errors
 */
export class StorageError extends AppError {
  constructor(message: string = 'Erro no armazenamento', code: string = 'STORAGE_ERROR') {
    super(message, code, true);
  }
}

/**
 * Storage quota exceeded
 */
export class StorageQuotaError extends StorageError {
  constructor(message: string = 'Espaço de armazenamento insuficiente') {
    super(message, 'STORAGE_QUOTA_EXCEEDED');
  }
}

/**
 * Unexpected/Unknown error
 */
export class UnexpectedError extends AppError {
  constructor(message: string = 'Erro inesperado', originalError?: any) {
    super(message, 'UNEXPECTED_ERROR', false);
    if (originalError) {
      this.stack = originalError.stack || this.stack;
    }
  }
}

/**
 * Error codes constants
 */
export const ErrorCodes = {
  // Authentication
  AUTH_ERROR: 'AUTH_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Business
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // Storage
  STORAGE_ERROR: 'STORAGE_ERROR',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',

  // Unknown
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

/**
 * User-friendly error messages
 */
export const ErrorMessages: { [key: string]: string } = {
  [ErrorCodes.AUTH_ERROR]: 'Erro de autenticação. Por favor, tente novamente.',
  [ErrorCodes.INVALID_CREDENTIALS]: 'Email ou senha incorretos.',
  [ErrorCodes.TOKEN_EXPIRED]: 'Sua sessão expirou. Por favor, faça login novamente.',
  [ErrorCodes.UNAUTHORIZED]: 'Você não tem permissão para acessar este recurso.',
  [ErrorCodes.VALIDATION_ERROR]: 'Os dados fornecidos são inválidos.',
  [ErrorCodes.NETWORK_ERROR]: 'Erro de conexão. Verifique sua internet.',
  [ErrorCodes.TIMEOUT_ERROR]: 'A requisição demorou muito. Tente novamente.',
  [ErrorCodes.SERVER_ERROR]: 'Erro no servidor. Tente novamente mais tarde.',
  [ErrorCodes.NOT_FOUND]: 'Recurso não encontrado.',
  [ErrorCodes.DATABASE_ERROR]: 'Erro ao acessar os dados.',
  [ErrorCodes.CONFLICT_ERROR]: 'Este recurso já existe.',
  [ErrorCodes.RESOURCE_NOT_FOUND]: 'Recurso não encontrado.',
  [ErrorCodes.PERMISSION_DENIED]: 'Você não tem permissão para realizar esta ação.',
  [ErrorCodes.STORAGE_ERROR]: 'Erro ao salvar dados.',
  [ErrorCodes.STORAGE_QUOTA_EXCEEDED]: 'Espaço de armazenamento insuficiente.',
  [ErrorCodes.UNEXPECTED_ERROR]: 'Ocorreu um erro inesperado.',
  [ErrorCodes.UNKNOWN_ERROR]: 'Ocorreu um erro desconhecido.'
};
