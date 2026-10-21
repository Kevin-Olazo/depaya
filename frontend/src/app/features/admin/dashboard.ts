import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { UIChart } from 'primeng/chart';
import { Skeleton } from 'primeng/skeleton';
import {
  ResumenDepartamentos,
  ResumenPagos,
  ResumenReservas,
  ResumenUsuarios,
} from '../../core/models/api.models';
import { ESTADOS_DEPARTAMENTO, ESTADOS_PAGO, ESTADOS_RESERVA, ROLES } from '../../core/models/etiquetas';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { PagosService } from '../../core/services/pagos.service';
import { ReservasService } from '../../core/services/reservas.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { COLOR_ESTADO, COLORES, OPCIONES_BASE, OPCIONES_EJES, SERIE, etiquetaMes } from '../../shared/colores-graficos';
import { Kpi } from '../../shared/kpi';

const OPCIONES_BARRAS_H = {
  ...OPCIONES_EJES,
  indexAxis: 'y' as const,
  scales: {
    x: { beginAtZero: true, grid: { color: '#eef0ea' }, ticks: { precision: 0, font: { size: 11 } } },
    y: { grid: { display: false }, ticks: { font: { size: 11 } } },
  },
};

function dona(etiquetas: string[], valores: number[], colores: string[]) {
  return {
    labels: etiquetas,
    datasets: [{ data: valores, backgroundColor: colores, borderWidth: 2, borderColor: '#fff' }],
  };
}

function barras(etiquetas: string[], valores: number[], color: string, nombre: string) {
  return { labels: etiquetas, datasets: [{ label: nombre, data: valores, backgroundColor: color, borderRadius: 6, maxBarThickness: 38 }] };
}

/** Dashboard del admin: un resumen por servicio (usuarios, departamentos, reservas y pagos) en tarjetas y gráficos. */
@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, RouterLink, ButtonModule, UIChart, Skeleton, Kpi],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="encabezado-pagina">
      <div>
        <p class="eyebrow">Administración</p>
        <h1>Panel de <em>administración</em></h1>
        <p>Resumen de toda la plataforma. Cada bloque viene de un servicio distinto (usuarios, departamentos, reservas y pagos).</p>
      </div>
      <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" [loading]="cargando()" (onClick)="cargar()" />
    </header>

    @if (pendientes() > 0) {
      <div class="aviso aviso-alerta" role="status">
        <i class="pi pi-clock"></i>
        <div class="fila-separada" style="flex: 1">
          <span><strong>{{ pendientes() }} reembolso(s) esperan tu decisión</strong> por {{ pagos()?.montoReembolsosPendientes | currency: 'PEN' : 'symbol' : '1.2-2' }}. Si pasan las 48 h sin respuesta, se aprueban solos.</span>
          <p-button label="Revisar reembolsos" size="small" routerLink="/admin/reembolsos" />
        </div>
      </div>
    }

    <!-- USUARIOS -->
    <section class="bloque" aria-labelledby="t-usuarios">
      <div class="titulo-bloque"><h2 id="t-usuarios">Usuarios</h2><a class="enlace" routerLink="/admin/usuarios">Gestionar →</a></div>
      <div class="rejilla-kpi">
        @if (usuarios(); as u) {
          <app-kpi etiqueta="Usuarios registrados" [valor]="u.total" icono="pi-users" tono="marca" />
          <app-kpi etiqueta="Cuentas activas" [valor]="u.activos" icono="pi-user-plus" tono="verde" />
          <app-kpi etiqueta="Cuentas inactivas" [valor]="u.inactivos" icono="pi-user-minus" tono="gris" />
          <app-kpi etiqueta="Propietarios" [valor]="u.porRol['PROPIETARIO']" [detalle]="u.porRol['INQUILINO'] + ' inquilinos · ' + u.porRol['ADMIN'] + ' admin'" icono="pi-building" tono="azul" />
        } @else {
          @for (i of [1, 2, 3, 4]; track i) { <p-skeleton height="86px" borderRadius="16px" /> }
        }
      </div>
      <div class="rejilla-2">
        <article class="tarjeta"><h3>Registros por mes</h3><div class="grafico"><p-chart type="bar" [data]="registrosMes()" [options]="ejes" ariaLabel="Registros de usuarios por mes" /></div></article>
        <article class="tarjeta"><h3>Usuarios por rol</h3><div class="grafico"><p-chart type="doughnut" [data]="usuariosRol()" [options]="base" ariaLabel="Usuarios por rol" /></div></article>
      </div>
    </section>

    <!-- DEPARTAMENTOS -->
    <section class="bloque" aria-labelledby="t-deptos">
      <div class="titulo-bloque"><h2 id="t-deptos">Departamentos</h2><a class="enlace" routerLink="/admin/departamentos">Gestionar →</a></div>
      <div class="rejilla-kpi">
        @if (deptos(); as d) {
          <app-kpi etiqueta="Departamentos publicados" [valor]="d.total" icono="pi-building" tono="marca" />
          <app-kpi etiqueta="Propietarios con publicaciones" [valor]="d.propietariosConDepartamentos" icono="pi-users" tono="azul" />
          <app-kpi etiqueta="Precio promedio por noche" [valor]="(d.precioPromedioNoche | currency: 'PEN' : 'symbol' : '1.2-2') ?? ''" icono="pi-tag" tono="ambar" />
          <app-kpi etiqueta="Disponibles" [valor]="d.porEstado['DISPONIBLE']" [detalle]="d.porEstado['INACTIVO'] + ' inactivos'" icono="pi-check-circle" tono="verde" />
        } @else {
          @for (i of [1, 2, 3, 4]; track i) { <p-skeleton height="86px" borderRadius="16px" /> }
        }
      </div>
      <div class="rejilla-3">
        <article class="tarjeta"><h3>Por estado</h3><div class="grafico"><p-chart type="doughnut" [data]="deptosEstado()" [options]="base" ariaLabel="Departamentos por estado" /></div></article>
        <article class="tarjeta"><h3>Por distrito</h3><div class="grafico"><p-chart type="bar" [data]="deptosDistrito()" [options]="barrasH" ariaLabel="Departamentos por distrito" /></div></article>
        <article class="tarjeta"><h3>Por categoría</h3><div class="grafico"><p-chart type="bar" [data]="deptosCategoria()" [options]="ejes" ariaLabel="Departamentos por categoría" /></div></article>
      </div>
    </section>

    <!-- RESERVAS -->
    <section class="bloque" aria-labelledby="t-reservas">
      <div class="titulo-bloque"><h2 id="t-reservas">Reservas</h2><a class="enlace" routerLink="/admin/reservas">Ver todas →</a></div>
      <div class="rejilla-kpi">
        @if (reservas(); as r) {
          <app-kpi etiqueta="Reservas totales" [valor]="r.total" icono="pi-calendar" tono="marca" />
          <app-kpi etiqueta="Valor confirmado" [valor]="(r.valorReservasConfirmadas | currency: 'PEN' : 'symbol' : '1.2-2') ?? ''" [detalle]="r.nochesConfirmadas + ' noches confirmadas'" icono="pi-dollar" tono="verde" />
          <app-kpi etiqueta="Confirmadas" [valor]="r.porEstado['CONFIRMADA']" [detalle]="r.porEstado['PENDIENTE'] + ' pendientes de pago'" icono="pi-check-circle" tono="azul" />
          <app-kpi etiqueta="Reembolsos pendientes" [valor]="r.reembolsosPendientes" icono="pi-replay" tono="ambar" />
        } @else {
          @for (i of [1, 2, 3, 4]; track i) { <p-skeleton height="86px" borderRadius="16px" /> }
        }
      </div>
      <div class="rejilla-3">
        <article class="tarjeta"><h3>Por estado</h3><div class="grafico"><p-chart type="doughnut" [data]="reservasEstado()" [options]="base" ariaLabel="Reservas por estado" /></div></article>
        <article class="tarjeta"><h3>Reservas por mes</h3><div class="grafico"><p-chart type="bar" [data]="reservasMes()" [options]="ejes" ariaLabel="Reservas por mes" /></div></article>
        <article class="tarjeta"><h3>Distritos más reservados</h3><div class="grafico"><p-chart type="bar" [data]="topDistritos()" [options]="barrasH" ariaLabel="Distritos más reservados" /></div></article>
      </div>
    </section>

    <!-- PAGOS -->
    <section class="bloque" aria-labelledby="t-pagos">
      <div class="titulo-bloque"><h2 id="t-pagos">Pagos e ingresos</h2><a class="enlace" routerLink="/admin/pagos">Ver pagos →</a></div>
      <div class="rejilla-kpi">
        @if (pagos(); as p) {
          <app-kpi etiqueta="Ingresos brutos" [valor]="(p.ingresosBrutos | currency: 'PEN' : 'symbol' : '1.2-2') ?? ''" [detalle]="p.totalPagos + ' pagos registrados'" icono="pi-wallet" tono="azul" />
          <app-kpi [etiqueta]="'Comisión de DepaYa (' + p.porcentajeComision + ' %)'" [valor]="(p.comisionDepaya | currency: 'PEN' : 'symbol' : '1.2-2') ?? ''" icono="pi-percentage" tono="marca" />
          <app-kpi etiqueta="Para propietarios" [valor]="(p.montoPropietarios | currency: 'PEN' : 'symbol' : '1.2-2') ?? ''" [detalle]="'El ' + (100 - p.porcentajeComision) + ' % de cada pago'" icono="pi-money-bill" tono="verde" />
          <app-kpi etiqueta="Reembolsos por decidir" [valor]="p.reembolsosPendientes" [detalle]="(p.montoReembolsosPendientes | currency: 'PEN' : 'symbol' : '1.2-2') ?? ''" icono="pi-replay" tono="ambar" />
        } @else {
          @for (i of [1, 2, 3, 4]; track i) { <p-skeleton height="86px" borderRadius="16px" /> }
        }
      </div>
      <div class="rejilla-3">
        <article class="tarjeta"><h3>Pagos por estado</h3><div class="grafico"><p-chart type="doughnut" [data]="pagosEstado()" [options]="base" ariaLabel="Pagos por estado" /></div></article>
        <article class="tarjeta"><h3>Ingresos por método (S/)</h3><div class="grafico"><p-chart type="bar" [data]="ingresosMetodo()" [options]="ejes" ariaLabel="Ingresos por método de pago" /></div></article>
        <article class="tarjeta"><h3>Ingresos por mes (S/)</h3><div class="grafico"><p-chart type="line" [data]="ingresosMes()" [options]="ejes" ariaLabel="Ingresos por mes" /></div></article>
      </div>
    </section>
  `,
  styles: `
    .bloque { display: grid; gap: 14px; }
    .titulo-bloque { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
    .titulo-bloque h2 { font-size: 1.25rem; font-weight: 750; }
    .rejilla-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 16px; }
    .tarjeta h3 { margin-bottom: 10px; font-size: 0.95rem; color: var(--dy-tinta-suave); }
  `,
})
export class Dashboard {
  private readonly api = {
    usuarios: inject(UsuariosService),
    deptos: inject(DepartamentosService),
    reservas: inject(ReservasService),
    pagos: inject(PagosService),
  };
  private readonly destruir = inject(DestroyRef);

  protected readonly base = OPCIONES_BASE;
  protected readonly ejes = OPCIONES_EJES;
  protected readonly barrasH = OPCIONES_BARRAS_H;

  protected readonly usuarios = signal<ResumenUsuarios | null>(null);
  protected readonly deptos = signal<ResumenDepartamentos | null>(null);
  protected readonly reservas = signal<ResumenReservas | null>(null);
  protected readonly pagos = signal<ResumenPagos | null>(null);
  protected readonly cargando = signal(false);

  protected readonly pendientes = computed(() => this.pagos()?.reembolsosPendientes ?? 0);

  protected readonly registrosMes = computed(() => {
    const m = this.usuarios()?.registrosPorMes ?? [];
    return barras(m.map((x) => etiquetaMes(x.mes)), m.map((x) => x.total), COLORES.marca, 'Registros');
  });
  protected readonly usuariosRol = computed(() => {
    const r = Object.entries(this.usuarios()?.porRol ?? {});
    return dona(r.map(([k]) => ROLES[k as keyof typeof ROLES]?.texto ?? k), r.map(([, v]) => v), r.map(([k]) => COLOR_ESTADO[k] ?? COLORES.gris));
  });
  protected readonly deptosEstado = computed(() => {
    const r = Object.entries(this.deptos()?.porEstado ?? {});
    return dona(r.map(([k]) => ESTADOS_DEPARTAMENTO[k as keyof typeof ESTADOS_DEPARTAMENTO]?.texto ?? k), r.map(([, v]) => v), r.map(([k]) => COLOR_ESTADO[k] ?? COLORES.gris));
  });
  protected readonly deptosDistrito = computed(() => {
    const r = Object.entries(this.deptos()?.porDistrito ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return barras(r.map(([k]) => k), r.map(([, v]) => v), COLORES.azul, 'Departamentos');
  });
  protected readonly deptosCategoria = computed(() => {
    const r = Object.entries(this.deptos()?.porCategoria ?? {});
    return barras(r.map(([k]) => k), r.map(([, v]) => v), COLORES.violeta, 'Departamentos');
  });
  protected readonly reservasEstado = computed(() => {
    const r = Object.entries(this.reservas()?.porEstado ?? {});
    return dona(r.map(([k]) => ESTADOS_RESERVA[k as keyof typeof ESTADOS_RESERVA]?.texto ?? k), r.map(([, v]) => v), r.map(([k]) => COLOR_ESTADO[k] ?? COLORES.gris));
  });
  protected readonly reservasMes = computed(() => {
    const m = this.reservas()?.reservasPorMes ?? [];
    return barras(m.map((x) => etiquetaMes(x.mes)), m.map((x) => x.total), COLORES.salvia, 'Reservas');
  });
  protected readonly topDistritos = computed(() => {
    const r = Object.entries(this.reservas()?.topDistritos ?? {});
    return barras(r.map(([k]) => k), r.map(([, v]) => v), COLORES.ambar, 'Reservas');
  });
  protected readonly pagosEstado = computed(() => {
    const r = Object.entries(this.pagos()?.porEstado ?? {});
    return dona(r.map(([k]) => ESTADOS_PAGO[k as keyof typeof ESTADOS_PAGO]?.texto ?? k), r.map(([, v]) => v), r.map(([k]) => COLOR_ESTADO[k] ?? COLORES.gris));
  });
  protected readonly ingresosMetodo = computed(() => {
    const r = Object.entries(this.pagos()?.ingresosPorMetodo ?? {});
    return { labels: r.map(([k]) => k), datasets: [{ label: 'Ingresos (S/)', data: r.map(([, v]) => v), backgroundColor: SERIE, borderRadius: 6, maxBarThickness: 46 }] };
  });
  protected readonly ingresosMes = computed(() => {
    const r = Object.entries(this.pagos()?.ingresosPorMes ?? {});
    return {
      labels: r.map(([k]) => etiquetaMes(k)),
      datasets: [{ label: 'Ingresos (S/)', data: r.map(([, v]) => v), borderColor: COLORES.verde, backgroundColor: 'rgb(21 128 61 / 12%)', fill: true, tension: 0.3, pointRadius: 4 }],
    };
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    let restantes = 4;
    const listo = () => {
      restantes -= 1;
      if (restantes === 0) this.cargando.set(false);
    };
    // Cada resumen se carga por separado: si un servicio falla, los demás se muestran igual.
    this.api.usuarios.resumen().pipe(takeUntilDestroyed(this.destruir)).subscribe({ next: (r) => { this.usuarios.set(r); listo(); }, error: listo });
    this.api.deptos.resumen().pipe(takeUntilDestroyed(this.destruir)).subscribe({ next: (r) => { this.deptos.set(r); listo(); }, error: listo });
    this.api.reservas.resumen().pipe(takeUntilDestroyed(this.destruir)).subscribe({ next: (r) => { this.reservas.set(r); listo(); }, error: listo });
    this.api.pagos.resumen().pipe(takeUntilDestroyed(this.destruir)).subscribe({ next: (r) => { this.pagos.set(r); listo(); }, error: listo });
  }
}
