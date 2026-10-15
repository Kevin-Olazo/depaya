package com.depaya.departamentos.client;

import com.depaya.departamentos.config.TokenSistema;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

// Consulta datos básicos de un usuario en ms-auth.
@Component
public class AuthClient {

    private final RestClient http;
    private final TokenSistema token;

    public AuthClient(@LoadBalanced RestClient.Builder builder, TokenSistema token) {
        this.http = builder.clone().baseUrl("http://ms-auth").build();
        this.token = token;
    }

    public Optional<UsuarioRemotoDTO> obtener(Long id) {
        try {
            return Optional.ofNullable(http.get()
                    .uri("/api/usuarios/{id}/publico", id)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token.generar())
                    .retrieve()
                    .body(UsuarioRemotoDTO.class));
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (RestClientException | IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "El servicio de usuarios (ms-auth) no está disponible.");
        }
    }
}
