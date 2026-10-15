package com.depaya.reservas.client;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

// Consulta a ms-departamentos (el detalle es público, sin token).
@Component
public class DepartamentosClient {

    private final RestClient http;

    public DepartamentosClient(@LoadBalanced RestClient.Builder builder) {
        this.http = builder.clone().baseUrl("http://ms-departamentos").build();
    }

    public Optional<DepartamentoRemotoDTO> obtener(Long id) {
        try {
            return Optional.ofNullable(http.get()
                    .uri("/api/departamentos/{id}", id)
                    .retrieve()
                    .body(DepartamentoRemotoDTO.class));
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (RestClientException | IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "El servicio de departamentos (ms-departamentos) no está disponible.");
        }
    }
}
