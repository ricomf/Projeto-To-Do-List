// src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';

// Importação crucial para o Jeep-SQLite (apenas para plataformas nativas)
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { errorInterceptor } from './app/interceptors/error.interceptor';

// 🚨 NOVO: Variável global para sinalizar o status de inicialização
(window as any).isSQLiteInitialized = false; 

/**
 * Funções de inicialização pré-Angular.
 * Prepara o WebStore se a plataforma for 'web'.
 */
async function initializeApp() {
  const platform = Capacitor.getPlatform();
  console.log('[Main] 🚀 Starting app initialization on platform:', platform);

  if (platform === 'web') {
    console.log('[Main] 📦 Web platform - SQLite disabled, using Mock Backend');
    console.log('[Main] 💾 Data will be stored in localStorage');
  } else {
    // Para plataformas nativas, registra jeep-sqlite
    console.log('[Main] 📱 Native platform - Registering jeep-sqlite...');
    jeepSqlite(window);
    console.log('[Main] ✅ jeep-sqlite registered for native platform');
  }

  console.log('[Main] 🎉 Main initialization complete');
}

// Inicialização e Bootstrap Angular
(async () => {
  try {
    // Primeiro, inicializa os componentes e o WebStore
    await initializeApp(); 

    // Depois, inicia a aplicação Angular
    bootstrapApplication(AppComponent, {
      providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        provideIonicAngular(), 
        // Importa as rotas para o Router funcionar corretamente
        provideRouter(routes, withPreloading(PreloadAllModules)),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
      ],
    }).catch(err => console.error('[Main] Bootstrap error:', err));
  } catch (err) {
    console.error('[Main] Application failed to start due to initialization error.');
  }
})();