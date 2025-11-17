import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { MockBackendService } from './mock-backend.service';
import { SQLiteAuthService } from './sqlite-auth.service';
import { DatabaseService } from './database.service';
import { ILogin, IRegister, IAuthResponse, ITokenPayload, IUser } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Configurações iniciais (ajustáveis com base no ambiente ou inicialização)
  private useSQLite = false; 
  private useMockBackend = true; 
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';

  private currentUserSubject = new BehaviorSubject<IUser | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private initPromise: Promise<void> | null = null;

  constructor(
    private apiService: ApiService,
    private mockBackend: MockBackendService,
    private sqliteAuth: SQLiteAuthService,
    private database: DatabaseService
  ) {
    this.initPromise = this.initializeDatabase();
    this.checkTokenExpiration();
  }

  private async initializeDatabase(): Promise<void> {
    const platform = (window as any).Capacitor?.getPlatform() || 'web';

    // Apenas tenta inicializar SQLite em plataformas nativas
    if (platform !== 'web') {
      try {
        console.log('[AuthService] Native platform - Initializing SQLite database...');
        await this.database.initialize();
        console.log('[AuthService] ✅ SQLite database initialized successfully');
        this.useSQLite = true;
        this.useMockBackend = false;
      } catch (error) {
        console.error('[AuthService] ❌ Failed to initialize SQLite on native platform:', error);
        this.useSQLite = false;
        this.useMockBackend = true;
      }
    } else {
      // No navegador, usa apenas Mock Backend
      console.log('[AuthService] Web platform - Using Mock Backend');
      this.useSQLite = false;
      this.useMockBackend = true;
    }
  }

  /**
   * Wait for database initialization
   */
  async waitForInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Get current user value
   */
  get currentUserValue(): IUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated (SÍNCRONO - APENAS TOKEN)
   */
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Login user
   */
  async login(credentials: ILogin): Promise<IAuthResponse> {
    try {
      console.log('[AuthService] Login attempt START');
      console.log('[AuthService] - useSQLite:', this.useSQLite);
      console.log('[AuthService] - useMockBackend:', this.useMockBackend);
      console.log('[AuthService] - credentials:', { email: credentials.email, passwordLength: credentials.password?.length });

      let response: IAuthResponse;

      if (this.useSQLite) {
        console.log('[AuthService] Using SQLite authentication...');
        await this.waitForInit();
        response = await this.sqliteAuth.login(credentials);
        console.log('[AuthService] SQLite login response:', { success: !!response.token, userId: response.user?.id });
      } else if (this.useMockBackend) {
        console.log('[AuthService] Using Mock Backend authentication...');
        // O Mock agora verifica credenciais antes de retornar sucesso
        response = await this.mockBackend.login(credentials);
        console.log('[AuthService] Mock login response:', { success: !!response.token, userId: response.user?.id });
      } else {
        console.log('[AuthService] Using Real API authentication...');
        // API real
        response = await lastValueFrom(
          this.apiService.post<IAuthResponse>('auth/login', credentials)
        );
        console.log('[AuthService] API login response:', { success: !!response.token, userId: response.user?.id });
      }

      console.log('[AuthService] Setting session...');
      this.setSession(response);
      console.log('[AuthService] Session set successfully');
      console.log('[AuthService] isAuthenticated:', this.isAuthenticated);

      return response;
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      console.error('[AuthService] Error details:', JSON.stringify(error));
      // Re-lança o erro para que o componente de login possa exibi-lo
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: IRegister): Promise<IAuthResponse> {
    try {
      let response: IAuthResponse;

      if (this.useSQLite) {
        response = await this.sqliteAuth.register(userData);
      } else if (this.useMockBackend) {
        response = await this.mockBackend.register(userData);
      } else {
        response = await lastValueFrom(
          this.apiService.post<IAuthResponse>('auth/register', userData)
        );
      }

      this.setSession(response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const userId = this.currentUserValue?.id;

      if (this.useSQLite && userId) {
        await this.sqliteAuth.logout(userId);
      } else if (!this.useMockBackend) {
        await lastValueFrom(this.apiService.post('auth/logout', {}));
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
    }
  }

  /**
   * Refresh access token (Lógica simplificada)
   */
  async refreshToken(): Promise<IAuthResponse | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return null;
    }

    try {
      let response: IAuthResponse | null;

      if (this.useSQLite) {
        response = await this.sqliteAuth.refreshToken(refreshToken);
      } else if (!this.useMockBackend) {
        response = await lastValueFrom(
          this.apiService.post<IAuthResponse>('auth/refresh', { refreshToken })
        );
      } else {
        // Mock backend não suporta refresh
        this.clearSession();
        return null;
      }

      if (response) {
        this.setSession(response);
      } else {
        this.clearSession();
      }

      return response;
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  /**
   * Get stored access token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // ============== MÉTODOS DE VERIFICAÇÃO ASYNCRONA PARA O GUARD ================

  public getCurrentUserId(): string | null {
    const userData = localStorage.getItem(this.USER_KEY);
    if (userData) {
      try {
        const user = JSON.parse(userData) as IUser;
        return user.id || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Verifica se o usuário tem um token válido E se o seu registro existe no banco de dados local.
   */
  async isAuthenticatedAndExists(): Promise<boolean> {
    const token = this.getToken();
    const userId = this.getCurrentUserId();

    console.log('[AuthService:Check] Starting authentication check...');
    console.log('[AuthService:Check] - Token exists:', !!token);
    console.log('[AuthService:Check] - User ID:', userId);
    console.log('[AuthService:Check] - isAuthenticated:', this.isAuthenticated);
    console.log('[AuthService:Check] - useSQLite:', this.useSQLite);
    console.log('[AuthService:Check] - useMockBackend:', this.useMockBackend);

    // 1. Verificação básica (Token e ID local)
    if (!this.isAuthenticated || !token || !userId) {
      console.log('[AuthService:Check] ❌ Falha: Token ou ID do usuário ausente/inválido.');
      return false;
    }

    // 2. Se estiver usando Mock Backend (com ou sem SQLite), permitir acesso
    // Isso permite que o app funcione no Android mesmo se o SQLite falhar
    if (this.useMockBackend) {
        console.log('[AuthService:Check] ✅ Usando Mock Backend. Token válido encontrado. Acesso permitido.');
        return true;
    }

    // 3. Se estiver a usar a API real (nem Mock nem SQLite)
    if (!this.useSQLite && !this.useMockBackend) {
        console.log('[AuthService:Check] ✅ Usando API Real. Confiando na validade do token.');
        return true;
    }

    // 4. Verificação no SQLite (se useSQLite for true)
    console.log('[AuthService:Check] Verificando no banco de dados SQLite...');
    await this.waitForInit();

    try {
      const result = await this.database.query(
        "SELECT id FROM users WHERE id = ?;",
        [userId]
      );

      const exists = result.values && result.values.length > 0;

      if (!exists) {
        console.log(`[AuthService:Check] ❌ Utilizador ID ${userId} não encontrado no banco de dados local.`);
        this.clearSession();
      } else {
        console.log(`[AuthService:Check] ✅ Utilizador ID ${userId} encontrado localmente.`);
      }

      return exists;

    } catch (error) {
      console.error('[AuthService:Check] ❌ Erro ao verificar utilizador no DB local:', error);
      // Em caso de erro no SQLite, se estamos usando Mock Backend, permitir acesso
      if (this.useMockBackend) {
        console.log('[AuthService:Check] ⚠️ Erro no SQLite mas Mock está ativo. Permitindo acesso.');
        return true;
      }
      console.log('[AuthService:Check] ❌ Acesso negado devido a erro no SQLite.');
      this.clearSession();
      return false;
    }
  }

  // ============== FIM DOS MÉTODOS ASYNCRONOS ================

  /**
   * Set user session
   */
  private setSession(authResponse: IAuthResponse): void {
    try {
      // Armazenar apenas dados essenciais do usuário para evitar quota exceeded
      const essentialUserData = {
        id: authResponse.user.id,
        email: authResponse.user.email,
        nome: authResponse.user.nome,
        avatarUrl: authResponse.user.avatarUrl
      };

      localStorage.setItem(this.TOKEN_KEY, authResponse.token);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, authResponse.refreshToken);
      localStorage.setItem(this.USER_KEY, JSON.stringify(essentialUserData));

      this.currentUserSubject.next(authResponse.user as any);
      this.isAuthenticatedSubject.next(true);
    } catch (error: any) {
      console.error('[AuthService] Error setting session:', error);
      // Se houver erro de quota, limpar dados antigos e tentar novamente
      if (error.name === 'QuotaExceededError') {
        console.warn('[AuthService] Storage quota exceeded, clearing old data...');
        this.clearSession();
        // Tentar novamente com apenas dados mínimos
        const minimalUserData = {
          id: authResponse.user.id,
          email: authResponse.user.email,
          nome: authResponse.user.nome
        };
        localStorage.setItem(this.TOKEN_KEY, authResponse.token);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, authResponse.refreshToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(minimalUserData));

        this.currentUserSubject.next(authResponse.user as any);
        this.isAuthenticatedSubject.next(true);
      } else {
        throw error;
      }
    }
  }

  /**
   * Clear user session
   */
  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Get user from storage
   */
  private getUserFromStorage(): IUser | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Check if token is valid
   */
  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // 🚨 CORREÇÃO DE SINTAXE E LÓGICA REFORÇADA:
    if (this.useSQLite) {
      if (!token.includes('.') || token.split('.').length !== 3) { 
        this.clearSession();
        return false;
      }
    }

    if (this.useMockBackend) {
      return true; // Se o Mock está ativo, confiamos na existência do token.
    }

    try {
      const payload = this.decodeToken(token);
      const isExpired = Date.now() >= payload.exp * 1000;
      return !isExpired;
    } catch (error) {
      this.clearSession();
      return false;
    }
  }

  /**
   * Decode JWT token (função de suporte)
   */
  private decodeToken(token: string): ITokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const base64Url = parts[1];
    if (!base64Url) {
      throw new Error('Invalid token payload');
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  /**
   * Update user profile
   */
  async updateUser(updates: { nome?: string; email?: string; avatarUrl?: string }): Promise<IUser | null> {
    try {
      const userId = this.currentUserValue?.id;
      if (!userId) {
        throw new Error('Usuário não está autenticado');
      }

      let updatedUser: any;

      if (this.useSQLite) {
        await this.waitForInit();
        updatedUser = await this.sqliteAuth.updateUser(userId, updates);
      } else if (this.useMockBackend) {
        updatedUser = await this.mockBackend.updateUser(userId, updates);
      } else {
        // API real
        updatedUser = await lastValueFrom(
          this.apiService.patch<IUser>('users/profile', updates)
        );
      }

      if (updatedUser) {
        // Update local storage with new user data
        const currentUser = this.currentUserValue;
        if (currentUser) {
          const newUser = {
            ...currentUser,
            nome: updatedUser.nome,
            email: updatedUser.email,
            avatarUrl: updatedUser.avatarUrl || updatedUser.avatar_url
          };

          localStorage.setItem(this.USER_KEY, JSON.stringify(newUser));
          this.currentUserSubject.next(newUser);
        }
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Check token expiration periodically
   */
  private checkTokenExpiration(): void {
    setInterval(() => {
      if (!this.hasValidToken() && this.isAuthenticated) {
        this.refreshToken().catch(() => this.clearSession());
      }
    }, 60000);
  }
}