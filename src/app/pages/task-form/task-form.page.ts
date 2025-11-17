import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonBackButton, IonList, IonItem, IonLabel, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonDatetime, IonChip, IonIcon,
  IonDatetimeButton, IonModal, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { save, close, add } from 'ionicons/icons';
import { TaskService } from '../../services/task.service';
import { TaskStatus, TaskPriority, ICreateTaskDto, IUpdateTaskDto, IProject } from '../../models';
import { SqliteProjectService } from '../../services/sqlite-project.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.page.html',
  styleUrls: ['./task-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, IonHeader, IonToolbar, IonTitle,
    IonContent, IonButtons, IonButton, IonBackButton, IonList, IonItem,
    IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonDatetime, IonChip, IonIcon, IonDatetimeButton, IonModal
  ]
})
export class TaskFormPage implements OnInit {
  taskForm!: FormGroup;
  isEditMode = false;
  taskId?: string;
  tags: string[] = [];
  newTag = '';
  minDate: string;
  projects: IProject[] = [];

  readonly TaskStatus = TaskStatus;
  readonly TaskPriority = TaskPriority;

  priorities = [
    { value: TaskPriority.LOW, label: 'Baixa' },
    { value: TaskPriority.MEDIUM, label: 'Média' },
    { value: TaskPriority.HIGH, label: 'Alta' },
    { value: TaskPriority.URGENT, label: 'Urgente' }
  ];

  statuses = [
    { value: TaskStatus.TODO, label: 'A Fazer' },
    { value: TaskStatus.IN_PROGRESS, label: 'Em Andamento' },
    { value: TaskStatus.COMPLETED, label: 'Concluída' }
  ];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private projectService: SqliteProjectService,
    private authService: AuthService
  ) {
    addIcons({ save, close, add });
    this.minDate = new Date().toISOString();
  }

  ngOnInit() {
    console.log('[TaskFormPage] ========== TASK FORM PAGE LOADED ==========');
    this.initForm();
    this.loadProjects();
    this.checkEditMode();
  }

  async loadProjects() {
    const userId = this.authService.getCurrentUserId();
    await this.projectService.loadProjects(userId || undefined);

    this.projectService.getProjects().subscribe(projects => {
      this.projects = projects;
      console.log('[TaskFormPage] Loaded projects:', this.projects.length);
    });
  }

  initForm() {
    this.taskForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      descricao: [''],
      status: [TaskStatus.TODO, Validators.required],
      prioridade: [TaskPriority.MEDIUM, Validators.required],
      dataVencimento: [null],
      projectId: [null],
      categoryId: [null]
    });
  }

  async checkEditMode() {
    const id = this.route.snapshot.paramMap.get('id');
    const projectId = this.route.snapshot.queryParamMap.get('projectId');

    // Se veio com projectId nos query params, define no formulário
    if (projectId) {
      console.log('[TaskFormPage] Setting projectId from query params:', projectId);
      this.taskForm.patchValue({ projectId });
    }

    if (id) {
      this.isEditMode = true;
      this.taskId = id;
      await this.loadTask();
    }
  }

  async loadTask() {
    if (!this.taskId) return;

    try {
      const task = await this.taskService.getTask(this.taskId);

      if (task) {
        this.taskForm.patchValue({
          titulo: task.titulo,
          descricao: task.descricao,
          status: task.status,
          prioridade: task.prioridade,
          dataVencimento: task.dataVencimento ? new Date(task.dataVencimento).toISOString() : null,
          projectId: task.projectId,
          categoryId: task.categoryId
        });
        this.tags = task.tags || [];
      }
    } catch (error) {
      console.error('Error loading task:', error);
    }
  }

  addTag() {
    const tag = this.newTag.trim();
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.newTag = '';
    }
  }

  removeTag(tag: string) {
    this.tags = this.tags.filter(t => t !== tag);
  }

  async onSubmit() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.taskForm.value;

      if (this.isEditMode && this.taskId) {
        const updateData: IUpdateTaskDto = {
          titulo: formValue.titulo,
          descricao: formValue.descricao,
          status: formValue.status,
          prioridade: formValue.prioridade,
          dataVencimento: formValue.dataVencimento ? new Date(formValue.dataVencimento) : undefined,
          tags: this.tags,
          categoryId: formValue.categoryId
        };
        await this.taskService.updateTask(this.taskId, updateData);
      } else {
        const createData: ICreateTaskDto = {
          titulo: formValue.titulo,
          descricao: formValue.descricao,
          prioridade: formValue.prioridade,
          dataVencimento: formValue.dataVencimento ? new Date(formValue.dataVencimento) : undefined,
          tags: this.tags,
          projectId: formValue.projectId,
          categoryId: formValue.categoryId
        };
        console.log('[TaskFormPage] Creating task with data:', createData);
        console.log('[TaskFormPage] ProjectId from form:', formValue.projectId);
        await this.taskService.createTask(createData);
      }

      this.navCtrl.back();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Erro ao salvar tarefa: ' + (error as any)?.message || 'Erro desconhecido');
    }
  }

  cancel() {
    this.navCtrl.back();
  }

  getPriorityLabel(priority: TaskPriority): string {
    return this.priorities.find(p => p.value === priority)?.label || '';
  }

  getStatusLabel(status: TaskStatus): string {
    return this.statuses.find(s => s.value === status)?.label || '';
  }
}
