import { Routes } from '@angular/router';

/** Zona del huésped (INQUILINO o PROPIETARIO): reservar, pagar y ver sus reservas y pagos. */
export const HUESPED_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'reservas' },
  {
    path: 'reservar/:idDepartamento',
    title: 'Reservar · DepaYa',
    loadComponent: () => import('./checkout').then((m) => m.Checkout),
  },
  {
    path: 'reservas/:idReserva/pago',
    title: 'Pagar reserva · DepaYa',
    loadComponent: () => import('./checkout').then((m) => m.Checkout),
  },
  {
    path: 'reservas',
    title: 'Mis reservas · DepaYa',
    loadComponent: () => import('./mis-reservas').then((m) => m.MisReservas),
  },
  {
    path: 'pagos',
    title: 'Mis pagos · DepaYa',
    loadComponent: () => import('./mis-pagos').then((m) => m.MisPagos),
  },
];
