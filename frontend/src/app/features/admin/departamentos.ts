import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';
import { Departamento, EstadoDepartamento } from '../../core/models/api.models';
import { OPCIONES_ESTADO_DEPARTAMENTO } from '../../core/models/etiquetas';
import { ListaPaginada } from '../../core/lista-paginada';
import { Avisos } from '../../core/services/avisos';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { BotonCsv } from '../../shared/boton-csv';
import { DepartamentoForm } from '../../shared/departamento-form';
import { Vacio } from '../../shared/vacio';

@Component({
  selector: 'app-admin-departamentos',
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    IconField,
    InputIcon,
    InputText,
    Select,
    TableModule,
    Tooltip,
    BotonCsv,
    DepartamentoForm,
    Vacio,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="encabezado-pagina">
      <div>
        <h1>Departamentos</h1>
        <p>Todos los departamentos de la plataforma, en cualquier estado.</p>
      </div>
      <div class="fila">
        <app-boton-csv recurso="departamentos" [filtro]="filtroApi" />
        <p-button label="Nuevo departamento" icon="pi pi-plus" (onClick)="nuevo()" />
      </div>
    </header>

    <form class="tarjeta barra-filtros" [formGroup]="filtros" (ngSubmit)="$event.preventDefault()" aria-label="Filtros de departamentos">
      <div class="campo">
        <label for="d-q">Buscar</label>
        <p-iconfield>
          <p-inputicon class="pi pi-search" />
          <input pInputText id="d-q" formControlName="q" placeholder="Título o descripción" autocomplete="off" />
        </p-iconfield>
      </div>
      <div class="campo">
        <label for="d-estado">Estado</label>
        <p-select inputId="d-estado" ariaLabel="Estado" formControlName="estado" [options]="estados" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
      </div>
      <div class="campo">
        <label for="d-distrito">Distrito</label>
        <p-select inputId="d-distrito" ariaLabel="Distrito" formControlName="distrito" [options]="distritos()" placeholder="Todos" [showClear]="true" [filter]="true" />
      </div>
      <div class="campo">
        <label for="d-categoria">Categoría</label>
        <p-select inputId="d-categoria" ariaLabel="Categoría" formControlName="categoria" [options]="categorias()" placeholder="Todas" [showClear]="true" />
      </div>
      <div class="campo">
        <label for="d-prop">Propietario</label>
        <p-select inputId="d-prop" ariaLabel="Propietario" formControlName="propietarioId" [options]="propietarios()" optionLabel="etiqueta" optionValue="id" placeholder="Todos" [showClear]="true" [filter]="true" />
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
        sortField="fechaPublicacion"
        [sortOrder]="-1"
        dataKey="id"
        [tableStyle]="{ 'min-width': '66rem' }"
      >
        <ng-template #header>
          <tr>
            <th pSortableColumn="id" scope="col">ID <p-sortIcon field="id" /></th>
            <th pSortableColumn="titulo" scope="col">Departamento <p-sortIcon field="titulo" /></th>
            <th scope="col">Propietario</th>
            <th pSortableColumn="precioNoche" scope="col" class="derecha">Precio / noche <p-sortIcon field="precioNoche" /></th>
            <th pSortableColumn="capacidadPersonas" scope="col">Capacidad <p-sortIcon field="capacidadPersonas" /></th>
            <th scope="col">Estado</th>
            <th pSortableColumn="fechaPublicacion" scope="col">Publicado <p-sortIcon field="fechaPublicacion" /></th>
            <th scope="col" class="derecha" pFrozenColumn alignFrozen="right"><span class="sr-only">Acciones</span></th>
          </tr>
        </ng-template>
        <ng-template #body let-d>
          <tr>
            <td class="num">#{{ d.id }}</td>
            <td>
              <div class="celda-depa">
                <img [src]="d.imagenUrl" alt="" loading="lazy" />
                <span><strong>{{ d.titulo }}</strong><small class="apagado">{{ d.distrito }} · {{ d.categoria }}</small></span>
              </div>
            </td>
            <td>{{ d.propietarioNombre }}<br /><small class="apagado">ID {{ d.idPropietario }}</small></td>
            <td class="derecha num"><strong>{{ d.precioNoche | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong></td>
            <td class="num">{{ d.capacidadPersonas }} huésp. · {{ d.habitaciones }} hab.</td>
            <td>
              <p-select [options]="estados" optionLabel="texto" optionValue="valor" [ngModel]="d.estado" (ngModelChange)="cambiarEstado(d, $event)" [ariaLabel]="'Estado de ' + d.titulo" appendTo="body" size="small" [style]="{ minWidth: '9.5rem' }" />
            </td>
            <td class="num">{{ d.fechaPublicacion | date: 'd MMM y' }}</td>
            <td pFrozenColumn alignFrozen="right">
              <div class="acciones-fila">
                <p-button icon="pi pi-external-link" [text]="true" [rounded]="true" severity="secondary" pTooltip="Ver publicación" [ariaLabel]="'Ver ' + d.titulo" [routerLink]="['/departamentos', d.id]" />
                <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" severity="secondary" pTooltip="Editar" [ariaLabel]="'Editar ' + d.titulo" (onClick)="editar(d)" />
                <p-button icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" pTooltip="Eliminar" [ariaLabel]="'Eliminar ' + d.titulo" (onClick)="confirmarEliminar(d)" />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="8">
              @if (!lista.cargando()) {
                <app-vacio icono="pi-building" titulo="No hay departamentos con esos filtros" mensaje="Prueba quitando algún filtro." />
              }
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <app-departamento-form [(visible)]="formVisible" [departamento]="editando()" [admin]="true" (guardado)="lista.cargar()" />
  `,
  styles: `
    .derecha { text-align: right; }
    .celda-depa span { display: grid; }
  `,
})
export class AdminDepartamentos implements OnDestroy {
  private readonly api = inject(DepartamentosService);
  private readonly usuarios = inject(UsuariosService);
  private readonly avisos = inject(Avisos);
  private readonly confirmar = inject(ConfirmationService);
  private readonly destruir = inject(DestroyRef);

  protected readonly estados = OPCIONES_ESTADO_DEPARTAMENTO;
  protected readonly distritos = signal<string[]>([]);
  protected readonly categorias = signal<string[]>([]);
  protected readonly propietarios = signal<{ id: number; etiqueta: string }[]>([]);
  protected readonly formVisible = signal(false);
  protected readonly editando = signal<Departamento | null>(null);

  protected readonly filtros = inject(FormBuilder).nonNullable.group({
    q: [''],
    estado: [null as EstadoDepartamento | null],
    distrito: [null as string | null],
    categoria: [null as string | null],
    propietarioId: [null as number | null],
  });

  protected readonly filtroApi = () => {
    const v = this.filtros.getRawValue();
    return { q: v.q.trim() || undefined, estado: v.estado, distrito: v.distrito, categoria: v.categoria, propietarioId: v.propietarioId };
  };

  protected readonly lista = new ListaPaginada<Departamento>((consulta) => this.api.admin(this.filtroApi(), consulta), {
    orden: 'fechaPublicacion',
    sentido: -1,
  });

  constructor() {
    this.api.categorias().pipe(takeUntilDestroyed(this.destruir)).subscribe({ next: (c) => this.categorias.set(c), error: () => undefined });
    // Distritos de todos los departamentos: se toman del resumen del admin (incluye los que no están disponibles).
    this.api.resumen().pipe(takeUntilDestroyed(this.destruir)).subscribe({
      next: (r) => this.distritos.set(Object.keys(r.porDistrito).sort((a, b) => a.localeCompare(b, 'es'))),
      error: () => undefined,
    });
    this.usuarios
      .listar({ rol: 'PROPIETARIO' }, { page: 0, size: 100, sort: 'nombre,asc' })
      .pipe(takeUntilDestroyed(this.destruir))
      .subscribe({
        next: (p) => this.propietarios.set(p.content.map((u) => ({ id: u.id, etiqueta: `${u.nombre} ${u.apellido}` }))),
        error: () => undefined,
      });
    this.filtros.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destruir)).subscribe(() => this.lista.buscar());
  }

  ngOnDestroy(): void {
    this.lista.destruir();
  }

  protected nuevo(): void {
    this.editando.set(null);
    this.formVisible.set(true);
  }

  protected editar(d: Departamento): void {
    this.editando.set(d);
    this.formVisible.set(true);
  }

  protected cambiarEstado(d: Departamento, estado: EstadoDepartamento): void {
    if (estado === d.estado) return;
    this.api.cambiarEstado(d.id, estado).subscribe({
      next: (a) => {
        this.avisos.exito('Estado actualizado', `«${a.titulo}» → ${this.estados.find((e) => e.valor === estado)?.texto}`);
        this.lista.cargar();
      },
      error: () => this.lista.cargar(),
    });
  }

  protected confirmarEliminar(d: Departamento): void {
    this.confirmar.confirm({
      header: 'Eliminar departamento',
      message: `¿Eliminar «${d.titulo}» de ${d.propietarioNombre}? Si tiene reservas activas, el sistema no lo permitirá.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'No',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () =>
        this.api.eliminar(d.id).subscribe({
          next: () => {
            this.avisos.exito('Departamento eliminado', d.titulo);
            this.lista.cargar();
          },
          error: () => undefined,
        }),
    });
  }
}
