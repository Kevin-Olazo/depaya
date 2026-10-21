import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';
import { MetodoPago, Ocupada, Reserva } from '../../core/models/api.models';
import { METODOS_PAGO, OPCIONES_ESTADO_REEMBOLSO, OPCIONES_ESTADO_RESERVA } from '../../core/models/etiquetas';
import { ListaPaginada } from '../../core/lista-paginada';
import { ApiError } from '../../core/services/api-error';
import { Avisos } from '../../core/services/avisos';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { ReservasService } from '../../core/services/reservas.service';
import { aIso, deIso, diasHasta, hoy, nochesEntre } from '../../core/utils/fechas';
import { DiaCalendario, crearOcupacion } from '../../core/utils/ocupacion';
import { EstadoTag } from '../../shared/estado-tag';
import { RangoFechas, rangoAFiltro, rangoListo } from '../../shared/fecha-rango';
import { ReembolsoCelda } from '../../shared/reembolso-celda';
import { Vacio } from '../../shared/vacio';

@Component({
  selector: 'app-mis-reservas',
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    DatePicker,
    Dialog,
    IconField,
    InputIcon,
    InputNumber,
    InputText,
    Select,
    TableModule,
    Tooltip,
    EstadoTag,
    ReembolsoCelda,
    Vacio,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      <header class="encabezado-pagina">
        <div>
          <p class="eyebrow">Tu espacio DepaYa</p>
          <h1>Mis <em>reservas</em></h1>
          <p>Las reservas que hiciste como huésped. Paga las pendientes, edítalas o cancélalas; si cancelas una confirmada con 1 día o más de anticipación, tienes reembolso (plazo de 48 h).</p>
        </div>
        <p-button label="Buscar departamentos" icon="pi pi-search" routerLink="/departamentos" />
      </header>

      <form class="tarjeta barra-filtros" [formGroup]="filtros" (ngSubmit)="$event.preventDefault()" aria-label="Filtros de reservas">
        <div class="campo">
          <label for="r-q">Buscar</label>
          <p-iconfield>
            <p-inputicon class="pi pi-search" />
            <input pInputText id="r-q" formControlName="q" placeholder="Departamento o distrito" autocomplete="off" />
          </p-iconfield>
        </div>
        <div class="campo">
          <label for="r-estado">Estado</label>
          <p-select inputId="r-estado" ariaLabel="Estado" formControlName="estado" [options]="estados" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
        </div>
        <div class="campo">
          <label for="r-reembolso">Reembolso</label>
          <p-select inputId="r-reembolso" ariaLabel="Reembolso" formControlName="estadoReembolso" [options]="reembolsos" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
        </div>
        <div class="campo">
          <label for="r-fechas">Fecha de ingreso</label>
          <p-datepicker inputId="r-fechas" formControlName="rango" selectionMode="range" [readonlyInput]="true" placeholder="Desde — hasta" dateFormat="dd/mm/yy" [showClear]="true" appendTo="body" />
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
          [tableStyle]="{ 'min-width': '62rem' }"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="id" scope="col">N.° <p-sortIcon field="id" /></th>
              <th scope="col">Departamento</th>
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
                  <img [src]="r.imagenUrl" [alt]="''" loading="lazy" />
                  <span><strong>{{ r.departamentoTitulo }}</strong><small class="apagado">{{ r.distrito }} · {{ r.cantidadHuespedes }} huésp.</small></span>
                </a>
              </td>
              <td class="num">
                {{ r.fechaIngreso | date: 'd MMM' }} → {{ r.fechaSalida | date: 'd MMM y' }}<br />
                <small class="apagado">{{ r.noches }} {{ r.noches === 1 ? 'noche' : 'noches' }}</small>
              </td>
              <td class="derecha num"><strong>{{ r.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong></td>
              <td><app-estado-tag tipo="reserva" [valor]="r.estado" /></td>
              <td><app-reembolso-celda [estado]="r.estadoReembolso" [limite]="r.fechaLimiteReembolso" [devuelto]="r.fechaReembolso" /></td>
              <td pFrozenColumn alignFrozen="right">
                <div class="acciones-fila">
                  <p-button icon="pi pi-eye" [text]="true" [rounded]="true" severity="secondary" pTooltip="Ver detalle" [ariaLabel]="'Ver detalle de la reserva ' + r.id" (onClick)="detalle.set(r)" />
                  @if (r.estado === 'PENDIENTE') {
                    <p-button icon="pi pi-credit-card" [text]="true" [rounded]="true" pTooltip="Pagar" [ariaLabel]="'Pagar la reserva ' + r.id" [routerLink]="['/huesped/reservas', r.id, 'pago']" />
                    <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" severity="secondary" pTooltip="Editar fechas" [ariaLabel]="'Editar la reserva ' + r.id" (onClick)="abrirEdicion(r)" />
                  }
                  @if (r.estado !== 'CANCELADA') {
                    <p-button icon="pi pi-times-circle" [text]="true" [rounded]="true" severity="danger" pTooltip="Cancelar reserva" [ariaLabel]="'Cancelar la reserva ' + r.id" (onClick)="abrirCancelacion(r)" />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="7">
                @if (!lista.cargando()) {
                  <app-vacio icono="pi-calendar" titulo="Aún no hay reservas aquí" mensaje="Cuando reserves un departamento aparecerá en esta lista. Si cambiaste los filtros, prueba quitándolos.">
                    <p-button label="Explorar departamentos" routerLink="/departamentos" />
                  </app-vacio>
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Detalle -->
    <p-dialog [visible]="!!detalle()" (visibleChange)="!$event && detalle.set(null)" header="Detalle de la reserva" [modal]="true" [draggable]="false" [style]="{ width: '34rem' }" [breakpoints]="{ '640px': '94vw' }" [dismissableMask]="true">
      @if (detalle(); as r) {
        <div class="detalle-reserva">
          <div class="fila-separada"><strong>#{{ r.id }} · {{ r.departamentoTitulo }}</strong><app-estado-tag tipo="reserva" [valor]="r.estado" /></div>
          <dl class="lista-detalle">
            <div><dt>Distrito</dt><dd>{{ r.distrito }}</dd></div>
            <div><dt>Ingreso</dt><dd>{{ r.fechaIngreso | date: 'EEEE d MMMM y' }}</dd></div>
            <div><dt>Salida</dt><dd>{{ r.fechaSalida | date: 'EEEE d MMMM y' }}</dd></div>
            <div><dt>Noches</dt><dd>{{ r.noches }}</dd></div>
            <div><dt>Huéspedes</dt><dd>{{ r.cantidadHuespedes }}</dd></div>
            <div><dt>Precio por noche</dt><dd>{{ r.precioNoche | currency: 'PEN' : 'symbol' : '1.2-2' }}</dd></div>
            <div><dt>Total</dt><dd><strong>{{ r.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong></dd></div>
            <div><dt>Propietario</dt><dd>{{ r.propietarioNombre }}</dd></div>
            <div><dt>Reservada el</dt><dd>{{ r.fechaCreacion | date: 'd MMM y, HH:mm' }}</dd></div>
            @if (r.fechaCancelacion) {
              <div><dt>Cancelada el</dt><dd>{{ r.fechaCancelacion | date: 'd MMM y, HH:mm' }}</dd></div>
            }
          </dl>
          @if (r.estadoReembolso !== 'NO_APLICA') {
            <div class="aviso" [class.aviso-alerta]="r.estadoReembolso === 'PENDIENTE'" [class.aviso-ok]="r.estadoReembolso === 'DEVUELTO'">
              <i class="pi" [class]="r.estadoReembolso === 'PENDIENTE' ? 'pi-clock' : 'pi-check-circle'"></i>
              <div>
                @if (r.estadoReembolso === 'PENDIENTE') {
                  <strong>Reembolso pendiente.</strong> Solicitado el {{ r.fechaSolicitudReembolso | date: 'd MMM, HH:mm' }}. El administrador lo confirma antes del <strong>{{ r.fechaLimiteReembolso | date: 'd MMM y, HH:mm' }}</strong> (plazo de 48 h); si no responde a tiempo, se aprueba automáticamente.
                  @if (r.metodoReembolso) { <br />Se devolverá por {{ r.metodoReembolso }}. }
                } @else {
                  <strong>Reembolso devuelto</strong> el {{ r.fechaReembolso | date: 'd MMM y, HH:mm' }}.
                }
              </div>
            </div>
          } @else if (r.estado === 'CANCELADA') {
            <div class="aviso"><i class="pi pi-info-circle"></i><div>Esta cancelación no generó reembolso.</div></div>
          }
        </div>
      }
    </p-dialog>

    <!-- Editar (solo PENDIENTE) -->
    <p-dialog [visible]="!!edicion()" (visibleChange)="!$event && cerrarEdicion()" header="Editar reserva" [modal]="true" [draggable]="false" [style]="{ width: '46rem' }" [breakpoints]="{ '760px': '96vw' }">
      @if (edicion(); as r) {
        <div class="formulario">
          <p class="apagado">{{ r.departamentoTitulo }} · hasta {{ capacidad() }} huéspedes. Solo puedes editar una reserva pendiente de pago.</p>
          <div class="campo">
            <label for="e-fechas">Nuevas fechas</label>
            <p-datepicker inputId="e-fechas" selectionMode="range" [ngModel]="rangoEdicion()" (ngModelChange)="alElegirEdicion($event)" [minDate]="minimo" [disabledDates]="ocupacionEdicion().bloqueadas" [readonlyInput]="true" [inline]="true" [numberOfMonths]="1" dateFormat="dd/mm/yy" ariaLabel="Calendario de fechas">
              <ng-template #date let-fecha>
                <span class="dia" [class.ocupado]="nocheOcupada(fecha)">{{ fecha.day }}</span>
              </ng-template>
            </p-datepicker>
          </div>
          <div class="campo corto">
            <label for="e-huespedes">Huéspedes</label>
            <p-inputnumber inputId="e-huespedes" [ngModel]="huespedesEdicion()" (ngModelChange)="huespedesEdicion.set($event ?? 1)" [min]="1" [max]="capacidad()" [showButtons]="true" buttonLayout="horizontal" />
          </div>
          @if (resumenEdicion(); as e) {
            <p class="aviso aviso-info"><i class="pi pi-calculator"></i><span>{{ e.noches }} {{ e.noches === 1 ? 'noche' : 'noches' }} × {{ r.precioNoche | currency: 'PEN' : 'symbol' : '1.2-2' }} = <strong>{{ e.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong> (estimado; el total final lo calcula DepaYa).</span></p>
          }
          @if (errorEdicion(); as texto) {
            <div class="aviso aviso-error" role="alert"><i class="pi pi-times-circle"></i><div>{{ texto }}</div></div>
          }
        </div>
      }
      <ng-template #footer>
        <p-button label="Cerrar" severity="secondary" [text]="true" (onClick)="cerrarEdicion()" />
        <p-button label="Guardar cambios" icon="pi pi-check" [loading]="guardando()" (onClick)="guardarEdicion()" />
      </ng-template>
    </p-dialog>

    <!-- Cancelar -->
    <p-dialog [visible]="!!cancelacion()" (visibleChange)="!$event && cerrarCancelacion()" header="Cancelar reserva" [modal]="true" [draggable]="false" [style]="{ width: '34rem' }" [breakpoints]="{ '640px': '94vw' }">
      @if (cancelacion(); as r) {
        <div class="formulario">
          <p>¿Cancelar la reserva <strong>#{{ r.id }}</strong> de <strong>{{ r.departamentoTitulo }}</strong> ({{ r.fechaIngreso | date: 'd MMM' }} → {{ r.fechaSalida | date: 'd MMM y' }})?</p>
          @if (r.estado === 'PENDIENTE') {
            <div class="aviso aviso-info"><i class="pi pi-info-circle"></i><div>Todavía no pagaste: se cancela sin ningún cargo.</div></div>
          } @else if (conReembolso()) {
            <div class="aviso aviso-ok"><i class="pi pi-wallet"></i><div><strong>Tienes derecho a reembolso.</strong> Faltan {{ diasParaIngreso() }} día(s) para el ingreso. El reembolso queda <strong>pendiente por hasta 48 h</strong> hasta que el administrador lo confirme.</div></div>
            <div class="campo">
              <label for="c-metodo">¿Por dónde quieres recibir el reembolso?</label>
              <p-select inputId="c-metodo" ariaLabel="¿Por dónde quieres recibir el reembolso?" [options]="metodos" optionLabel="texto" optionValue="valor" [ngModel]="metodoReembolso()" (ngModelChange)="metodoReembolso.set($event)" placeholder="El mismo método de pago" [showClear]="true" appendTo="body" />
            </div>
          } @else {
            <div class="aviso aviso-alerta"><i class="pi pi-exclamation-triangle"></i><div><strong>Sin reembolso.</strong> Para recibirlo hay que cancelar con al menos 1 día de anticipación al ingreso.</div></div>
          }
        </div>
      }
      <ng-template #footer>
        <p-button label="Mantener reserva" severity="secondary" [text]="true" (onClick)="cerrarCancelacion()" />
        <p-button label="Sí, cancelar reserva" icon="pi pi-times" severity="danger" [loading]="guardando()" (onClick)="confirmarCancelacion()" />
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .derecha { text-align: right; }
    .corto { max-width: 280px; }
    .lista-detalle { margin: 14px 0; display: grid; gap: 0; }
    .lista-detalle div { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid var(--dy-borde); }
    .lista-detalle dt { color: var(--dy-apagado); }
    .lista-detalle dd { margin: 0; text-align: right; font-weight: 600; }
    .dia { display: inline-grid; place-items: center; width: 100%; height: 100%; }
    .dia.ocupado { color: #a8544c; text-decoration: line-through; background: #f7e8e5; border-radius: 50%; }
    .celda-depa { color: inherit; }
    .celda-depa span { display: grid; }
  `,
})
export class MisReservas implements OnDestroy {
  private readonly api = inject(ReservasService);
  private readonly deptos = inject(DepartamentosService);
  private readonly avisos = inject(Avisos);
  private readonly destruir = inject(DestroyRef);

  protected readonly estados = OPCIONES_ESTADO_RESERVA;
  protected readonly reembolsos = OPCIONES_ESTADO_REEMBOLSO.filter((o) => o.valor !== 'NO_APLICA');
  protected readonly metodos = METODOS_PAGO;
  protected readonly minimo = hoy();

  protected readonly filtros = inject(FormBuilder).nonNullable.group({
    q: [''],
    estado: [null as Reserva['estado'] | null],
    estadoReembolso: [null as Reserva['estadoReembolso'] | null],
    rango: new FormControl<RangoFechas>(null, { nonNullable: true }),
  });

  protected readonly lista = new ListaPaginada<Reserva>(
    (consulta) => this.api.misReservas(this.filtroApi(), consulta),
    { orden: 'fechaCreacion', sentido: -1 },
  );

  protected readonly detalle = signal<Reserva | null>(null);

  /* edición */
  protected readonly edicion = signal<Reserva | null>(null);
  protected readonly capacidad = signal(1);
  protected readonly ocupadasEdicion = signal<Ocupada[]>([]);
  protected readonly rangoEdicion = signal<RangoFechas>(null);
  protected readonly huespedesEdicion = signal(1);
  protected readonly errorEdicion = signal('');
  protected readonly guardando = signal(false);
  protected readonly ocupacionEdicion = computed(() => {
    const r = this.edicion();
    // La propia reserva (mismas fechas) no cuenta como ocupación al editarla.
    return crearOcupacion(this.ocupadasEdicion(), (o) => !!r && o.fechaIngreso === r.fechaIngreso && o.fechaSalida === r.fechaSalida);
  });
  protected readonly resumenEdicion = computed(() => {
    const r = this.edicion();
    const [a, b] = this.rangoEdicion() ?? [];
    if (!r || !a || !b) return null;
    const noches = nochesEntre(a, b);
    return noches > 0 ? { noches, total: noches * r.precioNoche } : null;
  });

  /* cancelación */
  protected readonly cancelacion = signal<Reserva | null>(null);
  protected readonly metodoReembolso = signal<MetodoPago | null>(null);
  protected readonly diasParaIngreso = computed(() => {
    const r = this.cancelacion();
    return r ? diasHasta(r.fechaIngreso) : 0;
  });
  /** Misma regla del backend: CONFIRMADA y falta 1 día o más para el ingreso. */
  protected readonly conReembolso = computed(() => this.cancelacion()?.estado === 'CONFIRMADA' && this.diasParaIngreso() >= 1);

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
    return { q: v.q.trim() || undefined, estado: v.estado, estadoReembolso: v.estadoReembolso, ...rangoAFiltro(v.rango) };
  }

  protected nocheOcupada(fecha: DiaCalendario): boolean {
    return this.ocupacionEdicion().nocheOcupada(fecha);
  }

  /* ------------------------------------------------------------- edición */

  protected abrirEdicion(r: Reserva): void {
    forkJoin({ depa: this.deptos.detalle(r.idDepartamento), ocupadas: this.api.ocupadas(r.idDepartamento) }).subscribe({
      next: ({ depa, ocupadas }) => {
        this.capacidad.set(depa.capacidadPersonas);
        this.ocupadasEdicion.set(ocupadas);
        this.rangoEdicion.set([deIso(r.fechaIngreso), deIso(r.fechaSalida)]);
        this.huespedesEdicion.set(r.cantidadHuespedes);
        this.errorEdicion.set('');
        this.edicion.set(r);
      },
      error: () => undefined,
    });
  }

  protected cerrarEdicion(): void {
    this.edicion.set(null);
  }

  protected alElegirEdicion(valor: RangoFechas): void {
    this.errorEdicion.set('');
    const [a, b] = valor ?? [];
    if (a && b && this.ocupacionEdicion().choca(a, b)) {
      this.rangoEdicion.set(null);
      this.errorEdicion.set('Ese rango incluye noches ocupadas. Elige otras fechas.');
      return;
    }
    this.rangoEdicion.set(valor);
  }

  protected guardarEdicion(): void {
    const r = this.edicion();
    const [a, b] = this.rangoEdicion() ?? [];
    if (!r) return;
    if (!a || !b || b <= a) {
      this.errorEdicion.set('Elige la fecha de ingreso y una fecha de salida posterior.');
      return;
    }
    this.guardando.set(true);
    this.errorEdicion.set('');
    this.api.actualizar(r.id, { fechaIngreso: aIso(a), fechaSalida: aIso(b), cantidadHuespedes: this.huespedesEdicion() }).subscribe({
      next: (actualizada) => {
        this.guardando.set(false);
        this.edicion.set(null);
        this.avisos.exito('Reserva actualizada', `Nuevo total: ${actualizada.total.toFixed(2)} soles (${actualizada.noches} noche(s)).`);
        this.lista.cargar();
      },
      error: (e: unknown) => {
        this.guardando.set(false);
        this.errorEdicion.set(e instanceof ApiError ? [e.mensajeApi, e.detalle].filter(Boolean).join(' ') : 'No se pudo guardar.');
      },
    });
  }

  /* --------------------------------------------------------- cancelación */

  protected abrirCancelacion(r: Reserva): void {
    this.metodoReembolso.set(null);
    this.cancelacion.set(r);
  }

  protected cerrarCancelacion(): void {
    this.cancelacion.set(null);
  }

  protected confirmarCancelacion(): void {
    const r = this.cancelacion();
    if (!r) return;
    this.guardando.set(true);
    const cuerpo = this.conReembolso() && this.metodoReembolso() ? { metodoReembolso: this.metodoReembolso() } : {};
    this.api.cancelar(r.id, cuerpo).subscribe({
      next: (cancelada) => {
        this.guardando.set(false);
        this.cancelacion.set(null);
        if (cancelada.estadoReembolso === 'PENDIENTE') {
          this.avisos.exito('Reserva cancelada', 'Tu reembolso quedó pendiente (plazo de 48 h). Puedes seguirlo en esta lista.');
        } else {
          this.avisos.info('Reserva cancelada', 'Esta cancelación no genera reembolso.');
        }
        this.lista.cargar();
      },
      error: () => this.guardando.set(false),
    });
  }
}
