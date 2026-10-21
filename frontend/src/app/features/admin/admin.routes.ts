import { Routes } from '@angular/router';
import { PanelLayout } from '../../layout/panel-layout';

/** Panel de administración: dashboard, usuarios, departamentos, reservas, pagos y reembolsos. */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: PanelLayout,
    data: {
      titulo: 'Administración',
      enlaces: [
        { etiqueta: 'Dashboard', ruta: '/admin', icono: 'pi-chart-bar', exacto: true },
        { etiqueta: 'Usuarios', ruta: '/admin/usuarios', icono: 'pi-users' },
        { etiqueta: 'Departamentos', ruta: '/admin/departamentos', icono: 'pi-building' },
        { etiqueta: 'Reservas', ruta: '/admin/reservas', icono: 'pi-calendar' },
        { etiqueta: 'Pagos', ruta: '/admin/pagos', icono: 'pi-credit-card' },
        { etiqueta: 'Reembolsos', ruta: '/admin/reembolsos', icono: 'pi-replay' },
      ],
    },
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Administración · DepaYa',
        loadComponent: () => import('./dashboard').then((m) => m.Dashboard),
      },
      { path: 'usuarios', title: 'Usuarios · DepaYa', loadComponent: () => import('./usuarios').then((m) => m.Usuarios) },
      {
        path: 'departamentos',
        title: 'Departamentos · DepaYa',
        loadComponent: () => import('./departamentos').then((m) => m.AdminDepartamentos),
      },
      { path: 'reservas', title: 'Reservas · DepaYa', loadComponent: () => import('./reservas').then((m) => m.AdminReservas) },
      { path: 'pagos', title: 'Pagos · DepaYa', loadComponent: () => import('./pagos').then((m) => m.AdminPagos) },
      {
        path: 'reembolsos',
        title: 'Reembolsos · DepaYa',
        loadComponent: () => import('./reembolsos').then((m) => m.Reembolsos),
      },
    ],
  },
];
