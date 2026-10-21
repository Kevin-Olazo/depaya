import { Routes } from '@angular/router';
import { exigirRol, exigirSesion, soloInvitados } from './core/guards/roles.guard';
import { Shell } from './layout/shell';

/**
 * Rutas con carga perezosa. Las zonas por rol usan `canMatch`: si el rol no corresponde,
 * el código de esa zona ni siquiera se descarga y se redirige (login o inicio).
 */
export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'DepaYa · Alquila departamentos en el Perú',
        loadComponent: () => import('./features/publico/inicio').then((m) => m.Inicio),
      },
      {
        path: 'departamentos',
        title: 'Departamentos · DepaYa',
        loadComponent: () => import('./features/publico/catalogo').then((m) => m.Catalogo),
      },
      {
        path: 'departamentos/:id',
        title: 'Detalle del departamento · DepaYa',
        loadComponent: () => import('./features/publico/detalle').then((m) => m.Detalle),
      },
      {
        path: 'login',
        title: 'Iniciar sesión · DepaYa',
        canActivate: [soloInvitados],
        loadComponent: () => import('./features/publico/login').then((m) => m.Login),
      },
      {
        path: 'registro',
        title: 'Crear cuenta · DepaYa',
        canActivate: [soloInvitados],
        loadComponent: () => import('./features/publico/registro').then((m) => m.Registro),
      },
      {
        path: 'cuenta',
        title: 'Mi cuenta · DepaYa',
        canMatch: [exigirSesion],
        loadComponent: () => import('./features/cuenta/cuenta').then((m) => m.Cuenta),
      },
      {
        path: 'huesped',
        canMatch: [exigirRol('INQUILINO', 'PROPIETARIO')],
        loadChildren: () => import('./features/huesped/huesped.routes').then((m) => m.HUESPED_ROUTES),
      },
      {
        path: 'propietario',
        canMatch: [exigirRol('PROPIETARIO')],
        loadChildren: () => import('./features/propietario/propietario.routes').then((m) => m.PROPIETARIO_ROUTES),
      },
      {
        path: 'admin',
        canMatch: [exigirRol('ADMIN')],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: '**',
        title: 'Página no encontrada · DepaYa',
        loadComponent: () => import('./features/publico/no-encontrado').then((m) => m.NoEncontrado),
      },
    ],
  },
];
