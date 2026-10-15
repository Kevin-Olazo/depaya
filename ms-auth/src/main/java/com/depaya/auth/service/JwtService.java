package com.depaya.auth.service;

import com.depaya.auth.model.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtEncoder encoder;

    @Value("${depaya.jwt.expiracion-horas:8}")
    private long horas;

    public String generar(Usuario u) {
        Instant ahora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(String.valueOf(u.getId()))
                .issuedAt(ahora)
                .expiresAt(ahora.plus(horas, ChronoUnit.HOURS))
                .claim("rol", u.getRol().name())
                .claim("nombre", u.getNombre() + " " + u.getApellido())
                .claim("correo", u.getCorreo())
                .build();
        JwsHeader cabecera = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(cabecera, claims)).getTokenValue();
    }

    public long expiraEnSegundos() {
        return horas * 3600;
    }
}
