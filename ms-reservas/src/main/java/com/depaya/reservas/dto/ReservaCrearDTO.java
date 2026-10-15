package com.depaya.reservas.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class ReservaCrearDTO {

    @NotNull(message = "El departamento es obligatorio.")
    private Long idDepartamento;

    @NotNull(message = "La fecha de ingreso es obligatoria.")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaIngreso;

    @NotNull(message = "La fecha de salida es obligatoria.")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaSalida;

    @NotNull(message = "La cantidad de huéspedes es obligatoria.")
    @Min(value = 1, message = "Debe haber al menos 1 huésped.")
    private Integer cantidadHuespedes;
}
