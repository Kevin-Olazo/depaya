import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Sesion } from '../services/sesion';

/**
 * Rutas públicas del backend: NO llevan token. Si llegara un token vencido a una ruta pública,
 * el backend respondería 401 aunque la ruta no lo pida.
 */
const PUBLICAS_GET: RegExp[] = [
  /^\/api\/departamentos$/,
  /^\/api\/departamentos\/(distritos|categorias|\d+)$/,
  /^\/api\/reservas\/ocupadas$/,
];
const PUBLICAS_POST: RegExp[] = [/^\/api\/auth\/(login|registro)$/];

export function esRutaPublica(metodo: string, url: string): boolean {
  let ruta: string;
  try {
    ruta = new URL(url, environment.apiUrl).pathname.replace(/\/+$/, '');
  } catch {
    return false;
  }
  const lista = metodo === 'GET' ? PUBLICAS_GET : metodo === 'POST' ? PUBLICAS_POST : [];
  return lista.some((patron) => patron.test(ruta));
}

/** Agrega `Authorization: Bearer <token>` solo a las rutas privadas del backend. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  const token = inject(Sesion).token();
  if (!token || esRutaPublica(req.method, req.url)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
