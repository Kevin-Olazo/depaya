package com.depaya.reservas.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;

// Respuesta de GET /api/departamentos/{id} en ms-departamentos.
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DepartamentoRemotoDTO {

    private Long id;
    private Long idPropietario;
    private String propietarioNombre;
    private String titulo;
    private String distrito;
    private String categoria;
    private String imagenUrl;
    private BigDecimal precioNoche;
    private Integer capacidadPersonas;
    private String estado;
}
