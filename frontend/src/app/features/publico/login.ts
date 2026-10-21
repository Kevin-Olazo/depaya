import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { inicioPorRol } from '../../core/guards/roles.guard';
import { AuthService } from '../../core/services/auth.service';
import { Avisos } from '../../core/services/avisos';
import { Sesion } from '../../core/services/sesion';
import { destinoSeguro } from '../../core/utils/navegacion';
import { Campo } from '../../shared/campo';
import { aplicarErroresServidor } from '../../shared/formularios';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputText, Password, Message, Campo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth">
      <section class="promo" aria-hidden="true">
        <div class="promo-contenido">
          <p class="eyebrow">Bienvenido a DepaYa</p>
          <h1>Tu próximo hogar<br /><em>empieza aquí.</em></h1>
          <p class="promo-texto">Encuentra departamentos, administra tus propiedades y realiza reservas desde una sola plataforma.</p>
          <ul>
            <li><i class="pi pi-check-circle"></i> Reserva en minutos, sin llamadas ni intermediarios.</li>
            <li><i class="pi pi-check-circle"></i> Reembolso de hasta 48 h si cancelas a tiempo.</li>
            <li><i class="pi pi-check-circle"></i> Propietarios: recibes el 90 % de cada reserva pagada.</li>
          </ul>
          <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1000&q=85" alt="" />
        </div>
      </section>

      <section class="formulario-lado">
        <form class="tarjeta formulario" [formGroup]="form" (ngSubmit)="entrar()" novalidate>
          <div>
            <h2>Iniciar sesión</h2>
            <p class="apagado">Ingresa con tu correo y contraseña.</p>
          </div>

          @if (retorno(); as destino) {
            <p-message severity="info" icon="pi pi-info-circle">
              {{ destino.startsWith('/huesped/reservar') ? 'Inicia sesión para continuar con tu reserva: conservamos las fechas que elegiste.' : 'Inicia sesión para continuar.' }}
            </p-message>
          }
          @if (errorGeneral(); as texto) {
            <p-message severity="error" icon="pi pi-times-circle" role="alert">{{ texto }}</p-message>
          }

          <app-campo etiqueta="Correo electrónico" para="correo" [control]="form.controls.correo">
            <input pInputText id="correo" type="email" formControlName="correo" autocomplete="username" placeholder="tu@correo.com" />
          </app-campo>
          <app-campo etiqueta="Contraseña" para="password" [control]="form.controls.password">
            <p-password inputId="password" formControlName="password" [feedback]="false" [toggleMask]="true" autocomplete="current-password" />
          </app-campo>

          <p-button type="submit" label="Entrar" icon="pi pi-sign-in" [loading]="enviando()" styleClass="w-full" [fluid]="true" />

          <p class="registro">¿Aún no tienes cuenta? <a class="enlace" routerLink="/registro" [queryParams]="parametros()">Regístrate gratis</a></p>
        </form>

        <div class="tarjeta tarjeta-plana ejemplos">
          <strong>Cuentas de ejemplo</strong>
          <span class="apagado pequeno">Contraseña de todas: 123456</span>
          <div class="fila">
            <p-button label="Administrador" size="small" severity="secondary" [outlined]="true" (onClick)="usar('admin@depaya.com')" />
            <p-button label="Propietario" size="small" severity="secondary" [outlined]="true" (onClick)="usar('avargas@gmail.com')" />
            <p-button label="Inquilino" size="small" severity="secondary" [outlined]="true" (onClick)="usar('drojas@gmail.com')" />
          </div>
        </div>
      </section>
    </div>
  `,
  styles: `
    .auth { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); min-height: calc(100vh - var(--dy-cabecera)); }
    .promo { display: grid; align-items: center; padding: 56px clamp(24px, 6vw, 96px); background: #e9eee5; }
    .promo-contenido { max-width: 480px; display: grid; gap: 18px; }
    .promo h1 { font-size: clamp(2.2rem, 4vw, 3rem); font-weight: 700; letter-spacing: -0.05em; line-height: 1.1; }
    .promo-texto { color: #66736b; line-height: 1.75; max-width: 40ch; }
    .promo ul { list-style: none; margin: 4px 0 0; padding: 0; display: grid; gap: 10px; color: #3f5a49; font-size: 0.875rem; }
    .promo li { display: flex; gap: 10px; align-items: center; }
    .promo li i { color: var(--dy-musgo); }
    .promo img { width: 100%; height: 220px; object-fit: cover; border-radius: 16px; margin-top: 8px; }
    .formulario-lado { display: grid; align-content: center; justify-items: center; gap: 16px; padding: 40px 20px; background: #f7f7f1; }
    .formulario-lado > * { width: min(100%, 460px); }
    .formulario-lado .tarjeta { border-radius: 18px; padding: 34px; box-shadow: 0 15px 45px rgb(38 61 43 / 6%); }
    .tarjeta h2 { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.04em; }
    .registro { text-align: center; color: var(--dy-apagado); }
    .ejemplos { display: grid; gap: 8px; }
    @media (max-width: 880px) { .auth { grid-template-columns: 1fr; } .promo { display: none; } }
  `,
})
export class Login {
  /** Ruta a la que volver después de iniciar sesión (query param `returnUrl`). */
  readonly returnUrl = input<string | undefined>();

  private readonly auth = inject(AuthService);
  private readonly sesion = inject(Sesion);
  private readonly router = inject(Router);
  private readonly avisos = inject(Avisos);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  protected retorno(): string | null {
    const destino = destinoSeguro(this.returnUrl());
    return destino && destino !== '/' ? destino : null;
  }

  protected parametros(): Record<string, string> | null {
    const destino = this.retorno();
    return destino ? { returnUrl: destino } : null;
  }

  protected usar(correo: string): void {
    this.form.setValue({ correo, password: '123456' });
    this.errorGeneral.set(null);
  }

  protected entrar(): void {
    this.errorGeneral.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (r) => {
        this.enviando.set(false);
        this.avisos.exito(`¡Hola, ${r.usuario.nombre}!`, 'Iniciaste sesión correctamente.');
        void this.router.navigateByUrl(this.retorno() ?? inicioPorRol(this.sesion.rol()));
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        this.errorGeneral.set(aplicarErroresServidor(this.form, e));
      },
    });
  }
}
