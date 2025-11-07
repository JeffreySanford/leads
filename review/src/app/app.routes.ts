import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/pack', pathMatch: 'full' },
  { path: 'pack', loadComponent: () => import('./pack-leads/pack-leads.component').then(m => m.PackLeadsComponent) },
  { path: 'search', loadComponent: () => import('./search-sam/search-sam.component').then(m => m.SearchSamComponent) },
];
