import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonFab, IonFabButton,
  IonIcon, IonChip, IonLabel, IonProgressBar, IonButtons, IonButton,
  IonRefresher, IonRefresherContent, IonGrid, IonRow, IonCol,
  ModalController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, briefcase, people, calendar } from 'ionicons/icons';
import { IProject, ProjectStatus, TaskStatus } from '../../models';
import { SqliteProjectService } from '../../services/sqlite-project.service';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { ProjectFormModalComponent } from '../../components/project-form-modal/project-form-modal.component';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.page.html',
  styleUrls: ['./projects.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonFab, IonFabButton, IonIcon, IonChip, IonLabel, IonProgressBar,
    IonButtons, IonButton, IonRefresher, IonRefresherContent, IonGrid,
    IonRow, IonCol
  ]
})
export class ProjectsPage implements OnInit {
  projects: IProject[] = [];
  isLoading = false;

  constructor(
    private router: Router,
    private projectService: SqliteProjectService,
    private authService: AuthService,
    private taskService: TaskService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {
    addIcons({ add, briefcase, people, calendar });
  }

  ngOnInit() {
    this.loadProjects();
    this.subscribeToProjects();
  }

  subscribeToProjects() {
    this.projectService.getProjects().subscribe(projects => {
      this.projects = projects;
    });
  }

  async loadProjects() {
    this.isLoading = true;
    try {
      const userId = this.authService.getCurrentUserId();
      await this.projectService.loadProjects(userId || undefined);
    } catch (error) {
      console.error('Error loading projects:', error);
      this.showToast('Erro ao carregar projetos');
    } finally {
      this.isLoading = false;
    }
  }

  async handleRefresh(event: any) {
    await this.loadProjects();
    event.target.complete();
  }

  viewProject(project: IProject) {
    this.router.navigate(['/project-detail', project.id]);
  }

  async createNewProject() {
    const modal = await this.modalCtrl.create({
      component: ProjectFormModalComponent,
      backdropDismiss: false
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    console.log('[ProjectsPage] Modal dismissed with role:', role, 'data:', data);

    if (role === 'confirm' && data) {
      const userId = this.authService.getCurrentUserId();
      console.log('[ProjectsPage] Current user ID:', userId);

      if (!userId) {
        this.showToast('Erro: Usuário não autenticado');
        return;
      }

      try {
        console.log('[ProjectsPage] Creating project with data:', data);
        const created = await this.projectService.createProject(data, userId);
        console.log('[ProjectsPage] Project created:', created);

        if (created) {
          this.showToast('Projeto criado com sucesso!');
        } else {
          this.showToast('Erro ao criar projeto');
        }
      } catch (error) {
        console.error('[ProjectsPage] Error creating project:', error);
        this.showToast('Erro ao criar projeto: ' + error);
      }
    }
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  getStatusColor(status: ProjectStatus): string {
    const colors: { [key in ProjectStatus]: string } = {
      [ProjectStatus.ACTIVE]: 'success',
      [ProjectStatus.COMPLETED]: 'primary',
      [ProjectStatus.ARCHIVED]: 'medium',
      [ProjectStatus.ON_HOLD]: 'warning'
    };
    return colors[status];
  }

  getStatusLabel(status: ProjectStatus): string {
    const labels: { [key in ProjectStatus]: string } = {
      [ProjectStatus.ACTIVE]: 'Ativo',
      [ProjectStatus.COMPLETED]: 'Concluído',
      [ProjectStatus.ARCHIVED]: 'Arquivado',
      [ProjectStatus.ON_HOLD]: 'Em Espera'
    };
    return labels[status];
  }

  getProjectProgress(project: IProject): number {
    if (!project.tasks || project.tasks.length === 0) return 0;

    // Busca todas as tarefas do localStorage
    const tasksStorage = localStorage.getItem('user_tasks');
    if (!tasksStorage) return 0;

    const allTasks = JSON.parse(tasksStorage);
    const projectTasks = allTasks.filter((task: any) =>
      project.tasks?.includes(task.id)
    );

    if (projectTasks.length === 0) return 0;

    // Conta tarefas concluídas
    const completedTasks = projectTasks.filter((task: any) =>
      task.status === TaskStatus.COMPLETED
    );

    return completedTasks.length / projectTasks.length;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }
}
