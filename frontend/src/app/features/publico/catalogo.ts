import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subject, debounceTime, switchMap, tap, catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Drawer } from 'primeng/drawer';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Consulta, Departamento, FiltroDepartamento, Pagina } from '../../core/models/api.models';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { mensajeDeError } from '../../core/services/api-error';
import { aIso, deIso, hoy } from '../../core/utils/fechas';
import { DepaCard } from '../../shared/depa-card';
import { RangoFechas } from '../../shared/fecha-rango';
import { Vacio } from '../../shared/vacio';

const ORDENES = [
  { valor: 'fechaPublicacion,desc', texto: 'Más recientes' },
  { valor: 'precioNoche,asc', texto: 'Precio: de menor a mayor' },
  { valor: 'precioNoche,desc', texto: 'Precio: de mayor a menor' },
  { valor: 'capacidadPersonas,desc', texto: 'Mayor capacidad' },
  { valor: 'titulo,asc', texto: 'Nombre (A–Z)' },
];
const ORDEN_DEFECTO = ORDENES[0].valor;
const TAMANO = 12;

function numero(p: ParamMap, clave: string): number | null {
  const v = p.get(clave);
  if (v === null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function verdadero(p: ParamMap, clave: string): boolean {
  return p.get(clave) === 'true';
}

/** Catálogo público: búsqueda, filtros, orden y paginación. El estado vive en la URL (se puede compartir y funciona el botón "atrás"). */
@Component({
  selector: 'app-catalogo',
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    ButtonModule,
    DatePicker,
    Drawer,
    IconField,
    InputIcon,
    InputNumber,
    InputText,
    Paginator,
    Select,
    Skeleton,
    ToggleSwitch,
    DepaCard,
    Vacio,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      <header class="encabezado-pagina">
        <div>
          <p class="eyebrow">Selección DepaYa</p>
          <h1>Departamentos <em>disponibles</em></h1>
          <p role="status" aria-live="polite">
            @if (cargando()) { Buscando… }
            @else if (resultados(); as r) { {{ r.totalElements }} {{ r.totalElements === 1 ? 'alojamiento encontrado' : 'alojamientos encontrados' }} }
          </p>
        </div>
        <div class="fila">
          @if (esMovil()) {
            <p-button label="Filtros" icon="pi pi-sliders-h" severity="secondary" [outlined]="true" [badge]="filtrosActivos() ? '' + filtrosActivos() : ''" (onClick)="filtrosAbiertos.set(true)" />
          }
          <label class="sr-only" for="orden">Ordenar por</label>
          <p-select inputId="orden" [formControl]="form.controls.orden" [options]="ordenes" optionLabel="texto" optionValue="valor" ariaLabel="Ordenar por" [style]="{ minWidth: '14rem' }" />
        </div>
      </header>

      <div class="distribucion">
        @if (!esMovil()) {
          <aside class="filtros tarjeta" aria-label="Filtros">
            <ng-container *ngTemplateOutlet="panelFiltros" />
          </aside>
        }

        <section id="resultados" aria-label="Resultados">
          @if (cargando()) {
            <div class="rejilla-cards">
              @for (i of esqueleto; track i) {
                <p-skeleton height="360px" borderRadius="18px" />
              }
            </div>
          } @else if (error(); as texto) {
            <div class="aviso aviso-error" role="alert"><i class="pi pi-exclamation-triangle"></i><div><strong>No pudimos cargar los departamentos.</strong><br />{{ texto }}</div></div>
            <div class="reintento"><p-button label="Reintentar" icon="pi pi-refresh" (onClick)="recargar()" /></div>
          } @else if (resultados(); as r) {
            @if (r.content.length > 0) {
              <div class="rejilla-cards">
                @for (d of r.content; track d.id) {
                  <app-depa-card [depa]="d" [fechas]="fechasDetalle()" />
                }
              </div>
              <p-paginator
                [first]="primero()"
                [rows]="tamano"
                [totalRecords]="r.totalElements"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="{first} – {last} de {totalRecords}"
                (onPageChange)="cambiarPagina($event)"
              />
            } @else {
              <div class="tarjeta">
                <app-vacio icono="pi-search" titulo="No encontramos departamentos" mensaje="Prueba con menos filtros, otro distrito u otras fechas.">
                  <p-button label="Quitar filtros" icon="pi pi-filter-slash" (onClick)="limpiar()" />
                </app-vacio>
              </div>
            }
          }
        </section>
      </div>
    </div>

    @if (esMovil()) {
      <p-drawer [(visible)]="filtrosAbiertos" header="Filtros" position="left" [style]="{ width: 'min(92vw, 24rem)' }">
        <ng-container *ngTemplateOutlet="panelFiltros" />
        <div class="pie-drawer">
          <p-button label="Ver resultados" [fluid]="true" (onClick)="filtrosAbiertos.set(false)" />
        </div>
      </p-drawer>
    }

    <ng-template #panelFiltros>
      <form class="formulario" [formGroup]="form" (ngSubmit)="$event.preventDefault()" aria-label="Filtros del catálogo">
        <div class="fila-separada">
          <strong>Filtros</strong>
          @if (filtrosActivos() > 0) {
            <button type="button" class="limpiar" (click)="limpiar()"><i class="pi pi-filter-slash"></i> Limpiar ({{ filtrosActivos() }})</button>
          }
        </div>

        <div class="campo">
          <label for="f-q">Buscar</label>
          <p-iconfield>
            <p-inputicon class="pi pi-search" />
            <input pInputText id="f-q" formControlName="q" placeholder="Título o descripción" autocomplete="off" />
          </p-iconfield>
        </div>

        <div class="campo">
          <label for="f-distrito">Distrito</label>
          <p-select inputId="f-distrito" ariaLabel="Distrito" formControlName="distrito" [options]="distritos()" placeholder="Todos los distritos" [showClear]="true" [filter]="distritos().length > 8" appendTo="body" />
        </div>

        <div class="campo">
          <label for="f-categoria">Categoría</label>
          <p-select inputId="f-categoria" ariaLabel="Categoría" formControlName="categoria" [options]="categorias()" placeholder="Todas las categorías" [showClear]="true" appendTo="body" />
        </div>

        <div class="campo">
          <label for="f-fechas">Fechas libres</label>
          <p-datepicker inputId="f-fechas" formControlName="rango" selectionMode="range" [readonlyInput]="true" [minDate]="minimo" placeholder="Ingreso — salida" dateFormat="dd/mm/yy" [showClear]="true" appendTo="body" />
          @if (avisoFechas()) {
            <span class="ayuda">{{ avisoFechas() }}</span>
          } @else {
            <span class="ayuda">Solo se muestran los departamentos sin reservas en esas noches.</span>
          }
        </div>

        <div class="doble">
          <div class="campo">
            <label for="f-pmin">Precio mínimo</label>
            <p-inputnumber inputId="f-pmin" formControlName="precioMin" prefix="S/ " [min]="0" [maxFractionDigits]="0" placeholder="S/ 0" [useGrouping]="false" />
          </div>
          <div class="campo">
            <label for="f-pmax">Precio máximo</label>
            <p-inputnumber inputId="f-pmax" formControlName="precioMax" prefix="S/ " [min]="0" [maxFractionDigits]="0" placeholder="Sin tope" [useGrouping]="false" />
          </div>
        </div>

        <div class="triple">
          <div class="campo">
            <label for="f-huespedes">Huéspedes</label>
            <p-inputnumber inputId="f-huespedes" formControlName="huespedes" [min]="1" [max]="30" placeholder="Todos" />
          </div>
          <div class="campo">
            <label for="f-hab">Habitaciones</label>
            <p-inputnumber inputId="f-hab" formControlName="habitaciones" [min]="1" [max]="20" placeholder="Todas" />
          </div>
          <div class="campo">
            <label for="f-banos">Baños</label>
            <p-inputnumber inputId="f-banos" formControlName="banos" [min]="1" [max]="20" placeholder="Todos" />
          </div>
        </div>

        <fieldset class="comodidades">
          <legend>Comodidades</legend>
          <div class="interruptor"><p-toggleswitch inputId="f-wifi" formControlName="wifi" /><label for="f-wifi"><i class="pi pi-wifi"></i> Wi‑Fi</label></div>
          <div class="interruptor"><p-toggleswitch inputId="f-piscina" formControlName="piscina" /><label for="f-piscina"><i class="pi pi-sun"></i> Piscina</label></div>
          <div class="interruptor"><p-toggleswitch inputId="f-mascotas" formControlName="mascotas" /><label for="f-mascotas"><i class="pi pi-heart"></i> Admite mascotas</label></div>
        </fieldset>
      </form>
    </ng-template>
  `,
  styles: `
    .distribucion { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 26px; align-items: start; }
    .filtros { position: sticky; top: calc(var(--dy-cabecera) + 16px); max-height: calc(100vh - var(--dy-cabecera) - 32px); overflow: auto; }
    .doble { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .triple { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .triple .campo > label, .doble .campo > label { font-size: 0.78rem; }
    .comodidades { border: 0; padding: 0; margin: 0; display: grid; gap: 12px; }
    .comodidades legend { font-weight: 600; font-size: 0.875rem; padding: 0; margin-bottom: 8px; }
    .interruptor { display: flex; align-items: center; gap: 10px; }
    .interruptor label { display: flex; gap: 8px; align-items: center; cursor: pointer; }
    .limpiar { background: none; border: 0; color: var(--dy-primario); font: inherit; font-weight: 600; cursor: pointer; display: inline-flex; gap: 6px; align-items: center; padding: 4px; }
    .limpiar:hover { text-decoration: underline; }
    p-paginator { display: block; margin-top: 26px; }
    .reintento { margin-top: 14px; }
    .pie-drawer { margin-top: 22px; position: sticky; bottom: 0; background: #fff; padding-top: 10px; }
    @media (max-width: 900px) { .distribucion { grid-template-columns: minmax(0, 1fr); } }
  `,
})
export class Catalogo {
  private readonly api = inject(DepartamentosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destruir = inject(DestroyRef);

  protected readonly ordenes = ORDENES;
  protected readonly tamano = TAMANO;
  protected readonly esqueleto = Array.from({ length: 6 }, (_, i) => i);
  protected readonly minimo = hoy();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    q: [''],
    distrito: [null as string | null],
    categoria: [null as string | null],
    precioMin: [null as number | null],
    precioMax: [null as number | null],
    huespedes: [null as number | null],
    habitaciones: [null as number | null],
    banos: [null as number | null],
    piscina: [false],
    wifi: [false],
    mascotas: [false],
    rango: new FormControl<RangoFechas>(null, { nonNullable: true }),
    orden: [ORDEN_DEFECTO],
  });

  protected readonly distritos = signal<string[]>([]);
  protected readonly categorias = signal<string[]>([]);
  protected readonly resultados = signal<Pagina<Departamento> | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly primero = signal(0);
  protected readonly filtrosActivos = signal(0);
  protected readonly avisoFechas = signal('');
  protected readonly esMovil = signal(false);
  protected readonly filtrosAbiertos = signal(false);

  private readonly parametros = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly fechasDetalle = computed(() => {
    const p = this.parametros();
    const desde = p.get('desde');
    const hasta = p.get('hasta');
    return desde && hasta ? { ingreso: desde, salida: hasta } : null;
  });

  private readonly peticiones = new Subject<{ filtro: FiltroDepartamento; consulta: Consulta }>();

  constructor() {
    this.api.distritos().pipe(takeUntilDestroyed(this.destruir)).subscribe({ next: (d) => this.distritos.set(d), error: () => undefined });
    this.api.categorias().pipe(takeUntilDestroyed(this.destruir)).subscribe({ next: (c) => this.categorias.set(c), error: () => undefined });

    const consulta = window.matchMedia('(max-width: 900px)');
    this.esMovil.set(consulta.matches);
    const alCambiar = (e: MediaQueryListEvent) => this.esMovil.set(e.matches);
    consulta.addEventListener('change', alCambiar);
    this.destruir.onDestroy(() => consulta.removeEventListener('change', alCambiar));

    // Cada petición cancela la anterior (switchMap) para que una respuesta lenta no pise a una más nueva.
    this.peticiones
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
        }),
        switchMap(({ filtro, consulta: c }) =>
          this.api.catalogo(filtro, c).pipe(
            catchError((e: unknown) => {
              this.error.set(mensajeDeError(e));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destruir),
      )
      .subscribe((pagina) => {
        this.resultados.set(pagina);
        this.cargando.set(false);
      });

    // URL → formulario → API
    effect(() => {
      const p = this.parametros();
      untracked(() => this.alCambiarUrl(p));
    });

    // Formulario → URL (con una pausa para no consultar en cada tecla)
    this.form.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destruir)).subscribe(() => {
      this.actualizarAvisos();
      this.empujarUrl(0);
    });
  }

  protected cambiarPagina(e: PaginatorState): void {
    this.empujarUrl(e.page ?? 0);
    document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected limpiar(): void {
    this.form.reset({ orden: this.form.controls.orden.value }, { emitEvent: false });
    this.actualizarAvisos();
    this.empujarUrl(0);
  }

  protected recargar(): void {
    this.alCambiarUrl(this.parametros());
  }

  private alCambiarUrl(p: ParamMap): void {
    const desde = p.get('desde');
    const hasta = p.get('hasta');
    const valores = {
      q: p.get('q') ?? '',
      distrito: p.get('distrito'),
      categoria: p.get('categoria'),
      precioMin: numero(p, 'precioMin'),
      precioMax: numero(p, 'precioMax'),
      huespedes: numero(p, 'huespedes'),
      habitaciones: numero(p, 'habitaciones'),
      banos: numero(p, 'banos'),
      piscina: verdadero(p, 'piscina'),
      wifi: verdadero(p, 'wifi'),
      mascotas: verdadero(p, 'mascotas'),
      rango: (desde && hasta ? [deIso(desde), deIso(hasta)] : null) as RangoFechas,
      orden: ORDENES.some((o) => o.valor === p.get('orden')) ? p.get('orden')! : ORDEN_DEFECTO,
    };
    // Si el usuario está eligiendo un rango a medias, no se lo borramos.
    const parcial = this.form.controls.rango.value;
    if (!valores.rango && parcial && parcial[0] && !parcial[1]) {
      valores.rango = parcial;
    }
    this.form.patchValue(valores, { emitEvent: false });
    this.actualizarAvisos();

    const pagina = Math.max(1, numero(p, 'pagina') ?? 1);
    this.primero.set((pagina - 1) * TAMANO);

    const filtro: FiltroDepartamento = {
      q: valores.q.trim() || undefined,
      distrito: valores.distrito,
      categoria: valores.categoria,
      precioMin: valores.precioMin,
      precioMax: valores.precioMax,
      huespedes: valores.huespedes,
      habitaciones: valores.habitaciones,
      banos: valores.banos,
      piscina: valores.piscina || null,
      wifi: valores.wifi || null,
      mascotas: valores.mascotas || null,
      desde,
      hasta,
    };
    this.peticiones.next({ filtro, consulta: { page: pagina - 1, size: TAMANO, sort: valores.orden } });
  }

  /** Formulario → parámetros de la URL (solo lo que tiene valor). */
  private empujarUrl(pagina: number): void {
    const v = this.form.getRawValue();
    const qp: Record<string, string | number | boolean> = {};
    if (v.q.trim()) qp['q'] = v.q;
    if (v.distrito) qp['distrito'] = v.distrito;
    if (v.categoria) qp['categoria'] = v.categoria;
    if (v.precioMin !== null) qp['precioMin'] = v.precioMin;
    if (v.precioMax !== null) qp['precioMax'] = v.precioMax;
    if (v.huespedes !== null) qp['huespedes'] = v.huespedes;
    if (v.habitaciones !== null) qp['habitaciones'] = v.habitaciones;
    if (v.banos !== null) qp['banos'] = v.banos;
    if (v.piscina) qp['piscina'] = true;
    if (v.wifi) qp['wifi'] = true;
    if (v.mascotas) qp['mascotas'] = true;
    const [ingreso, salida] = v.rango ?? [];
    if (ingreso && salida && salida > ingreso) {
      qp['desde'] = aIso(ingreso);
      qp['hasta'] = aIso(salida);
    }
    if (v.orden !== ORDEN_DEFECTO) qp['orden'] = v.orden;
    if (pagina > 0) qp['pagina'] = pagina + 1;
    void this.router.navigate([], { relativeTo: this.route, queryParams: qp, replaceUrl: pagina === 0 });
  }

  private actualizarAvisos(): void {
    const v = this.form.getRawValue();
    const [ingreso, salida] = v.rango ?? [];
    this.avisoFechas.set(
      ingreso && salida && salida <= ingreso ? 'Elige una fecha de salida posterior al ingreso.' : '',
    );
    const rangoValido = !!(ingreso && salida && salida > ingreso);
    this.filtrosActivos.set(
      [
        v.q.trim(),
        v.distrito,
        v.categoria,
        v.precioMin,
        v.precioMax,
        v.huespedes,
        v.habitaciones,
        v.banos,
        v.piscina,
        v.wifi,
        v.mascotas,
        rangoValido,
      ].filter((x) => x !== null && x !== '' && x !== false && x !== undefined).length,
    );
  }
}
