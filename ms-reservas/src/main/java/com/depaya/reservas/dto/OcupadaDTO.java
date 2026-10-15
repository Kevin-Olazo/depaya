package com.depaya.reservas.dto;

import com.depaya.reservas.model.EstadoReserva;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

// Rango ocupado de un departamento. El día de salida queda libre.
@Getter
@AllArgsConstructor
public class OcupadaDTO {

    private final LocalDate fechaIngreso;
    private final LocalDate fechaSalida;
    private final EstadoReserva estado;
}
