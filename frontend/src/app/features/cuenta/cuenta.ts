import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { Select } from 'primeng/select';
import { TipoDocumento } from '../../core/models/api.models';
import { TIPOS_DOCUMENTO } from '../../core/models/etiquetas';
import { Observable, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { Avisos } from '../../core/services/avisos';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { Sesion } from '../../core/services/sesion';
import { Campo } from '../../shared/campo';
import { EstadoTag } from '../../shared/estado-tag';
import { aplicarErroresServidor } from '../../shared/formularios';

@Component({
  selector: 'app-cuenta',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ButtonModule, InputText, Message, Password, Select, Campo, EstadoTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      <header class="tarjeta perfil">
        <span class="avatar" aria-hidden="true">{{ sesion.iniciales() }}</span>
        <div>
          <h1>{{ sesion.nombre() }}</h1>
          <p class="apagado">{{ sesion.correo() }}</p>
          <div class="fila">
            @if (sesion.rol(); as rol) { <app-estado-tag tipo="rol" [valor]="rol" /> }
            @if (sesion.perfil(); as p) { <span class="apagado pequeno">Miembro desde {{ p.fechaRegistro | date: "d 'de' MMMM 'de' y" }}</span> }
          </div>
        </div>
      </header>

      @if (sesion.esPropietario() && sesion.perfil(); as p) {
        <section class="tarjeta" aria-labelledby="t-pub">
          <div class="fila-separada">
            <div>
              <h2 id="t-pub">Estado de tus publicaciones</h2>
              <p class="apagado">
                @if (p.publicacionesHabilitadas) { Puedes publicar departamentos nuevos. } @else { El administrador bloqueó tus publicaciones: no puedes crear departamentos nuevos. }
              </p>
            </div>
            <div class="fila">
              <span class="insignia" [class.mal]="!p.publicacionesHabilitadas">{{ p.publicacionesHabilitadas ? 'Habilitadas' : 'Bloqueadas' }}</span>
              <p-button label="Mis departamentos" severity="secondary" [outlined]="true" routerLink="/propietario/departamentos" />
            </div>
          </div>
        </section>
      }

      <section class="tarjeta" aria-labelledby="t-datos">
        <h2 id="t-datos">Mis datos</h2>
        <form class="formulario" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
          @if (errorGeneral(); as texto) {
            <p-message severity="error" icon="pi pi-times-circle" role="alert">{{ texto }}</p-message>
          }
          <div class="formulario-rejilla">
            <app-campo etiqueta="Nombre" para="c-nombre" [obligatorio]="true" [control]="form.controls.nombre">
              <input pInputText id="c-nombre" formControlName="nombre" maxlength="100" autocomplete="given-name" />
            </app-campo>
            <app-campo etiqueta="Apellido" para="c-apellido" [obligatorio]="true" [control]="form.controls.apellido">
              <input pInputText id="c-apellido" formControlName="apellido" maxlength="100" autocomplete="family-name" />
            </app-campo>
            <app-campo etiqueta="Tipo de documento" para="c-tipo" [obligatorio]="true" [control]="form.controls.tipoDocumento">
              <p-select inputId="c-tipo" ariaLabel="Tipo de documento" formControlName="tipoDocumento" [options]="tiposDocumento" optionLabel="texto" optionValue="valor" />
            </app-campo>
            <app-campo etiqueta="Número de documento" para="c-doc" [obligatorio]="true" [control]="form.controls.numeroDocumento">
              <input pInputText id="c-doc" formControlName="numeroDocumento" maxlength="20" />
            </app-campo>
            <app-campo etiqueta="Correo" para="c-correo" [obligatorio]="true" [control]="form.controls.correo">
              <input pInputText id="c-correo" type="email" formControlName="correo" maxlength="150" autocomplete="email" />
            </app-campo>
            <app-campo etiqueta="Teléfono" para="c-telefono" [obligatorio]="true" [control]="form.controls.telefono">
              <input pInputText id="c-telefono" type="tel" formControlName="telefono" maxlength="15" autocomplete="tel" />
            </app-campo>
            <app-campo etiqueta="Nueva contraseña (opcional)" para="c-password" [control]="form.controls.password" ayuda="Déjala vacía para conservar la actual." class="completo">
              <p-password inputId="c-password" formControlName="password" [feedback]="false" [toggleMask]="true" autocomplete="new-password" />
            </app-campo>
          </div>
          <div class="fila">
            <p-button type="submit" label="Guardar cambios" icon="pi pi-check" [loading]="guardando()" [disabled]="!form.dirty" />
            @if (form.dirty) { <p-button label="Descartar" severity="secondary" [text]="true" (onClick)="cargarFormulario()" /> }
          </div>
        </form>
      </section>

      @if (!sesion.esAdmin()) {
        <section class="tarjeta peligro" aria-labelledby="t-desactivar">
          <h2 id="t-desactivar">Desactivar mi cuenta</h2>
          <p>
            Tu cuenta se desactivará y no podrás iniciar sesión.
            @if (sesion.esPropietario()) { Tus departamentos se pausarán (pasan a «Inactivo») y dejarás de poder publicar. }
            Solo un administrador puede reactivarla.
          </p>
          <p-button label="Desactivar mi cuenta" icon="pi pi-user-minus" severity="danger" [outlined]="true" [loading]="desactivando()" (onClick)="confirmarDesactivar()" />
        </section>
      }
    </div>
  `,
  styles: `
    .contenedor { max-width: 860px; }
    .perfil { display: flex; gap: 18px; align-items: center; }
    .perfil h1 { font-size: 1.5rem; }
    .avatar { display: grid; place-items: center; width: 68px; height: 68px; border-radius: 50%; background: var(--dy-primario); color: #fff; font-weight: 800; font-size: 1.4rem; flex: none; }
    .insignia { background: #e9f2e8; color: #2f6149; font-weight: 700; padding: 4px 12px; border-radius: 999px; font-size: 0.82rem; }
    .insignia.mal { background: #fbeeec; color: #8f3a33; }
    .tarjeta h2 { margin-bottom: 12px; }
    .peligro { border-color: #f0cdc9; background: #fdf8f7; display: grid; gap: 12px; justify-items: start; }
    .peligro h2 { color: #8f3a33; margin-bottom: 0; }
  `,
})
export class Cuenta {
  protected readonly sesion = inject(Sesion);
  private readonly auth = inject(AuthService);
  private readonly deptos = inject(DepartamentosService);
  private readonly avisos = inject(Avisos);
  private readonly confirmar = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly destruir = inject(DestroyRef);

  protected readonly tiposDocumento = TIPOS_DOCUMENTO;
  protected readonly guardando = signal(false);
  protected readonly desactivando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellido: ['', [Validators.required, Validators.maxLength(100)]],
    tipoDocumento: ['DNI' as TipoDocumento, [Validators.required]],
    numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    telefono: ['', [Validators.required, Validators.maxLength(15)]],
    password: ['', [Validators.minLength(6), Validators.maxLength(72)]],
  });

  constructor() {
    this.auth.me().pipe(takeUntilDestroyed(this.destruir)).subscribe({ error: () => undefined });
    // Llena el formulario cuando llega el perfil (y no pisa lo que el usuario ya esté editando).
    effect(() => {
      const perfil = this.sesion.perfil();
      if (perfil) untracked(() => !this.form.dirty && this.cargarFormulario());
    });
  }

  protected cargarFormulario(): void {
    const p = this.sesion.perfil();
    if (!p) return;
    this.form.reset({
      nombre: p.nombre,
      apellido: p.apellido,
      tipoDocumento: p.tipoDocumento,
      numeroDocumento: p.numeroDocumento,
      correo: p.correo,
      telefono: p.telefono,
      password: '',
    });
    this.errorGeneral.set(null);
  }

  protected guardar(): void {
    const id = this.sesion.id();
    this.errorGeneral.set(null);
    if (id === null) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.auth.actualizarPerfil(id, { ...v, password: v.password || null, rol: null }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cargarFormulario();
        this.avisos.exito('Datos actualizados', 'Tus cambios se guardaron.');
      },
      error: (e: unknown) => {
        this.guardando.set(false);
        this.errorGeneral.set(aplicarErroresServidor(this.form, e));
      },
    });
  }

  protected confirmarDesactivar(): void {
    this.confirmar.confirm({
      header: 'Desactivar mi cuenta',
      message: 'Se cerrará tu sesión y no podrás volver a entrar hasta que un administrador reactive tu cuenta. ¿Seguro que quieres continuar?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar mi cuenta',
      rejectLabel: 'No, mantenerla',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () => {
        const id = this.sesion.id();
        this.desactivando.set(true);
        // Un propietario primero pausa sus publicaciones, para que nadie reserve un depa de una cuenta desactivada.
        const pausar$: Observable<unknown> =
          this.sesion.esPropietario() && id !== null ? this.deptos.activacion(id, false) : of(null);
        pausar$.pipe(switchMap(() => this.auth.desactivarMiCuenta())).subscribe({
          next: () => {
            this.desactivando.set(false);
            this.auth.cerrarSesion();
            this.avisos.info('Cuenta desactivada', 'Para volver a usar DepaYa, pide a un administrador que la reactive.');
            void this.router.navigateByUrl('/');
          },
          error: () => this.desactivando.set(false),
        });
      },
    });
  }
}
