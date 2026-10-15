package com.depaya.pagos.dto;

import lombok.Getter;
import lombok.Setter;

// Parámetros de paginación: page, size y sort (campo,asc).
@Getter
@Setter
public class ParametrosPagina {

    private int page = 0;
    private int size = 10;
    private String sort;
}
