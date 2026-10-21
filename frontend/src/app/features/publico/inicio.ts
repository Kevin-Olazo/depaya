import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { Departamento } from '../../core/models/api.models';
import { CATEGORIAS_ICONOS } from '../../core/models/etiquetas';
import { Sesion } from '../../core/services/sesion';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { aIso, hoy, sumarDias } from '../../core/utils/fechas';
import { DepaCard } from '../../shared/depa-card';
import { RangoFechas } from '../../shared/fecha-rango';

interface Destino {
  distrito: string;
  total: number;
  imagen: string;
}

@Component({
  selector: 'app-inicio',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, DatePicker, InputNumber, InputText, Select, Skeleton, DepaCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <div class="velo"></div>
      <div class="contenedor hero-contenido">
        <h1>Alquila.<br />Explora.<br />Vive el Perú.</h1>
        <p>Los mejores departamentos te esperan en Miraflores, Barranco, San Isidro y más.</p>

        <form class="buscador" [formGroup]="form" (ngSubmit)="buscar()" role="search" aria-label="Buscar departamentos">
          <div class="campo-b">
            <label for="b-q">¿Qué buscas?</label>
            <input pInputText id="b-q" formControlName="q" placeholder="Vista al mar, loft, familiar…" autocomplete="off" />
          </div>
          <div class="campo-b">
            <label for="b-distrito">Distrito</label>
            <p-select inputId="b-distrito" ariaLabel="Distrito" formControlName="distrito" [options]="distritos()" placeholder="Todos" [showClear]="true" />
          </div>
          <div class="campo-b">
            <label for="b-fechas">Fechas</label>
            <p-datepicker inputId="b-fechas" formControlName="rango" selectionMode="range" [readonlyInput]="true" [minDate]="minimo" placeholder="Ingreso — salida" dateFormat="dd/mm/yy" [showClear]="true" appendTo="body" />
          </div>
          <div class="campo-b corto">
            <label for="b-huespedes">Huéspedes</label>
            <p-inputnumber inputId="b-huespedes" formControlName="huespedes" [min]="1" [max]="30" [showButtons]="true" buttonLayout="horizontal" placeholder="Cualquiera" />
          </div>
          <p-button type="submit" label="Buscar" icon="pi pi-search" size="large" [fluid]="true" />
        </form>
      </div>
    </section>

    <div class="contenedor secciones">
      <section aria-labelledby="t-distritos">
        <div class="titulo-seccion">
          <h2 id="t-distritos">Explora por distrito</h2>
          <a class="enlace" routerLink="/departamentos">Ver todos →</a>
        </div>
        <div class="distritos">
          @if (cargandoDestinos()) {
            @for (i of [1, 2, 3, 4]; track i) {
              <p-skeleton height="210px" borderRadius="16px" />
            }
          } @else {
            @for (d of destinos(); track d.distrito) {
              <a class="distrito" routerLink="/departamentos" [queryParams]="{ distrito: d.distrito }">
                <img [src]="d.imagen" [alt]="'Departamentos en ' + d.distrito" loading="lazy" />
                <span class="distrito-info">
                  <strong>{{ d.distrito }}</strong>
                  <small>{{ d.total }} {{ d.total === 1 ? 'alojamiento' : 'alojamientos' }}</small>
                </span>
              </a>
            }
          }
        </div>
      </section>

      <section aria-labelledby="t-categorias">
        <div class="titulo-seccion"><h2 id="t-categorias">Elige tu estilo</h2></div>
        <div class="categorias">
          @for (c of categorias(); track c) {
            <a class="categoria" routerLink="/departamentos" [queryParams]="{ categoria: c }">
              <i class="pi" [class]="icono(c)" aria-hidden="true"></i>
              {{ c }}
            </a>
          }
        </div>
      </section>

      <section aria-labelledby="t-recientes">
        <div class="titulo-seccion">
          <h2 id="t-recientes">Recién publicados</h2>
          <a class="enlace" routerLink="/departamentos">Ver catálogo completo →</a>
        </div>
        <div class="rejilla-cards">
          @if (cargandoRecientes()) {
            @for (i of [1, 2, 3, 4]; track i) {
              <p-skeleton height="360px" borderRadius="18px" />
            }
          } @else {
            @for (d of recientes(); track d.id) {
              <app-depa-card [depa]="d" />
            }
          }
        </div>
      </section>

      <section class="como" aria-labelledby="t-como">
        <h2 id="t-como">Así de simple</h2>
        <ol>
          <li><span class="paso">1</span><div><strong>Busca</strong><p>Filtra por distrito, precio, comodidades y fechas libres.</p></div></li>
          <li><span class="paso">2</span><div><strong>Reserva</strong><p>Inicias sesión solo cuando decides reservar y conservas tu selección.</p></div></li>
          <li><span class="paso">3</span><div><strong>Paga y listo</strong><p>Yape, Plin, Visa o Mastercard (simulado). Reembolso de hasta 48 h si cancelas a tiempo.</p></div></li>
        </ol>
      </section>

      <section class="promo">
        <div>
          <h2>¿Tienes un departamento?</h2>
          <p>Publícalo gratis y empieza a generar ingresos. DepaYa cobra una comisión de solo <strong>10 %</strong> por reserva pagada: tú recibes el <strong>90 %</strong>.</p>
          <div class="fila">
            @if (sesion.esPropietario()) {
              <p-button label="Ir a mis departamentos" routerLink="/propietario/departamentos" />
            } @else if (!sesion.activa()) {
              <p-button label="Publicar ahora" routerLink="/registro" [queryParams]="{ rol: 'PROPIETARIO' }" />
            }
          </div>
        </div>
        <div class="promo-foto" aria-hidden="true"></div>
      </section>
    </div>
  `,
  styles: `
    .hero { position: relative; display: grid; align-items: center; min-height: 560px; color: #fff;
      background: url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1800&q=80') center / cover; }
    .velo { position: absolute; inset: 0; background: linear-gradient(100deg, rgb(15 17 23 / 78%) 0%, rgb(15 17 23 / 40%) 55%, rgb(15 17 23 / 10%) 100%); }
    .hero-contenido { position: relative; display: grid; gap: 18px; padding-block: 64px; }
    .hero h1 { color: #fff; font-size: clamp(2.6rem, 6vw, 4.4rem); font-weight: 850; line-height: 1.04; letter-spacing: -0.03em; }
    .hero-contenido > p { font-size: 1.15rem; max-width: 46ch; opacity: 0.92; }
    .buscador { margin-top: 12px; display: grid; grid-template-columns: 1.3fr 1fr 1.2fr 0.9fr auto; gap: 12px; align-items: end; background: #fff; color: var(--dy-tinta); padding: 16px; border-radius: 20px; box-shadow: var(--dy-sombra-fuerte); max-width: 1080px; }
    .campo-b { display: grid; gap: 5px; min-width: 0; }
    .campo-b label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--dy-apagado); }
    .campo-b input, .campo-b .p-select, .campo-b .p-datepicker, .campo-b .p-inputnumber { width: 100%; }
    .secciones { display: grid; gap: 56px; padding-block: 56px 24px; }
    .titulo-seccion { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
    .titulo-seccion h2, .como h2 { font-size: 1.55rem; font-weight: 750; }
    .distritos { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap: 16px; }
    .distrito { position: relative; display: block; border-radius: 18px; overflow: hidden; aspect-ratio: 4 / 3.1; background: #e5e7eb; box-shadow: var(--dy-sombra); }
    .distrito img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
    .distrito:hover img { transform: scale(1.05); }
    .distrito-info { position: absolute; inset: auto 0 0 0; padding: 38px 16px 14px; display: grid; color: #fff; background: linear-gradient(transparent, rgb(0 0 0 / 70%)); }
    .distrito-info strong { font-size: 1.1rem; }
    .distrito-info small { opacity: 0.9; }
    .categorias { display: flex; gap: 10px; flex-wrap: wrap; }
    .categoria { display: inline-flex; gap: 10px; align-items: center; padding: 12px 20px; background: #fff; border: 1px solid var(--dy-borde); border-radius: 999px; font-weight: 650; box-shadow: var(--dy-sombra); transition: border-color 0.15s, color 0.15s, transform 0.15s; }
    .categoria:hover { border-color: var(--dy-coral); color: var(--dy-coral); transform: translateY(-2px); }
    .como { background: #fff; border: 1px solid var(--dy-borde); border-radius: 24px; padding: clamp(22px, 4vw, 44px); box-shadow: var(--dy-sombra); }
    .como ol { list-style: none; margin: 22px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
    .como li { display: flex; gap: 14px; align-items: flex-start; }
    .paso { flex: none; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--dy-coral); color: #fff; font-weight: 800; }
    .como p { color: var(--dy-apagado); margin-top: 4px; }
    .promo { display: grid; grid-template-columns: 1.1fr 0.9fr; background: #14161c; color: #e5e7eb; border-radius: 24px; overflow: hidden; }
    .promo > div:first-child { padding: clamp(24px, 5vw, 56px); display: grid; gap: 14px; align-content: center; }
    .promo h2 { color: #fff; font-size: 1.9rem; font-weight: 800; }
    .promo strong { color: #fff; }
    .promo-foto { min-height: 260px; background: url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&q=80') center / cover; }
    @media (max-width: 1000px) { .buscador { grid-template-columns: 1fr 1fr; } .buscador p-button { grid-column: 1 / -1; } }
    @media (max-width: 640px) { .buscador { grid-template-columns: 1fr; } .promo { grid-template-columns: 1fr; } .hero { min-height: 0; } }
  `,
})
export class Inicio {
  private readonly api = inject(DepartamentosService);
  private readonly router = inject(Router);
  protected readonly sesion = inject(Sesion);

  protected readonly minimo = hoy();
  protected readonly form = inject(FormBuilder).nonNullable.group({
    q: [''],
    distrito: [null as string | null],
    rango: new FormControl<RangoFechas>(null, { nonNullable: true }),
    huespedes: [null as number | null],
  });

  protected readonly distritos = signal<string[]>([]);
  protected readonly categorias = signal<string[]>([]);
  protected readonly destinos = signal<Destino[]>([]);
  protected readonly recientes = signal<Departamento[]>([]);
  protected readonly cargandoDestinos = signal(true);
  protected readonly cargandoRecientes = signal(true);

  constructor() {
    const destruir = inject(DestroyRef);

    this.api.categorias().pipe(takeUntilDestroyed(destruir)).subscribe({ next: (c) => this.categorias.set(c), error: () => undefined });

    this.api
      .distritos()
      .pipe(takeUntilDestroyed(destruir))
      .subscribe({
        next: (lista) => {
          this.distritos.set(lista);
          const primeros = lista.slice(0, 8);
          if (primeros.length === 0) {
            this.cargandoDestinos.set(false);
            return;
          }
          // Una consulta mínima por distrito da el conteo real y una foto del primer resultado.
          forkJoin(
            primeros.map((distrito) =>
              this.api.catalogo({ distrito }, { page: 0, size: 1 }).pipe(
                map((p): Destino | null =>
                  p.content[0] ? { distrito, total: p.totalElements, imagen: p.content[0].imagenUrl } : null,
                ),
              ),
            ),
          ).subscribe({
            next: (r) => {
              this.destinos.set(r.filter((d): d is Destino => d !== null));
              this.cargandoDestinos.set(false);
            },
            error: () => this.cargandoDestinos.set(false),
          });
        },
        error: () => this.cargandoDestinos.set(false),
      });

    this.api
      .catalogo({}, { page: 0, size: 4, sort: 'fechaPublicacion,desc' })
      .pipe(takeUntilDestroyed(destruir))
      .subscribe({
        next: (p) => {
          this.recientes.set(p.content);
          this.cargandoRecientes.set(false);
        },
        error: () => this.cargandoRecientes.set(false),
      });
  }

  protected icono(categoria: string): string {
    return CATEGORIAS_ICONOS[categoria] ?? 'pi-home';
  }

  protected buscar(): void {
    const v = this.form.getRawValue();
    const queryParams: Record<string, string | number> = {};
    if (v.q?.trim()) queryParams['q'] = v.q.trim();
    if (v.distrito) queryParams['distrito'] = v.distrito;
    if (v.huespedes) queryParams['huespedes'] = v.huespedes;
    const [ingreso, salida] = v.rango ?? [];
    if (ingreso && salida && salida > ingreso) {
      queryParams['desde'] = aIso(ingreso);
      queryParams['hasta'] = aIso(salida);
    } else if (ingreso && !salida) {
      queryParams['desde'] = aIso(ingreso);
      queryParams['hasta'] = aIso(sumarDias(ingreso, 1));
    }
    void this.router.navigate(['/departamentos'], { queryParams });
  }
}
