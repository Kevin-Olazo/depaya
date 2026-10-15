package com.depaya.auth.dto;

import com.depaya.auth.model.Rol;
import lombok.Getter;
import lombok.Setter;

// Filtros del listado: q, rol y activo.
@Getter
@Setter
public class FiltroUsuario extends ParametrosPagina {

    private String q;
    private Rol rol;
    private Boolean activo;
}
