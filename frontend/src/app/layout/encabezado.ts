import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ROLES } from '../core/models/etiquetas';
import { AuthService } from '../core/services/auth.service';
import { Avisos } from '../core/services/avisos';
import { Sesion } from '../core/services/sesion';

interface Enlace {
  etiqueta: string;
  ruta: string;
  icono: string;
}

@Component({
  selector: 'app-encabezado',
  imports: [RouterLink, RouterLinkActive, ButtonModule, Drawer, Menu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="cabecera">
      <div class="contenedor barra">
        <a routerLink="/" class="marca" aria-label="DepaYa, ir al inicio">
          <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
            <rect width="64" height="64" rx="16" fill="#e31c5f" />
            <path d="M32 14 12 31h6v17h10V38h8v10h10V31h6L32 14Z" fill="#fff" />
          </svg>
          <span>DepaYa</span>
        </a>

        <nav class="enlaces" aria-label="Navegación principal">
          @for (e of enlaces(); track e.ruta) {
            <a [routerLink]="e.ruta" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: e.ruta === '/' }">{{ e.etiqueta }}</a>
          }
        </nav>

        <div class="acciones">
          @if (sesion.activa()) {
            <button type="button" class="usuario" (click)="menu.toggle($event)" aria-haspopup="true" [attr.aria-label]="'Menú de ' + sesion.nombre()">
              <span class="avatar" aria-hidden="true">{{ sesion.iniciales() }}</span>
              <span class="usuario-texto">
                <strong>{{ sesion.nombre() }}</strong>
                <small>{{ rolTexto() }}</small>
              </span>
              <i class="pi pi-angle-down" aria-hidden="true"></i>
            </button>
            <p-menu #menu [model]="itemsMenu()" [popup]="true" appendTo="body" />
          } @else {
            <p-button label="Iniciar sesión" [text]="true" severity="secondary" routerLink="/login" class="oculto-movil" />
            <p-button label="Registrarse" routerLink="/registro" />
          }
          <button type="button" class="hamburguesa" (click)="movil.set(true)" aria-label="Abrir menú de navegación">
            <i class="pi pi-bars" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </header>

    <p-drawer [(visible)]="movil" position="right" header="Menú" [style]="{ width: 'min(86vw, 22rem)' }">
      <nav class="drawer-nav" aria-label="Navegación móvil">
        @if (sesion.activa()) {
          <div class="drawer-usuario">
            <span class="avatar" aria-hidden="true">{{ sesion.iniciales() }}</span>
            <div>
              <strong>{{ sesion.nombre() }}</strong>
              <small>{{ sesion.correo() }}</small>
            </div>
          </div>
        }
        @for (e of enlaces(); track e.ruta) {
          <a [routerLink]="e.ruta" (click)="movil.set(false)"><i class="pi" [class]="e.icono" aria-hidden="true"></i> {{ e.etiqueta }}</a>
        }
        @if (sesion.activa()) {
          <a routerLink="/cuenta" (click)="movil.set(false)"><i class="pi pi-user" aria-hidden="true"></i> Mi cuenta</a>
          <button type="button" (click)="cerrarSesion()"><i class="pi pi-sign-out" aria-hidden="true"></i> Cerrar sesión</button>
        } @else {
          <a routerLink="/login" (click)="movil.set(false)"><i class="pi pi-sign-in" aria-hidden="true"></i> Iniciar sesión</a>
          <a routerLink="/registro" (click)="movil.set(false)"><i class="pi pi-user-plus" aria-hidden="true"></i> Registrarse</a>
        }
      </nav>
    </p-drawer>
  `,
  styles: `
    .cabecera { position: sticky; top: 0; z-index: 100; background: rgb(255 255 255 / 92%); backdrop-filter: saturate(160%) blur(10px); border-bottom: 1px solid var(--dy-borde); }
    .barra { height: var(--dy-cabecera); display: flex; align-items: center; gap: 24px; }
    .marca { display: flex; align-items: center; gap: 10px; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; color: var(--dy-coral); }
    .enlaces { display: flex; gap: 4px; margin-left: 8px; flex: 1; }
    .enlaces a { padding: 8px 14px; border-radius: 999px; font-weight: 600; color: var(--dy-tinta-suave); transition: background 0.15s, color 0.15s; }
    .enlaces a:hover { background: #f3f4f6; color: var(--dy-tinta); }
    .enlaces a.activo { background: #fff1f3; color: var(--dy-coral); }
    .acciones { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .usuario { display: flex; align-items: center; gap: 10px; border: 1px solid var(--dy-borde); background: #fff; padding: 5px 12px 5px 6px; border-radius: 999px; cursor: pointer; font: inherit; color: inherit; }
    .usuario:hover { box-shadow: var(--dy-sombra); }
    .usuario-texto { display: grid; text-align: left; line-height: 1.15; max-width: 170px; }
    .usuario-texto strong { font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .usuario-texto small { color: var(--dy-apagado); font-size: 0.72rem; }
    .avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--dy-coral); color: #fff; font-weight: 700; font-size: 0.8rem; flex: none; }
    .hamburguesa { display: none; width: 42px; height: 42px; border-radius: 12px; border: 1px solid var(--dy-borde); background: #fff; cursor: pointer; font-size: 1.1rem; }
    .drawer-nav { display: grid; gap: 4px; }
    .drawer-nav a, .drawer-nav button { display: flex; gap: 12px; align-items: center; padding: 12px 10px; border-radius: 12px; font: inherit; font-weight: 600; background: none; border: 0; text-align: left; cursor: pointer; color: var(--dy-tinta); }
    .drawer-nav a:hover, .drawer-nav button:hover { background: #f3f4f6; }
    .drawer-usuario { display: flex; gap: 12px; align-items: center; padding: 6px 10px 16px; border-bottom: 1px solid var(--dy-borde); margin-bottom: 8px; }
    .drawer-usuario div { display: grid; min-width: 0; }
    .drawer-usuario small { color: var(--dy-apagado); overflow: hidden; text-overflow: ellipsis; }
    @media (max-width: 880px) {
      .enlaces, .usuario-texto, .usuario > .pi, .oculto-movil { display: none; }
      .usuario { padding: 3px; }
      .hamburguesa { display: grid; place-items: center; }
    }
  `,
})
export class Encabezado {
  protected readonly sesion = inject(Sesion);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly avisos = inject(Avisos);

  protected readonly movil = signal(false);
  protected readonly rolTexto = computed(() => (this.sesion.rol() ? ROLES[this.sesion.rol()!].texto : ''));

  protected readonly enlaces = computed<Enlace[]>(() => {
    const lista: Enlace[] = [{ etiqueta: 'Departamentos', ruta: '/departamentos', icono: 'pi-search' }];
    if (this.sesion.esHuesped()) {
      lista.push(
        { etiqueta: 'Mis reservas', ruta: '/huesped/reservas', icono: 'pi-calendar' },
        { etiqueta: 'Mis pagos', ruta: '/huesped/pagos', icono: 'pi-credit-card' },
      );
    }
    if (this.sesion.esPropietario()) {
      lista.push({ etiqueta: 'Panel propietario', ruta: '/propietario', icono: 'pi-building' });
    }
    if (this.sesion.esAdmin()) {
      lista.push({ etiqueta: 'Administración', ruta: '/admin', icono: 'pi-shield' });
    }
    return lista;
  });

  protected readonly itemsMenu = computed<MenuItem[]>(() => {
    const items: MenuItem[] = [
      { label: this.sesion.correo(), disabled: true, styleClass: 'menu-correo' },
      { separator: true },
      ...this.enlaces().map((e) => ({ label: e.etiqueta, icon: `pi ${e.icono}`, routerLink: e.ruta })),
      { label: 'Mi cuenta', icon: 'pi pi-user', routerLink: '/cuenta' },
      { separator: true },
      { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.cerrarSesion() },
    ];
    return items;
  });

  protected cerrarSesion(): void {
    this.movil.set(false);
    this.auth.cerrarSesion();
    this.avisos.info('Sesión cerrada', 'Hasta pronto.');
    void this.router.navigateByUrl('/');
  }
}
