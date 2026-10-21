import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Vacio } from '../../shared/vacio';

@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink, ButtonModule, Vacio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      <app-vacio icono="pi-compass" titulo="No encontramos esa página" mensaje="Puede que el enlace esté incompleto o que la página ya no exista.">
        <p-button label="Ir al inicio" routerLink="/" />
        <p-button label="Ver departamentos" severity="secondary" [outlined]="true" routerLink="/departamentos" />
      </app-vacio>
    </div>
  `,
})
export class NoEncontrado {}
