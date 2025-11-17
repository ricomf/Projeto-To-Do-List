import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonButtons, IonBackButton, IonIcon,
  IonTextarea, IonSelect,
  IonSelectOption, ToastController, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  download, refreshOutline, trashOutline, cloudDownloadOutline,
  documentTextOutline, searchOutline, codeSlashOutline
} from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';

@Component({
  selector: 'app-database-debug',
  templateUrl: './database-debug.page.html',
  styleUrls: ['./database-debug.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonButton, IonButtons, IonBackButton, IonIcon,
    IonTextarea, IonSelect, IonSelectOption,
    IonRefresher, IonRefresherContent
  ]
})
export class DatabaseDebugPage implements OnInit {
  tables: any[] = [];
  selectedTable: string = '';
  tableData: any = null;
  tableStructure: any[] = [];
  customQuery: string = '';
  queryResult: any = null;
  databasePath: string = '';
  backupInfo: string = '';

  // Expose Object.keys to template
  Object = Object;

  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController
  ) {
    addIcons({
      download, refreshOutline, trashOutline, cloudDownloadOutline,
      documentTextOutline, searchOutline, codeSlashOutline
    });
  }

  async ngOnInit() {
    await this.loadTables();
    await this.loadDatabaseInfo();
  }

  async loadTables() {
    try {
      const result = await this.databaseService.query(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      );
      this.tables = result.values || [];

      // Set first table as selected by default
      if (this.tables.length > 0 && !this.selectedTable) {
        this.selectedTable = this.tables[0].name;
        await this.loadTableData();
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      await this.showToast('Erro ao carregar tabelas', 'danger');
    }
  }

  async loadDatabaseInfo() {
    try {
      this.databasePath = await this.databaseService.getDatabasePath();

      const backup = localStorage.getItem('meuapp_db_backup');
      const timestamp = localStorage.getItem('meuapp_db_backup_timestamp');

      if (backup) {
        const size = (backup.length / 1024).toFixed(2);
        this.backupInfo = `Backup disponível: ${size} KB (${timestamp})`;
      } else {
        this.backupInfo = 'Nenhum backup disponível';
      }
    } catch (error) {
      console.error('Error loading database info:', error);
    }
  }

  async onTableChange() {
    if (this.selectedTable) {
      await this.loadTableData();
    }
  }

  async loadTableData() {
    try {
      // Get table structure
      const structureResult = await this.databaseService.query(
        `PRAGMA table_info(${this.selectedTable})`
      );
      this.tableStructure = structureResult.values || [];

      // Get table data
      const dataResult = await this.databaseService.query(
        `SELECT * FROM ${this.selectedTable} LIMIT 100`
      );
      this.tableData = dataResult.values || [];
    } catch (error) {
      console.error('Error loading table data:', error);
      await this.showToast('Erro ao carregar dados da tabela', 'danger');
    }
  }

  async executeCustomQuery() {
    if (!this.customQuery.trim()) {
      await this.showToast('Digite uma query SQL', 'warning');
      return;
    }

    try {
      const result = await this.databaseService.query(this.customQuery);
      this.queryResult = result.values || [];
      await this.showToast('Query executada com sucesso', 'success');
    } catch (error: any) {
      console.error('Error executing query:', error);
      await this.showToast(`Erro: ${error.message}`, 'danger');
      this.queryResult = null;
    }
  }

  async downloadAsJson() {
    try {
      await this.databaseService.downloadDatabaseAsJson();
      await this.showToast('Banco exportado como JSON', 'success');
    } catch (error) {
      console.error('Error exporting as JSON:', error);
      await this.showToast('Erro ao exportar banco', 'danger');
    }
  }

  async downloadAsSQLite() {
    try {
      await this.databaseService.downloadDatabaseAsSQLite();
      await this.showToast('Banco exportado como SQLite', 'success');
    } catch (error) {
      console.error('Error exporting as SQLite:', error);
      await this.showToast('Erro ao exportar banco', 'danger');
    }
  }

  async clearBackup() {
    try {
      this.databaseService.clearLocalStorageBackup();
      await this.loadDatabaseInfo();
      await this.showToast('Backup limpo com sucesso', 'success');
    } catch (error) {
      console.error('Error clearing backup:', error);
      await this.showToast('Erro ao limpar backup', 'danger');
    }
  }

  async refresh(event?: any) {
    await this.loadTables();
    await this.loadDatabaseInfo();
    if (event) {
      event.target.complete();
    }
  }

  getColumns(): string[] {
    if (!this.tableData || this.tableData.length === 0) {
      return [];
    }
    return Object.keys(this.tableData[0]);
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '(null)';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}
