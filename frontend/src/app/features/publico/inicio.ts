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
      <div class="contenedor hero-grid">
        <div class="hero-texto">
          <p class="eyebrow">Tu próxima estadía empieza aquí</p>
          <h1>Alquila. Explora.<br /><em>Vive el Perú.</em></h1>
          <p class="entradilla">Los mejores departamentos te esperan en Miraflores, Barranco, San Isidro y más.</p>

          <form class="buscador" [formGroup]="form" (ngSubmit)="buscar()" role="search" aria-label="Buscar departamentos">
            <div class="campo-b">
              <label for="b-q">¿Qué buscas?</label>
              <input pInputText id="b-q" formControlName="q" placeholder="Vista al mar, loft, familiar…" autocomplete="off" />
            </div>
            <div class="campo-b">
              <label for="b-distrito">¿A dónde vas?</label>
              <p-select inputId="b-distrito" ariaLabel="Distrito" formControlName="distrito" [options]="distritos()" placeholder="Todos los distritos" [showClear]="true" />
            </div>
            <div class="campo-b">
              <label for="b-fechas">Fechas</label>
              <p-datepicker inputId="b-fechas" formControlName="rango" selectionMode="range" [readonlyInput]="true" [minDate]="minimo" placeholder="Ingreso — salida" dateFormat="dd/mm/yy" [showClear]="true" appendTo="body" />
            </div>
            <div class="campo-b">
              <label for="b-huespedes">Huéspedes</label>
              <p-inputnumber inputId="b-huespedes" formControlName="huespedes" [min]="1" [max]="30" [showButtons]="true" buttonLayout="horizontal" placeholder="Cualquiera" />
            </div>
            <p-button type="submit" label="Buscar" icon="pi pi-search" size="large" [fluid]="true" class="boton-buscar" />
          </form>

          <div class="confianza">
            <span class="confianza-icono" aria-hidden="true"><i class="pi pi-shield"></i></span>
            <span><b>Reserva con tranquilidad</b><small>Pago simulado y reembolso de hasta 48 h si cancelas a tiempo</small></span>
          </div>
        </div>

        <div class="hero-arte" aria-hidden="true">
          <div class="hero-foto">
            <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=85" alt="" />
            <span class="foto-etiqueta"><span class="punto"></span> ESPACIOS CON ENCANTO</span>
          </div>
          <div class="nota-flotante">
            <span class="nota-icono"><i class="pi pi-heart"></i></span>
            <span><b>Tu espacio ideal</b><small>Está esperando por ti</small></span>
          </div>
          <div class="sello">VIVE<br />A TU<br /><i>MANERA</i></div>
        </div>
      </div>
    </section>

    <div class="contenedor secciones">
      <section aria-labelledby="t-distritos">
        <div class="cabecera-seccion">
          <div>
            <p class="eyebrow">Selección DepaYa</p>
            <h2 id="t-distritos">Explora por <em>distrito</em></h2>
            <p>Barrios con los mejores espacios para tu próxima estadía.</p>
          </div>
          <a class="enlace-flecha" routerLink="/departamentos">Ver departamentos <i class="pi pi-arrow-right" aria-hidden="true"></i></a>
        </div>
        <div class="distritos">
          @if (cargandoDestinos()) {
            @for (i of [1, 2, 3, 4]; track i) {
              <p-skeleton height="210px" borderRadius="15px" />
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

      <section aria-labelledby="t-recientes">
        <div class="cabecera-seccion">
          <div>
            <p class="eyebrow">Recién publicados</p>
            <h2 id="t-recientes">Espacios que <em>inspiran</em></h2>
            <p>Una selección de lugares pensados para ti.</p>
          </div>
          <a class="enlace-flecha" routerLink="/departamentos">Ver catálogo completo <i class="pi pi-arrow-right" aria-hidden="true"></i></a>
        </div>
        <div class="filtros-estilo">
          <span class="etiqueta-estilo">Explora por estilo</span>
          @for (c of categorias(); track c) {
            <a class="pastilla" routerLink="/departamentos" [queryParams]="{ categoria: c }"><i class="pi" [class]="icono(c)" aria-hidden="true"></i> {{ c }}</a>
          }
        </div>
        <div class="rejilla-cards">
          @if (cargandoRecientes()) {
            @for (i of [1, 2, 3, 4]; track i) {
              <p-skeleton height="360px" borderRadius="15px" />
            }
          } @else {
            @for (d of recientes(); track d.id) {
              <app-depa-card [depa]="d" />
            }
          }
        </div>
      </section>

      <section class="como" aria-labelledby="t-como">
        <p class="eyebrow">Cómo funciona</p>
        <h2 id="t-como">Así de <em>simple</em></h2>
        <ol>
          <li><span class="paso">1</span><div><strong>Busca</strong><p>Filtra por distrito, precio, comodidades y fechas libres.</p></div></li>
          <li><span class="paso">2</span><div><strong>Reserva</strong><p>Inicias sesión solo cuando decides reservar y conservas tu selección.</p></div></li>
          <li><span class="paso">3</span><div><strong>Paga y listo</strong><p>Yape, Plin, Visa o Mastercard (simulado). Reembolso de hasta 48 h si cancelas a tiempo.</p></div></li>
        </ol>
      </section>
    </div>

    <section class="cta" aria-labelledby="t-cta">
      <div class="contenedor cta-interior">
        <div>
          <p class="eyebrow">¿Tienes un departamento?</p>
          <h2 id="t-cta">Tu espacio puede ser<br /><em>el próximo favorito.</em></h2>
          <p>Publícalo gratis y empieza a generar ingresos. DepaYa cobra una comisión de solo <strong>10 %</strong> por reserva pagada: tú recibes el <strong>90 %</strong>.</p>
        </div>
        @if (sesion.esPropietario()) {
          <a class="boton-claro" routerLink="/propietario/departamentos">Ir a mis departamentos <i class="pi pi-arrow-right" aria-hidden="true"></i></a>
        } @else if (!sesion.activa()) {
          <a class="boton-claro" routerLink="/registro" [queryParams]="{ rol: 'PROPIETARIO' }">Quiero publicar <i class="pi pi-arrow-right" aria-hidden="true"></i></a>
        }
      </div>
    </section>
  `,
  styles: `
    .hero { background: #f5f5ef; overflow: hidden; }
    .hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; align-items: center; gap: 5%; min-height: 580px; padding-block: 56px 64px; }
    .hero-texto { max-width: 640px; }
    .hero h1 { font-size: clamp(2.7rem, 5.2vw, 4.3rem); font-weight: 700; line-height: 1.08; letter-spacing: -0.05em; margin: 20px 0 18px; }
    .entradilla { max-width: 44ch; color: #66736b; line-height: 1.75; font-size: 1rem; }
    .buscador { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; margin-top: 28px; padding: 16px; background: #fff; border: 1px solid #e8eae2; border-radius: 16px; box-shadow: 0 14px 35px rgb(36 60 45 / 6%); }
    .campo-b { display: grid; gap: 5px; min-width: 0; }
    .campo-b label { font-size: 0.66rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #7d8a80; }
    .campo-b input, .campo-b .p-select, .campo-b .p-datepicker, .campo-b .p-inputnumber { width: 100%; }
    .boton-buscar { grid-column: 1 / -1; margin-top: 4px; }
    .confianza { display: flex; align-items: center; gap: 13px; margin-top: 24px; }
    .confianza-icono { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: #dce8d7; color: #2f6149; flex: none; }
    .confianza b, .confianza small { display: block; }
    .confianza b { font-size: 0.8125rem; color: #30483a; }
    .confianza small { font-size: 0.75rem; color: #66736b; margin-top: 2px; }
    .hero-arte { position: relative; padding: 10px 14px 18px 22px; }
    .hero-foto { position: relative; height: 430px; overflow: hidden; border-radius: 48% 48% 15px 15px; box-shadow: 0 25px 55px rgb(38 61 43 / 14%); }
    .hero-foto img { width: 100%; height: 100%; object-fit: cover; }
    .hero-foto::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, rgb(23 42 32 / 14%), transparent 45%); }
    .foto-etiqueta { position: absolute; z-index: 1; bottom: 20px; left: 22px; display: flex; align-items: center; gap: 8px; background: rgb(255 255 255 / 92%); border-radius: 30px; padding: 10px 14px; font-size: 0.6rem; letter-spacing: 0.12em; font-weight: 800; color: #45644e; }
    .punto { width: 6px; height: 6px; background: #83a87b; border-radius: 50%; }
    .nota-flotante { position: absolute; left: -10px; bottom: 56px; display: flex; gap: 11px; align-items: center; background: #fff; padding: 14px 17px; border-radius: 13px; box-shadow: 0 12px 30px rgb(28 60 41 / 12%); }
    .nota-icono { width: 36px; height: 36px; display: grid; place-items: center; background: #f0f4eb; color: #74986e; border-radius: 10px; }
    .nota-flotante b, .nota-flotante small { display: block; }
    .nota-flotante b { font-size: 0.8rem; color: #274a36; }
    .nota-flotante small { font-size: 0.72rem; color: #66736b; margin-top: 3px; }
    .sello { position: absolute; right: -6px; top: 34px; background: #dce8d7; color: #315440; border-radius: 50%; width: 96px; height: 96px; display: grid; place-content: center; text-align: center; font-size: 0.66rem; font-weight: 800; line-height: 1.4; letter-spacing: 0.1em; transform: rotate(9deg); box-shadow: 0 8px 20px rgb(48 69 45 / 8%); }
    .sello i { font-style: normal; color: #5d8456; }

    .secciones { display: grid; gap: 64px; padding-block: 72px; }
    .cabecera-seccion { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-bottom: 24px; }
    .cabecera-seccion h2, .como h2 { font-size: clamp(1.8rem, 3.4vw, 2.3rem); font-weight: 800; letter-spacing: -0.045em; margin: 12px 0 8px; }
    .cabecera-seccion p:not(.eyebrow) { color: #7d8980; font-size: 0.875rem; }
    .enlace-flecha { display: inline-flex; align-items: center; gap: 9px; color: #315d43; font-weight: 700; font-size: 0.8125rem; padding: 10px 0; }
    .enlace-flecha:hover { color: var(--dy-musgo); }
    .enlace-flecha i { font-size: 0.75rem; transition: transform 0.2s; }
    .enlace-flecha:hover i { transform: translateX(3px); }

    .distritos { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap: 18px; }
    .distrito { position: relative; display: block; border-radius: 15px; overflow: hidden; aspect-ratio: 4 / 3.1; background: #e8ebe4; }
    .distrito img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
    .distrito:hover img { transform: scale(1.05); }
    .distrito-info { position: absolute; inset: auto 0 0 0; padding: 42px 16px 14px; display: grid; color: #fff; background: linear-gradient(transparent, rgb(14 38 28 / 78%)); }
    .distrito-info strong { font-family: var(--dy-fuente-titulos); font-size: 1.05rem; font-weight: 800; }
    .distrito-info small { opacity: 0.9; font-size: 0.78rem; }

    .filtros-estilo { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; margin-bottom: 24px; }
    .etiqueta-estilo { font-size: 0.75rem; color: #7c887f; font-weight: 700; margin-right: 6px; }
    .pastilla { display: inline-flex; gap: 8px; align-items: center; background: #fff; border: 1px solid #e2e8df; border-radius: 30px; padding: 9px 16px; color: #607266; font-size: 0.78rem; font-weight: 600; transition: background 0.15s, color 0.15s, border-color 0.15s; }
    .pastilla:hover { background: #eaf0e6; color: #345940; border-color: #cfdccb; }

    .como { background: #fff; border: 1px solid #eeeee8; border-radius: 18px; padding: clamp(24px, 4vw, 46px); }
    .como ol { list-style: none; margin: 26px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 26px; }
    .como li { display: flex; gap: 14px; align-items: flex-start; }
    .paso { flex: none; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--dy-menta); color: var(--dy-primario); font-family: var(--dy-fuente-titulos); font-weight: 800; }
    .como strong { font-family: var(--dy-fuente-titulos); font-weight: 800; color: #274a36; }
    .como p { color: var(--dy-apagado); margin-top: 4px; font-size: 0.875rem; }

    .cta { background: #1b4133; color: #fff; padding: 60px 0; }
    .cta-interior { display: flex; align-items: center; justify-content: space-between; gap: 30px; flex-wrap: wrap; }
    .cta .eyebrow { color: #b3c9a9; }
    .cta .eyebrow::before { background: #a6c49a; }
    .cta h2 { color: #fff; font-size: clamp(1.9rem, 3.4vw, 2.4rem); font-weight: 800; letter-spacing: -0.045em; margin: 14px 0 12px; }
    .cta h2 em { color: #a6c49a; }
    .cta p:not(.eyebrow) { color: #c0cec4; max-width: 46ch; line-height: 1.7; font-size: 0.9rem; }
    .cta strong { color: #fff; }
    .boton-claro { display: inline-flex; align-items: center; gap: 10px; background: #fff; color: #244738; font-weight: 700; font-size: 0.8125rem; padding: 14px 22px; border-radius: 10px; transition: transform 0.2s, box-shadow 0.2s; }
    .boton-claro:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgb(0 0 0 / 18%); }

    @media (max-width: 960px) {
      .hero-grid { grid-template-columns: 1fr; gap: 36px; min-height: 0; padding-block: 44px 52px; }
      .hero-arte { max-width: 500px; width: 100%; margin: 0 auto; }
      .hero-foto { height: 350px; }
    }
    @media (max-width: 640px) {
      .buscador { grid-template-columns: 1fr; }
      .hero-foto { height: 300px; }
      .sello { right: 0; width: 84px; height: 84px; font-size: 0.6rem; }
      .nota-flotante { left: 0; }
      .secciones { gap: 48px; padding-block: 52px; }
    }
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
