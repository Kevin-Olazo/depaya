import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Estado vacío: ícono + título + mensaje + (opcional) un botón proyectado. */
@Component({
  selector: 'app-vacio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vacio" role="status">
      <span class="vacio-icono"><i class="pi" [class]="icono()" aria-hidden="true"></i></span>
      <strong>{{ titulo() }}</strong>
      @if (mensaje()) {
        <p>{{ mensaje() }}</p>
      }
      <div class="vacio-acciones"><ng-content /></div>
    </div>
  `,
  styles: `
    .vacio { display: grid; justify-items: center; gap: 8px; text-align: center; padding: 44px 20px; color: var(--dy-apagado); }
    .vacio-icono { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; background: var(--dy-menta); font-size: 1.6rem; color: var(--dy-salvia); }
    strong { color: #274a36; font-size: 1.05rem; font-family: var(--dy-fuente-titulos); font-weight: 800; }
    p { max-width: 46ch; }
    .vacio-acciones:empty { display: none; }
    .vacio-acciones { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
  `,
})
export class Vacio {
  readonly icono = input('pi-inbox');
  readonly titulo = input.required<string>();
  readonly mensaje = input<string>('');
}
