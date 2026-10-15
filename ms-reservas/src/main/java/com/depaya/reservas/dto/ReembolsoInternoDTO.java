package com.depaya.reservas.dto;

import com.depaya.reservas.model.EstadoReembolso;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

// Lo envía ms-pagos cuando cambia el reembolso.
@Data
public class ReembolsoInternoDTO {

    @NotNull(message = "El estado del reembolso es obligatorio.")
    private EstadoReembolso estadoReembolso;

    private LocalDateTime fechaReembolso;
}
