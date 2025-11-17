import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';
import { ILogin } from '../../../models';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner, ReactiveFormsModule, RouterModule]
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline });
  }

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginData: ILogin = this.loginForm.value;

    try {
      console.log('[LoginPage] Starting login...', loginData.email);
      const response = await this.authService.login(loginData);
      console.log('[LoginPage] ✅ Login successful!', response);
      console.log('[LoginPage] Auth status - isAuthenticated:', this.authService.isAuthenticated);
      console.log('[LoginPage] Token stored:', !!localStorage.getItem('auth_token'));

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('[LoginPage] Navigating to /tabs...');
      await this.router.navigate(['/tabs'], { replaceUrl: true });
      console.log('[LoginPage] Navigation completed');

      this.isLoading = false;
    } catch (error: any) {
      console.error('[LoginPage] ❌ Login error:', error);
      this.errorMessage = error?.message || 'Erro ao fazer login. Tente novamente.';
      this.isLoading = false;
    }
  }

  navigateToRegister() {
    this.router.navigate(['/auth/register']);
  }

  navigateToForgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
