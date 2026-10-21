import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

export interface EnlacePanel {
  etiqueta: string;
  ruta: string;
  icono: string;
  exacto?: boolean;
}

export interface DatosPanel {
  titulo: string;
  enlaces: EnlacePanel[];
}

/** Panel con navegación lateral (escritorio) o en pestañas deslizables (móvil). Los enlaces vienen de `route.data`. */
@Component({
  selector: 'app-panel-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor panel">
      <aside class="lateral">
        <p class="titulo-panel">{{ datos.titulo }}</p>
        <nav [attr.aria-label]="datos.titulo">
          @for (e of datos.enlaces; track e.ruta) {
            <a [routerLink]="e.ruta" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: !!e.exacto }">
              <i class="pi" [class]="e.icono" aria-hidden="true"></i>
              <span>{{ e.etiqueta }}</span>
            </a>
          }
        </nav>
      </aside>
      <section class="contenido"><router-outlet /></section>
    </div>
  `,
  styles: `
    .panel { display: grid; grid-template-columns: 232px minmax(0, 1fr); gap: 28px; padding-block: 28px 72px; align-items: start; }
    .lateral { position: sticky; top: calc(var(--dy-cabecera) + 18px); background: #fff; border: 1px solid var(--dy-borde); border-radius: var(--dy-radio); padding: 14px; box-shadow: var(--dy-sombra); }
    .titulo-panel { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dy-apagado); font-weight: 700; padding: 4px 10px 10px; }
    nav { display: grid; gap: 3px; }
    nav a { display: flex; gap: 12px; align-items: center; padding: 10px 12px; border-radius: 12px; font-weight: 600; color: var(--dy-tinta-suave); }
    nav a:hover { background: #f3f4f6; color: var(--dy-tinta); }
    nav a.activo { background: #fff1f3; color: var(--dy-coral); }
    .contenido { display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px; min-width: 0; align-content: start; }
    .contenido > router-outlet { display: none; }
    :host ::ng-deep .contenido > :not(router-outlet) { display: grid; gap: 22px; min-width: 0; align-content: start; }
    @media (max-width: 960px) {
      .panel { grid-template-columns: minmax(0, 1fr); gap: 16px; padding-top: 18px; }
      .lateral { position: static; padding: 6px; border-radius: 14px; }
      .titulo-panel { display: none; }
      nav { display: flex; overflow-x: auto; gap: 4px; scrollbar-width: thin; }
      nav a { white-space: nowrap; padding: 9px 14px; }
    }
  `,
})
export class PanelLayout {
  protected readonly datos = inject(ActivatedRoute).snapshot.data as DatosPanel;
}
