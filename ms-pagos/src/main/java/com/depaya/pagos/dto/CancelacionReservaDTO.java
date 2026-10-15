package com.depaya.pagos.dto;

import com.depaya.pagos.model.MetodoPago;
import lombok.Data;

import java.time.LocalDateTime;

// Aviso de ms-reservas: la reserva se canceló.
@Data
public class CancelacionReservaDTO {

    private boolean conReembolso;
    private LocalDateTime fechaSolicitud;
    private LocalDateTime fechaLimite;
    private MetodoPago metodoReembolso;
}
