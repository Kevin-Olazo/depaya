import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Departamento } from '../core/models/api.models';

/** Tarjeta del catálogo. Si hay fechas buscadas, las lleva al detalle para dejar el calendario ya elegido. */
@Component({
  selector: 'app-depa-card',
  imports: [RouterLink, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="card" [routerLink]="['/departamentos', depa().id]" [queryParams]="fechas()" [attr.aria-label]="'Ver ' + depa().titulo">
      <div class="foto">
        <img [src]="depa().imagenUrl" [alt]="'Foto de ' + depa().titulo" loading="lazy" (error)="sinFoto($event)" />
        <span class="categoria">{{ depa().categoria }}</span>
      </div>
      <div class="cuerpo">
        <div class="ubicacion"><i class="pi pi-map-marker" aria-hidden="true"></i> {{ depa().distrito }}</div>
        <h3 class="titulo">{{ depa().titulo }}</h3>
        <ul class="datos" aria-label="Características">
          <li><i class="pi pi-users" aria-hidden="true"></i> {{ depa().capacidadPersonas }} huésp.</li>
          <li><i class="pi pi-th-large" aria-hidden="true"></i> {{ depa().habitaciones }} hab.</li>
          <li><i class="pi pi-bookmark" aria-hidden="true"></i> {{ depa().banos }} baños</li>
        </ul>
        <div class="extras">
          @if (depa().tieneWifi) {
            <span class="extra" title="Wi‑Fi"><i class="pi pi-wifi" aria-hidden="true"></i> Wi‑Fi</span>
          }
          @if (depa().tienePiscina) {
            <span class="extra" title="Piscina"><i class="pi pi-sun" aria-hidden="true"></i> Piscina</span>
          }
          @if (depa().admiteMascotas) {
            <span class="extra" title="Admite mascotas"><i class="pi pi-heart" aria-hidden="true"></i> Mascotas</span>
          }
        </div>
        <div class="precio"><strong>{{ depa().precioNoche | currency: 'PEN' : 'symbol' : '1.0-2' }}</strong> <span>/ noche</span></div>
      </div>
    </a>
  `,
  styles: `
    .card { display: grid; grid-template-rows: auto 1fr; height: 100%; background: #fff; border: 1px solid var(--dy-borde); border-radius: 18px; overflow: hidden; box-shadow: var(--dy-sombra); transition: transform 0.18s, box-shadow 0.18s; }
    .card:hover { transform: translateY(-3px); box-shadow: var(--dy-sombra-fuerte); }
    .foto { position: relative; aspect-ratio: 4 / 3; background: #e5e7eb; overflow: hidden; }
    .foto img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s; }
    .card:hover .foto img { transform: scale(1.04); }
    .categoria { position: absolute; top: 12px; left: 12px; background: rgb(255 255 255 / 94%); color: var(--dy-tinta); font-size: 0.75rem; font-weight: 650; padding: 4px 10px; border-radius: 999px; }
    .cuerpo { padding: 14px 16px 16px; display: grid; gap: 8px; align-content: start; }
    .ubicacion { color: var(--dy-apagado); font-size: 0.82rem; display: flex; gap: 6px; align-items: center; }
    .titulo { font-size: 1.02rem; font-weight: 700; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.6em; }
    .datos { list-style: none; margin: 0; padding: 0; display: flex; gap: 14px; flex-wrap: wrap; color: var(--dy-tinta-suave); font-size: 0.85rem; }
    .datos li { display: flex; gap: 5px; align-items: center; }
    .extras { display: flex; gap: 6px; flex-wrap: wrap; min-height: 26px; }
    .extra { background: #f3f4f6; color: #374151; font-size: 0.75rem; padding: 3px 9px; border-radius: 999px; display: inline-flex; gap: 5px; align-items: center; }
    .precio { margin-top: 2px; color: var(--dy-apagado); font-size: 0.85rem; }
    .precio strong { color: var(--dy-tinta); font-size: 1.18rem; }
  `,
})
export class DepaCard {
  readonly depa = input.required<Departamento>();
  /** Query params (ingreso/salida) que se pasan al detalle. */
  readonly fechas = input<Record<string, string> | null>(null);

  protected sinFoto(evento: Event): void {
    (evento.target as HTMLImageElement).src =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#e5e7eb"/><text x="200" y="158" font-family="Arial" font-size="18" fill="#9ca3af" text-anchor="middle">Sin foto</text></svg>',
      );
  }
}
