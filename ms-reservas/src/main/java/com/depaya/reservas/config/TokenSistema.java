package com.depaya.reservas.config;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

// Token interno con rol SISTEMA. Expira en 5 minutos.
@Component
@RequiredArgsConstructor
public class TokenSistema {

    private final JwtEncoder encoder;

    public String generar() {
        Instant ahora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject("0")
                .issuedAt(ahora)
                .expiresAt(ahora.plus(5, ChronoUnit.MINUTES))
                .claim("rol", "SISTEMA")
                .claim("nombre", "Sistema")
                .build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }
}
