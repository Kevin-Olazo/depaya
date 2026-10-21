import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { Rol } from '../models/api.models';
import { Avisos } from '../services/avisos';
import { Sesion } from '../services/sesion';

/** Pantalla de inicio de cada rol (a donde se va tras iniciar sesión sin una ruta pendiente). */
export function inicioPorRol(rol: Rol | null): string {
  switch (rol) {
    case 'ADMIN':
      return '/admin';
    case 'PROPIETARIO':
      return '/propietario/departamentos';
    default:
      return '/';
  }
}

function haciaLogin(router: Router): UrlTree {
  const pendiente = router.getCurrentNavigation()?.extractedUrl.toString();
  const queryParams = pendiente && pendiente !== '/' ? { returnUrl: pendiente } : undefined;
  return router.createUrlTree(['/login'], { queryParams });
}

/** Exige sesión iniciada y que el rol sea uno de los indicados. Se usa con `canMatch`: el módulo ni se descarga. */
export function exigirRol(...roles: Rol[]): CanMatchFn {
  return () => {
    const sesion = inject(Sesion);
    const router = inject(Router);
    if (!sesion.activa()) {
      return haciaLogin(router);
    }
    if (roles.includes(sesion.rol()!)) {
      return true;
    }
    inject(Avisos).advertencia('Sección no disponible', 'Tu rol no tiene acceso a esa pantalla.');
    return router.createUrlTree([inicioPorRol(sesion.rol())]);
  };
}

/** Exige cualquier sesión iniciada. */
export const exigirSesion: CanMatchFn = () => {
  const sesion = inject(Sesion);
  return sesion.activa() ? true : haciaLogin(inject(Router));
};

/** Login y registro: si ya hay sesión, se redirige al inicio del rol. */
export const soloInvitados: CanActivateFn = () => {
  const sesion = inject(Sesion);
  return sesion.activa() ? inject(Router).createUrlTree([inicioPorRol(sesion.rol())]) : true;
};
