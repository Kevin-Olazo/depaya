package com.depaya.departamentos.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class ResumenDepartamentosDTO {

    private final long total;
    private final long propietariosConDepartamentos;
    private final double precioPromedioNoche;
    private final Map<String, Long> porEstado;
    private final Map<String, Long> porDistrito;
    private final Map<String, Long> porCategoria;
}
