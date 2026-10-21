import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { DatePicker } from 'primeng/datepicker';
import { UIChart } from 'primeng/chart';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { Pago, ResumenIngresos } from '../../core/models/api.models';
import { METODOS_PAGO, OPCIONES_ESTADO_PAGO } from '../../core/models/etiquetas';
import { ListaPaginada } from '../../core/lista-paginada';
import { PagosService } from '../../core/services/pagos.service';
import { COLORES, OPCIONES_BASE } from '../../shared/colores-graficos';
import { EstadoTag } from '../../shared/estado-tag';
import { RangoFechas, rangoAFiltro, rangoListo } from '../../shared/fecha-rango';
import { Kpi } from '../../shared/kpi';
import { Vacio } from '../../shared/vacio';

@Component({
  selector: 'app-mis-ingresos',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, DatePicker, UIChart, IconField, InputIcon, InputText, Select, Skeleton, TableModule, EstadoTag, Kpi, Vacio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="encabezado-pagina">
      <div>
        <p class="eyebrow">Panel propietario</p>
        <h1>Mis <em>ingresos</em></h1>
        <p>Lo que generan tus departamentos. Solo cuentan los pagos <strong>completados</strong>: DepaYa retiene una comisión y el resto es tuyo.</p>
      </div>
    </header>

    <section class="rejilla-kpi" aria-label="Resumen de ingresos">
      @if (resumen(); as r) {
        <app-kpi etiqueta="Ingreso bruto" [valor]="(r.ingresoBruto | currency: 'PEN' : 'symbol' : '1.2-2') ?? ''" [detalle]="r.pagosCompletados + ' pago(s) completado(s)'" icono="pi-wallet" tono="azul" />
        <app-kpi [etiqueta]="'Comisión de DepaYa (' + r.porcentajeComision + ' %)'" [valor]="(r.comisionDepaya | currency: 'PEN' : 'symbol' : '1.2-2') ?? ''" icono="pi-percentage" tono="ambar" />
        <app-kpi [etiqueta]="'Ingreso neto (' + (100 - r.porcentajeComision) + ' %)'" [valor]="(r.ingresoNeto | currency: 'PEN' : 'symbol' : '1.2-2') ?? ''" detalle="Lo que recibes" icono="pi-money-bill" tono="verde" />
        <app-kpi etiqueta="Reembolsos pendientes" [valor]="r.reembolsosPendientes" detalle="Esperan confirmación del admin" icono="pi-replay" tono="marca" />
      } @else {
        @for (i of [1, 2, 3, 4]; track i) {
          <p-skeleton height="86px" borderRadius="16px" />
        }
      }
    </section>

    @if (resumen(); as r) {
      @if (r.ingresoBruto > 0) {
        <section class="tarjeta grafico-caja">
          <div>
            <h2>¿Cómo se reparte cada pago?</h2>
            <p class="apagado">De cada pago completado, el {{ 100 - r.porcentajeComision }} % es para ti y el {{ r.porcentajeComision }} % es la comisión de DepaYa.</p>
          </div>
          <div class="grafico"><p-chart type="doughnut" [data]="reparto()" [options]="opciones" ariaLabel="Reparto entre ingreso neto y comisión de DepaYa" /></div>
        </section>
      }
    }

    <form class="tarjeta barra-filtros" [formGroup]="filtros" (ngSubmit)="$event.preventDefault()" aria-label="Filtros de pagos recibidos">
      <div class="campo">
        <label for="i-q">Buscar</label>
        <p-iconfield>
          <p-inputicon class="pi pi-search" />
          <input pInputText id="i-q" formControlName="q" placeholder="Huésped o departamento" autocomplete="off" />
        </p-iconfield>
      </div>
      <div class="campo">
        <label for="i-estado">Estado</label>
        <p-select inputId="i-estado" ariaLabel="Estado" formControlName="estado" [options]="estados" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
      </div>
      <div class="campo">
        <label for="i-metodo">Método</label>
        <p-select inputId="i-metodo" ariaLabel="Método" formControlName="metodo" [options]="metodos" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
      </div>
      <div class="campo">
        <label for="i-fechas">Fecha del pago</label>
        <p-datepicker inputId="i-fechas" formControlName="rango" selectionMode="range" [readonlyInput]="true" placeholder="Desde — hasta" dateFormat="dd/mm/yy" [showClear]="true" appendTo="body" />
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
        [tableStyle]="{ 'min-width': '66rem' }"
      >
        <ng-template #header>
          <tr>
            <th pSortableColumn="id" scope="col">Pago <p-sortIcon field="id" /></th>
            <th scope="col">Departamento</th>
            <th scope="col">Huésped</th>
            <th pSortableColumn="monto" scope="col" class="derecha">Monto <p-sortIcon field="monto" /></th>
            <th scope="col" class="derecha">Comisión</th>
            <th scope="col" class="derecha">Tu neto</th>
            <th pSortableColumn="metodo" scope="col">Método <p-sortIcon field="metodo" /></th>
            <th pSortableColumn="estado" scope="col">Estado <p-sortIcon field="estado" /></th>
            <th pSortableColumn="fechaCreacion" scope="col">Fecha <p-sortIcon field="fechaCreacion" /></th>
          </tr>
        </ng-template>
        <ng-template #body let-p>
          <tr>
            <td class="num">#{{ p.id }}</td>
            <td><strong>{{ p.departamentoTitulo }}</strong><br /><small class="apagado">Reserva #{{ p.idReserva }} · {{ p.distrito }}</small></td>
            <td>{{ p.inquilinoNombre }}</td>
            <td class="derecha num">{{ p.monto | currency: p.moneda : 'symbol' : '1.2-2' }}</td>
            <td class="derecha num apagado">− {{ p.comision | currency: p.moneda : 'symbol' : '1.2-2' }}</td>
            <td class="derecha num"><strong>{{ p.montoPropietario | currency: p.moneda : 'symbol' : '1.2-2' }}</strong></td>
            <td>{{ p.metodo }}</td>
            <td><app-estado-tag tipo="pago" [valor]="p.estado" /></td>
            <td class="num">{{ (p.fechaPago ?? p.fechaCreacion) | date: 'd MMM y, HH:mm' }}</td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="9">
              @if (!lista.cargando()) {
                <app-vacio icono="pi-wallet" titulo="Aún no hay pagos" mensaje="Cuando un huésped pague una reserva de tus departamentos, verás aquí el monto, la comisión y lo que te corresponde." />
              }
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: `
    .derecha { text-align: right; }
    .grafico-caja { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: center; }
    .grafico { height: 260px; }
    @media (max-width: 760px) { .grafico-caja { grid-template-columns: minmax(0, 1fr); } }
  `,
})
export class MisIngresos implements OnDestroy {
  private readonly api = inject(PagosService);
  private readonly destruir = inject(DestroyRef);

  protected readonly estados = OPCIONES_ESTADO_PAGO;
  protected readonly metodos = METODOS_PAGO;
  protected readonly resumen = signal<ResumenIngresos | null>(null);
  protected readonly opciones = OPCIONES_BASE;

  protected readonly reparto = computed(() => {
    const r = this.resumen();
    return {
      labels: ['Tu ingreso neto', 'Comisión de DepaYa'],
      datasets: [{ data: [r?.ingresoNeto ?? 0, r?.comisionDepaya ?? 0], backgroundColor: [COLORES.verde, COLORES.ambar], borderWidth: 2, borderColor: '#fff' }],
    };
  });

  protected readonly filtros = inject(FormBuilder).nonNullable.group({
    q: [''],
    estado: [null as Pago['estado'] | null],
    metodo: [null as Pago['metodo'] | null],
    rango: new FormControl<RangoFechas>(null, { nonNullable: true }),
  });

  protected readonly lista = new ListaPaginada<Pago>(
    (consulta) => {
      const v = this.filtros.getRawValue();
      return this.api.misIngresos({ q: v.q.trim() || undefined, estado: v.estado, metodo: v.metodo, ...rangoAFiltro(v.rango) }, consulta);
    },
    { orden: 'fechaCreacion', sentido: -1 },
  );

  constructor() {
    this.api.resumenIngresos().pipe(takeUntilDestroyed(this.destruir)).subscribe({ next: (r) => this.resumen.set(r), error: () => undefined });
    this.filtros.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destruir)).subscribe(() => {
      if (rangoListo(this.filtros.controls.rango)) this.lista.buscar();
    });
  }

  ngOnDestroy(): void {
    this.lista.destruir();
  }
}
