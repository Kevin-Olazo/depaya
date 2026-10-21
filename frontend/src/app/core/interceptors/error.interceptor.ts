import { Location } from '@angular/common';
import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiError, CuerpoError } from '../services/api-error';
import { Avisos } from '../services/avisos';
import { Sesion } from '../services/sesion';

/** Pon `true` en el contexto de una petición cuando el formulario ya muestra el error (sin toast). */
export const SIN_AVISO = new HttpContextToken<boolean>(() => false);

/** El cuerpo puede venir como JSON, como texto o como Blob (descargas). */
function leerCuerpo(e: HttpErrorResponse) {
  const cuerpo: unknown = e.error;
  if (cuerpo instanceof Blob) {
    return from(cuerpo.text()).pipe(
      switchMap((texto) => of(analizar(texto))),
      catchError(() => of(null)),
    );
  }
  if (typeof cuerpo === 'string') return of(analizar(cuerpo));
  return of((cuerpo as CuerpoError | null) ?? null);
}

function analizar(texto: string): CuerpoError | null {
  try {
    return JSON.parse(texto) as CuerpoError;
  } catch {
    return null;
  }
}

/**
 * Normaliza los errores del backend en un ApiError. Un 401 con token cierra la sesión y lleva al login;
 * el resto se muestra en un toast (el `mensaje` del backend y la lista `errores` de las validaciones 400).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(Sesion);
  const router = inject(Router);
  const avisos = inject(Avisos);
  const ubicacion = inject(Location);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || !req.url.startsWith(environment.apiUrl)) {
        return throwError(() => err);
      }
      return leerCuerpo(err).pipe(
        switchMap((cuerpo) => {
          const apiError = ApiError.desdeHttp(err, cuerpo);
          const llevabaToken = req.headers.has('Authorization');

          if (err.status === 401 && llevabaToken) {
            if (sesion.activa()) {
              sesion.cerrar();
              avisos.advertencia('Tu sesión expiró', 'Inicia sesión de nuevo para continuar.');
              // La URL del navegador ya está al día aunque el router aún no termine la navegación (carga inicial).
              const actual = ubicacion.path(true) || router.url;
              const destino = actual.startsWith('/login') ? '/' : actual;
              void router.navigate(['/login'], { queryParams: { returnUrl: destino } });
            }
          } else if (!req.context.get(SIN_AVISO)) {
            if (apiError.esValidacion) avisos.error(apiError.mensajeApi, apiError.detalle);
            else avisos.error(tituloPorEstado(err.status), apiError.mensajeApi);
          }
          return throwError(() => apiError);
        }),
      );
    }),
  );
};

function tituloPorEstado(estado: number): string {
  switch (estado) {
    case 0:
      return 'Sin conexión';
    case 401:
      return 'No autorizado';
    case 403:
      return 'Acción no permitida';
    case 404:
      return 'No encontrado';
    case 409:
      return 'No se pudo completar';
    default:
      return estado >= 500 ? 'Error del servidor' : 'Revisa los datos';
  }
}
