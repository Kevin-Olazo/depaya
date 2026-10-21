import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TonoKpi = 'coral' | 'azul' | 'verde' | 'ambar' | 'violeta' | 'gris';

/** Tarjeta de indicador (dashboard, resúmenes). */
@Component({
  selector: 'app-kpi',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="kpi" [attr.data-tono]="tono()">
      <span class="kpi-icono" aria-hidden="true"><i class="pi" [class]="icono()"></i></span>
      <div class="kpi-texto">
        <span class="kpi-etiqueta">{{ etiqueta() }}</span>
        <strong class="kpi-valor">{{ valor() }}</strong>
        @if (detalle()) {
          <small class="kpi-detalle">{{ detalle() }}</small>
        }
      </div>
    </article>
  `,
  styles: `
    .kpi { display: flex; gap: 12px; align-items: center; background: #fff; border: 1px solid var(--dy-borde); border-radius: var(--dy-radio); padding: 16px; box-shadow: var(--dy-sombra); height: 100%; }
    .kpi-icono { flex: none; display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; font-size: 1.1rem; background: var(--fondo); color: var(--color); }
    .kpi-texto { display: grid; gap: 1px; min-width: 0; }
    .kpi-etiqueta { color: var(--dy-apagado); font-size: 0.8rem; font-weight: 600; }
    .kpi-valor { font-size: 1.35rem; line-height: 1.2; font-weight: 750; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .kpi-detalle { color: var(--dy-apagado); font-size: 0.78rem; }
    [data-tono='coral'] { --fondo: #fff1f3; --color: #c0134f; }
    [data-tono='azul'] { --fondo: #eff6ff; --color: #1d4ed8; }
    [data-tono='verde'] { --fondo: #f0fdf4; --color: #15803d; }
    [data-tono='ambar'] { --fondo: #fffbeb; --color: #b45309; }
    [data-tono='violeta'] { --fondo: #f5f3ff; --color: #6d28d9; }
    [data-tono='gris'] { --fondo: #f3f4f6; --color: #4b5563; }
  `,
})
export class Kpi {
  readonly etiqueta = input.required<string>();
  readonly valor = input.required<string | number>();
  readonly detalle = input<string>('');
  readonly icono = input('pi-chart-bar');
  readonly tono = input<TonoKpi>('coral');
}
