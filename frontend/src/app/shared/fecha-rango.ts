import { FormControl } from '@angular/forms';
import { aIso } from '../core/utils/fechas';

/** Valor de un p-datepicker en modo rango: [ingreso, salida]. */
export type RangoFechas = (Date | null)[] | null;

/**
 * Convierte el rango del calendario en los filtros `desde`/`hasta` del backend.
 * Solo cuenta cuando están las dos fechas (una sola elegida es un rango a medias).
 */
export function rangoAFiltro(rango: RangoFechas | undefined): { desde?: string; hasta?: string } {
  const [a, b] = rango ?? [];
  return a && b ? { desde: aIso(a), hasta: aIso(b) } : {};
}

/** ¿El rango está vacío o completo? (para no buscar mientras el usuario elige la segunda fecha) */
export function rangoListo(control: FormControl<RangoFechas>): boolean {
  const v = control.value;
  return !v || !v[0] || !!v[1];
}
