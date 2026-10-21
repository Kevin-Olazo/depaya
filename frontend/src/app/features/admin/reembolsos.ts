import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Pago } from '../../core/models/api.models';
import { ListaPaginada } from '../../core/lista-paginada';
import { PagosService } from '../../core/services/pagos.service';
import { tiempoRestante } from '../../core/utils/fechas';
import { ReembolsoAcciones } from '../../shared/reembolso-acciones';
import { Vacio } from '../../shared/vacio';

/** Bandeja de reembolsos pendientes: el admin los confirma (ya devolvió el dinero) o los rechaza (el pago vuelve a Completado). */
@Component({
  selector: 'app-reembolsos',
  imports: [CurrencyPipe, DatePipe, ButtonModule, TableModule, Vacio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="encabezado-pagina">
      <div>
        <p class="eyebrow">Administración</p>
        <h1>Reembolsos <em>pendientes</em></h1>
        <p>Cuando un huésped cancela una reserva pagada con 1 día o más de anticipación, el reembolso llega aquí con un plazo de <strong>48 horas</strong>.</p>
      </div>
      <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" [loading]="lista.cargando()" (onClick)="lista.cargar()" />
    </header>

    <div class="aviso aviso-info">
      <i class="pi pi-info-circle"></i>
      <div><strong>Confirmar</strong> significa que ya devolviste el dinero: el pago queda «Reembolsado». <strong>Rechazar</strong> devuelve el pago a «Completado». Si el plazo vence sin que decidas, el sistema aprueba el reembolso automáticamente.</div>
    </div>

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
        sortField="fechaCreacion"
        [sortOrder]="1"
        dataKey="id"
        [tableStyle]="{ 'min-width': '60rem' }"
      >
        <ng-template #header>
          <tr>
            <th pSortableColumn="id" scope="col">Pago <p-sortIcon field="id" /></th>
            <th scope="col">Huésped</th>
            <th scope="col">Departamento</th>
            <th pSortableColumn="monto" scope="col" class="derecha">A devolver <p-sortIcon field="monto" /></th>
            <th scope="col">Devolver por</th>
            <th scope="col">Solicitado</th>
            <th scope="col">Plazo (48 h)</th>
            <th scope="col" class="derecha" pFrozenColumn alignFrozen="right"><span class="sr-only">Acciones</span></th>
          </tr>
        </ng-template>
        <ng-template #body let-p>
          <tr>
            <td class="num">#{{ p.id }}<br /><small class="apagado">Reserva #{{ p.idReserva }}</small></td>
            <td><strong>{{ p.inquilinoNombre }}</strong><br /><small class="apagado">{{ p.inquilinoCorreo }}</small></td>
            <td>{{ p.departamentoTitulo }}<br /><small class="apagado">{{ p.distrito }}</small></td>
            <td class="derecha num"><strong>{{ p.monto | currency: p.moneda : 'symbol' : '1.2-2' }}</strong></td>
            <td>{{ p.metodoReembolso ?? p.metodo }}</td>
            <td class="num">{{ p.fechaSolicitudReembolso | date: 'd MMM, HH:mm' }}</td>
            <td class="num">
              {{ p.fechaLimiteReembolso | date: 'd MMM, HH:mm' }}<br />
              <small [class]="urgencia(p)">{{ restante(p) }}</small>
            </td>
            <td pFrozenColumn alignFrozen="right">
              <div class="acciones-fila">
                <p-button label="Confirmar" icon="pi pi-check" size="small" severity="success" (onClick)="acciones.confirmar(p, recargar)" [ariaLabel]="'Confirmar el reembolso del pago ' + p.id" />
                <p-button label="Rechazar" icon="pi pi-times" size="small" severity="danger" [outlined]="true" (onClick)="acciones.rechazar(p, recargar)" [ariaLabel]="'Rechazar el reembolso del pago ' + p.id" />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="8">
              @if (!lista.cargando()) {
                <app-vacio icono="pi-check-circle" titulo="No hay reembolsos pendientes" mensaje="Todo al día. Cuando alguien cancele una reserva pagada con tiempo, aparecerá aquí." />
              }
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: `
    .derecha { text-align: right; }
    .acciones-fila { gap: 6px; }
    .vencido { color: #b42318; font-weight: 700; }
    .urgente { color: #94681d; font-weight: 700; }
    .normal { color: var(--dy-apagado); }
  `,
})
export class Reembolsos implements OnDestroy {
  private readonly api = inject(PagosService);
  protected readonly acciones = inject(ReembolsoAcciones);

  protected readonly lista = new ListaPaginada<Pago>((consulta) => this.api.administrar({ estado: 'REEMBOLSO_PENDIENTE' }, consulta), {
    orden: 'fechaCreacion',
    sentido: 1,
  });

  protected readonly recargar = () => this.lista.cargar();

  ngOnDestroy(): void {
    this.lista.destruir();
  }

  protected restante(p: Pago): string {
    return tiempoRestante(p.fechaLimiteReembolso);
  }

  protected urgencia(p: Pago): string {
    if (!p.fechaLimiteReembolso) return 'normal';
    const ms = new Date(p.fechaLimiteReembolso).getTime() - Date.now();
    return ms < 0 ? 'vencido' : ms < 6 * 3_600_000 ? 'urgente' : 'normal';
  }
}
