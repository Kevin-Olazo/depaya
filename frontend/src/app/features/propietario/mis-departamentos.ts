import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
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
import { AuthService } from '../../core/services/auth.service';
import { Avisos } from '../../core/services/avisos';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { Sesion } from '../../core/services/sesion';
import { DepartamentoForm } from '../../shared/departamento-form';
import { Vacio } from '../../shared/vacio';

@Component({
  selector: 'app-mis-departamentos',
  imports: [
    CurrencyPipe,
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
    DepartamentoForm,
    Vacio,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="encabezado-pagina">
      <div>
        <h1>Mis departamentos</h1>
        <p>Publica, edita y gestiona el estado de tus departamentos. Solo los <strong>Disponibles</strong> aparecen en el catálogo y se pueden reservar.</p>
      </div>
      <div class="fila">
        <p-button label="Publicar departamento" icon="pi pi-plus" (onClick)="nuevo()" />
      </div>
    </header>

    @if (bloqueado()) {
      <div class="aviso aviso-error" role="alert">
        <i class="pi pi-ban"></i>
        <div><strong>El administrador bloqueó tus publicaciones.</strong> Puedes ver y administrar lo que ya publicaste, pero no crear departamentos nuevos hasta que te habilite. Escribe a soporte si crees que es un error.</div>
      </div>
    }

    <section class="tarjeta publicaciones" aria-labelledby="t-pub">
      <div>
        <h2 id="t-pub">Publicaciones</h2>
        <p class="apagado">Pausa todos tus departamentos de una vez (pasan a «Inactivo») o vuelve a publicarlos (pasan a «Disponible»).</p>
      </div>
      <div class="fila">
        <p-button label="Pausar todas" icon="pi pi-pause" severity="secondary" [outlined]="true" [loading]="trabajandoMasivo() === 'pausar'" (onClick)="confirmarActivacion(false)" />
        <p-button label="Reactivar todas" icon="pi pi-play" severity="success" [outlined]="true" [loading]="trabajandoMasivo() === 'reactivar'" (onClick)="confirmarActivacion(true)" />
      </div>
    </section>

    <form class="tarjeta barra-filtros" [formGroup]="filtros" (ngSubmit)="$event.preventDefault()" aria-label="Filtros de mis departamentos">
      <div class="campo">
        <label for="m-q">Buscar</label>
        <p-iconfield>
          <p-inputicon class="pi pi-search" />
          <input pInputText id="m-q" formControlName="q" placeholder="Título o descripción" autocomplete="off" />
        </p-iconfield>
      </div>
      <div class="campo">
        <label for="m-estado">Estado</label>
        <p-select inputId="m-estado" ariaLabel="Estado" formControlName="estado" [options]="estados" optionLabel="texto" optionValue="valor" placeholder="Todos" [showClear]="true" />
      </div>
      <div class="campo">
        <label for="m-categoria">Categoría</label>
        <p-select inputId="m-categoria" ariaLabel="Categoría" formControlName="categoria" [options]="categorias()" placeholder="Todas" [showClear]="true" />
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
        [rowsPerPageOptions]="[5, 10, 25]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="{first} – {last} de {totalRecords}"
        sortField="fechaPublicacion"
        [sortOrder]="-1"
        dataKey="id"
        [tableStyle]="{ 'min-width': '60rem' }"
      >
        <ng-template #header>
          <tr>
            <th pSortableColumn="titulo" scope="col">Departamento <p-sortIcon field="titulo" /></th>
            <th pSortableColumn="distrito" scope="col">Distrito <p-sortIcon field="distrito" /></th>
            <th pSortableColumn="precioNoche" scope="col" class="derecha">Precio / noche <p-sortIcon field="precioNoche" /></th>
            <th pSortableColumn="capacidadPersonas" scope="col">Capacidad <p-sortIcon field="capacidadPersonas" /></th>
            <th scope="col">Estado</th>
            <th scope="col" class="derecha" pFrozenColumn alignFrozen="right"><span class="sr-only">Acciones</span></th>
          </tr>
        </ng-template>
        <ng-template #body let-d>
          <tr>
            <td>
              <div class="celda-depa">
                <img [src]="d.imagenUrl" alt="" loading="lazy" />
                <span><strong>{{ d.titulo }}</strong><small class="apagado">{{ d.categoria }} · #{{ d.id }}</small></span>
              </div>
            </td>
            <td>{{ d.distrito }}</td>
            <td class="derecha num"><strong>{{ d.precioNoche | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong></td>
            <td class="num">{{ d.capacidadPersonas }} huésp. · {{ d.habitaciones }} hab. · {{ d.banos }} baños</td>
            <td>
              <p-select [options]="estados" optionLabel="texto" optionValue="valor" [ngModel]="d.estado" (ngModelChange)="cambiarEstado(d, $event)" [ariaLabel]="'Estado de ' + d.titulo" appendTo="body" size="small" [style]="{ minWidth: '9.5rem' }" />
            </td>
            <td pFrozenColumn alignFrozen="right">
              <div class="acciones-fila">
                <p-button icon="pi pi-external-link" [text]="true" [rounded]="true" severity="secondary" pTooltip="Ver publicación" [ariaLabel]="'Ver la publicación de ' + d.titulo" [routerLink]="['/departamentos', d.id]" />
                <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" severity="secondary" pTooltip="Editar" [ariaLabel]="'Editar ' + d.titulo" (onClick)="editar(d)" />
                <p-button icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" pTooltip="Eliminar" [ariaLabel]="'Eliminar ' + d.titulo" (onClick)="confirmarEliminar(d)" />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="6">
              @if (!lista.cargando()) {
                <app-vacio icono="pi-building" titulo="Aún no tienes departamentos aquí" mensaje="Publica tu primer departamento y empieza a recibir reservas. DepaYa cobra solo el 10 % de cada reserva pagada.">
                  <p-button label="Publicar departamento" icon="pi pi-plus" (onClick)="nuevo()" />
                </app-vacio>
              }
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <app-departamento-form [(visible)]="formVisible" [departamento]="editando()" (guardado)="alGuardar()" />
  `,
  styles: `
    .publicaciones { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .derecha { text-align: right; }
    .celda-depa span { display: grid; }
  `,
})
export class MisDepartamentos implements OnDestroy {
  private readonly api = inject(DepartamentosService);
  private readonly sesion = inject(Sesion);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(Avisos);
  private readonly confirmar = inject(ConfirmationService);
  private readonly destruir = inject(DestroyRef);

  protected readonly estados = OPCIONES_ESTADO_DEPARTAMENTO;
  protected readonly categorias = signal<string[]>([]);
  protected readonly bloqueado = computed(() => this.sesion.perfil()?.publicacionesHabilitadas === false);
  protected readonly trabajandoMasivo = signal<'pausar' | 'reactivar' | null>(null);

  protected readonly formVisible = signal(false);
  protected readonly editando = signal<Departamento | null>(null);

  protected readonly filtros = inject(FormBuilder).nonNullable.group({
    q: [''],
    estado: [null as EstadoDepartamento | null],
    categoria: [null as string | null],
  });

  protected readonly lista = new ListaPaginada<Departamento>(
    (consulta) => {
      const v = this.filtros.getRawValue();
      return this.api.misDepartamentos({ q: v.q.trim() || undefined, estado: v.estado, categoria: v.categoria }, consulta);
    },
    { orden: 'fechaPublicacion', sentido: -1 },
  );

  constructor() {
    this.auth.refrescarPerfil();
    this.api.categorias().pipe(takeUntilDestroyed(this.destruir)).subscribe({ next: (c) => this.categorias.set(c), error: () => undefined });
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

  protected alGuardar(): void {
    this.lista.cargar();
  }

  protected cambiarEstado(d: Departamento, estado: EstadoDepartamento): void {
    if (estado === d.estado) return;
    this.api.cambiarEstado(d.id, estado).subscribe({
      next: (actualizado) => {
        this.avisos.exito('Estado actualizado', `«${actualizado.titulo}» ahora está ${this.estados.find((e) => e.valor === estado)?.texto.toLowerCase()}.`);
        this.lista.cargar();
      },
      error: () => this.lista.cargar(),
    });
  }

  protected confirmarEliminar(d: Departamento): void {
    this.confirmar.confirm({
      header: 'Eliminar departamento',
      message: `¿Eliminar «${d.titulo}»? Esta acción no se puede deshacer. Si tiene reservas activas, el sistema no te dejará borrarlo: cancélalas o ponlo en «Inactivo».`,
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

  protected confirmarActivacion(activo: boolean): void {
    this.confirmar.confirm({
      header: activo ? 'Reactivar publicaciones' : 'Pausar publicaciones',
      message: activo
        ? 'Todos tus departamentos Inactivos pasarán a «Disponible» y volverán a verse en el catálogo.'
        : 'Todos tus departamentos pasarán a «Inactivo» y dejarán de verse en el catálogo. Las reservas que ya existen se respetan.',
      icon: activo ? 'pi pi-play' : 'pi pi-pause',
      acceptLabel: activo ? 'Sí, reactivar' : 'Sí, pausar',
      rejectLabel: 'No',
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () => this.cambiarActivacion(activo),
    });
  }

  private cambiarActivacion(activo: boolean): void {
    const id = this.sesion.id();
    if (id === null) return;
    this.trabajandoMasivo.set(activo ? 'reactivar' : 'pausar');
    this.api.activacion(id, activo).subscribe({
      next: (r) => {
        this.trabajandoMasivo.set(null);
        this.avisos.exito(activo ? 'Publicaciones reactivadas' : 'Publicaciones pausadas', `${r.actualizados} departamento(s) actualizados.`);
        this.lista.cargar();
      },
      error: () => this.trabajandoMasivo.set(null),
    });
  }
}
