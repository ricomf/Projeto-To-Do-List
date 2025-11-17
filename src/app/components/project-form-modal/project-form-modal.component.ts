import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonIcon,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, save, colorPalette } from 'ionicons/icons';
import { IProject, ProjectStatus } from '../../models/project.model';

@Component({
  selector: 'app-project-form-modal',
  templateUrl: './project-form-modal.component.html',
  styleUrls: ['./project-form-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonIcon
  ]
})
export class ProjectFormModalComponent implements OnInit {
  @Input() project?: IProject;

  formData: any = {
    nome: '',
    descricao: '',
    cor: '#3880ff'
  };

  availableColors = [
    { label: 'Azul', value: '#3880ff' },
    { label: 'Verde', value: '#2dd36f' },
    { label: 'Vermelho', value: '#eb445a' },
    { label: 'Roxo', value: '#9333ea' },
    { label: 'Laranja', value: '#f97316' },
    { label: 'Rosa', value: '#ec4899' },
    { label: 'Amarelo', value: '#fbbf24' },
    { label: 'Cinza', value: '#6b7280' }
  ];

  statusOptions = [
    { label: 'Ativo', value: ProjectStatus.ACTIVE },
    { label: 'Em Pausa', value: ProjectStatus.ON_HOLD },
    { label: 'Concluído', value: ProjectStatus.COMPLETED },
    { label: 'Arquivado', value: ProjectStatus.ARCHIVED }
  ];

  constructor(private modalCtrl: ModalController) {
    addIcons({ close, save, colorPalette });
  }

  ngOnInit() {
    if (this.project) {
      this.formData = {
        nome: this.project.nome,
        descricao: this.project.descricao,
        cor: this.project.cor,
        status: this.project.status
      };
    }
  }

  get isEditMode(): boolean {
    return !!this.project;
  }

  get isFormValid(): boolean {
    return !!(this.formData.nome?.trim());
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save() {
    console.log('[ProjectFormModal] Save called');
    console.log('[ProjectFormModal] Form valid:', this.isFormValid);
    console.log('[ProjectFormModal] Form data:', this.formData);

    if (!this.isFormValid) {
      console.log('[ProjectFormModal] Form is invalid, not saving');
      return;
    }

    console.log('[ProjectFormModal] Dismissing modal with data:', this.formData);
    this.modalCtrl.dismiss(this.formData, 'confirm');
  }
}
