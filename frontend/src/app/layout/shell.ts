import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Encabezado } from './encabezado';
import { Pie } from './pie';

/** Estructura común: cabecera fija, contenido y pie. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Encabezado, Pie],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="saltar-contenido" href="#contenido">Saltar al contenido</a>
    <app-encabezado />
    <main id="contenido" tabindex="-1"><router-outlet /></main>
    <app-pie />
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; outline: none; }
  `,
})
export class Shell {}
