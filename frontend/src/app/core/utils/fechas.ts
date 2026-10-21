const MS_DIA = 86_400_000;

/** Date -> "yyyy-MM-dd" con la fecha local (sin pasar por UTC). */
export function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** "yyyy-MM-dd" (o un LocalDateTime ISO) -> Date a medianoche local. */
export function deIso(texto: string): Date {
  const [a, m, d] = texto.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function hoy(): Date {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

/** Noches entre dos fechas (inmune al cambio de horario). */
export function nochesEntre(ingreso: Date, salida: Date): number {
  const a = Date.UTC(ingreso.getFullYear(), ingreso.getMonth(), ingreso.getDate());
  const b = Date.UTC(salida.getFullYear(), salida.getMonth(), salida.getDate());
  return Math.round((b - a) / MS_DIA);
}

/** Días que faltan desde hoy hasta la fecha (negativo si ya pasó). */
export function diasHasta(fechaIso: string): number {
  return nochesEntre(hoy(), deIso(fechaIso));
}

/** Rango [ingreso, salida) de una reserva choca con otro rango? La salida queda libre. */
export function chocan(aIng: Date, aSal: Date, bIng: Date, bSal: Date): boolean {
  return aIng < bSal && aSal > bIng;
}

/** Tiempo restante legible ("quedan 31 h 20 min", "vencido hace 2 h"). */
export function tiempoRestante(limiteIso: string | null): string {
  if (!limiteIso) return '';
  const ms = new Date(limiteIso).getTime() - Date.now();
  const abs = Math.abs(ms);
  const horas = Math.floor(abs / 3_600_000);
  const minutos = Math.floor((abs % 3_600_000) / 60_000);
  const texto = horas > 0 ? `${horas} h ${minutos} min` : `${minutos} min`;
  return ms >= 0 ? `quedan ${texto}` : `vencido hace ${texto}`;
}
