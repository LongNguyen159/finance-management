import { Routes } from '@angular/router';
import { UserManualComponent } from './components/user-manual/user-manual.component';
import { MainPageComponent } from './pages/main-page/main-page.component';
import { DocsPageComponent } from './pages/docs-page/docs-page.component';
import { WelcomePageComponent } from './pages/welcome-page/welcome-page.component';
import { WhatsNewPageComponent } from './pages/whats-new-page/whats-new-page.component';
import { StoragePageComponent } from './pages/storage-page/storage-page.component';

export const routes: Routes = [
    {
        path: 'docs',
        component: DocsPageComponent,
    },
    {
        path: '',
        component: MainPageComponent
    },
    {
        path: 'welcome',
        component: WelcomePageComponent
    },
    {
        path: 'updates',
        component: WhatsNewPageComponent
    },
    {
        path: 'storage',
        component: StoragePageComponent
    },
    { path: '**', redirectTo: '' }
];
