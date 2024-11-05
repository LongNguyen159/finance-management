import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: 'docs', loadComponent: () => import('./pages/docs-page/docs-page.component').then(m => m.DocsPageComponent) },
    { path: '', loadComponent: () => import('./pages/main-page/main-page.component').then(m => m.MainPageComponent) },
    { path: 'welcome', loadComponent: () => import('./pages/welcome-page/welcome-page.component').then(m => m.WelcomePageComponent) },
    { path: 'updates', loadComponent: () => import('./pages/whats-new-page/whats-new-page.component').then(m => m.WhatsNewPageComponent) },
    { path: 'storage', loadComponent: () => import('./pages/storage-page/storage-page.component').then(m => m.StoragePageComponent) },
    { path: '**', redirectTo: '' }
];
