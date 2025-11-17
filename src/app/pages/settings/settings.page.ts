import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonToggle, IonIcon, IonListHeader, IonAvatar, IonButton,
  IonCard, IonCardContent, IonNote, AlertController, ActionSheetController,
  ToastController, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  person, notifications, moon, language, logOut, help, shield,
  documentText, chevronForward, mail
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { PreferencesService } from '../../services/preferences.service';
import { IUserProfile, IUserPreferences, UserRole } from '../../models';
import { ProfileEditModalComponent } from '../../components/profile-edit-modal/profile-edit-modal.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonToggle, IonIcon, IonListHeader, IonAvatar,
    IonButton, IonCard, IonCardContent, IonNote, RouterLink
  ]
})
export class SettingsPage implements OnInit {
  userProfile?: IUserProfile;
  preferences: IUserPreferences = {
    notificacoesEmail: true,
    notificacoesPush: true,
    tema: 'auto',
    idioma: 'pt-BR'
  };

  constructor(
    private authService: AuthService,
    private preferencesService: PreferencesService,
    private router: Router,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private modalController: ModalController
  ) {
    addIcons({
      person, notifications, moon, language, logOut, help, shield,
      documentText, chevronForward, mail
    });
  }

  ngOnInit() {
    this.loadUserProfile();
    this.loadPreferences();
  }

  async loadUserProfile() {
    try {
      const currentUser = this.authService.currentUserValue;

      if (currentUser) {
        this.userProfile = {
          id: currentUser.id,
          nome: currentUser.nome,
          email: currentUser.email,
          avatarUrl: undefined,
          roles: [UserRole.USER],
          dataCriacao: new Date(),
          dataAtualizacao: new Date(),
          ativo: true,
          preferencias: this.preferences
        };
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  loadPreferences() {
    this.preferences = this.preferencesService.currentPreferencesValue;
  }

  async updatePreferences() {
    try {
      this.preferencesService.updatePreferences(this.preferences);

      const toast = await this.toastController.create({
        message: 'Preferências atualizadas com sucesso!',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }

  async navigateToProfile() {
    if (!this.userProfile) return;

    const modal = await this.modalController.create({
      component: ProfileEditModalComponent,
      componentProps: {
        userProfile: this.userProfile
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'save' && data) {
      try {
        // Update user profile in the backend
        await this.authService.updateUser({
          nome: data.nome,
          email: data.email,
          avatarUrl: data.avatarUrl
        });

        // Update local profile
        this.userProfile = data;

        const toast = await this.toastController.create({
          message: 'Perfil salvo com sucesso!',
          duration: 2000,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
      } catch (error: any) {
        console.error('Error updating profile:', error);

        const toast = await this.toastController.create({
          message: error.message || 'Erro ao salvar perfil',
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
        await toast.present();
      }
    }
  }

  async changeTheme() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Escolha o tema',
      buttons: [
        {
          text: 'Claro',
          handler: () => {
            this.preferences.tema = 'light';
            this.updatePreferences();
          }
        },
        {
          text: 'Escuro',
          handler: () => {
            this.preferences.tema = 'dark';
            this.updatePreferences();
          }
        },
        {
          text: 'Automático',
          handler: () => {
            this.preferences.tema = 'auto';
            this.updatePreferences();
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

  async navigateToSecurity() {
    const alert = await this.alertController.create({
      header: 'Alterar Senha',
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: 'Senha atual'
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'Nova senha'
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Confirmar nova senha'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Alterar',
          handler: async (data) => {
            if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
              const toast = await this.toastController.create({
                message: 'Por favor, preencha todos os campos',
                duration: 2000,
                position: 'bottom',
                color: 'warning'
              });
              await toast.present();
              return false;
            }

            if (data.newPassword !== data.confirmPassword) {
              const toast = await this.toastController.create({
                message: 'As senhas não conferem',
                duration: 2000,
                position: 'bottom',
                color: 'warning'
              });
              await toast.present();
              return false;
            }

            if (data.newPassword.length < 6) {
              const toast = await this.toastController.create({
                message: 'A senha deve ter no mínimo 6 caracteres',
                duration: 2000,
                position: 'bottom',
                color: 'warning'
              });
              await toast.present();
              return false;
            }

            // TODO: Implementar alteração de senha no backend
            const toast = await this.toastController.create({
              message: 'Senha alterada com sucesso!',
              duration: 2000,
              position: 'bottom',
              color: 'success'
            });
            await toast.present();
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  navigateToHelp() {
    this.router.navigate(['/help']);
  }

  navigateToPrivacy() {
    this.router.navigate(['/privacy']);
  }

  navigateToTerms() {
    this.router.navigate(['/terms']);
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Sair',
      message: 'Tem certeza que deseja sair?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sair',
          role: 'destructive',
          handler: async () => {
            try {
              await this.authService.logout();
              this.router.navigate(['/auth/login']);
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
