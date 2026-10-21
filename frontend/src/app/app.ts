import { Location } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { Avisos } from './core/services/avisos';
import { AuthService } from './core/services/auth.service';
import { Sesion } from './core/services/sesion';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, ConfirmDialog],
  template: `
    <p-toast position="top-right" [breakpoints]="{ '640px': { width: 'calc(100% - 24px)', right: '12px', left: '12px' } }" />
    <p-confirmdialog [style]="{ width: '30rem' }" [breakpoints]="{ '640px': '92vw' }" />
    <router-outlet />
  `,
})
export class App {
  private readonly sesion = inject(Sesion);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly avisos = inject(Avisos);
  private readonly ubicacion = inject(Location);

  constructor() {
    // El token dura 8 horas: si vence con la pestaña abierta, se avisa y se lleva al login.
    this.sesion.vencida$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => {
      this.avisos.advertencia('Tu sesión expiró', 'Inicia sesión de nuevo para continuar.');
      const actual = this.ubicacion.path(true) || this.router.url;
      const destino = actual.startsWith('/login') ? '/' : actual;
      void this.router.navigate(['/login'], { queryParams: { returnUrl: destino } });
    });
    // Si había una sesión guardada, se recargan los datos del perfil (por ejemplo, publicaciones bloqueadas).
    this.auth.refrescarPerfil();
  }
}
