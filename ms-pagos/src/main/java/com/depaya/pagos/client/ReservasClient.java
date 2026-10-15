package com.depaya.pagos.client;

import com.depaya.pagos.config.TokenSistema;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

// Consulta y avisa a ms-reservas con un token de sistema.
@Component
public class ReservasClient {

    private final RestClient http;
    private final TokenSistema token;

    public ReservasClient(@LoadBalanced RestClient.Builder builder, TokenSistema token) {
        this.http = builder.clone().baseUrl("http://ms-reservas").build();
        this.token = token;
    }

    public Optional<ReservaRemotaDTO> obtener(Long idReserva) {
        try {
            return Optional.ofNullable(http.get()
                    .uri("/api/reservas/{id}", idReserva)
                    .header(HttpHeaders.AUTHORIZATION, bearer())
                    .retrieve()
                    .body(ReservaRemotaDTO.class));
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (RestClientException | IllegalStateException e) {
            throw noDisponible();
        }
    }

    public void confirmar(Long idReserva) {
        try {
            http.put()
                    .uri("/api/reservas/{id}/confirmar", idReserva)
                    .header(HttpHeaders.AUTHORIZATION, bearer())
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva no se pudo confirmar: " + e.getStatusText());
        } catch (RestClientException | IllegalStateException e) {
            throw noDisponible();
        }
    }

    public void actualizarReembolso(Long idReserva, ReembolsoReservaDTO dto) {
        try {
            http.put()
                    .uri("/api/reservas/{id}/reembolso", idReserva)
                    .header(HttpHeaders.AUTHORIZATION, bearer())
                    .body(dto)
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException.NotFound e) {
            // La reserva ya no existe: no hay nada que actualizar.
        } catch (RestClientException | IllegalStateException e) {
            throw noDisponible();
        }
    }

    private String bearer() {
        return "Bearer " + token.generar();
    }

    private static ResponseStatusException noDisponible() {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "El servicio de reservas (ms-reservas) no está disponible.");
    }
}
