import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

/** Mensajes emergentes (p-toast) en español. */
@Injectable({ providedIn: 'root' })
export class Avisos {
  private readonly mensajes = inject(MessageService);

  exito(titulo: string, detalle?: string): void {
    this.mensajes.add({ severity: 'success', summary: titulo, detail: detalle, life: 4000 });
  }

  info(titulo: string, detalle?: string): void {
    this.mensajes.add({ severity: 'info', summary: titulo, detail: detalle, life: 4500 });
  }

  advertencia(titulo: string, detalle?: string): void {
    this.mensajes.add({ severity: 'warn', summary: titulo, detail: detalle, life: 6000 });
  }

  error(titulo: string, detalle?: string): void {
    this.mensajes.add({ severity: 'error', summary: titulo, detail: detalle, life: 7000 });
  }
}
