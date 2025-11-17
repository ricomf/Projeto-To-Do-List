import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IUserPreferences } from '../models';

const PREFERENCES_STORAGE_KEY = 'user_preferences';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private preferencesSubject: BehaviorSubject<IUserPreferences>;
  public preferences$: Observable<IUserPreferences>;

  private defaultPreferences: IUserPreferences = {
    notificacoesEmail: true,
    notificacoesPush: true,
    tema: 'auto',
    idioma: 'pt-BR'
  };

  constructor() {
    const storedPreferences = this.loadFromStorage();
    this.preferencesSubject = new BehaviorSubject<IUserPreferences>(
      storedPreferences || this.defaultPreferences
    );
    this.preferences$ = this.preferencesSubject.asObservable();

    // Apply theme on initialization
    this.applyTheme(this.currentPreferencesValue.tema);
  }

  get currentPreferencesValue(): IUserPreferences {
    return this.preferencesSubject.value;
  }

  private loadFromStorage(): IUserPreferences | null {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading preferences from storage:', error);
      return null;
    }
  }

  private saveToStorage(preferences: IUserPreferences): void {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences to storage:', error);
    }
  }

  updatePreferences(preferences: Partial<IUserPreferences>): void {
    const currentPreferences = this.currentPreferencesValue;
    const updatedPreferences = { ...currentPreferences, ...preferences };

    this.preferencesSubject.next(updatedPreferences);
    this.saveToStorage(updatedPreferences);

    // Apply theme if it changed
    if (preferences.tema !== undefined) {
      this.applyTheme(preferences.tema);
    }
  }

  resetPreferences(): void {
    this.preferencesSubject.next(this.defaultPreferences);
    this.saveToStorage(this.defaultPreferences);
    this.applyTheme(this.defaultPreferences.tema);
  }

  private applyTheme(tema: 'light' | 'dark' | 'auto'): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let shouldUseDark: boolean;

    switch (tema) {
      case 'dark':
        shouldUseDark = true;
        break;
      case 'light':
        shouldUseDark = false;
        break;
      case 'auto':
      default:
        shouldUseDark = prefersDark;
        break;
    }

    document.body.classList.toggle('dark', shouldUseDark);
  }

  // Listen for system theme changes when in auto mode
  initializeThemeListener(): void {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.currentPreferencesValue.tema === 'auto') {
        this.applyTheme('auto');
      }
    });
  }
}
