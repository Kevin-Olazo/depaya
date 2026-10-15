package com.depaya.reservas.client;

import com.depaya.reservas.config.TokenSistema;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

// Avisa a ms-pagos cuando se cancela una reserva.
@Component
public class PagosClient {

    private final RestClient http;
    private final TokenSistema token;

    public PagosClient(@LoadBalanced RestClient.Builder builder, TokenSistema token) {
        this.http = builder.clone().baseUrl("http://ms-pagos").build();
        this.token = token;
    }

    public void notificarCancelacion(Long idReserva, CancelacionPagoDTO aviso) {
        try {
            http.put()
                    .uri("/api/pagos/reserva/{idReserva}/cancelacion", idReserva)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token.generar())
                    .body(aviso)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException | IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "No se pudo cancelar: el servicio de pagos (ms-pagos) no respondió. Intenta de nuevo.");
        }
    }
}
