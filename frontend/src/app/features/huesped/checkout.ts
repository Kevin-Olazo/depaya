import { CurrencyPipe, DatePipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { Skeleton } from 'primeng/skeleton';
import { Departamento, MetodoPago, Ocupada, Pago, Reserva } from '../../core/models/api.models';
import { METODOS_PAGO } from '../../core/models/etiquetas';
import { ApiError } from '../../core/services/api-error';
import { Avisos } from '../../core/services/avisos';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { PagosService } from '../../core/services/pagos.service';
import { ReservasService } from '../../core/services/reservas.service';
import { Sesion } from '../../core/services/sesion';
import { aIso, deIso, hoy, nochesEntre } from '../../core/utils/fechas';
import { DiaCalendario, crearOcupacion } from '../../core/utils/ocupacion';
import { EstadoTag } from '../../shared/estado-tag';

interface ResumenReserva {
  titulo: string;
  distrito: string;
  imagenUrl: string;
  precioNoche: number;
  ingreso: Date | null;
  salida: Date | null;
  noches: number;
  huespedes: number;
  total: number;
  esEstimado: boolean;
}

type Paso = 1 | 2 | 3;

/**
 * Reserva y pago en pasos. Dos entradas: /huesped/reservar/:idDepartamento (reserva nueva) y
 * /huesped/reservas/:idReserva/pago (pagar una reserva PENDIENTE que ya existe).
 * El pago es simulado: nunca se piden datos de tarjeta.
 */
@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, ButtonModule, DatePicker, InputNumber, Skeleton, EstadoTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      <header class="encabezado-pagina">
        <div>
          <h1>{{ paso() === 3 ? '¡Reserva confirmada!' : 'Reserva y pago' }}</h1>
          <p>{{ subtitulo() }}</p>
        </div>
      </header>

      <ol class="pasos" aria-label="Progreso de la reserva">
        @for (p of pasos; track p.n) {
          <li [class.activo]="paso() === p.n" [class.hecho]="paso() > p.n" [attr.aria-current]="paso() === p.n ? 'step' : null">
            <span class="numero">
              @if (paso() > p.n) {
                <i class="pi pi-check" aria-hidden="true"></i>
              } @else {
                {{ p.n }}
              }
            </span>
            <span>{{ p.texto }}</span>
          </li>
        }
      </ol>

      @if (cargando()) {
        <div class="columnas">
          <p-skeleton height="420px" borderRadius="16px" />
          <p-skeleton height="360px" borderRadius="16px" />
        </div>
      } @else if (bloqueo(); as texto) {
        <div class="tarjeta">
          <div class="aviso aviso-alerta" role="alert"><i class="pi pi-exclamation-triangle"></i><div>{{ texto }}</div></div>
          <div class="fila" style="margin-top: 16px">
            <p-button label="Ver mis reservas" routerLink="/huesped/reservas" />
            <p-button label="Buscar otro departamento" severity="secondary" [outlined]="true" routerLink="/departamentos" />
          </div>
        </div>
      } @else {
        <div class="columnas">
          <section class="principal">
            @switch (paso()) {
              @case (1) {
                <div class="tarjeta formulario">
                  <h2>1. Elige tus fechas y huéspedes</h2>
                  <div class="campo">
                    <label for="fechas">Ingreso y salida</label>
                    <p-datepicker
                      inputId="fechas"
                      selectionMode="range"
                      [ngModel]="rango()"
                      (ngModelChange)="alElegirFechas($event)"
                      [minDate]="minimo"
                      [disabledDates]="ocupacion().bloqueadas"
                      [readonlyInput]="true"
                      [numberOfMonths]="esMovil() ? 1 : 2"
                      [inline]="true"
                      dateFormat="dd/mm/yy"
                      ariaLabel="Calendario de fechas de la reserva"
                    >
                      <ng-template #date let-fecha>
                        <span class="dia" [class.ocupado]="esOcupada(fecha)">{{ fecha.day }}</span>
                      </ng-template>
                    </p-datepicker>
                    <span class="ayuda">Los días tachados están ocupados. La fecha de salida de otra reserva queda libre para ingresar ese día.</span>
                  </div>
                  <div class="campo corto">
                    <label for="huespedes">Huéspedes (máx. {{ depa()?.capacidadPersonas }})</label>
                    <p-inputnumber inputId="huespedes" [ngModel]="huespedes()" (ngModelChange)="huespedes.set($event ?? 1)" [min]="1" [max]="depa()?.capacidadPersonas ?? 1" [showButtons]="true" buttonLayout="horizontal" />
                  </div>
                  @if (mensaje(); as aviso) {
                    <div class="aviso aviso-alerta" role="alert"><i class="pi pi-exclamation-triangle"></i><div>{{ aviso }}</div></div>
                  }
                  <div class="fila">
                    <p-button label="Reservar y continuar al pago" icon="pi pi-arrow-right" iconPos="right" [loading]="procesando()" (onClick)="crearReserva()" />
                    <p-button label="Volver al departamento" severity="secondary" [text]="true" [routerLink]="['/departamentos', depa()?.id]" />
                  </div>
                  <p class="apagado pequeno">Tu reserva quedará <strong>pendiente de pago</strong>. Podrás pagarla ahora o después desde «Mis reservas».</p>
                </div>
              }

              @case (2) {
                <div class="tarjeta formulario">
                  @if (!pago()) {
                    <h2>2. Elige cómo pagar</h2>
                    <div class="aviso aviso-info"><i class="pi pi-shield"></i><div><strong>Pago simulado.</strong> No ingreses datos reales: DepaYa no pide números de tarjeta ni hace cargos.</div></div>
                    <div class="metodos" role="radiogroup" aria-label="Método de pago">
                      @for (m of metodos; track m.valor) {
                        <label class="metodo" [class.elegido]="metodo() === m.valor">
                          <input type="radio" name="metodo" [value]="m.valor" [checked]="metodo() === m.valor" (change)="metodo.set(m.valor)" />
                          <i class="pi" [class]="m.icono" aria-hidden="true"></i>
                          <span><strong>{{ m.texto }}</strong><small>{{ m.descripcion }}</small></span>
                          <i class="pi pi-check-circle marca" aria-hidden="true"></i>
                        </label>
                      }
                    </div>
                    <div class="fila">
                      <p-button [label]="'Iniciar pago de ' + (resumen()?.total ?? 0 | currency: 'PEN' : 'symbol' : '1.2-2')" icon="pi pi-lock" [disabled]="!metodo()" [loading]="procesando()" (onClick)="iniciarPago()" />
                      <p-button label="Pagar más tarde" severity="secondary" [text]="true" routerLink="/huesped/reservas" />
                    </div>
                  } @else {
                    <h2>2. Autoriza el pago</h2>
                    <div class="pasarela">
                      <div class="pasarela-cabecera"><i class="pi pi-lock"></i> Pasarela simulada · {{ nombreMetodo(pago()!.metodo) }}</div>
                      <p>El pago <strong>#{{ pago()!.id }}</strong> está <app-estado-tag tipo="pago" [valor]="pago()!.estado" />. Confirma para que la pasarela lo apruebe y tu reserva quede <strong>confirmada</strong>.</p>
                      <div class="monto">{{ pago()!.monto | currency: 'PEN' : 'symbol' : '1.2-2' }}</div>
                    </div>
                    <div class="fila">
                      <p-button label="Autorizar pago" icon="pi pi-check" severity="success" [loading]="procesando()" (onClick)="autorizarPago()" />
                      <p-button label="Cancelar este pago" severity="secondary" [outlined]="true" [disabled]="procesando()" (onClick)="cancelarPago()" />
                    </div>
                  }
                </div>
              }

              @case (3) {
                <div class="tarjeta exito">
                  <span class="check"><i class="pi pi-check" aria-hidden="true"></i></span>
                  <h2>Tu reserva está confirmada</h2>
                  <p>Pagaste <strong>{{ pago()?.monto | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong> con {{ pago() ? nombreMetodo(pago()!.metodo) : '' }}.</p>
                  <dl class="detalle">
                    <div><dt>Reserva</dt><dd>#{{ reserva()?.id }}</dd></div>
                    <div><dt>Pago</dt><dd>#{{ pago()?.id }}</dd></div>
                    <div><dt>Referencia de la pasarela</dt><dd>{{ pago()?.referenciaPasarela }}</dd></div>
                  </dl>
                  <div class="fila centrado">
                    <p-button label="Ver mis reservas" icon="pi pi-calendar" routerLink="/huesped/reservas" />
                    <p-button label="Seguir explorando" severity="secondary" [outlined]="true" routerLink="/departamentos" />
                  </div>
                  <p class="apagado pequeno">Si cancelas con 1 día o más de anticipación, el reembolso queda pendiente hasta 48 h y lo confirma el administrador.</p>
                </div>
              }
            }
          </section>

          @if (resumen(); as r) {
            <aside class="tarjeta resumen" aria-label="Resumen de la reserva">
              <img [src]="r.imagenUrl" [alt]="'Foto de ' + r.titulo" />
              <div class="cuerpo">
                <strong>{{ r.titulo }}</strong>
                <span class="apagado pequeno"><i class="pi pi-map-marker"></i> {{ r.distrito }}</span>
                @if (reserva(); as res) {
                  <div class="fila"><span class="pequeno">Reserva #{{ res.id }}</span><app-estado-tag tipo="reserva" [valor]="res.estado" /></div>
                }
              </div>
              <dl class="lineas">
                <div><dt>Ingreso</dt><dd>{{ r.ingreso ? (r.ingreso | date: 'EEE d MMM y') : 'Por elegir' }}</dd></div>
                <div><dt>Salida</dt><dd>{{ r.salida ? (r.salida | date: 'EEE d MMM y') : 'Por elegir' }}</dd></div>
                <div><dt>Huéspedes</dt><dd>{{ r.huespedes }}</dd></div>
                <div><dt>{{ r.precioNoche | currency: 'PEN' : 'symbol' : '1.0-2' }} × {{ r.noches }} {{ r.noches === 1 ? 'noche' : 'noches' }}</dt><dd class="num">{{ r.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</dd></div>
                <div class="total"><dt>{{ r.esEstimado ? 'Total estimado' : 'Total' }}</dt><dd class="num">{{ r.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</dd></div>
              </dl>
              @if (r.esEstimado) {
                <p class="apagado pequeno">El total final lo calcula DepaYa al crear la reserva.</p>
              }
            </aside>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .pasos { list-style: none; margin: 0; padding: 0; display: flex; gap: 8px; flex-wrap: wrap; }
    .pasos li { display: flex; align-items: center; gap: 10px; padding: 8px 16px 8px 8px; border-radius: 999px; background: #fff; border: 1px solid var(--dy-borde); color: var(--dy-apagado); font-weight: 600; }
    .pasos .numero { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: #f3f4f6; font-size: 0.85rem; }
    .pasos li.activo { color: var(--dy-tinta); border-color: var(--dy-coral); }
    .pasos li.activo .numero { background: var(--dy-coral); color: #fff; }
    .pasos li.hecho .numero { background: #15803d; color: #fff; }
    .columnas { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 24px; align-items: start; }
    .principal { min-width: 0; }
    .tarjeta h2 { font-size: 1.2rem; }
    .corto { max-width: 280px; }
    .dia { display: inline-grid; place-items: center; width: 100%; height: 100%; }
    .dia.ocupado { color: #b42318; text-decoration: line-through; background: #fef2f2; border-radius: 50%; }
    :host ::ng-deep .p-datepicker-inline { width: 100%; max-width: 640px; }
    .metodos { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; }
    .metodo { position: relative; display: flex; align-items: center; gap: 14px; padding: 16px; border: 2px solid var(--dy-borde); border-radius: 14px; cursor: pointer; background: #fff; transition: border-color 0.15s, background 0.15s; }
    .metodo:hover { border-color: #d1d5db; }
    .metodo input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
    .metodo:has(input:focus-visible) { outline: 3px solid color-mix(in srgb, var(--dy-coral) 55%, white); outline-offset: 2px; }
    .metodo > i:first-of-type { font-size: 1.5rem; color: var(--dy-tinta-suave); }
    .metodo span { display: grid; flex: 1; }
    .metodo small { color: var(--dy-apagado); }
    .metodo .marca { color: var(--dy-coral); font-size: 1.3rem; opacity: 0; }
    .metodo.elegido { border-color: var(--dy-coral); background: #fff7f9; }
    .metodo.elegido .marca { opacity: 1; }
    .pasarela { border: 1px dashed #cbd5e1; border-radius: 14px; padding: 18px; display: grid; gap: 10px; background: #f8fafc; }
    .pasarela-cabecera { font-weight: 700; color: var(--dy-tinta-suave); display: flex; gap: 8px; align-items: center; }
    .monto { font-size: 2rem; font-weight: 800; }
    .exito { text-align: center; display: grid; gap: 12px; justify-items: center; padding: 36px 24px; }
    .check { display: grid; place-items: center; width: 70px; height: 70px; border-radius: 50%; background: #dcfce7; color: #15803d; font-size: 1.8rem; }
    .detalle { margin: 6px 0; display: grid; gap: 6px; width: min(100%, 420px); }
    .detalle div { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid var(--dy-borde); }
    .detalle dt { color: var(--dy-apagado); }
    .detalle dd { margin: 0; font-weight: 650; }
    .centrado { justify-content: center; }
    .resumen { position: sticky; top: calc(var(--dy-cabecera) + 16px); display: grid; gap: 14px; padding: 0; overflow: hidden; }
    .resumen img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
    .resumen .cuerpo { display: grid; gap: 4px; padding: 0 18px; }
    .resumen > p { padding: 0 18px 16px; }
    .lineas { margin: 0; padding: 0 18px 4px; display: grid; gap: 8px; }
    .lineas div { display: flex; justify-content: space-between; gap: 12px; }
    .lineas dt { color: var(--dy-tinta-suave); }
    .lineas dd { margin: 0; font-weight: 600; text-align: right; }
    .lineas .total { border-top: 1px solid var(--dy-borde); padding-top: 10px; font-size: 1.1rem; }
    .lineas .total dt { color: var(--dy-tinta); font-weight: 750; }
    .lineas .total dd { font-weight: 800; }
    @media (max-width: 980px) { .columnas { grid-template-columns: minmax(0, 1fr); } .resumen { position: static; order: -1; } }
  `,
})
export class Checkout {
  readonly idDepartamento = input<string | undefined>();
  readonly idReserva = input<string | undefined>();
  readonly ingreso = input<string | undefined>();
  readonly salida = input<string | undefined>();
  readonly huespedesInicial = input<string | undefined>(undefined, { alias: 'huespedes' });

  private readonly sesion = inject(Sesion);
  private readonly deptos = inject(DepartamentosService);
  private readonly reservas = inject(ReservasService);
  private readonly pagos = inject(PagosService);
  private readonly avisos = inject(Avisos);
  private readonly ubicacion = inject(Location);
  private readonly destruir = inject(DestroyRef);

  protected readonly pasos = [
    { n: 1, texto: 'Reserva' },
    { n: 2, texto: 'Pago' },
    { n: 3, texto: 'Confirmada' },
  ];
  protected readonly metodos = METODOS_PAGO;
  protected readonly minimo = hoy();

  protected readonly paso = signal<Paso>(1);
  protected readonly cargando = signal(true);
  protected readonly bloqueo = signal<string | null>(null);
  protected readonly procesando = signal(false);
  protected readonly mensaje = signal('');
  protected readonly esMovil = signal(window.matchMedia('(max-width: 700px)').matches);

  protected readonly depa = signal<Departamento | null>(null);
  protected readonly ocupadas = signal<Ocupada[]>([]);
  protected readonly reserva = signal<Reserva | null>(null);
  protected readonly pago = signal<Pago | null>(null);

  protected readonly rango = signal<(Date | null)[] | null>(null);
  protected readonly huespedes = signal(1);
  protected readonly metodo = signal<MetodoPago | null>(null);

  protected readonly ocupacion = computed(() => crearOcupacion(this.ocupadas()));

  protected readonly subtitulo = computed(() => {
    switch (this.paso()) {
      case 1:
        return 'Elige tus fechas. Pagas en el siguiente paso.';
      case 2:
        return 'Tu reserva está pendiente de pago. El pago es simulado.';
      default:
        return 'Te enviamos el detalle a «Mis reservas».';
    }
  });

  protected readonly resumen = computed<ResumenReserva | null>(() => {
    const r = this.reserva();
    if (r) {
      return {
        titulo: r.departamentoTitulo,
        distrito: r.distrito,
        imagenUrl: r.imagenUrl,
        precioNoche: r.precioNoche,
        ingreso: deIso(r.fechaIngreso),
        salida: deIso(r.fechaSalida),
        noches: r.noches,
        huespedes: r.cantidadHuespedes,
        total: r.total,
        esEstimado: false,
      };
    }
    const d = this.depa();
    if (!d) return null;
    const [ingreso, salida] = this.rango() ?? [];
    const noches = ingreso && salida ? Math.max(0, nochesEntre(ingreso, salida)) : 0;
    return {
      titulo: d.titulo,
      distrito: d.distrito,
      imagenUrl: d.imagenUrl,
      precioNoche: d.precioNoche,
      ingreso: ingreso ?? null,
      salida: salida ?? null,
      noches,
      huespedes: this.huespedes(),
      total: noches * d.precioNoche,
      esEstimado: true,
    };
  });

  constructor() {
    effect(() => {
      const idReserva = this.idReserva();
      const idDepartamento = this.idDepartamento();
      untracked(() => {
        if (idReserva) this.cargarReserva(Number(idReserva));
        else if (idDepartamento) this.cargarDepartamento(Number(idDepartamento));
      });
    });
  }

  protected nombreMetodo(m: MetodoPago): string {
    return this.metodos.find((x) => x.valor === m)?.texto ?? m;
  }

  protected esOcupada(fecha: DiaCalendario): boolean {
    return this.ocupacion().nocheOcupada(fecha);
  }

  protected alElegirFechas(valor: (Date | null)[] | null): void {
    this.mensaje.set('');
    const [ingreso, salida] = valor ?? [];
    if (ingreso && salida && this.ocupacion().choca(ingreso, salida)) {
      this.rango.set(null);
      this.mensaje.set('Ese rango incluye noches ocupadas. Elige otras fechas.');
      return;
    }
    this.rango.set(valor && valor[0] ? valor : null);
  }

  /* ---------------------------------------------------------- carga inicial */

  private cargarDepartamento(id: number): void {
    this.cargando.set(true);
    forkJoin({ depa: this.deptos.detalle(id), ocupadas: this.reservas.ocupadas(id) })
      .pipe(takeUntilDestroyed(this.destruir))
      .subscribe({
        next: ({ depa, ocupadas }) => {
          this.depa.set(depa);
          this.ocupadas.set(ocupadas);
          if (this.sesion.id() === depa.idPropietario) {
            this.bloqueo.set('No puedes reservar tu propio departamento.');
          } else if (depa.estado !== 'DISPONIBLE') {
            this.bloqueo.set('Este departamento no está disponible para reservar por ahora.');
          } else {
            this.prellenar(depa);
          }
          this.cargando.set(false);
        },
        error: (e: unknown) => {
          this.bloqueo.set(e instanceof ApiError ? e.mensajeApi : 'No pudimos cargar el departamento.');
          this.cargando.set(false);
        },
      });
  }

  private prellenar(depa: Departamento): void {
    const g = Number(this.huespedesInicial());
    this.huespedes.set(Number.isFinite(g) && g >= 1 ? Math.min(g, depa.capacidadPersonas) : 1);
    const ingreso = this.ingreso();
    const salida = this.salida();
    if (ingreso && salida) {
      const a = deIso(ingreso);
      const b = deIso(salida);
      if (b > a && a >= hoy()) this.alElegirFechas([a, b]);
    }
  }

  private cargarReserva(id: number): void {
    this.cargando.set(true);
    this.reservas
      .obtener(id)
      .pipe(takeUntilDestroyed(this.destruir))
      .subscribe({
        next: (r) => {
          if (r.idInquilino !== this.sesion.id()) {
            this.bloqueo.set('Esta reserva no es tuya.');
          } else if (r.estado !== 'PENDIENTE') {
            this.bloqueo.set(
              r.estado === 'CONFIRMADA' ? 'Esta reserva ya está confirmada y pagada.' : 'Esta reserva fue cancelada y ya no se puede pagar.',
            );
          } else {
            this.reserva.set(r);
            this.paso.set(2);
            // ¿Quedó un pago a medias (PROCESANDO)? Se retoma donde se dejó.
            this.pagos.misPagos({ idReserva: r.id, estado: 'PROCESANDO' }, { page: 0, size: 1 }).subscribe({
              next: (p) => {
                if (p.content[0]) this.pago.set(p.content[0]);
                this.cargando.set(false);
              },
              error: () => this.cargando.set(false),
            });
            return;
          }
          this.cargando.set(false);
        },
        error: (e: unknown) => {
          this.bloqueo.set(e instanceof ApiError ? e.mensajeApi : 'No pudimos cargar la reserva.');
          this.cargando.set(false);
        },
      });
  }

  /* ------------------------------------------------------------------ acciones */

  protected crearReserva(): void {
    const d = this.depa();
    const [ingreso, salida] = this.rango() ?? [];
    if (!d || !ingreso || !salida) {
      this.mensaje.set('Elige tu fecha de ingreso y tu fecha de salida.');
      return;
    }
    if (salida <= ingreso) {
      this.mensaje.set('La salida debe ser posterior al ingreso.');
      return;
    }
    this.mensaje.set('');
    this.procesando.set(true);
    // Solo se envían las fechas y los huéspedes: noches y total los calcula el backend.
    this.reservas
      .crear({ idDepartamento: d.id, fechaIngreso: aIso(ingreso), fechaSalida: aIso(salida), cantidadHuespedes: this.huespedes() })
      .subscribe({
        next: (r) => {
          this.reserva.set(r);
          this.paso.set(2);
          this.procesando.set(false);
          // Si recarga la página, retoma el pago de esta reserva en vez de intentar reservar otra vez.
          this.ubicacion.replaceState(`/huesped/reservas/${r.id}/pago`);
          this.avisos.exito('Reserva creada', 'Queda pendiente de pago. Elige cómo pagar.');
        },
        error: () => this.procesando.set(false),
      });
  }

  protected iniciarPago(): void {
    const r = this.reserva();
    const metodo = this.metodo();
    if (!r || !metodo) return;
    this.procesando.set(true);
    this.pagos.crear(r.id, metodo).subscribe({
      next: (p) => {
        this.pago.set(p);
        this.procesando.set(false);
      },
      error: () => this.procesando.set(false),
    });
  }

  protected autorizarPago(): void {
    const p = this.pago();
    const r = this.reserva();
    if (!p || !r) return;
    this.procesando.set(true);
    this.pagos.confirmar(p.id).subscribe({
      next: (confirmado) => {
        this.pago.set(confirmado);
        this.reservas.obtener(r.id).subscribe({
          next: (actualizada) => this.reserva.set(actualizada),
          error: () => undefined,
        });
        this.paso.set(3);
        this.procesando.set(false);
        this.avisos.exito('Pago aprobado', 'Tu reserva quedó confirmada.');
      },
      error: () => this.procesando.set(false),
    });
  }

  protected cancelarPago(): void {
    const p = this.pago();
    if (!p) return;
    this.procesando.set(true);
    this.pagos.cancelar(p.id).subscribe({
      next: () => {
        this.pago.set(null);
        this.procesando.set(false);
        this.avisos.info('Pago cancelado', 'Puedes elegir otro método o pagar más tarde.');
      },
      error: () => this.procesando.set(false),
    });
  }
}
