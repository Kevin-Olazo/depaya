import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { Reserva, ResumenAlquileres } from '../../core/models/api.models';
import { OPCIONES_ESTADO_REEMBOLSO, OPCIONES_ESTADO_RESERVA } from '../../core/models/etiquetas';
import { ListaPaginada } from '../../core/lista-paginada';
import { ReservasService } from '../../core/services/reservas.service';
import { EstadoTag } from '../../shared/estado-tag';
import { RangoFechas, rangoAFiltro, rangoListo } from '../../shared/fecha-rango';
import { Kpi } from '../../shared/kpi';
import { ReembolsoCelda } from '../../shared/reembolso-celda';
import { Vacio } from '../../shared/vacio';

@Component({
  selector: 'app-mis-alquileres',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    DatePicker,
    IconField,
    InputIcon,
    InputText,
    Select,
    Skeleton,
    TableModule,
    EstadoTag,
    Kpi,
    ReembolsoCelda,
    Vacio,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="encabezado-pagina">
      <div>
        <h1>Mis alquileres</h1>
        <p>Las reservas que hicieron los huéspedes a tus departamentos.</p>
      </div>
    </header>

    <section class="rejilla-kpi" aria-label="Resumen de alquileres">
      @if (resumen(); as r) {
        <app-kpi etiqueta="Reservas totales" [valor]="r.total" icono="pi-calendar" tono="coral" />
        <app-kpi etiqueta="Pendientes de pago" [valor]="r.pendientes" icono="pi-clock" tono="ambar" />
        <app-kpi etiqueta="Confirmadas" [valor]="r.confirmadas" icono="pi-check-circle" tono="verde" />
        <app-kpi etiqueta="Canceladas" [valor]="r.canceladas" icono="pi-times-circle" tono="gris" />
        <app-kpi etiqueta="Huéspedes próximos" [valor]="r.huespedesProximos" detalle="En reservas activas desde hoy" icono="pi-users" tono="azul" />
      } @else {
        @for (i of [1, 2, 3, 4, 5]; track i) {
          <p-skeleton height="86px" borderRadius="16px" />
        }
      }
    </section>

    <form class="tarjeta barra-filtros" [formGroup]="filtros" (ngSubmit)="$event.preventDefault()" aria-label="Filtros de alquileres">
      <div class="campo">
        <label for="a-q">Buscar</label>
        <p-iconfield>
          <p-inputicon class="pi pi-search" />
          <input pInputText id="a-q" formControlName="q" placeholder="Huésped, departamento o distrito" autocomplete="off" />
        </p-iconfield>
      </div>
      <div class="campo">
        <label for="a-estado">Estado</label>
        <p-select inputId="a-estado" ariaLabel="Estado" formControlName="estado" [options]="estados" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
      </div>
      <div class="campo">
        <label for="a-reembolso">Reembolso</label>
        <p-select inputId="a-reembolso" ariaLabel="Reembolso" formControlName="estadoReembolso" [options]="reembolsos" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
      </div>
      <div class="campo">
        <label for="a-fechas">Fecha de ingreso</label>
        <p-datepicker inputId="a-fechas" formControlName="rango" selectionMode="range" [readonlyInput]="true" placeholder="Desde — hasta" dateFormat="dd/mm/yy" [showClear]="true" appendTo="body" />
      </div>
    </form>

    @if (lista.error(); as texto) {
      <div class="aviso aviso-error" role="alert"><i class="pi pi-exclamation-triangle"></i><div>{{ texto }} <button type="button" class="enlace" (click)="lista.cargar()">Reintentar</button></div></div>
    }

    <div class="tabla-caja">
      <p-table
        [value]="lista.filas()"
        [lazy]="true"
        (onLazyLoad)="lista.alCargarPerezoso($event)"
        [paginator]="true"
        [rows]="lista.tamano()"
        [first]="lista.primero()"
        [totalRecords]="lista.total()"
        [loading]="lista.cargando()"
        [rowsPerPageOptions]="[5, 10, 25, 50]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="{first} – {last} de {totalRecords}"
        sortField="fechaCreacion"
        [sortOrder]="-1"
        dataKey="id"
        [tableStyle]="{ 'min-width': '64rem' }"
      >
        <ng-template #header>
          <tr>
            <th pSortableColumn="id" scope="col">N.° <p-sortIcon field="id" /></th>
            <th scope="col">Departamento</th>
            <th scope="col">Huésped</th>
            <th pSortableColumn="fechaIngreso" scope="col">Estadía <p-sortIcon field="fechaIngreso" /></th>
            <th pSortableColumn="total" scope="col" class="derecha">Total <p-sortIcon field="total" /></th>
            <th pSortableColumn="estado" scope="col">Estado <p-sortIcon field="estado" /></th>
            <th scope="col">Reembolso</th>
          </tr>
        </ng-template>
        <ng-template #body let-r>
          <tr>
            <td class="num">#{{ r.id }}</td>
            <td>
              <a class="celda-depa" [routerLink]="['/departamentos', r.idDepartamento]">
                <img [src]="r.imagenUrl" alt="" loading="lazy" />
                <span><strong>{{ r.departamentoTitulo }}</strong><small class="apagado">{{ r.distrito }}</small></span>
              </a>
            </td>
            <td><strong>{{ r.inquilinoNombre }}</strong><br /><small class="apagado">{{ r.inquilinoCorreo }}</small></td>
            <td class="num">
              {{ r.fechaIngreso | date: 'd MMM' }} → {{ r.fechaSalida | date: 'd MMM y' }}<br />
              <small class="apagado">{{ r.noches }} {{ r.noches === 1 ? 'noche' : 'noches' }} · {{ r.cantidadHuespedes }} huésp.</small>
            </td>
            <td class="derecha num"><strong>{{ r.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong></td>
            <td><app-estado-tag tipo="reserva" [valor]="r.estado" /></td>
            <td><app-reembolso-celda [estado]="r.estadoReembolso" [limite]="r.fechaLimiteReembolso" [devuelto]="r.fechaReembolso" /></td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="7">
              @if (!lista.cargando()) {
                <app-vacio icono="pi-calendar" titulo="Todavía no hay alquileres" mensaje="Cuando alguien reserve uno de tus departamentos aparecerá aquí. Si cambiaste los filtros, prueba quitándolos." />
              }
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: `
    .derecha { text-align: right; }
    .celda-depa { color: inherit; }
    .celda-depa span { display: grid; }
  `,
})
export class MisAlquileres implements OnDestroy {
  private readonly api = inject(ReservasService);
  private readonly destruir = inject(DestroyRef);

  protected readonly estados = OPCIONES_ESTADO_RESERVA;
  protected readonly reembolsos = OPCIONES_ESTADO_REEMBOLSO.filter((o) => o.valor !== 'NO_APLICA');
  protected readonly resumen = signal<ResumenAlquileres | null>(null);

  protected readonly filtros = inject(FormBuilder).nonNullable.group({
    q: [''],
    estado: [null as Reserva['estado'] | null],
    estadoReembolso: [null as Reserva['estadoReembolso'] | null],
    rango: new FormControl<RangoFechas>(null, { nonNullable: true }),
  });

  protected readonly lista = new ListaPaginada<Reserva>(
    (consulta) => {
      const v = this.filtros.getRawValue();
      return this.api.misAlquileres(
        { q: v.q.trim() || undefined, estado: v.estado, estadoReembolso: v.estadoReembolso, ...rangoAFiltro(v.rango) },
        consulta,
      );
    },
    { orden: 'fechaCreacion', sentido: -1 },
  );

  constructor() {
    this.api.resumenAlquileres().pipe(takeUntilDestroyed(this.destruir)).subscribe({ next: (r) => this.resumen.set(r), error: () => undefined });
    this.filtros.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destruir)).subscribe(() => {
      if (rangoListo(this.filtros.controls.rango)) this.lista.buscar();
    });
  }

  ngOnDestroy(): void {
    this.lista.destruir();
  }
}
