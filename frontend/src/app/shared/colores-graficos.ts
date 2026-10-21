/** Paleta de los gráficos (coral de marca + tonos que se distinguen entre sí y con buen contraste sobre blanco). */
export const COLORES = {
  coral: '#e31c5f',
  azul: '#2563eb',
  verde: '#15803d',
  ambar: '#d97706',
  violeta: '#7c3aed',
  turquesa: '#0f766e',
  gris: '#64748b',
};

export const SERIE = [COLORES.coral, COLORES.azul, COLORES.verde, COLORES.ambar, COLORES.violeta, COLORES.turquesa, COLORES.gris];

export const COLOR_ESTADO: Record<string, string> = {
  // reservas
  PENDIENTE: COLORES.ambar,
  CONFIRMADA: COLORES.verde,
  CANCELADA: '#dc2626',
  // pagos
  PROCESANDO: COLORES.azul,
  COMPLETADO: COLORES.verde,
  REEMBOLSO_PENDIENTE: COLORES.ambar,
  REEMBOLSADO: COLORES.gris,
  CANCELADO: '#dc2626',
  // departamentos
  DISPONIBLE: COLORES.verde,
  OCUPADO: COLORES.ambar,
  MANTENIMIENTO: COLORES.azul,
  INACTIVO: COLORES.gris,
  // roles
  ADMIN: COLORES.violeta,
  PROPIETARIO: COLORES.azul,
  INQUILINO: COLORES.coral,
};

export const OPCIONES_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { usePointStyle: true, boxWidth: 8, padding: 14, font: { size: 12 } } },
  },
};

export const OPCIONES_EJES = {
  ...OPCIONES_BASE,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { beginAtZero: true, grid: { color: '#eef0f3' }, ticks: { precision: 0, font: { size: 11 } } },
  },
};

/** "2026-10" -> "oct 2026" */
export function etiquetaMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  const nombres = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${nombres[(m ?? 1) - 1] ?? mes} ${a ?? ''}`.trim();
}
