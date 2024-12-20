import { Routes } from '@angular/router';
import { RoutePath } from './components/models';

/** Trim out the '/' slash, only start from the actual link. */
export const routes: Routes = [
    { path: RoutePath.Docs.split('/')[1], loadComponent: () => import('./pages/docs-page/docs-page.component').then(m => m.DocsPageComponent) },
    { path: RoutePath.MainPage.split('/')[1], loadComponent: () => import('./pages/main-page/main-page.component').then(m => m.MainPageComponent) },
    { path: RoutePath.WelcomePage.split('/')[1], loadComponent: () => import('./pages/welcome-page/welcome-page.component').then(m => m.WelcomePageComponent) },
    { path: RoutePath.WhatsNewPage.split('/')[1], loadComponent: () => import('./pages/whats-new-page/whats-new-page.component').then(m => m.WhatsNewPageComponent) },
    { path: RoutePath.FinanceManagerPage.split('/')[1], loadComponent: () => import('./pages/storage-page/storage-page.component').then(m => m.StoragePageComponent) },
    { path: RoutePath.HighlightedFeaturesPage.split('/')[1], loadComponent: () => import('./pages/highlighted-features-page/highlighted-features-page.component').then(m => m.HighlightedFeaturesPageComponent) },

    { path: RoutePath.SmartBudgeterPage.split('/')[1], loadComponent: () => import('./pages/smart-budgeter/smart-budgeter.component').then(m => m.SmartBudgeterComponent) },


    { path: '**', redirectTo: RoutePath.MainPage }
];
