import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

console.log('[TabsRoutes] Loading tabs routes...');

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'tasks',
        loadComponent: () =>
          import('../pages/tasks/tasks.page').then((m) => m.TasksPage),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('../pages/projects/projects.page').then((m) => m.ProjectsPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: '',
        redirectTo: '/tabs/tasks',
        pathMatch: 'full',
      },
    ],
  },
];
