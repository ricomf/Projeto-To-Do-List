import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonItem, IonLabel, IonChip, IonBadge, IonIcon,
  IonItemSliding, IonItemOptions, IonItemOption, IonButton,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { create, trash, ellipseOutline, playCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { ITask, TaskPriority, TaskStatus } from '../../../models';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.scss'],
  standalone: true,
  imports: [
    CommonModule, IonItem, IonLabel, IonChip, IonBadge,
    IonIcon, IonItemSliding, IonItemOptions, IonItemOption, IonButton
  ]
})
export class TaskItemComponent {
  @Input() task!: ITask;
  @Input() showActions = true;
  @Output() taskToggle = new EventEmitter<ITask>();
  @Output() taskStatusChange = new EventEmitter<{task: ITask, newStatus: TaskStatus}>();
  @Output() taskEdit = new EventEmitter<ITask>();
  @Output() taskDelete = new EventEmitter<ITask>();
  @Output() taskClick = new EventEmitter<ITask>();

  TaskStatus = TaskStatus;

  constructor(private actionSheetCtrl: ActionSheetController) {
    addIcons({ create, trash, ellipseOutline, playCircleOutline, checkmarkCircleOutline });
  }

  onToggle() {
    this.taskToggle.emit(this.task);
  }

  async onStatusClick(event: Event) {
    event.stopPropagation();

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Alterar Status',
      buttons: [
        {
          text: 'A Fazer',
          icon: 'ellipse-outline',
          cssClass: this.task.status === TaskStatus.TODO ? 'action-sheet-selected' : '',
          handler: () => {
            if (this.task.status !== TaskStatus.TODO) {
              this.taskStatusChange.emit({ task: this.task, newStatus: TaskStatus.TODO });
            }
          }
        },
        {
          text: 'Em Andamento',
          icon: 'play-circle-outline',
          cssClass: this.task.status === TaskStatus.IN_PROGRESS ? 'action-sheet-selected' : '',
          handler: () => {
            if (this.task.status !== TaskStatus.IN_PROGRESS) {
              this.taskStatusChange.emit({ task: this.task, newStatus: TaskStatus.IN_PROGRESS });
            }
          }
        },
        {
          text: 'Concluído',
          icon: 'checkmark-circle-outline',
          cssClass: this.task.status === TaskStatus.COMPLETED ? 'action-sheet-selected' : '',
          handler: () => {
            if (this.task.status !== TaskStatus.COMPLETED) {
              this.taskStatusChange.emit({ task: this.task, newStatus: TaskStatus.COMPLETED });
            }
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  getStatusIcon(): string {
    switch (this.task.status) {
      case TaskStatus.TODO:
        return 'ellipse-outline';
      case TaskStatus.IN_PROGRESS:
        return 'play-circle-outline';
      case TaskStatus.COMPLETED:
        return 'checkmark-circle-outline';
      default:
        return 'ellipse-outline';
    }
  }

  getStatusColor(): string {
    switch (this.task.status) {
      case TaskStatus.TODO:
        return 'medium';
      case TaskStatus.IN_PROGRESS:
        return 'primary';
      case TaskStatus.COMPLETED:
        return 'success';
      default:
        return 'medium';
    }
  }

  getStatusLabel(): string {
    switch (this.task.status) {
      case TaskStatus.TODO:
        return 'A Fazer';
      case TaskStatus.IN_PROGRESS:
        return 'Em Andamento';
      case TaskStatus.COMPLETED:
        return 'Concluído';
      default:
        return 'A Fazer';
    }
  }

  onEdit() {
    this.taskEdit.emit(this.task);
  }

  onDelete() {
    this.taskDelete.emit(this.task);
  }

  onClick() {
    this.taskClick.emit(this.task);
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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  get isCompleted(): boolean {
    return this.task.status === TaskStatus.COMPLETED;
  }
}
