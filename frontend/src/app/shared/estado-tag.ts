import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import {
  ESTADOS_DEPARTAMENTO,
  ESTADOS_PAGO,
  ESTADOS_REEMBOLSO,
  ESTADOS_RESERVA,
  Etiqueta,
  ROLES,
} from '../core/models/etiquetas';

export type TipoEstado = 'rol' | 'departamento' | 'reserva' | 'reembolso' | 'pago';

const MAPAS: Record<TipoEstado, Record<string, Etiqueta>> = {
  rol: ROLES,
  departamento: ESTADOS_DEPARTAMENTO,
  reserva: ESTADOS_RESERVA,
  reembolso: ESTADOS_REEMBOLSO,
  pago: ESTADOS_PAGO,
};

/** Etiqueta de color para un estado (reserva, pago, reembolso, departamento o rol), siempre en español. */
@Component({
  selector: 'app-estado-tag',
  imports: [Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p-tag [value]="etiqueta().texto" [severity]="etiqueta().severidad" [rounded]="true" />`,
})
export class EstadoTag {
  readonly tipo = input.required<TipoEstado>();
  readonly valor = input.required<string | null | undefined>();

  protected readonly etiqueta = computed<Etiqueta>(() => {
    const v = this.valor() ?? '';
    return MAPAS[this.tipo()][v] ?? { texto: v || '—', severidad: 'secondary' };
  });
}
