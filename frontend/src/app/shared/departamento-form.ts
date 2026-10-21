import { ChangeDetectionStrategy, Component, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Departamento, DepartamentoGuardarDto, EstadoDepartamento, Usuario } from '../core/models/api.models';
import { OPCIONES_ESTADO_DEPARTAMENTO } from '../core/models/etiquetas';
import { ApiError } from '../core/services/api-error';
import { AuthService } from '../core/services/auth.service';
import { Avisos } from '../core/services/avisos';
import { DepartamentosService } from '../core/services/departamentos.service';
import { UsuariosService } from '../core/services/usuarios.service';
import { Campo } from './campo';
import { aplicarErroresServidor } from './formularios';

const DISTRITOS_LIMA = [
  'Barranco',
  'Chorrillos',
  'Jesús María',
  'La Molina',
  'Lince',
  'Magdalena del Mar',
  'Miraflores',
  'Pueblo Libre',
  'San Borja',
  'San Isidro',
  'San Miguel',
  'Santiago de Surco',
  'Surquillo',
];

/** Alta y edición de un departamento (propietario o admin). Muestra los errores de validación del backend bajo cada campo. */
@Component({
  selector: 'app-departamento-form',
  imports: [ReactiveFormsModule, ButtonModule, Dialog, InputNumber, InputText, Select, Textarea, ToggleSwitch, Campo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [(visible)]="visible"
      [header]="departamento() ? 'Editar departamento' : 'Publicar departamento'"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '52rem' }"
      [breakpoints]="{ '900px': '96vw' }"
      [closable]="!guardando()"
    >
      <form class="formulario" [formGroup]="form" (ngSubmit)="guardar()" novalidate id="form-departamento">
        @if (errorGeneral(); as texto) {
          <div class="aviso aviso-error" role="alert">
            <i class="pi pi-ban"></i>
            <div><strong>{{ bloqueado() ? 'Publicaciones bloqueadas' : 'Revisa el formulario' }}</strong><br />{{ texto }}</div>
          </div>
        }

        <div class="formulario-rejilla">
          @if (admin() && !departamento()) {
            <app-campo etiqueta="Propietario" para="d-propietario" [obligatorio]="true" [control]="form.controls.idPropietario" class="completo">
              <p-select inputId="d-propietario" ariaLabel="Propietario" formControlName="idPropietario" [options]="propietarios()" optionLabel="etiqueta" optionValue="id" placeholder="Elige un propietario" [filter]="true" appendTo="body" />
            </app-campo>
          }
          <app-campo etiqueta="Título" para="d-titulo" [obligatorio]="true" [control]="form.controls.titulo" class="completo">
            <input pInputText id="d-titulo" formControlName="titulo" maxlength="200" placeholder="Ej. Depa moderno con vista al parque" />
          </app-campo>
          <app-campo etiqueta="Descripción" para="d-descripcion" [obligatorio]="true" [control]="form.controls.descripcion" class="completo">
            <textarea pTextarea id="d-descripcion" formControlName="descripcion" rows="4" maxlength="2000" [autoResize]="true"></textarea>
          </app-campo>
          <app-campo etiqueta="Distrito" para="d-distrito" [obligatorio]="true" [control]="form.controls.distrito">
            <p-select inputId="d-distrito" ariaLabel="Distrito" formControlName="distrito" [options]="distritos()" [editable]="true" placeholder="Elige o escribe" appendTo="body" />
          </app-campo>
          <app-campo etiqueta="Categoría" para="d-categoria" [obligatorio]="true" [control]="form.controls.categoria">
            <p-select inputId="d-categoria" ariaLabel="Categoría" formControlName="categoria" [options]="categorias()" placeholder="Elige una categoría" appendTo="body" />
          </app-campo>
          <app-campo etiqueta="Dirección" para="d-direccion" [obligatorio]="true" [control]="form.controls.direccion" class="completo">
            <input pInputText id="d-direccion" formControlName="direccion" maxlength="250" placeholder="Av. Larco 123" />
          </app-campo>
          <app-campo etiqueta="Precio por noche (S/)" para="d-precio" [obligatorio]="true" [control]="form.controls.precioNoche">
            <p-inputnumber inputId="d-precio" formControlName="precioNoche" mode="decimal" prefix="S/ " [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" />
          </app-campo>
          <app-campo etiqueta="Estado" para="d-estado" [control]="form.controls.estado">
            <p-select inputId="d-estado" ariaLabel="Estado" formControlName="estado" [options]="estados" optionLabel="texto" optionValue="valor" appendTo="body" />
          </app-campo>
          <app-campo etiqueta="Capacidad (personas)" para="d-capacidad" [obligatorio]="true" [control]="form.controls.capacidadPersonas">
            <p-inputnumber inputId="d-capacidad" formControlName="capacidadPersonas" [min]="1" [showButtons]="true" />
          </app-campo>
          <div class="doble">
            <app-campo etiqueta="Habitaciones" para="d-hab" [obligatorio]="true" [control]="form.controls.habitaciones">
              <p-inputnumber inputId="d-hab" formControlName="habitaciones" [min]="1" [showButtons]="true" />
            </app-campo>
            <app-campo etiqueta="Baños" para="d-banos" [obligatorio]="true" [control]="form.controls.banos">
              <p-inputnumber inputId="d-banos" formControlName="banos" [min]="1" [showButtons]="true" />
            </app-campo>
          </div>
          <app-campo etiqueta="URL de la imagen" para="d-imagen" [obligatorio]="true" [control]="form.controls.imagenUrl" class="completo" ayuda="Pega la dirección de una foto (https://…).">
            <input pInputText id="d-imagen" formControlName="imagenUrl" maxlength="500" inputmode="url" placeholder="https://images.unsplash.com/…" />
          </app-campo>
          @if (vistaPrevia()) {
            <div class="completo vista-previa"><img [src]="vistaPrevia()" alt="Vista previa de la imagen" (error)="imagenRota.set(true)" (load)="imagenRota.set(false)" [hidden]="imagenRota()" />@if (imagenRota()) { <span class="apagado pequeno">No se pudo cargar la imagen con esa URL.</span> }</div>
          }
          <app-campo etiqueta="Latitud (opcional)" para="d-lat" [control]="form.controls.latitud">
            <p-inputnumber inputId="d-lat" formControlName="latitud" mode="decimal" [minFractionDigits]="0" [maxFractionDigits]="6" [useGrouping]="false" placeholder="-12.119" />
          </app-campo>
          <app-campo etiqueta="Longitud (opcional)" para="d-lon" [control]="form.controls.longitud">
            <p-inputnumber inputId="d-lon" formControlName="longitud" mode="decimal" [minFractionDigits]="0" [maxFractionDigits]="6" [useGrouping]="false" placeholder="-77.031" />
          </app-campo>
          <fieldset class="completo comodidades">
            <legend>Comodidades</legend>
            <div class="interruptor"><p-toggleswitch inputId="d-wifi" formControlName="tieneWifi" /><label for="d-wifi">Wi‑Fi</label></div>
            <div class="interruptor"><p-toggleswitch inputId="d-piscina" formControlName="tienePiscina" /><label for="d-piscina">Piscina</label></div>
            <div class="interruptor"><p-toggleswitch inputId="d-mascotas" formControlName="admiteMascotas" /><label for="d-mascotas">Admite mascotas</label></div>
          </fieldset>
        </div>
      </form>
      <ng-template #footer>
        <p-button label="Cancelar" severity="secondary" [text]="true" [disabled]="guardando()" (onClick)="visible.set(false)" />
        <p-button [label]="departamento() ? 'Guardar cambios' : 'Publicar'" icon="pi pi-check" [loading]="guardando()" (onClick)="guardar()" />
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .doble { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .vista-previa img { width: 100%; max-height: 220px; object-fit: cover; border-radius: 14px; border: 1px solid var(--dy-borde); }
    .comodidades { border: 0; padding: 0; margin: 0; display: flex; gap: 28px; flex-wrap: wrap; }
    .comodidades legend { font-weight: 600; font-size: 0.875rem; padding: 0; margin-bottom: 10px; }
    .interruptor { display: flex; align-items: center; gap: 10px; }
  `,
})
export class DepartamentoForm {
  readonly visible = model(false);
  /** null = alta; con valor = edición. */
  readonly departamento = input<Departamento | null>(null);
  /** El admin elige el propietario al crear. */
  readonly admin = input(false);
  readonly guardado = output<Departamento>();

  private readonly api = inject(DepartamentosService);
  private readonly usuarios = inject(UsuariosService);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(Avisos);

  protected readonly estados = OPCIONES_ESTADO_DEPARTAMENTO;
  protected readonly distritos = signal<string[]>(DISTRITOS_LIMA);
  protected readonly categorias = signal<string[]>(['Playa', 'Moderno', 'Vista al mar', 'Loft', 'Ejecutivo', 'Familiar']);
  protected readonly propietarios = signal<{ id: number; etiqueta: string }[]>([]);
  protected readonly guardando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly bloqueado = signal(false);
  protected readonly imagenRota = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    idPropietario: [null as number | null],
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: ['', [Validators.required, Validators.maxLength(2000)]],
    distrito: ['', [Validators.required, Validators.maxLength(100)]],
    direccion: ['', [Validators.required, Validators.maxLength(250)]],
    categoria: ['', [Validators.required]],
    latitud: [null as number | null, [Validators.min(-90), Validators.max(90)]],
    longitud: [null as number | null, [Validators.min(-180), Validators.max(180)]],
    precioNoche: [null as number | null, [Validators.required, Validators.min(0.01)]],
    capacidadPersonas: [2 as number | null, [Validators.required, Validators.min(1)]],
    habitaciones: [1 as number | null, [Validators.required, Validators.min(1)]],
    banos: [1 as number | null, [Validators.required, Validators.min(1)]],
    imagenUrl: ['', [Validators.required, Validators.maxLength(500), Validators.pattern(/^https?:\/\/\S+$/i)]],
    tienePiscina: [false],
    tieneWifi: [true],
    admiteMascotas: [false],
    estado: ['DISPONIBLE' as EstadoDepartamento],
  });

  private readonly imagen = toSignal(this.form.controls.imagenUrl.valueChanges, { initialValue: '' });
  protected vistaPrevia(): string {
    const url = this.imagen();
    return /^https?:\/\/\S+$/i.test(url) ? url : '';
  }

  constructor() {
    effect(() => {
      if (this.visible()) untracked(() => this.preparar());
    });
  }

  private preparar(): void {
    const d = this.departamento();
    this.errorGeneral.set(null);
    this.bloqueado.set(false);
    this.imagenRota.set(false);
    this.form.reset({
      idPropietario: null,
      titulo: d?.titulo ?? '',
      descripcion: d?.descripcion ?? '',
      distrito: d?.distrito ?? '',
      direccion: d?.direccion ?? '',
      categoria: d?.categoria ?? '',
      latitud: d?.latitud ?? null,
      longitud: d?.longitud ?? null,
      precioNoche: d?.precioNoche ?? null,
      capacidadPersonas: d?.capacidadPersonas ?? 2,
      habitaciones: d?.habitaciones ?? 1,
      banos: d?.banos ?? 1,
      imagenUrl: d?.imagenUrl ?? '',
      tienePiscina: d?.tienePiscina ?? false,
      tieneWifi: d?.tieneWifi ?? true,
      admiteMascotas: d?.admiteMascotas ?? false,
      estado: d?.estado ?? 'DISPONIBLE',
    });
    const requerido = this.admin() && !d;
    this.form.controls.idPropietario.setValidators(requerido ? [Validators.required] : []);
    this.form.controls.idPropietario.updateValueAndValidity({ emitEvent: false });

    this.api.categorias().subscribe({ next: (c) => this.categorias.set(c), error: () => undefined });
    this.api.distritos().subscribe({
      next: (lista) => this.distritos.set([...new Set([...DISTRITOS_LIMA, ...lista])].sort((a, b) => a.localeCompare(b, 'es'))),
      error: () => undefined,
    });
    if (requerido && this.propietarios().length === 0) {
      this.usuarios.listar({ rol: 'PROPIETARIO', activo: true }, { page: 0, size: 100, sort: 'nombre,asc' }).subscribe({
        next: (p) => this.propietarios.set(p.content.map((u: Usuario) => ({ id: u.id, etiqueta: `${u.nombre} ${u.apellido} · ${u.correo}` }))),
        error: () => undefined,
      });
    }
  }

  protected guardar(): void {
    this.errorGeneral.set(null);
    this.bloqueado.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorGeneral.set('Revisa los campos marcados en rojo.');
      return;
    }
    const v = this.form.getRawValue();
    const dto: DepartamentoGuardarDto = {
      idPropietario: this.admin() && !this.departamento() ? v.idPropietario : null,
      titulo: v.titulo.trim(),
      descripcion: v.descripcion.trim(),
      distrito: v.distrito.trim(),
      direccion: v.direccion.trim(),
      categoria: v.categoria,
      latitud: v.latitud,
      longitud: v.longitud,
      precioNoche: v.precioNoche as number,
      capacidadPersonas: v.capacidadPersonas as number,
      habitaciones: v.habitaciones as number,
      banos: v.banos as number,
      imagenUrl: v.imagenUrl.trim(),
      tienePiscina: v.tienePiscina,
      tieneWifi: v.tieneWifi,
      admiteMascotas: v.admiteMascotas,
      estado: v.estado,
    };
    const actual = this.departamento();
    this.guardando.set(true);
    (actual ? this.api.actualizar(actual.id, dto) : this.api.crear(dto)).subscribe({
      next: (guardado) => {
        this.guardando.set(false);
        this.visible.set(false);
        this.avisos.exito(actual ? 'Departamento actualizado' : 'Departamento publicado', guardado.titulo);
        this.guardado.emit(guardado);
      },
      error: (e: unknown) => {
        this.guardando.set(false);
        if (e instanceof ApiError && e.estado === 403) {
          // El administrador bloqueó las publicaciones de este propietario.
          this.bloqueado.set(true);
          this.errorGeneral.set(e.mensajeApi);
          this.auth.refrescarPerfil();
          return;
        }
        this.errorGeneral.set(aplicarErroresServidor(this.form, e) ?? 'Revisa los campos marcados en rojo.');
      },
    });
  }
}
