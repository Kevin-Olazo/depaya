import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { inicioPorRol } from '../../core/guards/roles.guard';
import { Rol, TipoDocumento } from '../../core/models/api.models';
import { TIPOS_DOCUMENTO } from '../../core/models/etiquetas';
import { AuthService } from '../../core/services/auth.service';
import { Avisos } from '../../core/services/avisos';
import { Sesion } from '../../core/services/sesion';
import { destinoSeguro } from '../../core/utils/navegacion';
import { Campo } from '../../shared/campo';
import { aplicarErroresServidor } from '../../shared/formularios';

function coinciden(grupo: AbstractControl): ValidationErrors | null {
  const clave = grupo.get('password')?.value;
  const repetida = grupo.get('repetir');
  if (repetida && repetida.value && clave !== repetida.value) {
    repetida.setErrors({ ...(repetida.errors ?? {}), mensaje: 'Las contraseñas no coinciden.' });
  } else if (repetida?.errors?.['mensaje']) {
    const { mensaje: _quitar, ...resto } = repetida.errors;
    repetida.setErrors(Object.keys(resto).length ? resto : null);
  }
  return null;
}

function validarDocumento(grupo: AbstractControl): ValidationErrors | null {
  const tipo = grupo.get('tipoDocumento')?.value as TipoDocumento;
  const numero = grupo.get('numeroDocumento');
  if (!numero || !numero.value) return null;
  const valor = String(numero.value).trim();
  const ok = tipo === 'DNI' ? /^\d{8}$/.test(valor) : /^[A-Za-z0-9]{6,20}$/.test(valor);
  const previo = numero.errors ?? {};
  if (!ok) {
    numero.setErrors({ ...previo, mensaje: tipo === 'DNI' ? 'El DNI debe tener 8 dígitos.' : 'Usa entre 6 y 20 letras o números.' });
  } else if (previo['mensaje']) {
    const { mensaje: _quitar, ...resto } = previo;
    numero.setErrors(Object.keys(resto).length ? resto : null);
  }
  return null;
}

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputText, Password, Select, SelectButton, Message, Campo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      <form class="tarjeta formulario caja" [formGroup]="form" (ngSubmit)="registrar()" novalidate>
        <div>
          <p class="eyebrow">Únete a DepaYa</p>
          <h1>Crea tu <em>cuenta</em></h1>
          <p class="apagado">Es gratis y toma menos de un minuto. Entrarás directo al terminar.</p>
        </div>

        @if (errorGeneral(); as texto) {
          <p-message severity="error" icon="pi pi-times-circle" role="alert">{{ texto }}</p-message>
        }

        <div class="campo">
          <span class="etiqueta" id="rol-etiqueta">Quiero usar DepaYa como</span>
          <p-select-button [options]="roles" formControlName="rol" optionLabel="texto" optionValue="valor" [allowEmpty]="false" ariaLabelledBy="rol-etiqueta" />
          <span class="ayuda">{{ form.controls.rol.value === 'PROPIETARIO' ? 'Publica tus departamentos y recibe el 90 % de cada reserva pagada. También podrás reservar.' : 'Busca, reserva y paga departamentos.' }}</span>
        </div>

        <div class="formulario-rejilla">
          <app-campo etiqueta="Nombre" para="nombre" [obligatorio]="true" [control]="form.controls.nombre">
            <input pInputText id="nombre" formControlName="nombre" autocomplete="given-name" maxlength="100" />
          </app-campo>
          <app-campo etiqueta="Apellido" para="apellido" [obligatorio]="true" [control]="form.controls.apellido">
            <input pInputText id="apellido" formControlName="apellido" autocomplete="family-name" maxlength="100" />
          </app-campo>
          <app-campo etiqueta="Tipo de documento" para="tipoDocumento" [obligatorio]="true" [control]="form.controls.tipoDocumento">
            <p-select inputId="tipoDocumento" ariaLabel="Tipo de documento" formControlName="tipoDocumento" [options]="tiposDocumento" optionLabel="texto" optionValue="valor" />
          </app-campo>
          <app-campo etiqueta="Número de documento" para="numeroDocumento" [obligatorio]="true" [control]="form.controls.numeroDocumento">
            <input pInputText id="numeroDocumento" formControlName="numeroDocumento" inputmode="numeric" maxlength="20" />
          </app-campo>
          <app-campo etiqueta="Correo electrónico" para="correo" [obligatorio]="true" [control]="form.controls.correo" class="completo">
            <input pInputText id="correo" type="email" formControlName="correo" autocomplete="email" maxlength="150" placeholder="tu@correo.com" />
          </app-campo>
          <app-campo etiqueta="Teléfono" para="telefono" [obligatorio]="true" [control]="form.controls.telefono" class="completo">
            <input pInputText id="telefono" type="tel" formControlName="telefono" autocomplete="tel" maxlength="15" placeholder="987654321" />
          </app-campo>
          <app-campo etiqueta="Contraseña" para="password" [obligatorio]="true" [control]="form.controls.password" ayuda="De 6 a 72 caracteres.">
            <p-password inputId="password" formControlName="password" [feedback]="false" [toggleMask]="true" autocomplete="new-password" />
          </app-campo>
          <app-campo etiqueta="Repite la contraseña" para="repetir" [obligatorio]="true" [control]="form.controls.repetir">
            <p-password inputId="repetir" formControlName="repetir" [feedback]="false" [toggleMask]="true" autocomplete="new-password" />
          </app-campo>
        </div>

        <p-button type="submit" label="Crear cuenta y entrar" icon="pi pi-user-plus" [loading]="enviando()" [fluid]="true" />
        <p class="pie-form">¿Ya tienes cuenta? <a class="enlace" routerLink="/login" [queryParams]="parametros()">Inicia sesión</a></p>
      </form>
    </div>
  `,
  styles: `
    .caja { width: min(100%, 700px); margin-inline: auto; padding: clamp(22px, 4vw, 40px); border-radius: 18px; box-shadow: 0 15px 45px rgb(38 61 43 / 6%); }
    h1 { font-size: 1.9rem; font-weight: 800; letter-spacing: -0.045em; margin-top: 12px; }
    .pie-form { text-align: center; color: var(--dy-apagado); }
  `,
})
export class Registro {
  readonly returnUrl = input<string | undefined>();
  /** `?rol=PROPIETARIO` abre el formulario como propietario. */
  readonly rol = input<string | undefined>();

  private readonly auth = inject(AuthService);
  private readonly sesion = inject(Sesion);
  private readonly router = inject(Router);
  private readonly avisos = inject(Avisos);

  protected readonly roles: { texto: string; valor: Rol }[] = [
    { texto: 'Inquilino', valor: 'INQUILINO' },
    { texto: 'Propietario', valor: 'PROPIETARIO' },
  ];
  protected readonly tiposDocumento = TIPOS_DOCUMENTO;

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      rol: ['INQUILINO' as Rol],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.maxLength(100)]],
      tipoDocumento: ['DNI' as TipoDocumento, [Validators.required]],
      numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      telefono: ['', [Validators.required, Validators.maxLength(15), Validators.pattern(/^[0-9+ ]{7,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(72)]],
      repetir: ['', [Validators.required]],
    },
    { validators: [coinciden, validarDocumento] },
  );
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  constructor() {
    queueMicrotask(() => {
      if (this.rol() === 'PROPIETARIO') this.form.controls.rol.setValue('PROPIETARIO');
    });
  }

  protected parametros(): Record<string, string> | null {
    const destino = destinoSeguro(this.returnUrl());
    return destino ? { returnUrl: destino } : null;
  }

  protected registrar(): void {
    this.errorGeneral.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { repetir: _repetir, ...datos } = this.form.getRawValue();
    this.enviando.set(true);
    this.auth.registro({ ...datos, nombre: datos.nombre.trim(), apellido: datos.apellido.trim() }).subscribe({
      next: (r) => {
        this.enviando.set(false);
        this.avisos.exito(`¡Bienvenido a DepaYa, ${r.usuario.nombre}!`, 'Tu cuenta fue creada y ya iniciaste sesión.');
        void this.router.navigateByUrl(destinoSeguro(this.returnUrl()) ?? inicioPorRol(this.sesion.rol()));
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        this.errorGeneral.set(aplicarErroresServidor(this.form, e));
      },
    });
  }
}
