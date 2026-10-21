import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';
import { Rol, TipoDocumento, Usuario } from '../../core/models/api.models';
import { OPCIONES_ROL, TIPOS_DOCUMENTO } from '../../core/models/etiquetas';
import { ListaPaginada } from '../../core/lista-paginada';
import { Avisos } from '../../core/services/avisos';
import { Sesion } from '../../core/services/sesion';
import { UsuariosService } from '../../core/services/usuarios.service';
import { BotonCsv } from '../../shared/boton-csv';
import { Campo } from '../../shared/campo';
import { EstadoTag } from '../../shared/estado-tag';
import { aplicarErroresServidor } from '../../shared/formularios';
import { Vacio } from '../../shared/vacio';

@Component({
  selector: 'app-usuarios',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    Dialog,
    IconField,
    InputIcon,
    InputText,
    Message,
    Password,
    Select,
    TableModule,
    ToggleSwitch,
    Tooltip,
    BotonCsv,
    Campo,
    EstadoTag,
    Vacio,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="encabezado-pagina">
      <div>
        <h1>Usuarios</h1>
        <p>Crea, edita y administra cuentas. Desactiva una cuenta para impedir el acceso o bloquea solo las publicaciones de un propietario.</p>
      </div>
      <div class="fila">
        <app-boton-csv recurso="usuarios" [filtro]="filtroApi" />
        <p-button label="Nuevo usuario" icon="pi pi-user-plus" (onClick)="nuevo()" />
      </div>
    </header>

    <form class="tarjeta barra-filtros" [formGroup]="filtros" (ngSubmit)="$event.preventDefault()" aria-label="Filtros de usuarios">
      <div class="campo">
        <label for="u-q">Buscar</label>
        <p-iconfield>
          <p-inputicon class="pi pi-search" />
          <input pInputText id="u-q" formControlName="q" placeholder="Nombre, correo o documento" autocomplete="off" />
        </p-iconfield>
      </div>
      <div class="campo">
        <label for="u-rol">Rol</label>
        <p-select inputId="u-rol" ariaLabel="Rol" formControlName="rol" [options]="roles" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
      </div>
      <div class="campo">
        <label for="u-activo">Cuenta</label>
        <p-select inputId="u-activo" ariaLabel="Cuenta" formControlName="activo" [options]="estadosCuenta" optionLabel="texto" optionValue="valor" placeholder="Todas" [showClear]="true" />
      </div>
    </form>

    @if (lista.error(); as texto) {
      <div class="aviso aviso-error" role="alert"><i class="pi pi-exclamation-triangle"></i><div>{{ texto }} <button type="button" class="enlace" (click)="lista.cargar()">Reintentar</button></div></div>
    }

    <div class="tabla-caja">
      <p-table
        [scrollable]="true"
        [value]="lista.filas()"
        [lazy]="true"
        (onLazyLoad)="lista.alCargarPerezoso($event)"
        [paginator]="true"
        [rows]="lista.tamano()"
        [first]="lista.primero()"
        [totalRecords]="lista.total()"
        [loading]="lista.cargando()"
        [rowsPerPageOptions]="[5, 10, 25, 50]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="{first} – {last} de {totalRecords}"
        sortField="id"
        [sortOrder]="-1"
        dataKey="id"
        [tableStyle]="{ 'min-width': '66rem' }"
      >
        <ng-template #header>
          <tr>
            <th pSortableColumn="id" scope="col">ID <p-sortIcon field="id" /></th>
            <th pSortableColumn="nombre" scope="col">Usuario <p-sortIcon field="nombre" /></th>
            <th scope="col">Documento</th>
            <th scope="col">Teléfono</th>
            <th pSortableColumn="rol" scope="col">Rol <p-sortIcon field="rol" /></th>
            <th scope="col">Cuenta activa</th>
            <th scope="col">Puede publicar</th>
            <th pSortableColumn="fechaRegistro" scope="col">Registro <p-sortIcon field="fechaRegistro" /></th>
            <th scope="col" class="derecha" pFrozenColumn alignFrozen="right"><span class="sr-only">Acciones</span></th>
          </tr>
        </ng-template>
        <ng-template #body let-u>
          <tr>
            <td class="num">#{{ u.id }}</td>
            <td><strong>{{ u.nombre }} {{ u.apellido }}</strong><br /><small class="apagado">{{ u.correo }}</small></td>
            <td class="num">{{ u.tipoDocumento }} {{ u.numeroDocumento }}</td>
            <td class="num">{{ u.telefono }}</td>
            <td><app-estado-tag tipo="rol" [valor]="u.rol" /></td>
            <td>
              <p-toggleswitch [ngModel]="u.activo" (ngModelChange)="alternarActivo(u, $event)" [ariaLabel]="(u.activo ? 'Desactivar' : 'Activar') + ' la cuenta de ' + u.nombre" [disabled]="u.id === sesion.id()" />
            </td>
            <td>
              @if (u.rol === 'PROPIETARIO') {
                <p-toggleswitch [ngModel]="u.publicacionesHabilitadas" (ngModelChange)="alternarPublicaciones(u, $event)" [ariaLabel]="(u.publicacionesHabilitadas ? 'Bloquear' : 'Habilitar') + ' publicaciones de ' + u.nombre" />
              } @else {
                <span class="apagado" aria-label="No aplica">—</span>
              }
            </td>
            <td class="num">{{ u.fechaRegistro | date: 'd MMM y' }}</td>
            <td pFrozenColumn alignFrozen="right">
              <div class="acciones-fila">
                <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" severity="secondary" pTooltip="Editar" [ariaLabel]="'Editar a ' + u.nombre" (onClick)="editar(u)" />
                <p-button icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" pTooltip="Eliminar" [ariaLabel]="'Eliminar a ' + u.nombre" [disabled]="u.id === sesion.id()" (onClick)="confirmarEliminar(u)" />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="9">
              @if (!lista.cargando()) {
                <app-vacio icono="pi-users" titulo="No hay usuarios con esos filtros" mensaje="Prueba quitando algún filtro o crea un usuario nuevo." />
              }
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="formVisible" [header]="editando() ? 'Editar usuario' : 'Nuevo usuario'" [modal]="true" [draggable]="false" [style]="{ width: '40rem' }" [breakpoints]="{ '700px': '96vw' }" [closable]="!guardando()">
      <form class="formulario" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
        @if (errorGeneral(); as texto) {
          <p-message severity="error" icon="pi pi-times-circle" role="alert">{{ texto }}</p-message>
        }
        <div class="formulario-rejilla">
          <app-campo etiqueta="Nombre" para="n-nombre" [obligatorio]="true" [control]="form.controls.nombre">
            <input pInputText id="n-nombre" formControlName="nombre" maxlength="100" />
          </app-campo>
          <app-campo etiqueta="Apellido" para="n-apellido" [obligatorio]="true" [control]="form.controls.apellido">
            <input pInputText id="n-apellido" formControlName="apellido" maxlength="100" />
          </app-campo>
          <app-campo etiqueta="Tipo de documento" para="n-tipo" [obligatorio]="true" [control]="form.controls.tipoDocumento">
            <p-select inputId="n-tipo" ariaLabel="Tipo de documento" formControlName="tipoDocumento" [options]="tiposDocumento" optionLabel="texto" optionValue="valor" appendTo="body" />
          </app-campo>
          <app-campo etiqueta="Número de documento" para="n-doc" [obligatorio]="true" [control]="form.controls.numeroDocumento">
            <input pInputText id="n-doc" formControlName="numeroDocumento" maxlength="20" />
          </app-campo>
          <app-campo etiqueta="Correo" para="n-correo" [obligatorio]="true" [control]="form.controls.correo" class="completo">
            <input pInputText id="n-correo" type="email" formControlName="correo" maxlength="150" />
          </app-campo>
          <app-campo etiqueta="Teléfono" para="n-telefono" [obligatorio]="true" [control]="form.controls.telefono">
            <input pInputText id="n-telefono" type="tel" formControlName="telefono" maxlength="15" />
          </app-campo>
          <app-campo etiqueta="Rol" para="n-rol" [obligatorio]="true" [control]="form.controls.rol">
            <p-select inputId="n-rol" ariaLabel="Rol" formControlName="rol" [options]="roles" optionLabel="texto" optionValue="valor" appendTo="body" />
          </app-campo>
          <app-campo [etiqueta]="editando() ? 'Nueva contraseña (opcional)' : 'Contraseña'" para="n-password" [obligatorio]="!editando()" [control]="form.controls.password" [ayuda]="editando() ? 'Déjala vacía para no cambiarla.' : 'De 6 a 72 caracteres.'" class="completo">
            <p-password inputId="n-password" formControlName="password" [feedback]="false" [toggleMask]="true" autocomplete="new-password" />
          </app-campo>
        </div>
      </form>
      <ng-template #footer>
        <p-button label="Cancelar" severity="secondary" [text]="true" [disabled]="guardando()" (onClick)="formVisible.set(false)" />
        <p-button [label]="editando() ? 'Guardar cambios' : 'Crear usuario'" icon="pi pi-check" [loading]="guardando()" (onClick)="guardar()" />
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .derecha { text-align: right; }
  `,
})
export class Usuarios implements OnDestroy {
  private readonly api = inject(UsuariosService);
  private readonly avisos = inject(Avisos);
  private readonly confirmar = inject(ConfirmationService);
  private readonly destruir = inject(DestroyRef);
  protected readonly sesion = inject(Sesion);

  protected readonly roles = OPCIONES_ROL;
  protected readonly tiposDocumento = TIPOS_DOCUMENTO;
  protected readonly estadosCuenta = [
    { valor: true, texto: 'Activas' },
    { valor: false, texto: 'Desactivadas' },
  ];

  protected readonly filtros = inject(FormBuilder).nonNullable.group({
    q: [''],
    rol: [null as Rol | null],
    activo: [null as boolean | null],
  });

  protected readonly filtroApi = () => {
    const v = this.filtros.getRawValue();
    return { q: v.q.trim() || undefined, rol: v.rol, activo: v.activo };
  };

  protected readonly lista = new ListaPaginada<Usuario>((consulta) => this.api.listar(this.filtroApi(), consulta), { orden: 'id', sentido: -1 });

  protected readonly formVisible = signal(false);
  protected readonly editando = signal<Usuario | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellido: ['', [Validators.required, Validators.maxLength(100)]],
    tipoDocumento: ['DNI' as TipoDocumento, [Validators.required]],
    numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    telefono: ['', [Validators.required, Validators.maxLength(15)]],
    rol: ['INQUILINO' as Rol, [Validators.required]],
    password: ['', [Validators.minLength(6), Validators.maxLength(72)]],
  });

  constructor() {
    this.filtros.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destruir)).subscribe(() => this.lista.buscar());
  }

  ngOnDestroy(): void {
    this.lista.destruir();
  }

  protected nuevo(): void {
    this.editando.set(null);
    this.form.reset({ tipoDocumento: 'DNI', rol: 'INQUILINO' });
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(72)]);
    this.form.controls.password.updateValueAndValidity({ emitEvent: false });
    this.errorGeneral.set(null);
    this.formVisible.set(true);
  }

  protected editar(u: Usuario): void {
    this.editando.set(u);
    this.form.reset({
      nombre: u.nombre,
      apellido: u.apellido,
      tipoDocumento: u.tipoDocumento,
      numeroDocumento: u.numeroDocumento,
      correo: u.correo,
      telefono: u.telefono,
      rol: u.rol,
      password: '',
    });
    this.form.controls.password.setValidators([Validators.minLength(6), Validators.maxLength(72)]);
    this.form.controls.password.updateValueAndValidity({ emitEvent: false });
    this.errorGeneral.set(null);
    this.formVisible.set(true);
  }

  protected guardar(): void {
    this.errorGeneral.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const actual = this.editando();
    this.guardando.set(true);
    const peticion = actual
      ? this.api.actualizar(actual.id, { ...v, password: v.password || null })
      : this.api.crear(v);
    peticion.subscribe({
      next: (u) => {
        this.guardando.set(false);
        this.formVisible.set(false);
        this.avisos.exito(actual ? 'Usuario actualizado' : 'Usuario creado', `${u.nombre} ${u.apellido}`);
        this.lista.cargar();
      },
      error: (e: unknown) => {
        this.guardando.set(false);
        this.errorGeneral.set(aplicarErroresServidor(this.form, e));
      },
    });
  }

  protected alternarActivo(u: Usuario, activo: boolean): void {
    const aplicar = () =>
      this.api.cambiarEstado(u.id, { activo }).subscribe({
        next: () => {
          this.avisos.exito(activo ? 'Cuenta activada' : 'Cuenta desactivada', `${u.nombre} ${u.apellido}`);
          this.lista.cargar();
        },
        error: () => this.lista.cargar(),
      });
    if (activo) {
      aplicar();
      return;
    }
    this.confirmar.confirm({
      header: 'Desactivar cuenta',
      message: `${u.nombre} ${u.apellido} no podrá iniciar sesión${u.rol === 'PROPIETARIO' ? ' y se bloquearán sus publicaciones' : ''}. Podrás reactivarla cuando quieras.`,
      icon: 'pi pi-user-minus',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'No',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: aplicar,
      reject: () => this.lista.cargar(),
    });
  }

  protected alternarPublicaciones(u: Usuario, habilitadas: boolean): void {
    this.api.cambiarEstado(u.id, { publicacionesHabilitadas: habilitadas }).subscribe({
      next: () => {
        this.avisos.exito(
          habilitadas ? 'Publicaciones habilitadas' : 'Publicaciones bloqueadas',
          habilitadas ? `${u.nombre} puede volver a publicar.` : `${u.nombre} ya no puede publicar departamentos nuevos.`,
        );
        this.lista.cargar();
      },
      error: () => this.lista.cargar(),
    });
  }

  protected confirmarEliminar(u: Usuario): void {
    this.confirmar.confirm({
      header: 'Eliminar usuario',
      message: `¿Eliminar definitivamente a ${u.nombre} ${u.apellido} (${u.correo})? Esta acción no se puede deshacer. Si solo quieres impedir su acceso, mejor desactiva la cuenta.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'No',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () =>
        this.api.eliminar(u.id).subscribe({
          next: () => {
            this.avisos.exito('Usuario eliminado', `${u.nombre} ${u.apellido}`);
            this.lista.cargar();
          },
          error: () => undefined,
        }),
    });
  }
}
