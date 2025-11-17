import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonList, IonItem, IonLabel, IonInput, IonIcon, IonAvatar,
  ModalController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, save, camera } from 'ionicons/icons';
import { IUserProfile } from '../../models';

@Component({
  selector: 'app-profile-edit-modal',
  templateUrl: './profile-edit-modal.component.html',
  styleUrls: ['./profile-edit-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle,
    IonContent, IonButtons, IonButton, IonList, IonItem, IonLabel,
    IonInput, IonIcon, IonAvatar
  ]
})
export class ProfileEditModalComponent implements OnInit {
  @Input() userProfile!: IUserProfile;

  profileForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private toastController: ToastController
  ) {
    addIcons({ close, save, camera });
  }

  ngOnInit() {
    this.initializeForm();
    if (this.userProfile?.avatarUrl) {
      this.previewUrl = this.userProfile.avatarUrl;
    }
  }

  initializeForm() {
    this.profileForm = this.formBuilder.group({
      nome: [this.userProfile?.nome || '', [Validators.required, Validators.minLength(3)]],
      email: [this.userProfile?.email || '', [Validators.required, Validators.email]]
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput() {
    const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
    fileInput?.click();
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  async save() {
    if (this.profileForm.valid) {
      const updatedProfile = {
        ...this.userProfile,
        nome: this.profileForm.value.nome,
        email: this.profileForm.value.email,
        avatarUrl: this.previewUrl || this.userProfile.avatarUrl
      };

      await this.modalController.dismiss(updatedProfile, 'save');
    } else {
      const toast = await this.toastController.create({
        message: 'Por favor, preencha todos os campos corretamente',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
    }
  }

  cancel() {
    this.modalController.dismiss(null, 'cancel');
  }
}
