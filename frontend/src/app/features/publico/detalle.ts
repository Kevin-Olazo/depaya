import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Image } from 'primeng/image';
import { InputNumber } from 'primeng/inputnumber';
import { Skeleton } from 'primeng/skeleton';
import { Departamento, Ocupada } from '../../core/models/api.models';
import { ApiError } from '../../core/services/api-error';
import { Avisos } from '../../core/services/avisos';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { ReservasService } from '../../core/services/reservas.service';
import { Sesion } from '../../core/services/sesion';
import { aIso, deIso, hoy, nochesEntre } from '../../core/utils/fechas';
import { DiaCalendario, crearOcupacion } from '../../core/utils/ocupacion';
import { EstadoTag } from '../../shared/estado-tag';
import { Vacio } from '../../shared/vacio';

@Component({
  selector: 'app-detalle',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, ButtonModule, DatePicker, Image, InputNumber, Skeleton, EstadoTag, Vacio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      @if (cargando()) {
        <p-skeleton height="2.2rem" width="60%" />
        <p-skeleton height="420px" borderRadius="22px" />
      } @else if (depa(); as d) {
        <nav class="migas" aria-label="Ruta de navegación">
          <a routerLink="/departamentos">Departamentos</a> <i class="pi pi-angle-right" aria-hidden="true"></i>
          <a routerLink="/departamentos" [queryParams]="{ distrito: d.distrito }">{{ d.distrito }}</a>
        </nav>

        <header class="cabecera-depa">
          <div>
            <h1>{{ d.titulo }}</h1>
            <p class="ubicacion"><i class="pi pi-map-marker" aria-hidden="true"></i> {{ d.direccion }}, {{ d.distrito }} · <span class="categoria">{{ d.categoria }}</span></p>
          </div>
          <div class="fila">
            @if (d.estado !== 'DISPONIBLE') {
              <app-estado-tag tipo="departamento" [valor]="d.estado" />
            }
            <p-button label="Compartir" icon="pi pi-share-alt" severity="secondary" [text]="true" (onClick)="compartir()" />
          </div>
        </header>

        <div class="foto">
          <p-image [src]="d.imagenUrl" [alt]="'Fotografía de ' + d.titulo" [preview]="true" imageClass="foto-img" />
        </div>

        <div class="columnas">
          <div class="principal">
            <section class="tarjeta datos" aria-label="Resumen">
              <div class="dato"><i class="pi pi-users"></i><strong>{{ d.capacidadPersonas }}</strong><span>huéspedes</span></div>
              <div class="dato"><i class="pi pi-th-large"></i><strong>{{ d.habitaciones }}</strong><span>{{ d.habitaciones === 1 ? 'habitación' : 'habitaciones' }}</span></div>
              <div class="dato"><i class="pi pi-bookmark"></i><strong>{{ d.banos }}</strong><span>{{ d.banos === 1 ? 'baño' : 'baños' }}</span></div>
              <div class="dato"><i class="pi pi-tag"></i><strong>{{ d.precioNoche | currency: 'PEN' : 'symbol' : '1.0-2' }}</strong><span>por noche</span></div>
            </section>

            <section class="tarjeta" aria-labelledby="t-desc">
              <h2 id="t-desc">Sobre este departamento</h2>
              <p class="descripcion">{{ d.descripcion }}</p>
              <div class="anfitrion">
                <span class="avatar" aria-hidden="true">{{ iniciales(d.propietarioNombre) }}</span>
                <div><strong>Publicado por {{ d.propietarioNombre }}</strong><br /><span class="apagado pequeno">Publicado el {{ d.fechaPublicacion | date: "d 'de' MMMM 'de' y" }}</span></div>
              </div>
            </section>

            <section class="tarjeta" aria-labelledby="t-comodidades">
              <h2 id="t-comodidades">Comodidades</h2>
              <ul class="comodidades">
                <li [class.no]="!d.tieneWifi"><i class="pi" [class]="d.tieneWifi ? 'pi-wifi' : 'pi-times'" aria-hidden="true"></i> Wi‑Fi <span class="sr-only">{{ d.tieneWifi ? 'incluido' : 'no incluido' }}</span></li>
                <li [class.no]="!d.tienePiscina"><i class="pi" [class]="d.tienePiscina ? 'pi-sun' : 'pi-times'" aria-hidden="true"></i> Piscina <span class="sr-only">{{ d.tienePiscina ? 'incluida' : 'no incluida' }}</span></li>
                <li [class.no]="!d.admiteMascotas"><i class="pi" [class]="d.admiteMascotas ? 'pi-heart' : 'pi-times'" aria-hidden="true"></i> Admite mascotas <span class="sr-only">{{ d.admiteMascotas ? 'sí' : 'no' }}</span></li>
              </ul>
            </section>

            <section class="tarjeta" aria-labelledby="t-ubicacion">
              <h2 id="t-ubicacion">Ubicación</h2>
              <p>{{ d.direccion }}, {{ d.distrito }}, Lima.</p>
              <a class="enlace" [href]="urlMapa(d)" target="_blank" rel="noopener noreferrer"><i class="pi pi-external-link"></i> Ver en el mapa</a>
            </section>
          </div>

          <aside class="reserva tarjeta" aria-labelledby="t-reserva">
            <div class="precio"><strong>{{ d.precioNoche | currency: 'PEN' : 'symbol' : '1.0-2' }}</strong> <span>/ noche</span></div>
            <h2 id="t-reserva" class="sr-only">Reservar</h2>

            @if (esPropio()) {
              <div class="aviso aviso-info"><i class="pi pi-info-circle"></i><div>Este departamento es tuyo: no puedes reservarlo. Puedes editarlo desde <a class="enlace" routerLink="/propietario/departamentos">Mis departamentos</a>.</div></div>
            } @else if (d.estado !== 'DISPONIBLE') {
              <div class="aviso aviso-alerta"><i class="pi pi-exclamation-triangle"></i><div>Por ahora no está disponible para reservar.</div></div>
            } @else if (sesion.esAdmin()) {
              <div class="aviso aviso-info"><i class="pi pi-info-circle"></i><div>Las cuentas de administrador no pueden reservar.</div></div>
            }

            <div class="calendario" [class.apagado-total]="!puedeReservar()">
              <p-datepicker
                [inline]="true"
                selectionMode="range"
                [ngModel]="rango()"
                (ngModelChange)="alElegirFechas($event)"
                [minDate]="minimo"
                [disabledDates]="fechasBloqueadas()"
                [disabled]="!puedeReservar()"
                [numberOfMonths]="1"
                dateFormat="dd/mm/yy"
                ariaLabel="Calendario de fechas de la reserva"
              >
                <ng-template #date let-fecha>
                  <span class="dia" [class.ocupado]="esOcupada(fecha)" [attr.title]="esOcupada(fecha) ? 'Ocupado' : null">{{ fecha.day }}</span>
                </ng-template>
              </p-datepicker>
              <ul class="leyenda" aria-label="Leyenda del calendario">
                <li><span class="muestra libre"></span> Libre</li>
                <li><span class="muestra elegido"></span> Tu selección</li>
                <li><span class="muestra ocupado"></span> Ocupado</li>
              </ul>
              <p class="apagado pequeno">La fecha de salida de otra reserva queda libre para que ingreses ese mismo día.</p>
            </div>

            <div class="campo">
              <label for="huespedes">Huéspedes (máx. {{ d.capacidadPersonas }})</label>
              <p-inputnumber inputId="huespedes" [ngModel]="huespedes()" (ngModelChange)="huespedes.set($event ?? 1)" [min]="1" [max]="d.capacidadPersonas" [showButtons]="true" buttonLayout="horizontal" [disabled]="!puedeReservar()" />
            </div>

            @if (noches() > 0) {
              <dl class="resumen">
                <div><dt>{{ d.precioNoche | currency: 'PEN' : 'symbol' : '1.0-2' }} × {{ noches() }} {{ noches() === 1 ? 'noche' : 'noches' }}</dt><dd class="num">{{ total() | currency: 'PEN' : 'symbol' : '1.2-2' }}</dd></div>
                <div class="total"><dt>Total estimado</dt><dd class="num">{{ total() | currency: 'PEN' : 'symbol' : '1.2-2' }}</dd></div>
              </dl>
              <p class="apagado pequeno">{{ rango()![0] | date: 'EEE d MMM' }} → {{ rango()![1] | date: 'EEE d MMM y' }}. El total final lo calcula DepaYa al crear la reserva.</p>
            }

            @if (mensaje(); as texto) {
              <div class="aviso aviso-alerta" role="alert"><i class="pi pi-exclamation-triangle"></i><div>{{ texto }}</div></div>
            }

            <p-button [label]="sesion.activa() ? 'Reservar' : 'Reservar (te pediremos iniciar sesión)'" icon="pi pi-calendar-plus" [fluid]="true" size="large" [disabled]="!puedeReservar()" (onClick)="reservar()" />
            <p class="apagado pequeno centro">No se cobra nada todavía: pagarás en el siguiente paso.</p>

            @if (proximas().length > 0) {
              <div class="proximas">
                <strong class="pequeno">Próximas fechas ocupadas</strong>
                <ul>
                  @for (o of proximas(); track o.fechaIngreso) {
                    <li>{{ fecha(o.fechaIngreso) | date: 'd MMM' }} – {{ fecha(o.fechaSalida) | date: 'd MMM y' }}</li>
                  }
                </ul>
              </div>
            }
          </aside>
        </div>
      } @else {
        <div class="tarjeta">
          <app-vacio icono="pi-home" titulo="No encontramos este departamento" [mensaje]="errorCarga() || 'Puede que ya no esté publicado.'">
            <p-button label="Ver otros departamentos" routerLink="/departamentos" />
          </app-vacio>
        </div>
      }
    </div>
  `,
  styles: `
    .migas { display: flex; gap: 8px; align-items: center; color: var(--dy-apagado); font-size: 0.85rem; }
    .migas a:hover { color: var(--dy-coral); text-decoration: underline; }
    .cabecera-depa { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .cabecera-depa h1 { font-size: clamp(1.5rem, 3vw, 2.15rem); font-weight: 780; }
    .ubicacion { color: var(--dy-apagado); margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .categoria { background: #fff1f3; color: #c0134f; font-weight: 650; font-size: 0.78rem; padding: 2px 10px; border-radius: 999px; }
    .foto { border-radius: 24px; overflow: hidden; background: #e5e7eb; box-shadow: var(--dy-sombra); line-height: 0; }
    :host ::ng-deep .foto p-image, :host ::ng-deep .foto .p-image { display: block; width: 100%; }
    :host ::ng-deep .foto-img { width: 100%; height: clamp(260px, 42vw, 500px); object-fit: cover; }
    .columnas { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 26px; align-items: start; }
    .principal { display: grid; gap: 18px; min-width: 0; }
    .datos { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 14px; }
    .dato { display: grid; gap: 2px; justify-items: start; }
    .dato i { color: var(--dy-coral); font-size: 1.2rem; margin-bottom: 4px; }
    .dato strong { font-size: 1.25rem; }
    .dato span { color: var(--dy-apagado); font-size: 0.85rem; }
    .descripcion { margin-top: 10px; line-height: 1.7; color: var(--dy-tinta-suave); white-space: pre-line; }
    .anfitrion { display: flex; gap: 12px; align-items: center; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--dy-borde); }
    .avatar { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--dy-coral); color: #fff; font-weight: 700; flex: none; }
    .comodidades { list-style: none; margin: 14px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
    .comodidades li { display: flex; gap: 10px; align-items: center; font-weight: 600; }
    .comodidades li i { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: #f0fdf4; color: #15803d; }
    .comodidades li.no { color: var(--dy-apagado); text-decoration: line-through; font-weight: 500; }
    .comodidades li.no i { background: #f3f4f6; color: #9ca3af; }
    .tarjeta h2 { margin-bottom: 4px; }
    .reserva { position: sticky; top: calc(var(--dy-cabecera) + 16px); display: grid; gap: 14px; box-shadow: var(--dy-sombra-fuerte); }
    .precio strong { font-size: 1.7rem; }
    .precio span { color: var(--dy-apagado); }
    .calendario { display: grid; gap: 8px; }
    .calendario.apagado-total { opacity: 0.55; pointer-events: none; }
    :host ::ng-deep .calendario .p-datepicker-inline { width: 100%; border: 1px solid var(--dy-borde); border-radius: 14px; padding: 6px; }
    .dia { display: inline-grid; place-items: center; width: 100%; height: 100%; }
    .dia.ocupado { color: #b42318; text-decoration: line-through; background: #fef2f2; border-radius: 50%; }
    .leyenda { list-style: none; margin: 0; padding: 0; display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.78rem; color: var(--dy-apagado); }
    .leyenda li { display: flex; gap: 6px; align-items: center; }
    .muestra { width: 12px; height: 12px; border-radius: 50%; display: inline-block; border: 1px solid #d1d5db; }
    .muestra.elegido { background: var(--p-primary-color); border-color: var(--p-primary-color); }
    .muestra.ocupado { background: #fecaca; border-color: #fca5a5; }
    .resumen { margin: 0; display: grid; gap: 6px; }
    .resumen div { display: flex; justify-content: space-between; gap: 12px; }
    .resumen dt { color: var(--dy-tinta-suave); }
    .resumen dd { margin: 0; }
    .resumen .total { border-top: 1px solid var(--dy-borde); padding-top: 8px; font-weight: 750; font-size: 1.05rem; }
    .resumen .total dt { color: var(--dy-tinta); }
    .centro { text-align: center; }
    .proximas { border-top: 1px solid var(--dy-borde); padding-top: 12px; }
    .proximas ul { margin: 6px 0 0; padding-left: 18px; color: var(--dy-tinta-suave); font-size: 0.85rem; display: grid; gap: 2px; }
    @media (max-width: 980px) { .columnas { grid-template-columns: minmax(0, 1fr); } .reserva { position: static; order: -1; } }
  `,
})
export class Detalle {
  /** Parámetros de la ruta / query (component input binding). */
  readonly id = input.required<string>();
  readonly ingreso = input<string | undefined>();
  readonly salida = input<string | undefined>();
  readonly huespedesInicial = input<string | undefined>(undefined, { alias: 'huespedes' });

  protected readonly sesion = inject(Sesion);
  private readonly api = inject(DepartamentosService);
  private readonly reservas = inject(ReservasService);
  private readonly router = inject(Router);
  private readonly avisos = inject(Avisos);
  private readonly destruir = inject(DestroyRef);

  protected readonly minimo = hoy();
  protected readonly depa = signal<Departamento | null>(null);
  protected readonly ocupadas = signal<Ocupada[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal('');
  protected readonly rango = signal<(Date | null)[] | null>(null);
  protected readonly huespedes = signal(1);
  protected readonly mensaje = signal('');

  protected readonly esPropio = computed(() => {
    const d = this.depa();
    return !!d && this.sesion.id() !== null && this.sesion.id() === d.idPropietario;
  });
  protected readonly puedeReservar = computed(
    () => this.depa()?.estado === 'DISPONIBLE' && !this.esPropio() && !this.sesion.esAdmin(),
  );

  /** Noches ocupadas: [ingreso, salida) — la fecha de salida queda libre. */
  private readonly ocupacion = computed(() => crearOcupacion(this.ocupadas()));
  protected readonly fechasBloqueadas = computed(() => this.ocupacion().bloqueadas);

  protected readonly noches = computed(() => {
    const [ingreso, salida] = this.rango() ?? [];
    return ingreso && salida ? Math.max(0, nochesEntre(ingreso, salida)) : 0;
  });
  protected readonly total = computed(() => this.noches() * (this.depa()?.precioNoche ?? 0));
  protected readonly proximas = computed(() => this.ocupadas().slice(0, 5));

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.cargar(id));
    });
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.errorCarga.set('');
    forkJoin({ depa: this.api.detalle(id), ocupadas: this.reservas.ocupadas(id) })
      .pipe(takeUntilDestroyed(this.destruir))
      .subscribe({
        next: ({ depa, ocupadas }) => {
          this.depa.set(depa);
          this.ocupadas.set(ocupadas);
          this.cargando.set(false);
          this.restaurarSeleccion(depa);
        },
        error: (e: unknown) => {
          this.depa.set(null);
          this.errorCarga.set(e instanceof ApiError && e.estado === 404 ? 'No existe un departamento con ese código.' : '');
          this.cargando.set(false);
        },
      });
  }

  /** Si llegaron fechas por la URL (desde el catálogo o tras iniciar sesión), se dejan elegidas. */
  private restaurarSeleccion(depa: Departamento): void {
    const g = Number(this.huespedesInicial());
    this.huespedes.set(Number.isFinite(g) && g >= 1 ? Math.min(g, depa.capacidadPersonas) : 1);
    const ingreso = this.ingreso();
    const salida = this.salida();
    if (ingreso && salida && /^\d{4}-\d{2}-\d{2}$/.test(ingreso) && /^\d{4}-\d{2}-\d{2}$/.test(salida)) {
      const a = deIso(ingreso);
      const b = deIso(salida);
      if (b > a && a >= hoy()) this.alElegirFechas([a, b]);
    }
  }

  protected alElegirFechas(valor: (Date | null)[] | null): void {
    this.mensaje.set('');
    const [ingreso, salida] = valor ?? [];
    if (ingreso && salida && this.hayChoque(ingreso, salida)) {
      this.rango.set(null);
      this.mensaje.set('Ese rango incluye noches ocupadas. Elige otras fechas.');
      return;
    }
    this.rango.set(valor && valor[0] ? valor : null);
  }

  protected esOcupada(fecha: DiaCalendario): boolean {
    return this.ocupacion().nocheOcupada(fecha);
  }

  protected fecha(iso: string): Date {
    return deIso(iso);
  }

  protected iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  protected urlMapa(d: Departamento): string {
    return d.latitud !== null && d.longitud !== null
      ? `https://www.openstreetmap.org/?mlat=${d.latitud}&mlon=${d.longitud}#map=17/${d.latitud}/${d.longitud}`
      : `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${d.direccion}, ${d.distrito}, Lima`)}`;
  }

  protected compartir(): void {
    const enlace = window.location.origin + this.router.url.split('?')[0];
    navigator.clipboard?.writeText(enlace).then(
      () => this.avisos.exito('Enlace copiado', 'Ya puedes compartirlo.'),
      () => this.avisos.info('Enlace', enlace),
    );
  }

  protected reservar(): void {
    const d = this.depa();
    if (!d) return;
    const [ingreso, salida] = this.rango() ?? [];
    if (!ingreso || !salida) {
      this.mensaje.set('Elige tu fecha de ingreso y tu fecha de salida en el calendario.');
      return;
    }
    if (salida <= ingreso) {
      this.mensaje.set('La salida debe ser posterior al ingreso.');
      return;
    }
    if (this.huespedes() > d.capacidadPersonas) {
      this.mensaje.set(`Este departamento admite hasta ${d.capacidadPersonas} huésped(es).`);
      return;
    }
    this.mensaje.set('');
    const destino = this.router.createUrlTree(['/huesped/reservar', d.id], {
      queryParams: { ingreso: aIso(ingreso), salida: aIso(salida), huespedes: this.huespedes() },
    });
    if (!this.sesion.activa()) {
      // El login se pide solo ahora; al volver, la selección ya está en la URL.
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.serializeUrl(destino) } });
      return;
    }
    void this.router.navigateByUrl(destino);
  }

  private hayChoque(ingreso: Date, salida: Date): boolean {
    return this.ocupacion().choca(ingreso, salida);
  }
}
