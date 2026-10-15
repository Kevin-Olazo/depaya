package com.depaya.departamentos.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecretKey claveJwt(@Value("${depaya.jwt.secret}") String secreto) {
        return new SecretKeySpec(secreto.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey claveJwt) {
        return NimbusJwtDecoder.withSecretKey(claveJwt).macAlgorithm(MacAlgorithm.HS256).build();
    }

    // El encoder se usa para generar tokens, el decoder para validarlos.
    @Bean
    JwtEncoder jwtEncoder(SecretKey claveJwt) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(claveJwt));
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter roles = new JwtGrantedAuthoritiesConverter();
        roles.setAuthoritiesClaimName("rol");
        roles.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter convertidor = new JwtAuthenticationConverter();
        convertidor.setJwtGrantedAuthoritiesConverter(roles);
        return convertidor;
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationConverter convertidor) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/error").permitAll()
                        // Catálogo público.
                        .requestMatchers(HttpMethod.GET, "/api/departamentos", "/api/departamentos/distritos",
                                "/api/departamentos/categorias", "/api/departamentos/{id:\\d+}").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) ->
                                escribir(res, 401, "No autorizado", "Falta el token o es inválido."))
                        .accessDeniedHandler((req, res, ex) ->
                                escribir(res, 403, "Prohibido", "No tienes permiso para esta operación.")))
                .oauth2ResourceServer(o -> o
                        .jwt(j -> j.jwtAuthenticationConverter(convertidor))
                        .authenticationEntryPoint((req, res, ex) ->
                                escribir(res, 401, "No autorizado", "Falta el token o es inválido."))
                        .accessDeniedHandler((req, res, ex) ->
                                escribir(res, 403, "Prohibido", "No tienes permiso para esta operación.")));
        return http.build();
    }

    private static void escribir(HttpServletResponse res, int status, String error, String mensaje) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"status\":" + status + ",\"error\":\"" + error + "\",\"mensaje\":\"" + mensaje + "\"}");
    }
}
