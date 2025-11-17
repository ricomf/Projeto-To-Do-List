import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonProgressBar,
  IonActionSheet,
  ModalController,
  AlertController,
  ToastController,
  ViewWillEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  create,
  trash,
  archive,
  checkmarkCircle,
  list,
  calendar,
  ellipsisVertical,
  add
} from 'ionicons/icons';
import { IProject, ProjectStatus } from '../../models/project.model';
import { ITask, TaskStatus } from '../../models/task.model';
import { SqliteProjectService } from '../../services/sqlite-project.service';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { ProjectFormModalComponent } from '../../components/project-form-modal/project-form-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.page.html',
  styleUrls: ['./project-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonProgressBar,
    IonActionSheet
  ]
})
export class ProjectDetailPage implements OnInit, OnDestroy, ViewWillEnter {
  project?: IProject;
  projectId?: string;
  isActionSheetOpen = false;
  currentUserId?: string;
  projectTasks: ITask[] = [];
  private tasksSubscription?: Subscription;

  actionSheetButtons = [
    {
      text: 'Editar',
      icon: 'create',
      handler: () => {
        this.openEditModal();
      }
    },
    {
      text: 'Marcar como Concluído',
      icon: 'checkmarkCircle',
      handler: () => {
        this.completeProject();
      }
    },
    {
      text: 'Arquivar',
      icon: 'archive',
      handler: () => {
        this.archiveProject();
      }
    },
    {
      text: 'Excluir',
      role: 'destructive',
      icon: 'trash',
      handler: () => {
        this.confirmDelete();
      }
    },
    {
      text: 'Cancelar',
      role: 'cancel'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: SqliteProjectService,
    private authService: AuthService,
    private taskService: TaskService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      arrowBack,
      create,
      trash,
      archive,
      checkmarkCircle,
      list,
      calendar,
      ellipsisVertical,
      add
    });
  }

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id') || undefined;
    this.currentUserId = this.authService.getCurrentUserId() || undefined;
    this.loadProject();
    this.subscribeToTaskUpdates();
  }

  ionViewWillEnter() {
    // Recarrega tasks quando a página se torna ativa (ex: ao voltar da criação de task)
    console.log('[ProjectDetailPage] ionViewWillEnter - reloading tasks');
    this.loadProjectTasks();
  }

  ngOnDestroy() {
    // Limpa a subscription para evitar memory leaks
    if (this.tasksSubscription) {
      this.tasksSubscription.unsubscribe();
    }
  }

  subscribeToTaskUpdates() {
    // Subscribe para atualizações automáticas de tasks
    this.tasksSubscription = this.taskService.tasks$.subscribe(tasks => {
      console.log('[ProjectDetailPage] Tasks updated via subscription:', tasks.length);
      this.filterProjectTasks(tasks);
    });
  }

  private filterProjectTasks(allTasks: ITask[]) {
    if (!this.projectId) {
      this.projectTasks = [];
      return;
    }

    this.projectTasks = allTasks.filter(task => {
      console.log(`[ProjectDetailPage] Task ${task.id} projectId:`, task.projectId, 'matches:', task.projectId === this.projectId);
      return task.projectId === this.projectId;
    });

    console.log('[ProjectDetailPage] Filtered project tasks:', this.projectTasks.length);
  }

  async loadProject() {
    if (this.projectId) {
      this.project = this.projectService.getProjectById(this.projectId);
      await this.loadProjectTasks();
    }
  }

  async loadProjectTasks() {
    if (!this.projectId) {
      console.log('[ProjectDetailPage] No projectId, skipping task load');
      return;
    }

    try {
      console.log('[ProjectDetailPage] Loading tasks for project:', this.projectId);
      const allTasks = await this.taskService.getTasks();
      console.log('[ProjectDetailPage] Total tasks in system:', allTasks.length);
      console.log('[ProjectDetailPage] All tasks:', allTasks);

      this.filterProjectTasks(allTasks);
      console.log('[ProjectDetailPage] Project tasks:', this.projectTasks);
    } catch (error) {
      console.error('[ProjectDetailPage] Error loading tasks:', error);
      this.projectTasks = [];
    }
  }

  get isOwner(): boolean {
    return this.project?.ownerId === this.currentUserId;
  }

  get canEdit(): boolean {
    return this.isOwner;
  }

  get projectProgress(): number {
    if (!this.projectTasks || this.projectTasks.length === 0) {
      return 0;
    }
    const completedTasks = this.projectTasks.filter(task => task.status === TaskStatus.COMPLETED);
    return completedTasks.length / this.projectTasks.length;
  }

  get completedTasksCount(): number {
    return this.projectTasks.filter(task => task.status === TaskStatus.COMPLETED).length;
  }

  get totalTasksCount(): number {
    return this.projectTasks.length;
  }

  getStatusColor(status: ProjectStatus): string {
    const colors: Record<ProjectStatus, string> = {
      [ProjectStatus.ACTIVE]: 'success',
      [ProjectStatus.ON_HOLD]: 'warning',
      [ProjectStatus.COMPLETED]: 'primary',
      [ProjectStatus.ARCHIVED]: 'medium'
    };
    return colors[status] || 'medium';
  }

  getStatusLabel(status: ProjectStatus): string {
    const labels: Record<ProjectStatus, string> = {
      [ProjectStatus.ACTIVE]: 'Ativo',
      [ProjectStatus.ON_HOLD]: 'Em Pausa',
      [ProjectStatus.COMPLETED]: 'Concluído',
      [ProjectStatus.ARCHIVED]: 'Arquivado'
    };
    return labels[status] || status;
  }

  formatDate(date?: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  }

  async openEditModal() {
    const modal = await this.modalCtrl.create({
      component: ProjectFormModalComponent,
      componentProps: {
        project: this.project
      },
      backdropDismiss: false
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data && this.projectId) {
      const updated = await this.projectService.updateProject(this.projectId, data);
      if (updated) {
        this.loadProject();
        this.showToast('Projeto atualizado com sucesso!');
      }
    }
  }

  async confirmDelete() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.deleteProject();
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteProject() {
    if (!this.projectId) return;

    const deleted = await this.projectService.deleteProject(this.projectId);
    if (deleted) {
      this.showToast('Projeto excluído com sucesso!');
      this.router.navigate(['/tabs/projects']);
    }
  }

  async archiveProject() {
    if (!this.projectId) return;

    const archived = await this.projectService.archiveProject(this.projectId);
    if (archived) {
      this.loadProject();
      this.showToast('Projeto arquivado!');
    }
  }

  async completeProject() {
    if (!this.projectId) return;

    const completed = await this.projectService.completeProject(this.projectId);
    if (completed) {
      this.loadProject();
      this.showToast('Projeto marcado como concluído!');
    }
  }

  openActionSheet() {
    this.isActionSheetOpen = true;
  }

  createTask() {
    console.log('[ProjectDetailPage] Creating task for project:', this.projectId);
    // Navigate to task form with projectId as query param
    this.router.navigate(['/task-form'], {
      queryParams: { projectId: this.projectId }
    });
  }

  viewProjectTasks() {
    console.log('[ProjectDetailPage] Viewing tasks for project:', this.projectId);
    // Navigate to tasks page with filter for this project
    this.router.navigate(['/tabs/tasks'], {
      queryParams: { projectId: this.projectId }
    });
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
