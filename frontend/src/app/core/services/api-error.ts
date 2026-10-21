import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorCampo {
  campo: string;
  mensaje: string;
}

/** Cuerpo de error del backend: {timestamp, status, error, mensaje, errores?, ruta}. */
export interface CuerpoError {
  timestamp?: string;
  status?: number;
  error?: string;
  mensaje?: string;
  errores?: ErrorCampo[];
  ruta?: string;
}

/** Error normalizado que el interceptor entrega a los componentes. */
export class ApiError extends Error {
  constructor(
    readonly estado: number,
    readonly mensajeApi: string,
    readonly errores: ErrorCampo[] = [],
    readonly ruta?: string,
  ) {
    super(mensajeApi);
    this.name = 'ApiError';
  }

  get esValidacion(): boolean {
    return this.estado === 400 && this.errores.length > 0;
  }

  /** Mensaje + lista de errores de campo, en líneas separadas. */
  get detalle(): string {
    return this.errores.map((e) => e.mensaje).join('\n');
  }

  static desdeHttp(e: HttpErrorResponse, cuerpo: CuerpoError | null): ApiError {
    if (e.status === 0) {
      return new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión o inténtalo en unos minutos.');
    }
    const mensaje = cuerpo?.mensaje || textoPorEstado(e.status);
    return new ApiError(e.status, mensaje, cuerpo?.errores ?? [], cuerpo?.ruta);
  }
}

function textoPorEstado(estado: number): string {
  switch (estado) {
    case 401:
      return 'Falta iniciar sesión o la sesión venció.';
    case 403:
      return 'No tienes permiso para esta operación.';
    case 404:
      return 'No se encontró lo que buscas.';
    case 409:
      return 'La operación entra en conflicto con el estado actual.';
    case 502:
    case 503:
    case 504:
      return 'El servicio no está disponible por ahora. Inténtalo de nuevo en unos minutos.';
    default:
      return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  }
}

export function mensajeDeError(err: unknown): string {
  return err instanceof ApiError ? err.mensajeApi : 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
