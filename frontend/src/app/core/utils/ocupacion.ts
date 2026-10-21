import { Ocupada } from '../models/api.models';
import { aIso, chocan, deIso, sumarDias } from './fechas';

export interface DiaCalendario {
  day: number;
  month: number;
  year: number;
}

/**
 * Disponibilidad de un departamento a partir de /api/reservas/ocupadas.
 * Cada rango [ingreso, salida) ocupa las noches de ingreso a salida-1: el día de salida queda libre.
 */
export class Ocupacion {
  private readonly noches = new Set<string>();
  private readonly rangos: { ingreso: Date; salida: Date }[];
  /** Días que no se pueden elegir ni como ingreso ni como salida (noche propia y noche anterior ocupadas). */
  readonly bloqueadas: Date[] = [];

  constructor(ocupadas: Ocupada[]) {
    this.rangos = ocupadas.map((o) => ({ ingreso: deIso(o.fechaIngreso), salida: deIso(o.fechaSalida) }));
    for (const { ingreso, salida } of this.rangos) {
      for (let f = ingreso; f < salida; f = sumarDias(f, 1)) {
        this.noches.add(aIso(f));
      }
    }
    for (const texto of this.noches) {
      const dia = deIso(texto);
      if (this.noches.has(aIso(sumarDias(dia, -1)))) this.bloqueadas.push(dia);
    }
  }

  /** ¿La noche que empieza en este día está ocupada? (para pintar el calendario) */
  nocheOcupada(dia: DiaCalendario | Date): boolean {
    const fecha = dia instanceof Date ? dia : new Date(dia.year, dia.month, dia.day);
    return this.noches.has(aIso(fecha));
  }

  /** ¿Una estadía [ingreso, salida) toca alguna noche ocupada? */
  choca(ingreso: Date, salida: Date): boolean {
    return this.rangos.some((r) => chocan(ingreso, salida, r.ingreso, r.salida));
  }
}

/** Ignora los rangos que cumplan `omitir` (por ejemplo, la propia reserva que se está editando). */
export function crearOcupacion(ocupadas: Ocupada[], omitir?: (o: Ocupada) => boolean): Ocupacion {
  return new Ocupacion(omitir ? ocupadas.filter((o) => !omitir(o)) : ocupadas);
}
