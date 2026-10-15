package com.depaya.reservas.client;

import com.depaya.reservas.model.MetodoPago;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

// Aviso a ms-pagos: la reserva se canceló.
@Getter
@AllArgsConstructor
public class CancelacionPagoDTO {

    private final boolean conReembolso;
    private final LocalDateTime fechaSolicitud;
    private final LocalDateTime fechaLimite;
    private final MetodoPago metodoReembolso;
}
