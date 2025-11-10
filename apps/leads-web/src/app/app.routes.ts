import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/pack', pathMatch: 'full' },
  {
    path: 'pack',
    loadChildren: () =>
      import('./pack-leads/pack-leads.module').then(
        (m) => m.PackLeadsModule
      ),
  },
  {
    path: 'search',
    loadChildren: () =>
      import('./search-sam/search-sam.module').then(
        (m) => m.SearchSamModule
      ),
  },
];
