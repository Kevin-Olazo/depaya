import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SIN_AVISO } from '../interceptors/error.interceptor';
import {
  CancelarReservaDto,
  Consulta,
  FiltroReserva,
  Ocupada,
  Pagina,
  Reserva,
  ReservaActualizarDto,
  ReservaCrearDto,
  ResumenAlquileres,
  ResumenReservas,
} from '../models/api.models';
import { construirParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/reservas`;
  private readonly sinAviso = new HttpContext().set(SIN_AVISO, true);

  /** Público (sin token): rangos ocupados de un departamento; la fecha de salida queda libre. */
  ocupadas(idDepartamento: number): Observable<Ocupada[]> {
    return this.http.get<Ocupada[]>(`${this.base}/ocupadas`, { params: { idDepartamento } });
  }

  /* ---- huésped (INQUILINO o PROPIETARIO) ---- */
  misReservas(filtro: FiltroReserva, consulta: Consulta): Observable<Pagina<Reserva>> {
    return this.http.get<Pagina<Reserva>>(`${this.base}/mis-reservas`, { params: construirParams(filtro, consulta) });
  }

  obtener(id: number): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.base}/${id}`);
  }

  /** Las noches y el total los calcula el backend; nunca se envían. */
  crear(dto: ReservaCrearDto): Observable<Reserva> {
    return this.http.post<Reserva>(this.base, dto);
  }

  actualizar(id: number, dto: ReservaActualizarDto): Observable<Reserva> {
    return this.http.put<Reserva>(`${this.base}/${id}`, dto, { context: this.sinAviso });
  }

  cancelar(id: number, dto: CancelarReservaDto = {}): Observable<Reserva> {
    return this.http.put<Reserva>(`${this.base}/${id}/cancelar`, dto);
  }

  /* ---- propietario ---- */
  misAlquileres(filtro: FiltroReserva, consulta: Consulta): Observable<Pagina<Reserva>> {
    return this.http.get<Pagina<Reserva>>(`${this.base}/mis-alquileres`, { params: construirParams(filtro, consulta) });
  }

  resumenAlquileres(): Observable<ResumenAlquileres> {
    return this.http.get<ResumenAlquileres>(`${this.base}/mis-alquileres/resumen`);
  }

  /* ---- admin ---- */
  administrar(filtro: FiltroReserva, consulta: Consulta): Observable<Pagina<Reserva>> {
    return this.http.get<Pagina<Reserva>>(this.base, { params: construirParams(filtro, consulta) });
  }

  resumen(): Observable<ResumenReservas> {
    return this.http.get<ResumenReservas>(`${this.base}/resumen`);
  }
}
