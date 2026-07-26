import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./photos/photos').then((m) => m.Photos),
  },
  {
    path: 'favorites',
    loadComponent: () => import('./favorites/favorites').then((m) => m.Favorites),
  },
  {
    path: 'photos/:id',
    loadComponent: () => import('./favorites/photo-detail/photo-detail').then((m) => m.PhotoDetail),
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
