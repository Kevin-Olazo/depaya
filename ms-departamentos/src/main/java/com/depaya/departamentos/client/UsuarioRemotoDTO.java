package com.depaya.departamentos.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

// Respuesta de GET /api/usuarios/{id}/publico en ms-auth.
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UsuarioRemotoDTO {

    private Long id;
    private String nombre;
    private String apellido;
    private String rol;
    private boolean activo;
    private boolean publicacionesHabilitadas;
}
