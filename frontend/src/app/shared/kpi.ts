import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TonoKpi = 'marca' | 'azul' | 'verde' | 'ambar' | 'violeta' | 'terracota' | 'gris';

// Tarjeta de indicador (dashboard y resúmenes).
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
    .kpi { display: flex; gap: 13px; align-items: center; background: #fff; border: 1px solid #e9ede6; border-radius: 14px; padding: 17px 16px; height: 100%; transition: box-shadow 0.2s, transform 0.2s; }
    .kpi:hover { box-shadow: 0 10px 28px rgb(32 61 42 / 8%); transform: translateY(-2px); }
    .kpi-icono { flex: none; display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; font-size: 1.1rem; background: var(--fondo); color: var(--color); }
    .kpi-texto { display: grid; gap: 1px; min-width: 0; }
    .kpi-etiqueta { color: var(--dy-apagado); font-size: 0.78rem; font-weight: 600; }
    .kpi-valor { font-family: var(--dy-fuente-titulos); font-size: 1.4rem; line-height: 1.2; font-weight: 800; letter-spacing: -0.03em; color: #274a36; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .kpi-detalle { color: var(--dy-apagado); font-size: 0.75rem; }
    [data-tono='marca'] { --fondo: #e7efe8; --color: #1d4a3b; }
    [data-tono='verde'] { --fondo: #e9f2e8; --color: #3a7d4f; }
    [data-tono='azul'] { --fondo: #e4eef3; --color: #3d6a82; }
    [data-tono='ambar'] { --fondo: #f7ecd3; --color: #94681d; }
    [data-tono='violeta'] { --fondo: #ece8f3; --color: #66578b; }
    [data-tono='terracota'] { --fondo: #f7e8e5; --color: #a8544c; }
    [data-tono='gris'] { --fondo: #eff2ed; --color: #55655b; }
  `,
})
export class Kpi {
  readonly etiqueta = input.required<string>();
  readonly valor = input.required<string | number>();
  readonly detalle = input<string>('');
  readonly icono = input('pi-chart-bar');
  readonly tono = input<TonoKpi>('marca');
}
