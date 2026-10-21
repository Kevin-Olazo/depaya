import { signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { Consulta, Pagina } from './models/api.models';
import { ApiError } from './services/api-error';

export interface OpcionesLista {
  tamano?: number;
  /** Campo de orden inicial (el mismo que se pasa a [sortField] del p-table). */
  orden?: string;
  /** 1 = ascendente, -1 = descendente. */
  sentido?: 1 | -1;
}

/**
 * Estado de una tabla `p-table` en modo `lazy`: página, tamaño, orden y filtros viajan al servidor.
 * Cancela la petición anterior cuando llega una nueva.
 */
export class ListaPaginada<T> {
  readonly filas = signal<T[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly primero = signal(0);
  readonly tamano = signal(10);
  readonly campoOrden = signal<string | undefined>(undefined);
  readonly sentidoOrden = signal<1 | -1>(-1);

  private peticion: Subscription | null = null;

  constructor(
    private readonly obtener: (consulta: Consulta) => Observable<Pagina<T>>,
    opciones: OpcionesLista = {},
  ) {
    this.tamano.set(opciones.tamano ?? 10);
    this.campoOrden.set(opciones.orden);
    this.sentidoOrden.set(opciones.sentido ?? -1);
  }

  get consulta(): Consulta {
    const campo = this.campoOrden();
    return {
      page: Math.floor(this.primero() / this.tamano()),
      size: this.tamano(),
      sort: campo ? `${campo},${this.sentidoOrden() === 1 ? 'asc' : 'desc'}` : undefined,
    };
  }

  /** Evento (onLazyLoad) del p-table: cambió la página, el tamaño o el orden. */
  alCargarPerezoso(evento: TableLazyLoadEvent): void {
    this.primero.set(evento.first ?? 0);
    this.tamano.set(evento.rows ?? this.tamano());
    if (typeof evento.sortField === 'string' && evento.sortField) {
      this.campoOrden.set(evento.sortField);
      this.sentidoOrden.set(evento.sortOrder === 1 ? 1 : -1);
    }
    this.cargar();
  }

  /** Cambiaron los filtros: vuelve a la primera página. */
  buscar(): void {
    this.primero.set(0);
    this.cargar();
  }

  cargar(): void {
    this.peticion?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);
    this.peticion = this.obtener(this.consulta).subscribe({
      next: (pagina) => {
        // Si borraron el último registro de la última página, retrocede una.
        if (pagina.content.length === 0 && pagina.totalElements > 0 && this.primero() > 0) {
          this.primero.set(Math.max(0, (pagina.totalPages - 1) * this.tamano()));
          this.cargar();
          return;
        }
        this.filas.set(pagina.content);
        this.total.set(pagina.totalElements);
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.filas.set([]);
        this.total.set(0);
        this.error.set(e instanceof ApiError ? e.mensajeApi : 'No se pudo cargar la información.');
        this.cargando.set(false);
      },
    });
  }

  destruir(): void {
    this.peticion?.unsubscribe();
  }
}
