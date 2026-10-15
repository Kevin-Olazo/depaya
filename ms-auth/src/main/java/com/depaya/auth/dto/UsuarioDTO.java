package com.depaya.auth.dto;

import com.depaya.auth.model.Rol;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UsuarioDTO {

    private Long id;
    private String nombre;
    private String apellido;
    private String tipoDocumento;
    private String numeroDocumento;
    private String correo;
    private String telefono;
    private Rol rol;
    private boolean activo;
    private boolean publicacionesHabilitadas;
    private LocalDateTime fechaRegistro;
    private LocalDateTime fechaDesactivacion;
}
