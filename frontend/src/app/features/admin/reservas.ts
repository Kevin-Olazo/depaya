import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';
import { Reserva } from '../../core/models/api.models';
import { OPCIONES_ESTADO_REEMBOLSO, OPCIONES_ESTADO_RESERVA } from '../../core/models/etiquetas';
import { ListaPaginada } from '../../core/lista-paginada';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { ReservasService } from '../../core/services/reservas.service';
import { BotonCsv } from '../../shared/boton-csv';
import { EstadoTag } from '../../shared/estado-tag';
import { RangoFechas, rangoAFiltro, rangoListo } from '../../shared/fecha-rango';
import { ReembolsoCelda } from '../../shared/reembolso-celda';
import { Vacio } from '../../shared/vacio';

@Component({
  selector: 'app-admin-reservas',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    DatePicker,
    Dialog,
    IconField,
    InputIcon,
    InputText,
    Select,
    TableModule,
    Tooltip,
    BotonCsv,
    EstadoTag,
    ReembolsoCelda,
    Vacio,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="encabezado-pagina">
      <div>
        <p class="eyebrow">Administración</p>
        <h1>Reservas</h1>
        <p>Todas las reservas de la plataforma. El reporte CSV respeta los filtros que apliques.</p>
      </div>
      <app-boton-csv recurso="reservas" [filtro]="filtroApi" />
    </header>

    <form class="tarjeta barra-filtros" [formGroup]="filtros" (ngSubmit)="$event.preventDefault()" aria-label="Filtros de reservas">
      <div class="campo">
        <label for="ar-q">Buscar</label>
        <p-iconfield>
          <p-inputicon class="pi pi-search" />
          <input pInputText id="ar-q" formControlName="q" placeholder="Huésped, propietario, departamento…" autocomplete="off" />
        </p-iconfield>
      </div>
      <div class="campo">
        <label for="ar-estado">Estado</label>
        <p-select inputId="ar-estado" ariaLabel="Estado" formControlName="estado" [options]="estados" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
      </div>
      <div class="campo">
        <label for="ar-reembolso">Reembolso</label>
        <p-select inputId="ar-reembolso" ariaLabel="Reembolso" formControlName="estadoReembolso" [options]="reembolsos" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
      </div>
      <div class="campo">
        <label for="ar-distrito">Distrito</label>
        <p-select inputId="ar-distrito" ariaLabel="Distrito" formControlName="distrito" [options]="distritos()" placeholder="Todos" [showClear]="true" [filter]="true" />
      </div>
      <div class="campo">
        <label for="ar-fechas">Fecha de ingreso</label>
        <p-datepicker inputId="ar-fechas" formControlName="rango" selectionMode="range" [readonlyInput]="true" placeholder="Desde — hasta" dateFormat="dd/mm/yy" [showClear]="true" appendTo="body" />
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
            <th pSortableColumn="id" scope="col">N.° <p-sortIcon field="id" /></th>
            <th scope="col">Departamento</th>
            <th scope="col">Huésped</th>
            <th scope="col">Propietario</th>
            <th pSortableColumn="fechaIngreso" scope="col">Estadía <p-sortIcon field="fechaIngreso" /></th>
            <th pSortableColumn="total" scope="col" class="derecha">Total <p-sortIcon field="total" /></th>
            <th pSortableColumn="estado" scope="col">Estado <p-sortIcon field="estado" /></th>
            <th scope="col">Reembolso</th>
            <th scope="col" class="derecha" pFrozenColumn alignFrozen="right"><span class="sr-only">Acciones</span></th>
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
            <td>{{ r.propietarioNombre }}</td>
            <td class="num">
              {{ r.fechaIngreso | date: 'd MMM' }} → {{ r.fechaSalida | date: 'd MMM y' }}<br />
              <small class="apagado">{{ r.noches }} {{ r.noches === 1 ? 'noche' : 'noches' }} · {{ r.cantidadHuespedes }} huésp.</small>
            </td>
            <td class="derecha num"><strong>{{ r.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong></td>
            <td><app-estado-tag tipo="reserva" [valor]="r.estado" /></td>
            <td><app-reembolso-celda [estado]="r.estadoReembolso" [limite]="r.fechaLimiteReembolso" [devuelto]="r.fechaReembolso" /></td>
            <td pFrozenColumn alignFrozen="right">
              <div class="acciones-fila">
                <p-button icon="pi pi-eye" [text]="true" [rounded]="true" severity="secondary" pTooltip="Ver detalle" [ariaLabel]="'Ver detalle de la reserva ' + r.id" (onClick)="detalle.set(r)" />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="9">
              @if (!lista.cargando()) {
                <app-vacio icono="pi-calendar" titulo="No hay reservas con esos filtros" mensaje="Prueba quitando algún filtro o ampliando el rango de fechas." />
              }
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [visible]="!!detalle()" (visibleChange)="!$event && detalle.set(null)" header="Detalle de la reserva" [modal]="true" [draggable]="false" [style]="{ width: '36rem' }" [breakpoints]="{ '640px': '94vw' }" [dismissableMask]="true">
      @if (detalle(); as r) {
        <div class="fila-separada"><strong>#{{ r.id }} · {{ r.departamentoTitulo }}</strong><app-estado-tag tipo="reserva" [valor]="r.estado" /></div>
        <dl class="lista-detalle">
          <div><dt>Huésped</dt><dd>{{ r.inquilinoNombre }} ({{ r.inquilinoCorreo }})</dd></div>
          <div><dt>Propietario</dt><dd>{{ r.propietarioNombre }}</dd></div>
          <div><dt>Distrito</dt><dd>{{ r.distrito }} · {{ r.categoria }}</dd></div>
          <div><dt>Ingreso</dt><dd>{{ r.fechaIngreso | date: 'EEEE d MMMM y' }}</dd></div>
          <div><dt>Salida</dt><dd>{{ r.fechaSalida | date: 'EEEE d MMMM y' }}</dd></div>
          <div><dt>Noches · huéspedes</dt><dd>{{ r.noches }} · {{ r.cantidadHuespedes }}</dd></div>
          <div><dt>Precio por noche</dt><dd>{{ r.precioNoche | currency: 'PEN' : 'symbol' : '1.2-2' }}</dd></div>
          <div><dt>Total</dt><dd><strong>{{ r.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong></dd></div>
          <div><dt>Creada</dt><dd>{{ r.fechaCreacion | date: 'd MMM y, HH:mm' }}</dd></div>
          @if (r.fechaCancelacion) {
            <div><dt>Cancelada</dt><dd>{{ r.fechaCancelacion | date: 'd MMM y, HH:mm' }}</dd></div>
          }
          <div><dt>Reembolso</dt><dd><app-reembolso-celda [estado]="r.estadoReembolso" [limite]="r.fechaLimiteReembolso" [devuelto]="r.fechaReembolso" /></dd></div>
          @if (r.metodoReembolso) {
            <div><dt>Método de reembolso</dt><dd>{{ r.metodoReembolso }}</dd></div>
          }
        </dl>
      }
    </p-dialog>
  `,
  styles: `
    .derecha { text-align: right; }
    .celda-depa { color: inherit; }
    .celda-depa span { display: grid; }
    .lista-detalle { margin: 14px 0 0; display: grid; }
    .lista-detalle div { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid var(--dy-borde); }
    .lista-detalle dt { color: var(--dy-apagado); }
    .lista-detalle dd { margin: 0; text-align: right; font-weight: 600; }
  `,
})
export class AdminReservas implements OnDestroy {
  private readonly api = inject(ReservasService);
  private readonly deptos = inject(DepartamentosService);
  private readonly destruir = inject(DestroyRef);

  protected readonly estados = OPCIONES_ESTADO_RESERVA;
  protected readonly reembolsos = OPCIONES_ESTADO_REEMBOLSO;
  protected readonly distritos = signal<string[]>([]);
  protected readonly detalle = signal<Reserva | null>(null);

  protected readonly filtros = inject(FormBuilder).nonNullable.group({
    q: [''],
    estado: [null as Reserva['estado'] | null],
    estadoReembolso: [null as Reserva['estadoReembolso'] | null],
    distrito: [null as string | null],
    rango: new FormControl<RangoFechas>(null, { nonNullable: true }),
  });

  protected readonly filtroApi = () => {
    const v = this.filtros.getRawValue();
    return { q: v.q.trim() || undefined, estado: v.estado, estadoReembolso: v.estadoReembolso, distrito: v.distrito, ...rangoAFiltro(v.rango) };
  };

  protected readonly lista = new ListaPaginada<Reserva>((consulta) => this.api.administrar(this.filtroApi(), consulta), {
    orden: 'fechaCreacion',
    sentido: -1,
  });

  constructor() {
    this.deptos.resumen().pipe(takeUntilDestroyed(this.destruir)).subscribe({
      next: (r) => this.distritos.set(Object.keys(r.porDistrito).sort((a, b) => a.localeCompare(b, 'es'))),
      error: () => undefined,
    });
    this.filtros.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destruir)).subscribe(() => {
      if (rangoListo(this.filtros.controls.rango)) this.lista.buscar();
    });
  }

  ngOnDestroy(): void {
    this.lista.destruir();
  }
}
