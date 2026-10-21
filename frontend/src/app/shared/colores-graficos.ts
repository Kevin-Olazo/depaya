// Paleta de los gráficos: verdes de marca más acentos cálidos y fríos que se distinguen entre sí.
export const COLORES = {
  marca: '#1d4a3b',
  verde: '#4e805d',
  salvia: '#789c74',
  ambar: '#d0a24f',
  terracota: '#bd665e',
  azul: '#5b8aa3',
  violeta: '#8d7eb0',
  gris: '#8a958c',
};

export const SERIE = [COLORES.marca, COLORES.salvia, COLORES.ambar, COLORES.azul, COLORES.terracota, COLORES.violeta, COLORES.gris];

export const COLOR_ESTADO: Record<string, string> = {
  // reservas
  PENDIENTE: COLORES.ambar,
  CONFIRMADA: COLORES.verde,
  CANCELADA: COLORES.terracota,
  // pagos
  PROCESANDO: COLORES.azul,
  COMPLETADO: COLORES.verde,
  REEMBOLSO_PENDIENTE: COLORES.ambar,
  REEMBOLSADO: COLORES.gris,
  CANCELADO: COLORES.terracota,
  // departamentos
  DISPONIBLE: COLORES.verde,
  OCUPADO: COLORES.ambar,
  MANTENIMIENTO: COLORES.azul,
  INACTIVO: COLORES.gris,
  // roles
  ADMIN: COLORES.violeta,
  PROPIETARIO: COLORES.azul,
  INQUILINO: COLORES.marca,
};

export const OPCIONES_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { usePointStyle: true, boxWidth: 8, padding: 14, font: { size: 12, family: 'DM Sans' } } },
  },
};

export const OPCIONES_EJES = {
  ...OPCIONES_BASE,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11, family: 'DM Sans' } } },
    y: { beginAtZero: true, grid: { color: '#eef0ea' }, ticks: { precision: 0, font: { size: 11, family: 'DM Sans' } } },
  },
};

// "2026-10" -> "oct 2026"
export function etiquetaMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  const nombres = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${nombres[(m ?? 1) - 1] ?? mes} ${a ?? ''}`.trim();
}
