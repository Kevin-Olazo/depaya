import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EstadoReembolso } from '../core/models/api.models';
import { tiempoRestante } from '../core/utils/fechas';
import { EstadoTag } from './estado-tag';

/** Estado del reembolso con su plazo de 48 h (o la fecha en que se devolvió). */
@Component({
  selector: 'app-reembolso-celda',
  imports: [DatePipe, EstadoTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (estado()) {
      @case ('PENDIENTE') {
        <app-estado-tag tipo="reembolso" valor="PENDIENTE" />
        @if (limite()) {
          <small class="linea">Plazo: {{ limite() | date: 'd MMM, HH:mm' }} · {{ restante() }}</small>
        }
      }
      @case ('DEVUELTO') {
        <app-estado-tag tipo="reembolso" valor="DEVUELTO" />
        @if (devuelto()) {
          <small class="linea">El {{ devuelto() | date: 'd MMM y, HH:mm' }}</small>
        }
      }
      @default {
        <span class="apagado" aria-label="Sin reembolso">—</span>
      }
    }
  `,
  styles: `
    :host { display: grid; gap: 3px; justify-items: start; }
    .linea { color: var(--dy-apagado); font-size: 0.75rem; white-space: nowrap; }
  `,
})
export class ReembolsoCelda {
  readonly estado = input.required<EstadoReembolso | null | undefined>();
  readonly limite = input<string | null>(null);
  readonly devuelto = input<string | null>(null);

  protected readonly restante = computed(() => tiempoRestante(this.limite()));
}
