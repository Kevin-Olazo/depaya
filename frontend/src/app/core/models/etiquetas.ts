import {
  EstadoDepartamento,
  EstadoPago,
  EstadoReembolso,
  EstadoReserva,
  MetodoPago,
  Rol,
  TipoDocumento,
} from './api.models';

export type Severidad = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface Etiqueta {
  texto: string;
  severidad: Severidad;
  icono?: string;
}

export const ROLES: Record<Rol, Etiqueta> = {
  ADMIN: { texto: 'Administrador', severidad: 'contrast', icono: 'pi-shield' },
  PROPIETARIO: { texto: 'Propietario', severidad: 'info', icono: 'pi-building' },
  INQUILINO: { texto: 'Inquilino', severidad: 'secondary', icono: 'pi-user' },
};

export const ESTADOS_DEPARTAMENTO: Record<EstadoDepartamento, Etiqueta> = {
  DISPONIBLE: { texto: 'Disponible', severidad: 'success' },
  OCUPADO: { texto: 'Ocupado', severidad: 'warn' },
  MANTENIMIENTO: { texto: 'Mantenimiento', severidad: 'info' },
  INACTIVO: { texto: 'Inactivo', severidad: 'secondary' },
};

export const ESTADOS_RESERVA: Record<EstadoReserva, Etiqueta> = {
  PENDIENTE: { texto: 'Pendiente de pago', severidad: 'warn' },
  CONFIRMADA: { texto: 'Confirmada', severidad: 'success' },
  CANCELADA: { texto: 'Cancelada', severidad: 'danger' },
};

export const ESTADOS_REEMBOLSO: Record<EstadoReembolso, Etiqueta> = {
  NO_APLICA: { texto: 'No aplica', severidad: 'secondary' },
  PENDIENTE: { texto: 'Reembolso pendiente', severidad: 'warn' },
  DEVUELTO: { texto: 'Reembolsado', severidad: 'success' },
};

export const ESTADOS_PAGO: Record<EstadoPago, Etiqueta> = {
  PROCESANDO: { texto: 'Procesando', severidad: 'info' },
  COMPLETADO: { texto: 'Completado', severidad: 'success' },
  REEMBOLSO_PENDIENTE: { texto: 'Reembolso pendiente', severidad: 'warn' },
  REEMBOLSADO: { texto: 'Reembolsado', severidad: 'secondary' },
  CANCELADO: { texto: 'Cancelado', severidad: 'danger' },
};

export const METODOS_PAGO: { valor: MetodoPago; texto: string; descripcion: string; icono: string }[] = [
  { valor: 'YAPE', texto: 'Yape', descripcion: 'Billetera digital', icono: 'pi-mobile' },
  { valor: 'PLIN', texto: 'Plin', descripcion: 'Billetera digital', icono: 'pi-mobile' },
  { valor: 'VISA', texto: 'Visa', descripcion: 'Tarjeta de crédito o débito', icono: 'pi-credit-card' },
  { valor: 'MASTERCARD', texto: 'Mastercard', descripcion: 'Tarjeta de crédito o débito', icono: 'pi-credit-card' },
];

export const TIPOS_DOCUMENTO: { valor: TipoDocumento; texto: string }[] = [
  { valor: 'DNI', texto: 'DNI' },
  { valor: 'CE', texto: 'Carné de extranjería' },
  { valor: 'PASAPORTE', texto: 'Pasaporte' },
];

export const CATEGORIAS_ICONOS: Record<string, string> = {
  Playa: 'pi-sun',
  Moderno: 'pi-building',
  'Vista al mar': 'pi-compass',
  Loft: 'pi-th-large',
  Ejecutivo: 'pi-briefcase',
  Familiar: 'pi-users',
};

export function opciones<T extends string>(mapa: Record<T, Etiqueta>): { valor: T; texto: string }[] {
  return (Object.keys(mapa) as T[]).map((valor) => ({ valor, texto: mapa[valor].texto }));
}

export const OPCIONES_ESTADO_DEPARTAMENTO = opciones(ESTADOS_DEPARTAMENTO);
export const OPCIONES_ESTADO_RESERVA = opciones(ESTADOS_RESERVA);
export const OPCIONES_ESTADO_REEMBOLSO = opciones(ESTADOS_REEMBOLSO);
export const OPCIONES_ESTADO_PAGO = opciones(ESTADOS_PAGO);
export const OPCIONES_ROL = opciones(ROLES);
