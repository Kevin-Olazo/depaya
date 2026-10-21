/* Interfaces que reflejan los DTO del backend (JSON en camelCase). */

export type Rol = 'ADMIN' | 'PROPIETARIO' | 'INQUILINO';
export type TipoDocumento = 'DNI' | 'CE' | 'PASAPORTE';
export type EstadoDepartamento = 'DISPONIBLE' | 'OCUPADO' | 'MANTENIMIENTO' | 'INACTIVO';
export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';
export type EstadoReembolso = 'NO_APLICA' | 'PENDIENTE' | 'DEVUELTO';
export type MetodoPago = 'YAPE' | 'PLIN' | 'VISA' | 'MASTERCARD';
export type EstadoPago = 'PROCESANDO' | 'COMPLETADO' | 'REEMBOLSO_PENDIENTE' | 'REEMBOLSADO' | 'CANCELADO';

/* ------------------------------------------------------------------ comunes */

export interface Pagina<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Parámetros de paginación: page desde 0, size máx. 100, sort = "campo,asc|desc". */
export interface Consulta {
  page: number;
  size: number;
  sort?: string;
}

export interface ConteoMes {
  mes: string;
  total: number;
}

/* ---------------------------------------------------------------- usuarios */

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  rol: Rol;
  activo: boolean;
  publicacionesHabilitadas: boolean;
  fechaRegistro: string;
  fechaDesactivacion: string | null;
}

export interface AuthRespuesta {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  usuario: Usuario;
}

export interface LoginDto {
  correo: string;
  password: string;
}

export interface UsuarioCrearDto {
  nombre: string;
  apellido: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  password: string;
  rol: Rol;
}

export interface UsuarioActualizarDto {
  nombre: string;
  apellido: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  password?: string | null;
  rol?: Rol | null;
}

export interface EstadoUsuarioDto {
  activo?: boolean;
  publicacionesHabilitadas?: boolean;
}

export interface FiltroUsuario {
  q?: string;
  rol?: Rol | null;
  activo?: boolean | null;
}

export interface ResumenUsuarios {
  total: number;
  activos: number;
  inactivos: number;
  porRol: Record<string, number>;
  registrosPorMes: ConteoMes[];
}

/* ------------------------------------------------------------ departamentos */

export interface Departamento {
  id: number;
  idPropietario: number;
  propietarioNombre: string;
  titulo: string;
  descripcion: string;
  distrito: string;
  direccion: string;
  categoria: string;
  latitud: number | null;
  longitud: number | null;
  precioNoche: number;
  capacidadPersonas: number;
  habitaciones: number;
  banos: number;
  imagenUrl: string;
  tienePiscina: boolean;
  tieneWifi: boolean;
  admiteMascotas: boolean;
  estado: EstadoDepartamento;
  fechaPublicacion: string;
}

export interface DepartamentoGuardarDto {
  idPropietario?: number | null;
  titulo: string;
  descripcion: string;
  distrito: string;
  direccion: string;
  categoria: string;
  latitud: number | null;
  longitud: number | null;
  precioNoche: number;
  capacidadPersonas: number;
  habitaciones: number;
  banos: number;
  imagenUrl: string;
  tienePiscina: boolean;
  tieneWifi: boolean;
  admiteMascotas: boolean;
  estado?: EstadoDepartamento | null;
}

export interface FiltroDepartamento {
  q?: string;
  distrito?: string | null;
  categoria?: string | null;
  precioMin?: number | null;
  precioMax?: number | null;
  huespedes?: number | null;
  habitaciones?: number | null;
  banos?: number | null;
  piscina?: boolean | null;
  wifi?: boolean | null;
  mascotas?: boolean | null;
  /** Fechas libres: ambas juntas y hasta > desde (yyyy-MM-dd). */
  desde?: string | null;
  hasta?: string | null;
  /** Solo en los listados de admin y propietario. */
  estado?: EstadoDepartamento | null;
  propietarioId?: number | null;
}

export interface ResumenDepartamentos {
  total: number;
  propietariosConDepartamentos: number;
  precioPromedioNoche: number;
  porEstado: Record<string, number>;
  porDistrito: Record<string, number>;
  porCategoria: Record<string, number>;
}

/* ----------------------------------------------------------------- reservas */

export interface Reserva {
  id: number;
  idDepartamento: number;
  idInquilino: number;
  idPropietario: number;
  departamentoTitulo: string;
  distrito: string;
  categoria: string;
  imagenUrl: string;
  inquilinoNombre: string;
  inquilinoCorreo: string;
  propietarioNombre: string;
  fechaIngreso: string;
  fechaSalida: string;
  noches: number;
  cantidadHuespedes: number;
  precioNoche: number;
  total: number;
  estado: EstadoReserva;
  estadoReembolso: EstadoReembolso;
  metodoReembolso: MetodoPago | null;
  fechaCreacion: string;
  fechaCancelacion: string | null;
  fechaSolicitudReembolso: string | null;
  fechaLimiteReembolso: string | null;
  fechaReembolso: string | null;
}

/** El total y las noches los calcula el backend: nunca se envían. */
export interface ReservaCrearDto {
  idDepartamento: number;
  fechaIngreso: string;
  fechaSalida: string;
  cantidadHuespedes: number;
}

export interface ReservaActualizarDto {
  fechaIngreso: string;
  fechaSalida: string;
  cantidadHuespedes: number;
}

export interface CancelarReservaDto {
  metodoReembolso?: MetodoPago | null;
}

export interface Ocupada {
  fechaIngreso: string;
  fechaSalida: string;
  estado: EstadoReserva;
}

export interface FiltroReserva {
  q?: string;
  estado?: EstadoReserva | null;
  estadoReembolso?: EstadoReembolso | null;
  idDepartamento?: number | null;
  distrito?: string | null;
  desde?: string | null;
  hasta?: string | null;
}

export interface ResumenReservas {
  total: number;
  porEstado: Record<string, number>;
  reembolsosPendientes: number;
  valorReservasConfirmadas: number;
  nochesConfirmadas: number;
  reservasPorMes: ConteoMes[];
  topDistritos: Record<string, number>;
}

export interface ResumenAlquileres {
  total: number;
  pendientes: number;
  confirmadas: number;
  canceladas: number;
  huespedesProximos: number;
}

/* -------------------------------------------------------------------- pagos */

export interface Pago {
  id: number;
  idReserva: number;
  idInquilino: number;
  inquilinoNombre: string;
  inquilinoCorreo: string;
  idPropietario: number;
  departamentoTitulo: string;
  distrito: string;
  monto: number;
  comision: number;
  montoPropietario: number;
  moneda: string;
  metodo: MetodoPago;
  estado: EstadoPago;
  referenciaPasarela: string | null;
  metodoReembolso: MetodoPago | null;
  fechaCreacion: string;
  fechaPago: string | null;
  fechaSolicitudReembolso: string | null;
  fechaLimiteReembolso: string | null;
  fechaReembolso: string | null;
}

/** El monto no se envía: sale del total de la reserva. */
export interface PagoCrearDto {
  idReserva: number;
  metodo: MetodoPago;
}

export interface FiltroPago {
  q?: string;
  estado?: EstadoPago | null;
  metodo?: MetodoPago | null;
  idReserva?: number | null;
  desde?: string | null;
  hasta?: string | null;
}

export interface ResumenIngresos {
  pagosCompletados: number;
  ingresoBruto: number;
  comisionDepaya: number;
  ingresoNeto: number;
  reembolsosPendientes: number;
  porcentajeComision: number;
}

export interface ResumenPagos {
  totalPagos: number;
  porEstado: Record<string, number>;
  ingresosBrutos: number;
  comisionDepaya: number;
  montoPropietarios: number;
  reembolsosPendientes: number;
  montoReembolsosPendientes: number;
  ingresosPorMetodo: Record<string, number>;
  ingresosPorMes: Record<string, number>;
  porcentajeComision: number;
}
