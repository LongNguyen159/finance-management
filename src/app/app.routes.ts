import { Routes } from '@angular/router';
import { UserManualComponent } from './components/user-manual/user-manual.component';
import { MainPageComponent } from './pages/main-page/main-page.component';

export const routes: Routes = [
    {
        path: 'docs',
        component: UserManualComponent
    },
    {
        path: '',
        component: MainPageComponent
    },
    { path: '**', redirectTo: '' }
];
