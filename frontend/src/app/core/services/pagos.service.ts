import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Consulta,
  FiltroPago,
  MetodoPago,
  Pagina,
  Pago,
  ResumenIngresos,
  ResumenPagos,
} from '../models/api.models';
import { construirParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/pagos`;

  /* ---- huésped ---- */
  misPagos(filtro: FiltroPago, consulta: Consulta): Observable<Pagina<Pago>> {
    return this.http.get<Pagina<Pago>>(`${this.base}/mis-pagos`, { params: construirParams(filtro, consulta) });
  }

  /** Paso 1: crea el pago PROCESANDO. El monto sale de la reserva (no se envía). */
  crear(idReserva: number, metodo: MetodoPago): Observable<Pago> {
    return this.http.post<Pago>(this.base, { idReserva, metodo });
  }

  /** Paso 2: confirma el pago (pasarela simulada); la reserva queda CONFIRMADA. */
  confirmar(id: number): Observable<Pago> {
    return this.http.put<Pago>(`${this.base}/${id}/confirmar`, {});
  }

  /** Desiste de un pago PROCESANDO. */
  cancelar(id: number): Observable<Pago> {
    return this.http.put<Pago>(`${this.base}/${id}/cancelar`, {});
  }

  /* ---- propietario ---- */
  misIngresos(filtro: FiltroPago, consulta: Consulta): Observable<Pagina<Pago>> {
    return this.http.get<Pagina<Pago>>(`${this.base}/mis-ingresos`, { params: construirParams(filtro, consulta) });
  }

  resumenIngresos(): Observable<ResumenIngresos> {
    return this.http.get<ResumenIngresos>(`${this.base}/mis-ingresos/resumen`);
  }

  /* ---- admin ---- */
  administrar(filtro: FiltroPago, consulta: Consulta): Observable<Pagina<Pago>> {
    return this.http.get<Pagina<Pago>>(this.base, { params: construirParams(filtro, consulta) });
  }

  resumen(): Observable<ResumenPagos> {
    return this.http.get<ResumenPagos>(`${this.base}/resumen`);
  }

  confirmarReembolso(id: number): Observable<Pago> {
    return this.http.put<Pago>(`${this.base}/${id}/reembolso/confirmar`, {});
  }

  rechazarReembolso(id: number): Observable<Pago> {
    return this.http.put<Pago>(`${this.base}/${id}/reembolso/rechazar`, {});
  }
}
