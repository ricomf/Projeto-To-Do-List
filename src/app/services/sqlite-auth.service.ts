import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { IUser, ILogin, IRegister, IAuthResponse, UserRole } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SQLiteAuthService {
  constructor(private db: DatabaseService) {}

  /**
   * Hash password using Web Crypto API (browser compatible)
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  // O método register() permanece inalterado e é o único que cria usuários.
  async register(userData: IRegister): Promise<IAuthResponse> {
    // ... (Seu código de register continua aqui, está correto)
    try {
      // Check if user already exists
      const existingUser = await this.db.query(
        'SELECT * FROM users WHERE email = ?',
        [userData.email]
      );

      if (existingUser.values && existingUser.values.length > 0) {
        throw new Error('Email já cadastrado');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Generate user ID
      const userId = this.db.generateId();
      const now = this.db.dateToSQL(new Date());

      // Insert user
      await this.db.run(
        `INSERT INTO users (id, nome, email, password, roles, data_criacao, ultima_atualizacao)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, userData.nome, userData.email, hashedPassword, JSON.stringify([UserRole.USER]), now, now]
      );

      // Create default preferences
      await this.db.run(
        `INSERT INTO user_preferences (user_id, tema, idioma, notificacoes_push, notificacoes_email)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, 'auto', 'pt-BR', 1, 1]
      );

      // Generate tokens
      const token = this.generateToken();
      const refreshToken = this.generateToken();
      const expiresAt = this.db.dateToSQL(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours

      // Store tokens
      await this.db.run(
        `INSERT INTO auth_tokens (user_id, token, refresh_token, expires_at)
         VALUES (?, ?, ?, ?)`,
        [userId, token, refreshToken, expiresAt]
      );

      // FORÇA SALVAMENTO no IndexedDB
      console.log('[SQLiteAuth] Forcing database save after registration...');
      await this.db.forceSave();
      console.log('[SQLiteAuth] ✅ Database saved successfully');

      // Fetch created user
      const user = await this.getUserById(userId);

      if (!user) {
        throw new Error('Erro ao criar usuário');
      }

      return {
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          avatarUrl: user.avatarUrl,
          roles: user.roles as any
        },
        token,
        refreshToken,
        expiresIn: 86400
      };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao criar conta');
    }
  }


  async login(credentials: ILogin): Promise<IAuthResponse> {
    try {
      console.log('[SQLiteAuth] Login attempt for:', credentials.email);

      // 1. Find user by email
      const result = await this.db.query(
        'SELECT * FROM users WHERE email = ?',
        [credentials.email]
      );

      console.log('[SQLiteAuth] Query result:', result);

      // 🚨 CORREÇÃO CRÍTICA: Se o usuário não for encontrado, LANCE UM ERRO.
      if (!result.values || result.values.length === 0) {
        console.error('[SQLiteAuth] ❌ Usuário não encontrado. Negando login.');
        throw new Error('Email ou senha inválidos');
      }

      const userData = result.values[0];
      console.log('[SQLiteAuth] User found:', userData.email);

      // 2. Verify password
      const isPasswordValid = await this.verifyPassword(credentials.password, userData.password);

      if (!isPasswordValid) {
        console.error('[SQLiteAuth] ❌ Senha inválida.');
        throw new Error('Email ou senha inválidos');
      }

      console.log('[SQLiteAuth] Password verified');

      // 3. Generate and store new tokens
      const token = this.generateToken();
      const refreshToken = this.generateToken();
      const expiresAt = this.db.dateToSQL(new Date(Date.now() + 24 * 60 * 60 * 1000));

      await this.db.run(
        `INSERT OR REPLACE INTO auth_tokens (user_id, token, refresh_token, expires_at)
         VALUES (?, ?, ?, ?)`,
        [userData.id, token, refreshToken, expiresAt]
      );

      // 4. Get user with preferences
      const user = await this.getUserById(userData.id);

      if (!user) {
        throw new Error('Erro ao buscar dados do usuário');
      }

      console.log('[SQLiteAuth] Login successful, returning response');

      return {
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          avatarUrl: user.avatarUrl,
          roles: user.roles as any
        },
        token,
        refreshToken,
        expiresIn: 86400
      };
    } catch (error: any) {
      // Re-lança a mensagem de erro específica para o componente de login
      throw new Error(error.message || 'Erro ao fazer login'); 
    }
  }

  // ... (O restante dos seus métodos: logout, refreshToken, validateToken, getUserById, generateToken permanecem inalterados)
  // ...
  
  async logout(userId: string): Promise<void> {
    await this.db.run('DELETE FROM auth_tokens WHERE user_id = ?', [userId]);
  }

  async refreshToken(refreshToken: string): Promise<IAuthResponse | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM auth_tokens WHERE refresh_token = ?',
        [refreshToken]
      );

      if (!result.values || result.values.length === 0) {
        return null;
      }

      const tokenData = result.values[0];

      // Check if token is expired
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt < new Date()) {
        await this.db.run('DELETE FROM auth_tokens WHERE user_id = ?', [tokenData.user_id]);
        return null;
      }

      // Generate new tokens
      const newToken = this.generateToken();
      const newRefreshToken = this.generateToken();
      const newExpiresAt = this.db.dateToSQL(new Date(Date.now() + 24 * 60 * 60 * 1000));

      // Update tokens
      await this.db.run(
        `UPDATE auth_tokens SET token = ?, refresh_token = ?, expires_at = ? WHERE user_id = ?`,
        [newToken, newRefreshToken, newExpiresAt, tokenData.user_id]
      );

      // Get user
      const user = await this.getUserById(tokenData.user_id);

      if (!user) {
        return null;
      }

      return {
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          avatarUrl: user.avatarUrl,
          roles: user.roles as any
        },
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: 86400
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  async validateToken(token: string): Promise<IUser | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM auth_tokens WHERE token = ?',
        [token]
      );

      if (!result.values || result.values.length === 0) {
        return null;
      }

      const tokenData = result.values[0];

      // Check if token is expired
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt < new Date()) {
        await this.db.run('DELETE FROM auth_tokens WHERE user_id = ?', [tokenData.user_id]);
        return null;
      }

      return await this.getUserById(tokenData.user_id);
    } catch (error) {
      console.error('Error validating token:', error);
      return null;
    }
  }

  private async getUserById(userId: string): Promise<IUser | null> {
    try {
      const userResult = await this.db.query(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (!userResult.values || userResult.values.length === 0) {
        return null;
      }

      const userData = userResult.values[0];

      // Get preferences
      const prefsResult = await this.db.query(
        'SELECT * FROM user_preferences WHERE user_id = ?',
        [userId]
      );

      const preferences = prefsResult.values?.[0] || {
        tema: 'auto',
        idioma: 'pt-BR',
        notificacoes_push: true,
        notificacoes_email: true
      };

      // Convert database row to IUser
      const user: IUser = {
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        avatarUrl: userData.avatar_url,
        telefone: userData.telefone,
        dataNascimento: userData.data_nascimento ? this.db.sqlToDate(userData.data_nascimento) : undefined,
        bio: userData.bio,
        roles: JSON.parse(userData.roles),
        dataCriacao: this.db.sqlToDate(userData.data_criacao),
        dataAtualizacao: this.db.sqlToDate(userData.ultima_atualizacao),
        ativo: Boolean(userData.ativo),
        preferencias: {
          tema: preferences.tema,
          idioma: preferences.idioma,
          notificacoesPush: Boolean(preferences.notificacoes_push),
          notificacoesEmail: Boolean(preferences.notificacoes_email)
        }
      };

      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: { nome?: string; email?: string; avatarUrl?: string }): Promise<IUser | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.nome !== undefined) {
        fields.push('nome = ?');
        values.push(updates.nome);
      }

      if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(updates.email);
      }

      if (updates.avatarUrl !== undefined) {
        fields.push('avatar_url = ?');
        values.push(updates.avatarUrl);
      }

      if (fields.length === 0) {
        return await this.getUserById(userId);
      }

      // Update ultima_atualizacao
      fields.push('ultima_atualizacao = ?');
      values.push(this.db.dateToSQL(new Date()));

      // Add userId to values array
      values.push(userId);

      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

      await this.db.run(sql, values);

      // Force save to IndexedDB
      console.log('[SQLiteAuth] Forcing database save after user update...');
      await this.db.forceSave();
      console.log('[SQLiteAuth] ✅ Database saved successfully');

      return await this.getUserById(userId);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  private generateToken(): string {
    // Generate a simple JWT-like token for browser compatibility
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: this.db.generateId(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const base64Header = btoa(JSON.stringify(header)).replace(/=/g, '');
    const base64Payload = btoa(JSON.stringify(payload)).replace(/=/g, '');
    const signature = Array.from({ length: 43 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    return `${base64Header}.${base64Payload}.${signature}`;
  }
}