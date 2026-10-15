package com.depaya.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthRespuestaDTO {

    private final String token;
    private final String tipo;
    private final long expiraEnSegundos;
    private final UsuarioDTO usuario;
}
