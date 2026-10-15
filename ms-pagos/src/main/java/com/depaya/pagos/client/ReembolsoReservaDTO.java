package com.depaya.pagos.client;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

// Aviso a ms-reservas: DEVUELTO o NO_APLICA (reembolso rechazado).
@Getter
@AllArgsConstructor
public class ReembolsoReservaDTO {

    private final String estadoReembolso;
    private final LocalDateTime fechaReembolso;
}
