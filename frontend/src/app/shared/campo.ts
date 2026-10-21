import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { mensajeControl } from './formularios';

/**
 * Envuelve un control de formulario con su etiqueta, ayuda y mensaje de error accesible.
 * (Usa detección por defecto a propósito: el estado del control no es una señal.)
 */
@Component({
  selector: 'app-campo',
  template: `
    <div class="campo">
      <label [attr.for]="para()">
        {{ etiqueta() }}
        @if (obligatorio()) {
          <span aria-hidden="true" class="obligatorio">*</span>
        }
      </label>
      <ng-content />
      @if (mensaje(); as texto) {
        <div class="error" role="alert" [id]="para() + '-error'">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
          <span>{{ texto }}</span>
        </div>
      } @else if (ayuda()) {
        <div class="ayuda" [id]="para() + '-ayuda'">{{ ayuda() }}</div>
      }
    </div>
  `,
  styles: `
    .obligatorio { color: var(--dy-primario); margin-left: 2px; }
  `,
})
export class Campo {
  readonly etiqueta = input.required<string>();
  /** id del control interno (enlaza la etiqueta). */
  readonly para = input.required<string>();
  readonly control = input<AbstractControl | null | undefined>(null);
  readonly ayuda = input<string>('');
  readonly obligatorio = input(false);

  protected mensaje(): string | null {
    return mensajeControl(this.control());
  }
}
