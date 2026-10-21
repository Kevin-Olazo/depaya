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
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';
import { Pago } from '../../core/models/api.models';
import { METODOS_PAGO, OPCIONES_ESTADO_PAGO } from '../../core/models/etiquetas';
import { ListaPaginada } from '../../core/lista-paginada';
import { Avisos } from '../../core/services/avisos';
import { PagosService } from '../../core/services/pagos.service';
import { tiempoRestante } from '../../core/utils/fechas';
import { EstadoTag } from '../../shared/estado-tag';
import { RangoFechas, rangoAFiltro, rangoListo } from '../../shared/fecha-rango';
import { Vacio } from '../../shared/vacio';

@Component({
  selector: 'app-mis-pagos',
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
    TableModule,
    Tooltip,
    EstadoTag,
    Vacio,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      <header class="encabezado-pagina">
        <div>
          <h1>Mis pagos</h1>
          <p>Los pagos de tus reservas. Los pagos simulados no hacen cargos reales. Si un pago quedó «Procesando», puedes autorizarlo o cancelarlo desde aquí.</p>
        </div>
      </header>

      <form class="tarjeta barra-filtros" [formGroup]="filtros" (ngSubmit)="$event.preventDefault()" aria-label="Filtros de pagos">
        <div class="campo">
          <label for="p-q">Buscar</label>
          <p-iconfield>
            <p-inputicon class="pi pi-search" />
            <input pInputText id="p-q" formControlName="q" placeholder="Departamento o distrito" autocomplete="off" />
          </p-iconfield>
        </div>
        <div class="campo">
          <label for="p-estado">Estado</label>
          <p-select inputId="p-estado" ariaLabel="Estado" formControlName="estado" [options]="estados" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
        </div>
        <div class="campo">
          <label for="p-metodo">Método</label>
          <p-select inputId="p-metodo" ariaLabel="Método" formControlName="metodo" [options]="metodos" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
        </div>
        <div class="campo">
          <label for="p-fechas">Fecha del pago</label>
          <p-datepicker inputId="p-fechas" formControlName="rango" selectionMode="range" [readonlyInput]="true" placeholder="Desde — hasta" dateFormat="dd/mm/yy" [showClear]="true" appendTo="body" />
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
          [tableStyle]="{ 'min-width': '58rem' }"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="id" scope="col">Pago <p-sortIcon field="id" /></th>
              <th scope="col">Reserva</th>
              <th pSortableColumn="monto" scope="col" class="derecha">Monto <p-sortIcon field="monto" /></th>
              <th pSortableColumn="metodo" scope="col">Método <p-sortIcon field="metodo" /></th>
              <th pSortableColumn="estado" scope="col">Estado <p-sortIcon field="estado" /></th>
              <th pSortableColumn="fechaCreacion" scope="col">Fecha <p-sortIcon field="fechaCreacion" /></th>
              <th scope="col" class="derecha" pFrozenColumn alignFrozen="right"><span class="sr-only">Acciones</span></th>
            </tr>
          </ng-template>
          <ng-template #body let-p>
            <tr>
              <td class="num">#{{ p.id }}</td>
              <td>
                <strong>{{ p.departamentoTitulo }}</strong><br />
                <small class="apagado">Reserva #{{ p.idReserva }} · {{ p.distrito }}</small>
              </td>
              <td class="derecha num"><strong>{{ p.monto | currency: p.moneda : 'symbol' : '1.2-2' }}</strong></td>
              <td>{{ p.metodo }}</td>
              <td>
                <app-estado-tag tipo="pago" [valor]="p.estado" />
                @if (p.estado === 'REEMBOLSO_PENDIENTE' && p.fechaLimiteReembolso) {
                  <br /><small class="apagado">Plazo {{ p.fechaLimiteReembolso | date: 'd MMM, HH:mm' }} · {{ restante(p) }}</small>
                } @else if (p.estado === 'REEMBOLSADO' && p.fechaReembolso) {
                  <br /><small class="apagado">Devuelto el {{ p.fechaReembolso | date: 'd MMM y' }}</small>
                } @else if (p.referenciaPasarela) {
                  <br /><small class="apagado">Ref. {{ p.referenciaPasarela }}</small>
                }
              </td>
              <td class="num">{{ (p.fechaPago ?? p.fechaCreacion) | date: 'd MMM y, HH:mm' }}</td>
              <td pFrozenColumn alignFrozen="right">
                <div class="acciones-fila">
                  @if (p.estado === 'PROCESANDO') {
                    <p-button label="Autorizar" icon="pi pi-check" size="small" severity="success" [loading]="trabajando() === p.id" (onClick)="confirmar(p)" />
                    <p-button icon="pi pi-times" size="small" [text]="true" [rounded]="true" severity="danger" pTooltip="Cancelar pago" [ariaLabel]="'Cancelar el pago ' + p.id" [disabled]="trabajando() === p.id" (onClick)="cancelar(p)" />
                  } @else {
                    <p-button icon="pi pi-calendar" [text]="true" [rounded]="true" severity="secondary" pTooltip="Ver mis reservas" [ariaLabel]="'Ir a mis reservas'" routerLink="/huesped/reservas" />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="7">
                @if (!lista.cargando()) {
                  <app-vacio icono="pi-credit-card" titulo="Todavía no tienes pagos" mensaje="Cuando pagues una reserva aparecerá aquí con su estado y su referencia.">
                    <p-button label="Explorar departamentos" routerLink="/departamentos" />
                  </app-vacio>
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: `
    .derecha { text-align: right; }
  `,
})
export class MisPagos implements OnDestroy {
  private readonly api = inject(PagosService);
  private readonly avisos = inject(Avisos);
  private readonly destruir = inject(DestroyRef);

  protected readonly estados = OPCIONES_ESTADO_PAGO;
  protected readonly metodos = METODOS_PAGO;
  protected readonly trabajando = signal<number | null>(null);

  protected readonly filtros = inject(FormBuilder).nonNullable.group({
    q: [''],
    estado: [null as Pago['estado'] | null],
    metodo: [null as Pago['metodo'] | null],
    rango: new FormControl<RangoFechas>(null, { nonNullable: true }),
  });

  protected readonly lista = new ListaPaginada<Pago>(
    (consulta) => this.api.misPagos(this.filtroApi(), consulta),
    { orden: 'fechaCreacion', sentido: -1 },
  );

  constructor() {
    this.filtros.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destruir)).subscribe(() => {
      if (rangoListo(this.filtros.controls.rango)) this.lista.buscar();
    });
  }

  ngOnDestroy(): void {
    this.lista.destruir();
  }

  private filtroApi() {
    const v = this.filtros.getRawValue();
    return { q: v.q.trim() || undefined, estado: v.estado, metodo: v.metodo, ...rangoAFiltro(v.rango) };
  }

  protected restante(p: Pago): string {
    return tiempoRestante(p.fechaLimiteReembolso);
  }

  protected confirmar(p: Pago): void {
    this.trabajando.set(p.id);
    this.api.confirmar(p.id).subscribe({
      next: () => {
        this.trabajando.set(null);
        this.avisos.exito('Pago aprobado', 'Tu reserva quedó confirmada.');
        this.lista.cargar();
      },
      error: () => this.trabajando.set(null),
    });
  }

  protected cancelar(p: Pago): void {
    this.trabajando.set(p.id);
    this.api.cancelar(p.id).subscribe({
      next: () => {
        this.trabajando.set(null);
        this.avisos.info('Pago cancelado', 'La reserva sigue pendiente: puedes pagarla de nuevo desde «Mis reservas».');
        this.lista.cargar();
      },
      error: () => this.trabajando.set(null),
    });
  }
}
