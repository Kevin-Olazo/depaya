import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Departamento } from '../core/models/api.models';

// Tarjeta del catálogo; si hay fechas buscadas, las lleva al detalle.
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
          <li><i class="pi pi-th-large" aria-hidden="true"></i> {{ depa().habitaciones }} hab.</li>
          <li><i class="pi pi-bookmark" aria-hidden="true"></i> {{ depa().banos }} baños</li>
          <li><i class="pi pi-users" aria-hidden="true"></i> {{ depa().capacidadPersonas }} huésp.</li>
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
        <div class="precio">
          <span><b>{{ depa().precioNoche | currency: 'PEN' : 'symbol' : '1.0-2' }}</b> <small>/ noche</small></span>
          <span class="flecha" aria-hidden="true"><i class="pi pi-arrow-right"></i></span>
        </div>
      </div>
    </a>
  `,
  styles: `
    .card { display: grid; grid-template-rows: auto 1fr; height: 100%; background: #fff; border: 1px solid #eeeee8; border-radius: 15px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
    .card:hover { transform: translateY(-4px); box-shadow: 0 14px 35px rgb(32 61 42 / 10%); }
    .foto { position: relative; height: 205px; background: #e8ebe4; overflow: hidden; }
    .foto img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
    .card:hover .foto img { transform: scale(1.04); }
    .categoria { position: absolute; bottom: 11px; left: 12px; background: #fffdf4; color: #5b705d; font-size: 0.66rem; font-weight: 700; padding: 6px 9px; border-radius: 5px; letter-spacing: 0.02em; }
    .cuerpo { padding: 16px 16px 15px; display: grid; gap: 9px; align-content: start; }
    .ubicacion { display: flex; gap: 5px; align-items: center; color: #8b958c; font-size: 0.72rem; }
    .titulo { font-size: 0.95rem; font-weight: 800; line-height: 1.4; color: #263d31; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.8em; }
    .datos { list-style: none; margin: 0; padding: 0; display: flex; gap: 12px; flex-wrap: wrap; color: #6c7a6f; font-size: 0.72rem; }
    .datos li { display: inline-flex; gap: 5px; align-items: center; }
    .extras { display: flex; gap: 6px; flex-wrap: wrap; min-height: 26px; }
    .extra { background: #f3f5f0; color: #4b5d52; font-size: 0.7rem; padding: 3px 9px; border-radius: 999px; display: inline-flex; gap: 5px; align-items: center; }
    .precio { border-top: 1px solid #eff0eb; margin-top: 2px; padding-top: 13px; display: flex; align-items: center; justify-content: space-between; }
    .precio b { font-family: var(--dy-fuente-titulos); color: #224332; font-size: 1.1rem; font-weight: 800; }
    .precio small { color: #8b958c; font-size: 0.7rem; }
    .flecha { width: 31px; height: 31px; border: 1px solid #e3e9df; border-radius: 50%; display: grid; place-items: center; color: #426a4a; font-size: 0.8rem; transition: background 0.2s, color 0.2s; }
    .card:hover .flecha { background: var(--dy-primario); color: #fff; border-color: var(--dy-primario); }
  `,
})
export class DepaCard {
  readonly depa = input.required<Departamento>();
  readonly fechas = input<Record<string, string> | null>(null);

  protected sinFoto(evento: Event): void {
    (evento.target as HTMLImageElement).src =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#e8ebe4"/><text x="200" y="158" font-family="Arial" font-size="18" fill="#8a958c" text-anchor="middle">Sin foto</text></svg>',
      );
  }
}
