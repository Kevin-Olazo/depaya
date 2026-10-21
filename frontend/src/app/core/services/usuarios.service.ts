import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SIN_AVISO } from '../interceptors/error.interceptor';
import {
  Consulta,
  EstadoUsuarioDto,
  FiltroUsuario,
  Pagina,
  ResumenUsuarios,
  Usuario,
  UsuarioActualizarDto,
  UsuarioCrearDto,
} from '../models/api.models';
import { construirParams } from '../utils/http-params';

/** Gestión de usuarios (ADMIN). */
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/usuarios`;
  private readonly sinAviso = new HttpContext().set(SIN_AVISO, true);

  listar(filtro: FiltroUsuario, consulta: Consulta): Observable<Pagina<Usuario>> {
    return this.http.get<Pagina<Usuario>>(this.base, { params: construirParams(filtro, consulta) });
  }

  resumen(): Observable<ResumenUsuarios> {
    return this.http.get<ResumenUsuarios>(`${this.base}/resumen`);
  }

  crear(dto: UsuarioCrearDto): Observable<Usuario> {
    return this.http.post<Usuario>(this.base, dto, { context: this.sinAviso });
  }

  actualizar(id: number, dto: UsuarioActualizarDto): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/${id}`, dto, { context: this.sinAviso });
  }

  /** Activa/desactiva la cuenta y habilita/bloquea publicaciones; los campos ausentes no cambian. */
  cambiarEstado(id: number, dto: EstadoUsuarioDto): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/${id}/estado`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
