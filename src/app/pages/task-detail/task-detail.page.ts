import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonBackButton, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonLabel, IonChip, IonIcon,
  IonButton, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { create, trash, calendar, time, pricetag, chevronBack } from 'ionicons/icons';
import { TaskService } from '../../services/task.service';
import { ITask, TaskPriority, TaskStatus } from '../../models';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonLabel, IonChip, IonIcon, IonButton
  ]
})
export class TaskDetailPage implements OnInit, OnDestroy {
  task: ITask | null = null;
  isLoading = true;
  private taskId: string | null = null;
  private routerSubscription?: Subscription;
  private taskSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private alertController: AlertController
  ) {
    addIcons({ create, trash, calendar, time, pricetag, chevronBack });
  }

  async ngOnInit() {
    this.taskId = this.route.snapshot.paramMap.get('id');
    if (this.taskId) {
      await this.loadTask(this.taskId);
    }

    // Subscribe to task updates
    this.taskSubscription = this.taskService.tasks$.subscribe(tasks => {
      if (this.taskId) {
        const updatedTask = tasks.find(t => t.id === this.taskId);
        if (updatedTask) {
          this.task = updatedTask;
        }
      }
    });

    // Subscribe to navigation events to reload when returning
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.taskId && this.router.url.includes(`/task-detail/${this.taskId}`)) {
        this.loadTask(this.taskId);
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.taskSubscription) {
      this.taskSubscription.unsubscribe();
    }
  }

  async loadTask(id: string) {
    try {
      this.task = await this.taskService.getTask(id);
      if (!this.task) {
        console.error('Task not found:', id);
        this.router.navigate(['/tasks']);
      }
    } catch (error) {
      console.error('Error loading task:', error);
      this.router.navigate(['/tasks']);
    } finally {
      this.isLoading = false;
    }
  }

  editTask() {
    if (this.task) {
      this.router.navigate(['/task-form', this.task.id]);
    }
  }

  async deleteTask() {
    if (!this.task) return;

    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir esta tarefa?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            if (this.task) {
              try {
                await this.taskService.deleteTask(this.task.id);
                await this.router.navigate(['/tabs/tasks']);
              } catch (error) {
                console.error('Error deleting task:', error);
                const errorAlert = await this.alertController.create({
                  header: 'Erro',
                  message: 'Erro ao excluir tarefa: ' + (error as any)?.message,
                  buttons: ['OK']
                });
                await errorAlert.present();
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getPriorityColor(priority: TaskPriority): string {
    const colors: { [key in TaskPriority]: string } = {
      [TaskPriority.LOW]: 'success',
      [TaskPriority.MEDIUM]: 'warning',
      [TaskPriority.HIGH]: 'danger',
      [TaskPriority.URGENT]: 'danger'
    };
    return colors[priority];
  }

  getPriorityLabel(priority: TaskPriority): string {
    const labels: { [key in TaskPriority]: string } = {
      [TaskPriority.LOW]: 'Baixa',
      [TaskPriority.MEDIUM]: 'Média',
      [TaskPriority.HIGH]: 'Alta',
      [TaskPriority.URGENT]: 'Urgente'
    };
    return labels[priority];
  }

  getStatusLabel(status: TaskStatus): string {
    const labels: { [key in TaskStatus]: string } = {
      [TaskStatus.TODO]: 'A Fazer',
      [TaskStatus.IN_PROGRESS]: 'Em Andamento',
      [TaskStatus.COMPLETED]: 'Concluído',
      [TaskStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status];
  }

  getStatusColor(status: TaskStatus): string {
    const colors: { [key in TaskStatus]: string } = {
      [TaskStatus.TODO]: 'medium',
      [TaskStatus.IN_PROGRESS]: 'primary',
      [TaskStatus.COMPLETED]: 'success',
      [TaskStatus.CANCELLED]: 'danger'
    };
    return colors[status];
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
