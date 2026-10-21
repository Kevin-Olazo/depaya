import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { construirParams } from '../utils/http-params';

export type RecursoCsv = 'usuarios' | 'departamentos' | 'reservas' | 'pagos';

/** Nombre del archivo según la cabecera Content-Disposition (filename*= o filename=). */
export function nombreDeArchivo(cabecera: string | null, alternativo: string): string {
  if (!cabecera) return alternativo;
  const extendido = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(cabecera);
  if (extendido) {
    try {
      return decodeURIComponent(extendido[1].trim().replace(/^"|"$/g, ''));
    } catch {
      /* cae al nombre simple */
    }
  }
  const simple = /filename\s*=\s*"?([^";]+)"?/i.exec(cabecera);
  return simple ? simple[1].trim() : alternativo;
}

/** Descarga de reportes CSV: pide el archivo con el token (HttpClient + blob) y lo guarda en el navegador. */
@Injectable({ providedIn: 'root' })
export class DescargasService {
  private readonly http = inject(HttpClient);

  /** `filtro` son los mismos filtros del listado (sin page/size). */
  descargarCsv(recurso: RecursoCsv, filtro: object = {}): Observable<HttpResponse<Blob>> {
    return this.http
      .get(`${environment.apiUrl}/api/${recurso}/exportar`, {
        params: construirParams(filtro),
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        tap((respuesta) => {
          const nombre = nombreDeArchivo(respuesta.headers.get('Content-Disposition'), `${recurso}.csv`);
          this.guardar(respuesta.body as Blob, nombre);
        }),
      );
  }

  private guardar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
