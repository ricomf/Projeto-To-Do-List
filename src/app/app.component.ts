// src/app/app.component.ts (Conteúdo COMPLETO)

import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from './services/database.service';
import { PreferencesService } from './services/preferences.service';
import { Capacitor } from '@capacitor/core'; // Importação crucial

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, CommonModule, RouterModule], 
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true
})
export class AppComponent implements OnInit {
  
  public isWebstoreReady: boolean = false; 

  // ✅ CORREÇÃO: As funções de debug são definidas aqui, garantindo que existam.
  constructor(
    private database: DatabaseService,
    private preferencesService: PreferencesService
  ) {
    console.log('[AppComponent] Initializing...');

    // ⬇️ FUNÇÕES DE DEBUG AGORA NO CONSTRUCTOR ⬇️
    (window as any).db = this.database;
    (window as any).debugDatabase = async () => {
      console.log('Starting database debug...');
      await this.database.debugDatabase();
    };
    (window as any).exportDatabase = async () => {
      console.log('Exporting database as JSON...');
      await this.database.downloadDatabaseAsJson();
    };
    (window as any).downloadSQLite = async () => {
      console.log('Downloading database as SQLite file...');
      await this.database.downloadDatabaseAsSQLite();
    };
    (window as any).getDatabasePath = async () => {
      const path = await this.database.getDatabasePath();
      console.log('Database path:', path);
      return path;
    };
    (window as any).checkBackup = async () => {
      await this.database.checkBackupInfo();
    };
    (window as any).restoreBackup = async () => {
      console.log('Restoring database from localStorage backup...');
      const result = await this.database.restoreFromLocalStorage();
      if (result) {
        console.log('✅ Database restored successfully!');
      } else {
        console.log('❌ No backup found or restore failed');
      }
      return result;
    };
    (window as any).forceSave = async () => {
      console.log('Forcing database save...');
      await this.database.forceSave();
      console.log('✅ Database saved!');
    };

    console.log('[AppComponent] 🔧 Debug functions available:');
    console.log('  - await window.debugDatabase() - Show all database info');
    console.log('  - await window.exportDatabase() - Download database as JSON');
    console.log('  - await window.downloadSQLite() - Download database as SQLite file');
    console.log('  - await window.getDatabasePath() - Get database file path');
    console.log('  - await window.checkBackup() - Check backup information');
    console.log('  - await window.restoreBackup() - Restore from localStorage backup');
    console.log('  - await window.forceSave() - Force save database');
    console.log('  - window.db - Direct access to DatabaseService');
    // ⬆️ FUNÇÕES DE DEBUG AGORA NO CONSTRUCTOR ⬆️

    // Clear old invalid tokens
    const token = localStorage.getItem('auth_token');
    if (token && (!token.includes('.') || token.split('.').length !== 3)) {
      console.log('[AppComponent] Clearing invalid old token format');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
    }
  }

  async ngOnInit() {
    const platform = Capacitor.getPlatform();
    console.log('[AppComponent] ngOnInit - Platform:', platform);

    // Initialize preferences service and theme listener
    this.preferencesService.initializeThemeListener();
    console.log('[AppComponent] ✅ Preferences service initialized');

    // SQLite apenas para plataformas nativas (Android/iOS)
    // No navegador, usa Mock Backend com localStorage
    if (platform !== 'web') {
      try {
        console.log('[AppComponent] Native platform - Initializing SQLite database...');
        await this.database.initialize();
        console.log('[AppComponent] ✅ SQLite database initialized successfully');
      } catch (error) {
        console.error('[AppComponent] ❌ Failed to initialize SQLite database:', error);
      }
    } else {
      console.log('[AppComponent] Web platform - Using Mock Backend with localStorage');
      console.log('[AppComponent] Data will persist in localStorage');
    }
  }
}