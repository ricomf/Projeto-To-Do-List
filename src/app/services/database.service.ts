import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private isInitialized = false;
  private platform: string;

  constructor() {
    this.platform = Capacitor.getPlatform();
    // Apenas instancia a conexão, não a inicializa.
    this.sqlite = new SQLiteConnection(CapacitorSQLite); 
  }

  /**
   * ❌ FUNÇÃO initWebStore() REMOVIDA
   * A lógica de inicialização do WebStore e manipulação do DOM
   * foi movida para o main.ts (Passo 3) e app.component.html (Passo 2).
   * O DatabaseService agora apenas CONTA que o WebStore esteja pronto.
   */

  /**
   * Inicializa o banco de dados
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[DatabaseService] Already initialized');
      return;
    }

    try {
      console.log('[DatabaseService] Starting initialization on platform:', this.platform);

      // ✅ AGUARDA O WebStore estar pronto (web)
      if (this.platform === 'web') {
        console.log('[DatabaseService] 🔍 Checking WebStore status...');
        console.log('[DatabaseService] Current isSQLiteInitialized:', (window as any).isSQLiteInitialized);

        let attempts = 0;
        const maxAttempts = 50;

        while (!(window as any).isSQLiteInitialized && attempts < maxAttempts) {
          console.log(`[DatabaseService] ⏳ Waiting for WebStore... (attempt ${attempts + 1}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!(window as any).isSQLiteInitialized) {
          console.error('[DatabaseService] ❌ WebStore initialization timeout after', attempts * 100, 'ms');
          throw new Error('WebStore initialization timeout');
        }

        console.log('[DatabaseService] ✅ WebStore is ready after', attempts * 100, 'ms');
      }

      const dbName = 'meuapp_db';
      const encrypted = false;
      const mode = 'no-encryption';
      const version = 1;
      const readonly = false;

      // Se o WebStore foi chamado e aguardado no main.ts, esta chamada terá sucesso.
      this.db = await this.sqlite.createConnection(dbName, encrypted, mode, version, readonly);
      console.log('[DatabaseService] Connection created');

      await this.db.open();
      console.log('[DatabaseService] Database opened');

      await this.createTables();
      console.log('[DatabaseService] Tables created');

      // Verifica se há backup no localStorage e se o banco está vazio
      if (this.platform === 'web') {
        await this.checkAndRestoreBackup();
      }

      this.isInitialized = true;
      console.log(`[DatabaseService] ✅ Database initialized successfully on ${this.platform}`);
    } catch (error) {
      console.error('[DatabaseService] ❌ Error initializing database:', error);
      throw error;
    }
  }

  // --- O resto das funções (createTables, getDb, query, etc.) permanecem iguais ---
  
  /**
   * Cria todas as tabelas
   */
  private async createTables(): Promise<void> {
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar_url TEXT,
        telefone TEXT,
        data_nascimento TEXT,
        bio TEXT,
        roles TEXT NOT NULL,
        data_criacao TEXT NOT NULL,
        ultima_atualizacao TEXT NOT NULL,
        ativo INTEGER DEFAULT 1
      );
      -- ... O resto das tuas CREATE TABLE e INDEX ...
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT PRIMARY KEY,
        tema TEXT DEFAULT 'auto',
        idioma TEXT DEFAULT 'pt-BR',
        notificacoes_push INTEGER DEFAULT 1,
        notificacoes_email INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        cor TEXT NOT NULL,
        icone TEXT,
        user_id TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        descricao TEXT,
        cor TEXT NOT NULL,
        is_public INTEGER DEFAULT 0,
        criado_por TEXT NOT NULL,
        status TEXT NOT NULL,
        data_criacao TEXT NOT NULL,
        data_atualizacao TEXT NOT NULL,
        FOREIGN KEY (criado_por) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS project_members (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        adicionado_em TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(project_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT,
        status TEXT NOT NULL,
        prioridade TEXT NOT NULL,
        data_criacao TEXT NOT NULL,
        data_atualizacao TEXT NOT NULL,
        data_vencimento TEXT,
        data_conclusao TEXT,
        user_id TEXT NOT NULL,
        project_id TEXT,
        category_id TEXT,
        tags TEXT DEFAULT '[]',
        anexos TEXT DEFAULT '[]',
        is_public INTEGER DEFAULT 0,
        assigned_to TEXT DEFAULT '[]',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS auth_tokens (
        user_id TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(criado_por);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `;

    await this.db.execute(createTablesSQL);
    await this.saveToStore();
  }

  /** Obter a conexão do banco */
  async getDb(): Promise<SQLiteDBConnection> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.db;
  }

  /** Executa uma query com retorno */
  async query(sql: string, params: any[] = []): Promise<any> {
    const db = await this.getDb();
    return await db.query(sql, params);
  }

  /** Executa um comando sem retorno */
  async run(sql: string, params: any[] = []): Promise<any> {
    const db = await this.getDb();
    const result = await db.run(sql, params);
    await this.saveToStore();
    return result;
  }

  /** Salva o banco de dados no disco (importante para Android/iOS/Web) */
  async saveToStore(): Promise<void> {
    try {
      console.log(`[DatabaseService] 💾 Saving database to store (platform: ${this.platform})...`);

      // Para todas as plataformas, incluindo web (IndexedDB)
      await this.sqlite.saveToStore('meuapp_db');
      console.log(`[DatabaseService] ✅ Database saved to IndexedDB/store successfully`);

      // Backup adicional no localStorage para web (fallback)
      if (this.platform === 'web') {
        console.log(`[DatabaseService] 💾 Creating localStorage backup...`);
        await this.backupToLocalStorage();
        console.log(`[DatabaseService] ✅ localStorage backup created`);
      }
    } catch (error) {
      console.error('[DatabaseService] ❌ Error saving to store:', error);
      throw error;
    }
  }

  /** Backup adicional para localStorage (web) */
  private async backupToLocalStorage(): Promise<void> {
    try {
      const jsonData = await this.exportDatabaseToJson();
      localStorage.setItem('meuapp_db_backup', jsonData);
      localStorage.setItem('meuapp_db_backup_timestamp', new Date().toISOString());
      console.log('[DatabaseService] ✅ Backup saved to localStorage');
    } catch (error) {
      console.error('[DatabaseService] Error backing up to localStorage:', error);
    }
  }

  /** Método público para forçar salvamento do banco */
  async forceSave(): Promise<void> {
    await this.saveToStore();
  }

  /** Executa várias instruções em batch */
  async executeBatch(statements: string[]): Promise<void> {
    const db = await this.getDb();
    await db.execute(statements.join('; '));
    await this.saveToStore();
  }

  /** Fecha a conexão */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.isInitialized = false;
    }
  }

  /** Debug: lista tabelas, estrutura e primeiras 5 linhas */
  async debugDatabase(): Promise<void> {
    if (!this.isInitialized) await this.initialize();

    console.log('========== DATABASE DEBUG ==========');
    console.log('Platform:', this.platform);

    const tables = await this.query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables:', tables.values);

    for (const table of tables.values || []) {
      const tableName = table.name;
      console.log(`\n----- Table: ${tableName} -----`);
      const info = await this.query(`PRAGMA table_info(${tableName})`);
      console.log('Structure:', info.values);
      const rows = await this.query(`SELECT * FROM ${tableName} LIMIT 5`);
      console.log('First 5 rows:', rows.values);
    }

    console.log('====================================');
  }

  /** Gera UUID simples */
  generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /** Converte Date para string SQLite */
  dateToSQL(date: Date): string {
    return date.toISOString();
  }

  /** Converte string SQLite para Date */
  sqlToDate(dateString: string): Date {
    return new Date(dateString);
  }

  /** Exporta todo o banco como JSON */
  async exportDatabaseToJson(): Promise<string> {
    const db = await this.getDb();
    const exportData = await db.exportToJson('full');
    return JSON.stringify(exportData, null, 2);
  }

  /** Download do banco em JSON */
  async downloadDatabaseAsJson(): Promise<void> {
    const jsonData = await this.exportDatabaseToJson();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meuapp_db_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Verifica se o banco existe (nativo) */
  async checkDatabaseExists(): Promise<boolean> {
    if (this.platform === 'web') return true;

    try {
      const dbList = await this.sqlite.getDatabaseList();
      return dbList.values?.includes('meuapp_db') || false;
    } catch {
      return false;
    }
  }

  /** Pega o caminho do banco para debug */
  async getDatabasePath(): Promise<string> {
    switch (this.platform) {
      case 'android': return '/data/data/io.ionic.starter/databases/meuapp_db.db';
      case 'ios': return 'Library/CapacitorDatabase/meuapp_db.db';
      case 'web': return 'IndexedDB: jeepSqlite';
      default: return 'Unknown platform';
    }
  }

  /** Download do banco como arquivo SQLite (web) */
  async downloadDatabaseAsSQLite(): Promise<void> {
    if (this.platform !== 'web') {
      console.warn('[DatabaseService] SQLite file download only available on web platform');
      return;
    }

    try {
      // Exporta o banco inteiro
      const db = await this.getDb();
      const exportData = await db.exportToJson('full');

      // Converte para Blob e faz download
      const jsonString = JSON.stringify(exportData);
      const blob = new Blob([jsonString], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meuapp_db_${new Date().toISOString().split('T')[0]}.sqlite`;
      a.click();
      URL.revokeObjectURL(url);

      console.log('[DatabaseService] ✅ SQLite file downloaded successfully');
    } catch (error) {
      console.error('[DatabaseService] Error downloading SQLite file:', error);
      throw error;
    }
  }

  /** Restaura banco de dados do backup no localStorage */
  async restoreFromLocalStorage(): Promise<boolean> {
    try {
      const backup = localStorage.getItem('meuapp_db_backup');
      const timestamp = localStorage.getItem('meuapp_db_backup_timestamp');

      if (!backup) {
        console.log('[DatabaseService] No backup found in localStorage');
        return false;
      }

      console.log(`[DatabaseService] Restoring backup from ${timestamp}`);

      const backupData = JSON.parse(backup);

      // Fecha a conexão atual se existir
      if (this.isInitialized) {
        await this.db.close();
        this.isInitialized = false;
      }

      // Importa os dados do backup usando sqlite connection
      const jsonString = JSON.stringify(backupData);
      await this.sqlite.importFromJson(jsonString);

      // Reinicializa a conexão
      await this.initialize();

      console.log('[DatabaseService] ✅ Database restored from localStorage backup');
      return true;
    } catch (error) {
      console.error('[DatabaseService] Error restoring from localStorage:', error);
      return false;
    }
  }

  /** Verifica e exibe informações sobre backups disponíveis */
  async checkBackupInfo(): Promise<void> {
    const backup = localStorage.getItem('meuapp_db_backup');
    const timestamp = localStorage.getItem('meuapp_db_backup_timestamp');

    if (backup) {
      const size = (backup.length / 1024).toFixed(2);
      console.log(`[DatabaseService] Backup available:`);
      console.log(`  - Size: ${size} KB`);
      console.log(`  - Timestamp: ${timestamp}`);
      console.log(`  - To restore: await window.db.restoreFromLocalStorage()`);
    } else {
      console.log('[DatabaseService] No backup found in localStorage');
    }

    // Verifica IndexedDB
    const path = await this.getDatabasePath();
    console.log(`[DatabaseService] Current database: ${path}`);
  }

  /** Limpa o backup do localStorage */
  clearLocalStorageBackup(): void {
    localStorage.removeItem('meuapp_db_backup');
    localStorage.removeItem('meuapp_db_backup_timestamp');
    console.log('[DatabaseService] ✅ localStorage backup cleared');
  }

  /** Verifica se o banco está vazio e tenta restaurar do backup */
  private async checkAndRestoreBackup(): Promise<void> {
    try {
      // Verifica se há dados na tabela users
      const usersResult = await this.db.query('SELECT COUNT(*) as count FROM users');
      const userCount = usersResult.values?.[0]?.count || 0;

      console.log(`[DatabaseService] Users in database: ${userCount}`);

      // Se o banco está vazio mas há backup no localStorage
      if (userCount === 0) {
        const backup = localStorage.getItem('meuapp_db_backup');
        if (backup) {
          console.log('[DatabaseService] 🔄 Database is empty but backup exists, attempting restore...');
          const restored = await this.restoreFromLocalStorage();
          if (restored) {
            console.log('[DatabaseService] ✅ Database restored from backup successfully');
          }
        } else {
          console.log('[DatabaseService] No backup found, starting with empty database');
        }
      } else {
        console.log('[DatabaseService] Database has existing data, no restore needed');
      }
    } catch (error) {
      console.error('[DatabaseService] Error checking/restoring backup:', error);
      // Não lança o erro, apenas loga
    }
  }
}