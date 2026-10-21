import { Routes } from '@angular/router';
import { PanelLayout } from '../../layout/panel-layout';

/** Panel del propietario: sus departamentos, los alquileres que reciben y sus ingresos. */
export const PROPIETARIO_ROUTES: Routes = [
  {
    path: '',
    component: PanelLayout,
    data: {
      titulo: 'Panel propietario',
      enlaces: [
        { etiqueta: 'Mis departamentos', ruta: '/propietario/departamentos', icono: 'pi-building' },
        { etiqueta: 'Mis alquileres', ruta: '/propietario/alquileres', icono: 'pi-calendar' },
        { etiqueta: 'Mis ingresos', ruta: '/propietario/ingresos', icono: 'pi-wallet' },
      ],
    },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'departamentos' },
      {
        path: 'departamentos',
        title: 'Mis departamentos · DepaYa',
        loadComponent: () => import('./mis-departamentos').then((m) => m.MisDepartamentos),
      },
      {
        path: 'alquileres',
        title: 'Mis alquileres · DepaYa',
        loadComponent: () => import('./mis-alquileres').then((m) => m.MisAlquileres),
      },
      {
        path: 'ingresos',
        title: 'Mis ingresos · DepaYa',
        loadComponent: () => import('./mis-ingresos').then((m) => m.MisIngresos),
      },
    ],
  },
];
