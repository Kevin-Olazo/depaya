import { AbstractControl, FormGroup } from '@angular/forms';
import { ApiError } from '../core/services/api-error';

/** Mensaje en español para el primer error del control (solo si ya se tocó o se intentó enviar). */
export function mensajeControl(control: AbstractControl | null | undefined): string | null {
  if (!control || !control.errors || !(control.touched || control.dirty)) return null;
  const e = control.errors;
  if (e['servidor']) return String(e['servidor']);
  if (e['required']) return 'Este campo es obligatorio.';
  if (e['email']) return 'Ingresa un correo válido.';
  if (e['minlength']) return `Escribe al menos ${e['minlength'].requiredLength} caracteres.`;
  if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
  if (e['min']) return `El valor mínimo es ${e['min'].min}.`;
  if (e['max']) return `El valor máximo es ${e['max'].max}.`;
  if (e['pattern']) return e['pattern'].mensaje ?? 'El formato no es válido.';
  if (e['mensaje']) return String(e['mensaje']);
  return 'El valor no es válido.';
}

/**
 * Muestra bajo cada campo los errores de validación (400 `errores[{campo, mensaje}]`) del backend.
 * Devuelve el texto general (mensaje del backend) cuando el error no pertenece a un campo concreto.
 */
export function aplicarErroresServidor(formulario: FormGroup, error: unknown): string | null {
  if (!(error instanceof ApiError)) return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  const sueltos: string[] = [];
  for (const { campo, mensaje } of error.errores) {
    const control = formulario.get(campo);
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), servidor: mensaje });
      control.markAsTouched();
    } else {
      sueltos.push(mensaje);
    }
  }
  if (error.errores.length === 0) return error.mensajeApi;
  return sueltos.length > 0 ? sueltos.join(' ') : null;
}
