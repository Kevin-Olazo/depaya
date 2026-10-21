import { HttpParams } from '@angular/common/http';
import { aIso } from './fechas';

/** Arma los query params omitiendo valores vacíos (null, undefined, '' y NaN). */
export function construirParams(...origenes: object[]): HttpParams {
  let params = new HttpParams();
  for (const origen of origenes) {
    for (const [clave, valor] of Object.entries(origen)) {
      if (valor === null || valor === undefined || valor === '' || (typeof valor === 'number' && Number.isNaN(valor))) {
        continue;
      }
      params = params.set(clave, valor instanceof Date ? aIso(valor) : String(valor));
    }
  }
  return params;
}
