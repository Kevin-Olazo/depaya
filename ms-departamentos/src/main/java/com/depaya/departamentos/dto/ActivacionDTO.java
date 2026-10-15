package com.depaya.departamentos.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ActivacionDTO {

    @NotNull(message = "Indica si se activan (true) o desactivan (false) los departamentos.")
    private Boolean activo;
}
