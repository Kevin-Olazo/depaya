package com.depaya.auth.dto;

import com.depaya.auth.model.Rol;
import lombok.Builder;
import lombok.Data;

// Datos básicos de un usuario para otros servicios.
@Data
@Builder
public class UsuarioPublicoDTO {

    private Long id;
    private String nombre;
    private String apellido;
    private Rol rol;
    private boolean activo;
    private boolean publicacionesHabilitadas;
}
