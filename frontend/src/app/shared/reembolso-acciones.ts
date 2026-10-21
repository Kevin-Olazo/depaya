import { CurrencyPipe } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { Pago } from '../core/models/api.models';
import { Avisos } from '../core/services/avisos';
import { PagosService } from '../core/services/pagos.service';

/** Confirmar o rechazar un reembolso pendiente (solo ADMIN), siempre con diálogo de confirmación. */
@Injectable({ providedIn: 'root' })
export class ReembolsoAcciones {
  private readonly pagos = inject(PagosService);
  private readonly confirmacion = inject(ConfirmationService);
  private readonly avisos = inject(Avisos);
  private readonly moneda = new CurrencyPipe('es-PE');

  private monto(p: Pago): string {
    return this.moneda.transform(p.monto, p.moneda || 'PEN', 'symbol', '1.2-2') ?? String(p.monto);
  }

  confirmar(p: Pago, despues: () => void): void {
    this.confirmacion.confirm({
      header: 'Confirmar reembolso',
      message: `¿Confirmas que ya devolviste ${this.monto(p)} a ${p.inquilinoNombre} (pago #${p.id})? El pago pasará a «Reembolsado» y la reserva a «Reembolsado».`,
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, confirmar reembolso',
      rejectLabel: 'No',
      acceptButtonProps: { severity: 'success' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () =>
        this.pagos.confirmarReembolso(p.id).subscribe({
          next: () => {
            this.avisos.exito('Reembolso confirmado', `Pago #${p.id} · ${this.monto(p)} devuelto a ${p.inquilinoNombre}.`);
            despues();
          },
          error: () => undefined,
        }),
    });
  }

  rechazar(p: Pago, despues: () => void): void {
    this.confirmacion.confirm({
      header: 'Rechazar reembolso',
      message: `¿Rechazar el reembolso del pago #${p.id}? El pago volverá a «Completado» y el huésped no recibirá la devolución.`,
      icon: 'pi pi-times-circle',
      acceptLabel: 'Sí, rechazar',
      rejectLabel: 'No',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () =>
        this.pagos.rechazarReembolso(p.id).subscribe({
          next: () => {
            this.avisos.info('Reembolso rechazado', `El pago #${p.id} volvió a «Completado».`);
            despues();
          },
          error: () => undefined,
        }),
    });
  }
}
