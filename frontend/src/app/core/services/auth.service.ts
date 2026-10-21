import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthRespuesta, LoginDto, Usuario, UsuarioActualizarDto, UsuarioCrearDto } from '../models/api.models';
import { SIN_AVISO } from '../interceptors/error.interceptor';
import { Sesion } from './sesion';

/** Login, registro y datos del usuario de la sesión (ms-auth vía gateway). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(Sesion);
  private readonly base = `${environment.apiUrl}/api`;
  private readonly sinAviso = new HttpContext().set(SIN_AVISO, true);

  /** Los formularios de login y registro muestran el error ellos mismos (sin toast). */
  login(dto: LoginDto): Observable<AuthRespuesta> {
    return this.http
      .post<AuthRespuesta>(`${this.base}/auth/login`, dto, { context: this.sinAviso })
      .pipe(tap((r) => this.sesion.iniciar(r.token, r.usuario)));
  }

  /** El registro devuelve token: se entra directo. */
  registro(dto: UsuarioCrearDto): Observable<AuthRespuesta> {
    return this.http
      .post<AuthRespuesta>(`${this.base}/auth/registro`, dto, { context: this.sinAviso })
      .pipe(tap((r) => this.sesion.iniciar(r.token, r.usuario)));
  }

  me(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/auth/me`).pipe(tap((u) => this.sesion.perfil.set(u)));
  }

  /** Recarga los datos del perfil si hay sesión (por ejemplo, para saber si las publicaciones están bloqueadas). */
  refrescarPerfil(): void {
    if (this.sesion.activa()) {
      this.me().subscribe({ error: () => undefined });
    }
  }

  actualizarPerfil(id: number, dto: UsuarioActualizarDto): Observable<Usuario> {
    return this.http
      .put<Usuario>(`${this.base}/usuarios/${id}`, dto, { context: this.sinAviso })
      .pipe(tap((u) => this.sesion.perfil.set(u)));
  }

  desactivarMiCuenta(): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/usuarios/me/desactivar`, {});
  }

  cerrarSesion(): void {
    this.sesion.cerrar();
  }
}
