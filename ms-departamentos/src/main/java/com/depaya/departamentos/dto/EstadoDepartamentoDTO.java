package com.depaya.departamentos.dto;

import com.depaya.departamentos.model.EstadoDepartamento;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EstadoDepartamentoDTO {

    @NotNull(message = "El estado es obligatorio.")
    private EstadoDepartamento estado;
}
