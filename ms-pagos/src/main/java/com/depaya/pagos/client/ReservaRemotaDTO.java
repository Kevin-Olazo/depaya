package com.depaya.pagos.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;

// Respuesta de GET /api/reservas/{id} en ms-reservas.
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReservaRemotaDTO {

    private Long id;
    private Long idInquilino;
    private Long idPropietario;
    private String departamentoTitulo;
    private String distrito;
    private String inquilinoNombre;
    private String inquilinoCorreo;
    private BigDecimal total;
    private String estado;
}
