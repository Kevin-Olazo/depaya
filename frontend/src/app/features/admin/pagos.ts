import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';
import { Pago } from '../../core/models/api.models';
import { METODOS_PAGO, OPCIONES_ESTADO_PAGO } from '../../core/models/etiquetas';
import { ListaPaginada } from '../../core/lista-paginada';
import { PagosService } from '../../core/services/pagos.service';
import { tiempoRestante } from '../../core/utils/fechas';
import { BotonCsv } from '../../shared/boton-csv';
import { EstadoTag } from '../../shared/estado-tag';
import { RangoFechas, rangoAFiltro, rangoListo } from '../../shared/fecha-rango';
import { ReembolsoAcciones } from '../../shared/reembolso-acciones';
import { Vacio } from '../../shared/vacio';

@Component({
  selector: 'app-admin-pagos',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, ButtonModule, DatePicker, IconField, InputIcon, InputText, Select, TableModule, Tooltip, BotonCsv, EstadoTag, Vacio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="encabezado-pagina">
      <div>
        <p class="eyebrow">Administración</p>
        <h1>Pagos</h1>
        <p>Todos los pagos de la plataforma con su comisión de DepaYa y lo que corresponde al propietario. El reporte CSV respeta los filtros.</p>
      </div>
      <app-boton-csv recurso="pagos" [filtro]="filtroApi" />
    </header>

    <form class="tarjeta barra-filtros" [formGroup]="filtros" (ngSubmit)="$event.preventDefault()" aria-label="Filtros de pagos">
      <div class="campo">
        <label for="ap-q">Buscar</label>
        <p-iconfield>
          <p-inputicon class="pi pi-search" />
          <input pInputText id="ap-q" formControlName="q" placeholder="Huésped, departamento, referencia…" autocomplete="off" />
        </p-iconfield>
      </div>
      <div class="campo">
        <label for="ap-estado">Estado</label>
        <p-select inputId="ap-estado" ariaLabel="Estado" formControlName="estado" [options]="estados" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
      </div>
      <div class="campo">
        <label for="ap-metodo">Método</label>
        <p-select inputId="ap-metodo" ariaLabel="Método" formControlName="metodo" [options]="metodos" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
      </div>
      <div class="campo">
        <label for="ap-fechas">Fecha del pago</label>
        <p-datepicker inputId="ap-fechas" formControlName="rango" selectionMode="range" [readonlyInput]="true" placeholder="Desde — hasta" dateFormat="dd/mm/yy" [showClear]="true" appendTo="body" />
      </div>
    </form>

    @if (lista.error(); as texto) {
      <div class="aviso aviso-error" role="alert"><i class="pi pi-exclamation-triangle"></i><div>{{ texto }} <button type="button" class="enlace" (click)="lista.cargar()">Reintentar</button></div></div>
    }

    <div class="tabla-caja">
      <p-table
        [scrollable]="true"
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
        [tableStyle]="{ 'min-width': '72rem' }"
      >
        <ng-template #header>
          <tr>
            <th pSortableColumn="id" scope="col">Pago <p-sortIcon field="id" /></th>
            <th scope="col">Departamento</th>
            <th scope="col">Huésped</th>
            <th pSortableColumn="monto" scope="col" class="derecha">Monto <p-sortIcon field="monto" /></th>
            <th scope="col" class="derecha">Comisión</th>
            <th scope="col" class="derecha">Propietario</th>
            <th pSortableColumn="metodo" scope="col">Método <p-sortIcon field="metodo" /></th>
            <th pSortableColumn="estado" scope="col">Estado <p-sortIcon field="estado" /></th>
            <th pSortableColumn="fechaCreacion" scope="col">Fecha <p-sortIcon field="fechaCreacion" /></th>
            <th scope="col" class="derecha" pFrozenColumn alignFrozen="right"><span class="sr-only">Acciones</span></th>
          </tr>
        </ng-template>
        <ng-template #body let-p>
          <tr>
            <td class="num">#{{ p.id }}</td>
            <td><strong>{{ p.departamentoTitulo }}</strong><br /><small class="apagado">Reserva #{{ p.idReserva }} · {{ p.distrito }}</small></td>
            <td>{{ p.inquilinoNombre }}<br /><small class="apagado">{{ p.inquilinoCorreo }}</small></td>
            <td class="derecha num"><strong>{{ p.monto | currency: p.moneda : 'symbol' : '1.2-2' }}</strong></td>
            <td class="derecha num">{{ p.comision | currency: p.moneda : 'symbol' : '1.2-2' }}</td>
            <td class="derecha num">{{ p.montoPropietario | currency: p.moneda : 'symbol' : '1.2-2' }}</td>
            <td>{{ p.metodo }}</td>
            <td>
              <app-estado-tag tipo="pago" [valor]="p.estado" />
              @if (p.estado === 'REEMBOLSO_PENDIENTE' && p.fechaLimiteReembolso) {
                <br /><small class="apagado">Plazo {{ p.fechaLimiteReembolso | date: 'd MMM, HH:mm' }} · {{ restante(p) }}</small>
              } @else if (p.referenciaPasarela) {
                <br /><small class="apagado">Ref. {{ p.referenciaPasarela }}</small>
              }
            </td>
            <td class="num">{{ p.fechaCreacion | date: 'd MMM y, HH:mm' }}</td>
            <td pFrozenColumn alignFrozen="right">
              <div class="acciones-fila">
                @if (p.estado === 'REEMBOLSO_PENDIENTE') {
                  <p-button icon="pi pi-check" size="small" [rounded]="true" severity="success" pTooltip="Confirmar reembolso" [ariaLabel]="'Confirmar el reembolso del pago ' + p.id" (onClick)="acciones.confirmar(p, recargar)" />
                  <p-button icon="pi pi-times" size="small" [rounded]="true" severity="danger" [outlined]="true" pTooltip="Rechazar reembolso" [ariaLabel]="'Rechazar el reembolso del pago ' + p.id" (onClick)="acciones.rechazar(p, recargar)" />
                }
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="10">
              @if (!lista.cargando()) {
                <app-vacio icono="pi-credit-card" titulo="No hay pagos con esos filtros" mensaje="Prueba quitando algún filtro o ampliando el rango de fechas." />
              }
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: `
    .derecha { text-align: right; }
  `,
})
export class AdminPagos implements OnDestroy {
  private readonly api = inject(PagosService);
  private readonly destruir = inject(DestroyRef);
  protected readonly acciones = inject(ReembolsoAcciones);

  protected readonly estados = OPCIONES_ESTADO_PAGO;
  protected readonly metodos = METODOS_PAGO;

  protected readonly filtros = inject(FormBuilder).nonNullable.group({
    q: [''],
    estado: [null as Pago['estado'] | null],
    metodo: [null as Pago['metodo'] | null],
    rango: new FormControl<RangoFechas>(null, { nonNullable: true }),
  });

  protected readonly filtroApi = () => {
    const v = this.filtros.getRawValue();
    return { q: v.q.trim() || undefined, estado: v.estado, metodo: v.metodo, ...rangoAFiltro(v.rango) };
  };

  protected readonly lista = new ListaPaginada<Pago>((consulta) => this.api.administrar(this.filtroApi(), consulta), {
    orden: 'fechaCreacion',
    sentido: -1,
  });

  protected readonly recargar = () => this.lista.cargar();

  constructor() {
    this.filtros.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destruir)).subscribe(() => {
      if (rangoListo(this.filtros.controls.rango)) this.lista.buscar();
    });
  }

  ngOnDestroy(): void {
    this.lista.destruir();
  }

  protected restante(p: Pago): string {
    return tiempoRestante(p.fechaLimiteReembolso);
  }
}
