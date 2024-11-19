import { Routes } from '@angular/router';
import { RoutePath } from './components/models';

export const routes: Routes = [
    { path: RoutePath.Docs, loadComponent: () => import('./pages/docs-page/docs-page.component').then(m => m.DocsPageComponent) },
    { path: RoutePath.MainPage, loadComponent: () => import('./pages/main-page/main-page.component').then(m => m.MainPageComponent) },
    { path: RoutePath.WelcomePage, loadComponent: () => import('./pages/welcome-page/welcome-page.component').then(m => m.WelcomePageComponent) },
    { path: RoutePath.WhatsNewPage, loadComponent: () => import('./pages/whats-new-page/whats-new-page.component').then(m => m.WhatsNewPageComponent) },
    { path: RoutePath.FinanceManagerPage, loadComponent: () => import('./pages/storage-page/storage-page.component').then(m => m.StoragePageComponent) },

    { path: RoutePath.HighlightedFeaturesPage, loadComponent: () => import('./pages/highlighted-features-page/highlighted-features-page.component').then(m => m.HighlightedFeaturesPageComponent) },

    { path: '**', redirectTo: RoutePath.MainPage }
];
