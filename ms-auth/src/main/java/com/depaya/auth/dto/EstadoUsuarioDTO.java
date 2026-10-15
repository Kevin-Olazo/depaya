package com.depaya.auth.dto;

import lombok.Data;

// Los campos null no se modifican.
@Data
public class EstadoUsuarioDTO {

    private Boolean activo;
    private Boolean publicacionesHabilitadas;
}
