import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '', // Rota padrão
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'feed',
    loadComponent: () =>
      import('./feed/feed.component').then((m) => m.FeedComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'books',
    loadComponent: () =>
      import('./book/book-list/book-list.component').then(
        (m) => m.BookListComponent
      ),
  },

  // <<< ROTA DE NOTIFICAÇÕES USANDO O MESMO PADRÃO LAZY LOADING >>>
  { 
    path: 'notifications', 
    loadComponent: () => 
      import('./notifications/notifications.component').then(m => m.NotificationsComponent) 
  },

  // futuras rotas aqui
  // { path: '**', redirectTo: '/feed' } // Considere adicionar uma rota curinga
];