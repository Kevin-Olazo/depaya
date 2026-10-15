package com.depaya.auth.config;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.oauth2.jwt.Jwt;

// Usuario autenticado, tomado del JWT.
@Getter
@AllArgsConstructor
public class UsuarioActual {

    private final Long id;
    private final String rol;
    private final String nombre;
    private final String correo;

    public static UsuarioActual de(Jwt jwt) {
        return new UsuarioActual(
                Long.valueOf(jwt.getSubject()),
                jwt.getClaimAsString("rol"),
                jwt.getClaimAsString("nombre"),
                jwt.getClaimAsString("correo"));
    }

    public boolean esAdmin() {
        return "ADMIN".equals(rol);
    }
}
