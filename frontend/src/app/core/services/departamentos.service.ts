import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SIN_AVISO } from '../interceptors/error.interceptor';
import {
  Consulta,
  Departamento,
  DepartamentoGuardarDto,
  EstadoDepartamento,
  FiltroDepartamento,
  Pagina,
  ResumenDepartamentos,
} from '../models/api.models';
import { construirParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class DepartamentosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/departamentos`;
  /** El formulario de alta/edición muestra los errores de campo y el 403 por su cuenta. */
  private readonly sinAviso = new HttpContext().set(SIN_AVISO, true);

  /* ---- público (sin token) ---- */
  catalogo(filtro: FiltroDepartamento, consulta: Consulta): Observable<Pagina<Departamento>> {
    return this.http.get<Pagina<Departamento>>(this.base, { params: construirParams(filtro, consulta) });
  }

  detalle(id: number): Observable<Departamento> {
    return this.http.get<Departamento>(`${this.base}/${id}`);
  }

  distritos(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/distritos`);
  }

  categorias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/categorias`);
  }

  /* ---- propietario ---- */
  misDepartamentos(filtro: FiltroDepartamento, consulta: Consulta): Observable<Pagina<Departamento>> {
    return this.http.get<Pagina<Departamento>>(`${this.base}/mis-departamentos`, {
      params: construirParams(filtro, consulta),
    });
  }

  crear(dto: DepartamentoGuardarDto): Observable<Departamento> {
    return this.http.post<Departamento>(this.base, dto, { context: this.sinAviso });
  }

  actualizar(id: number, dto: DepartamentoGuardarDto): Observable<Departamento> {
    return this.http.put<Departamento>(`${this.base}/${id}`, dto, { context: this.sinAviso });
  }

  cambiarEstado(id: number, estado: EstadoDepartamento): Observable<Departamento> {
    return this.http.put<Departamento>(`${this.base}/${id}/estado`, { estado });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /** Desactiva (activo=false → INACTIVO) o reactiva (activo=true → DISPONIBLE) todas las publicaciones del propietario. */
  activacion(idPropietario: number, activo: boolean): Observable<{ actualizados: number }> {
    return this.http.put<{ actualizados: number }>(`${this.base}/propietario/${idPropietario}/activacion`, { activo });
  }

  /* ---- admin ---- */
  admin(filtro: FiltroDepartamento, consulta: Consulta): Observable<Pagina<Departamento>> {
    return this.http.get<Pagina<Departamento>>(`${this.base}/admin`, { params: construirParams(filtro, consulta) });
  }

  resumen(): Observable<ResumenDepartamentos> {
    return this.http.get<ResumenDepartamentos>(`${this.base}/resumen`);
  }
}
