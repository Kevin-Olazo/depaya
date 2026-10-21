import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ROLES } from '../core/models/etiquetas';
import { Sesion } from '../core/services/sesion';

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

// Panel con menú lateral (escritorio) o en pestañas deslizables (móvil); los enlaces vienen de route.data.
@Component({
  selector: 'app-panel-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor panel">
      <aside class="lateral">
        <div class="usuario-panel">
          <span class="avatar" aria-hidden="true">{{ sesion.iniciales() }}</span>
          <b>{{ sesion.nombre() }}</b>
          <small>{{ rol }}</small>
        </div>
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
    .panel { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 26px; padding-block: 40px 80px; align-items: start; }
    .lateral { position: sticky; top: calc(var(--dy-cabecera) + 18px); background: #fff; border: 1px solid #e9ede6; border-radius: 14px; padding: 15px; }
    .usuario-panel { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 14px 8px 20px; border-bottom: 1px solid #edf0e9; margin-bottom: 12px; }
    .avatar { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; background: #e8efe5; color: #4f7756; font-family: var(--dy-fuente-titulos); font-weight: 800; margin-bottom: 10px; }
    .usuario-panel b { font-size: 0.8125rem; color: #304a38; overflow-wrap: anywhere; }
    .usuario-panel small { font-size: 0.7rem; color: var(--dy-apagado); margin-top: 3px; }
    .titulo-panel { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.14em; color: #7d8a80; font-weight: 800; padding: 4px 10px 8px; }
    nav { display: grid; gap: 3px; }
    nav a { display: flex; gap: 12px; align-items: center; padding: 11px 12px; border-radius: 9px; font-size: 0.8125rem; font-weight: 600; color: #5d6b62; transition: background 0.15s, color 0.15s; }
    nav a:hover { background: #f3f7f1; color: #315c3d; }
    nav a.activo { background: #edf3e9; color: #315c3d; font-weight: 800; }
    .contenido { display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px; min-width: 0; align-content: start; }
    .contenido > router-outlet { display: none; }
    :host ::ng-deep .contenido > :not(router-outlet) { display: grid; gap: 22px; min-width: 0; align-content: start; }
    @media (max-width: 960px) {
      .panel { grid-template-columns: minmax(0, 1fr); gap: 16px; padding-top: 22px; }
      .lateral { position: static; padding: 6px; border-radius: 14px; }
      .usuario-panel, .titulo-panel { display: none; }
      nav { display: flex; overflow-x: auto; gap: 4px; scrollbar-width: thin; }
      nav a { white-space: nowrap; padding: 9px 14px; }
    }
  `,
})
export class PanelLayout {
  protected readonly datos = inject(ActivatedRoute).snapshot.data as DatosPanel;
  protected readonly sesion = inject(Sesion);
  protected readonly rol = this.sesion.rol() ? ROLES[this.sesion.rol()!].texto : '';
}
