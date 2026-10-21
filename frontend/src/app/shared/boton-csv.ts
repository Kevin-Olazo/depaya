import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Avisos } from '../core/services/avisos';
import { DescargasService, RecursoCsv } from '../core/services/descargas.service';

/** Botón "Exportar CSV": descarga el reporte con el token y los mismos filtros del listado. */
@Component({
  selector: 'app-boton-csv',
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-button
      [label]="etiqueta()"
      icon="pi pi-download"
      severity="secondary"
      [outlined]="true"
      [loading]="descargando()"
      (onClick)="descargar()"
      [ariaLabel]="'Descargar reporte CSV de ' + recurso()"
    />
  `,
})
export class BotonCsv {
  readonly recurso = input.required<RecursoCsv>();
  /** Función que devuelve los filtros vigentes del listado (se evalúa al hacer clic). */
  readonly filtro = input<() => object>(() => ({}));
  readonly etiqueta = input('Exportar CSV');

  private readonly descargas = inject(DescargasService);
  private readonly avisos = inject(Avisos);
  protected readonly descargando = signal(false);

  descargar(): void {
    this.descargando.set(true);
    this.descargas.descargarCsv(this.recurso(), this.filtro()()).subscribe({
      next: (respuesta) => {
        this.descargando.set(false);
        const nombre = respuesta.headers.get('Content-Disposition') ?? '';
        this.avisos.exito('Reporte descargado', nombre.includes('filename') ? 'Revisa tu carpeta de descargas.' : undefined);
      },
      error: () => this.descargando.set(false),
    });
  }
}
