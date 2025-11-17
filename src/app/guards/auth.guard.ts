import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes that require authentication
 */
export const authGuard: CanActivateFn = async (route, state) => {
  console.error('🔒 [authGuard] ===== GUARD EXECUTING (Async) =====');
  const authService = inject(AuthService);
  const router = inject(Router);

  console.error('[authGuard] Checking access to:', state.url);

  // Chama o método assíncrono que verifica o token E o status do DB/Mock.
  const isAuthenticatedAndExists = await authService.isAuthenticatedAndExists(); 
  
  console.error('[authGuard] Final Status (Token + DB Check):', isAuthenticatedAndExists);

  if (isAuthenticatedAndExists) {
    console.error('[authGuard] ✅ Access granted to:', state.url);
    return true;
  }

  // Acesso negado. Limpa a sessão e redireciona.
  console.error('[authGuard] ❌ Access denied, redirecting to /auth/login');
  
  // O logout dentro do AuthService já limpou o token na maioria dos casos,
  // mas chamamos novamente para garantir a limpeza total da sessão.
  await authService.logout(); 

  // Redireciona para a página de login com URL de retorno
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};

/**
 * Guard to prevent authenticated users from accessing auth pages
 */
export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('[noAuthGuard] isAuthenticated:', authService.isAuthenticated); 

  if (!authService.isAuthenticated) {
    return true;
  }

  // Redirect to main app if already authenticated
  console.log('[noAuthGuard] Redirecting to /tabs');
  router.navigate(['/tabs']);
  return false;
};