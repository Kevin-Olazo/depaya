package com.depaya.reservas.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

// Resumen de reservas del propietario.
@Getter
@AllArgsConstructor
public class ResumenAlquileresDTO {

    private final long total;
    private final long pendientes;
    private final long confirmadas;
    private final long canceladas;
    private final long huespedesProximos;
}
