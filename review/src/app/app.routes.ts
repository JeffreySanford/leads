import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/pack', pathMatch: 'full' },
  { path: 'pack', loadComponent: () => import('./pack-leads/pack-leads.component').then(m => m.PackLeadsComponent) },
  { path: 'probe', loadComponent: () => import('./probe-sam/probe-sam.component').then(m => m.ProbeSamComponent) },
  { path: 'probe-verbose', loadComponent: () => import('./probe-sam-verbose/probe-sam-verbose.component').then(m => m.ProbeSamVerboseComponent) },
  { path: 'search', loadComponent: () => import('./search-sam/search-sam.component').then(m => m.SearchSamComponent) },
];
