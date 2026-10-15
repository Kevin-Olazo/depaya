package com.depaya.departamentos.client;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

// Pregunta a ms-reservas qué departamentos están ocupados en un rango de fechas.
@Component
public class ReservasClient {

    private final RestClient http;

    public ReservasClient(@LoadBalanced RestClient.Builder builder) {
        this.http = builder.clone().baseUrl("http://ms-reservas").build();
    }

    // Ids de departamentos ocupados en [desde, hasta).
    public List<Long> idsOcupados(LocalDate desde, LocalDate hasta, Long idDepartamento) {
        try {
            List<Long> ids = http.get()
                    .uri(b -> b.path("/api/reservas/ocupados")
                            .queryParam("desde", desde)
                            .queryParam("hasta", hasta)
                            .queryParamIfPresent("idDepartamento", Optional.ofNullable(idDepartamento))
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<Long>>() {
                    });
            return ids == null ? List.of() : ids;
        } catch (RestClientException | IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "El servicio de reservas (ms-reservas) no está disponible.");
        }
    }
}
